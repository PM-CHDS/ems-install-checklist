import type { FormStatus } from '@/db/schema';
import type { Lang } from '@/lib/checklist/types';
import { t } from '@/lib/i18n';

const styles: Record<FormStatus, string> = {
  created: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  issues: 'bg-amber-100 text-amber-800',
  submitted: 'bg-emerald-100 text-emerald-700',
  reviewed: 'bg-violet-100 text-violet-700',
};

export function StatusBadge({ status, lang }: { status: FormStatus; lang: Lang }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {t(lang, `status.${status}` as never)}
    </span>
  );
}
