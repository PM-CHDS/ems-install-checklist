'use client';

import { useState } from 'react';
import type { Lang } from '@/lib/checklist/types';
import { t } from '@/lib/i18n';

export function CopyLink({ url, lang }: { url: string; lang: Lang }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        {url}
      </code>
      <button
        type="button"
        className="btn-secondary px-3 py-2 text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? t(lang, 'admin.copied') : t(lang, 'admin.copy')}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="btn-secondary px-3 py-2 text-xs"
      >
        {t(lang, 'admin.open')} ↗
      </a>
    </div>
  );
}
