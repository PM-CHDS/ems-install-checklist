'use client';

import { useTransition } from 'react';
import type { Lang } from '@/lib/checklist/types';
import { t } from '@/lib/i18n';
import { setAdminLang } from './actions';

export function LanguageSwitch({ lang }: { lang: Lang }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5"
      aria-label={t(lang, 'admin.interfaceLanguage')}
    >
      {(['en', 'cs'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setAdminLang(l))}
          className={`rounded px-2.5 py-1 text-xs font-semibold uppercase transition ${
            lang === l ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
