'use client';

import { useActionState, useState } from 'react';
import { t } from '@/lib/i18n';
import { createInstanceAction } from './actions';

interface Props {
  checklists: { slug: string; version: number; title: string }[];
}

export function NewInstanceForm({ checklists }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createInstanceAction, null);
  const lang = 'cs' as const;

  if (checklists.length === 0) {
    return (
      <p className="card mt-6 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Žádný checklist není publikovaný v databázi. Spusťte{' '}
        <code className="rounded bg-amber-100 px-1">npm run db:sync-schema</code>.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn-primary mt-6" onClick={() => setOpen(true)}>
        + {t(lang, 'admin.newInstance')}
      </button>
    );
  }

  return (
    <form action={action} className="card mt-6 p-5">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
        {t(lang, 'admin.newInstance')}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="label" className="label-text">
            {t(lang, 'admin.label')} *
          </label>
          <input
            id="label"
            name="label"
            required
            autoFocus
            placeholder="např. FVE Kolín — hala B"
            className="field-input mt-1"
          />
          {state?.error === 'label-required' && (
            <p className="mt-1 text-sm text-rose-600">Vyplňte označení.</p>
          )}
        </div>
        <div>
          <label htmlFor="checklistSlug" className="label-text">
            {t(lang, 'admin.checklist')}
          </label>
          <select id="checklistSlug" name="checklistSlug" className="field-input mt-1">
            {checklists.map((c) => (
              <option key={`${c.slug}-${c.version}`} value={c.slug}>
                {c.title} (v{c.version})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lang" className="label-text">
            {t(lang, 'admin.language')}
          </label>
          <select id="lang" name="lang" className="field-input mt-1" defaultValue="cs">
            <option value="cs">Čeština</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label htmlFor="customerName" className="label-text">
            {t(lang, 'admin.customer')}
          </label>
          <input id="customerName" name="customerName" className="field-input mt-1" />
        </div>
        <div>
          <label htmlFor="customerEmail" className="label-text">
            {t(lang, 'admin.email')}
          </label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            className="field-input mt-1"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {t(lang, 'admin.create')}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Zrušit
        </button>
      </div>
    </form>
  );
}
