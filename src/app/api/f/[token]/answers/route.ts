import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isLocked, loadByToken, saveAnswer } from '@/lib/instances';

const body = z.object({
  updates: z
    .array(
      z.object({
        fieldId: z.string().min(1),
        value: z.unknown(),
        failNote: z.string().max(5000).nullish(),
      }),
    )
    .min(1)
    .max(200),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const loaded = await loadByToken(token);
  if (!loaded) return new NextResponse('not found', { status: 404 });
  if (isLocked(loaded.instance))
    return new NextResponse('form already submitted', { status: 409 });

  const parsed = body.safeParse(await req.json());
  if (!parsed.success)
    return new NextResponse(parsed.error.issues[0]?.message ?? 'bad request', {
      status: 400,
    });

  let status = loaded.instance.status;
  let current = loaded;
  for (const update of parsed.data.updates) {
    try {
      const res = await saveAnswer(current, update);
      status = res.status;
      // Keep the running state in sync so the derived status accounts for the
      // whole batch, not just the last field in it.
      current = {
        ...current,
        state: {
          ...current.state,
          values: { ...current.state.values, [update.fieldId]: update.value },
          failNotes: {
            ...current.state.failNotes,
            [update.fieldId]: update.failNote ?? null,
          },
        },
      };
    } catch (e) {
      return new NextResponse(e instanceof Error ? e.message : 'save failed', {
        status: 400,
      });
    }
  }

  return NextResponse.json({ ok: true, status });
}
