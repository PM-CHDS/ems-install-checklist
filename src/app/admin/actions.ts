'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkPassword, endSession, isAdmin, startSession } from '@/lib/auth';
import {
  createInstance,
  deleteInstance,
  isUuid,
  loadById,
  setStatus,
} from '@/lib/instances';
import { isLang } from '@/lib/i18n';
import { storage } from '@/lib/storage';

async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin');
}

export async function signIn(_prev: unknown, formData: FormData) {
  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) return { error: 'bad-password' as const };
  await startSession();
  redirect('/admin');
}

export async function signOut() {
  await endSession();
  redirect('/admin');
}

export async function createInstanceAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const label = String(formData.get('label') ?? '').trim();
  if (!label) return { error: 'label-required' as const };
  const langValue = formData.get('lang');
  // The picker sends `slug@version`; pinning the version matters when several
  // versions of the same checklist are published.
  const [slug, version] = String(formData.get('checklistSlug') ?? '').split('@');
  const instance = await createInstance({
    checklistSlug: slug,
    checklistVersion: version ? Number(version) : undefined,
    label,
    customerName: String(formData.get('customerName') ?? '') || undefined,
    customerEmail: String(formData.get('customerEmail') ?? '') || undefined,
    lang: isLang(langValue) ? langValue : 'cs',
  });
  revalidatePath('/admin');
  redirect(`/admin/${instance.id}?created=1`);
}

export async function markReviewed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  if (!isUuid(id)) redirect('/admin');
  await setStatus(id, 'reviewed', 'admin');
  revalidatePath(`/admin/${id}`);
}

export async function reopenForm(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  if (!isUuid(id)) redirect('/admin');
  await setStatus(id, 'in_progress', 'admin');
  revalidatePath(`/admin/${id}`);
}

export async function deleteInstanceAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  if (!isUuid(id)) redirect('/admin');
  const loaded = await loadById(id);
  if (loaded) {
    // Remove the blobs first; the DB cascade takes the rows with the instance.
    await Promise.all(
      loaded.attachments.map((a) =>
        storage()
          .delete(a.storageKey)
          .catch(() => undefined),
      ),
    );
  }
  await deleteInstance(id);
  revalidatePath('/admin');
  redirect('/admin');
}
