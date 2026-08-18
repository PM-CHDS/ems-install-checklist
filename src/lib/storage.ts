/**
 * File storage behind a small adapter so the deployment can choose:
 *   STORAGE_DRIVER=local  → a mounted disk volume (default; simplest self-hosted setup)
 *   STORAGE_DRIVER=s3     → any S3-compatible bucket: MinIO, Supabase Storage, AWS
 *
 * Uploads are never public: the app serves them through an authenticated/tokenized
 * route, so nothing depends on bucket ACLs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export interface StorageAdapter {
  put(key: string, body: Buffer, mime: string): Promise<void>;
  get(key: string): Promise<{ body: Buffer; mime?: string }>;
  delete(key: string): Promise<void>;
}

/* --------------------------------------------------------------- local disk */

class LocalStorage implements StorageAdapter {
  constructor(private root: string) {}

  private full(key: string) {
    const safe = key.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.root, safe);
  }

  async put(key: string, body: Buffer) {
    const p = this.full(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, body);
  }

  async get(key: string) {
    return { body: await fs.readFile(this.full(key)) };
  }

  async delete(key: string) {
    await fs.rm(this.full(key), { force: true });
  }
}

/* ------------------------------------------------------------ S3-compatible */

class S3Storage implements StorageAdapter {
  private clientPromise: Promise<import('@aws-sdk/client-s3').S3Client> | null = null;

  constructor(
    private bucket: string,
    private prefix: string,
  ) {}

  private async client() {
    if (!this.clientPromise) {
      this.clientPromise = import('@aws-sdk/client-s3').then(
        ({ S3Client }) =>
          new S3Client({
            region: process.env.S3_REGION ?? 'us-east-1',
            endpoint: process.env.S3_ENDPOINT,
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
            },
          }),
      );
    }
    return this.clientPromise;
  }

  private k(key: string) {
    return this.prefix ? `${this.prefix.replace(/\/$/, '')}/${key}` : key;
  }

  async put(key: string, body: Buffer, mime: string) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await this.client();
    await c.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.k(key),
        Body: body,
        ContentType: mime,
      }),
    );
  }

  async get(key: string) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await this.client();
    const res = await c.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.k(key) }),
    );
    const stream = res.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return { body: Buffer.concat(chunks), mime: res.ContentType };
  }

  async delete(key: string) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await this.client();
    await c.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: this.k(key) }),
    );
  }
}

let cached: StorageAdapter | null = null;

export function storage(): StorageAdapter {
  if (cached) return cached;
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  if (driver === 's3') {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new Error('STORAGE_DRIVER=s3 requires S3_BUCKET');
    cached = new S3Storage(bucket, process.env.S3_PREFIX ?? '');
  } else {
    cached = new LocalStorage(
      process.env.STORAGE_LOCAL_PATH ?? path.join(process.cwd(), 'var', 'uploads'),
    );
  }
  return cached;
}

const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** A malformed override must not silently remove the limit. */
export const MAX_UPLOAD_BYTES =
  Number(process.env.MAX_UPLOAD_BYTES) > 0
    ? Number(process.env.MAX_UPLOAD_BYTES)
    : DEFAULT_MAX_UPLOAD_BYTES;

export const ALLOWED_UPLOAD_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];

export function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}
