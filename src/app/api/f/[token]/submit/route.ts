import { NextResponse } from 'next/server';
import { isLocked, loadByToken, setStatus } from '@/lib/instances';
import { summarize } from '@/lib/checklist/state';
import { problemText } from '@/lib/checklist/state';
import { fieldById } from '@/lib/checklist/types';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const loaded = await loadByToken(token);
  if (!loaded) return new NextResponse('not found', { status: 404 });
  if (isLocked(loaded.instance))
    return new NextResponse('form already submitted', { status: 409 });

  // The browser checks this too, but the server is the authority — same rules,
  // same code path.
  const summary = summarize(loaded.checklist, loaded.state);
  if (!summary.canSubmit) {
    const lang = loaded.instance.lang;
    const details = summary.problems
      .slice(0, 5)
      .map((p) => {
        const f = fieldById(loaded.checklist, p.fieldId);
        return f ? problemText(p, f, lang) : p.fieldId;
      })
      .join('; ');
    return new NextResponse(
      `${summary.problems.length} ${lang === 'cs' ? 'nevyřešených položek' : 'unresolved items'}: ${details}`,
      { status: 422 },
    );
  }

  await setStatus(loaded.instance.id, 'submitted');
  return NextResponse.json({ ok: true });
}
