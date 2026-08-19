'use client';

import { useActionState } from 'react';
import type { Lang } from '@/lib/checklist/types';
import { t } from '@/lib/i18n';
import { signIn } from './actions';

export function LoginForm({ lang }: { lang: Lang }) {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <form action={action} className="card w-full p-6">
        <h1 className="text-lg font-semibold text-slate-900">{t(lang, 'admin.title')}</h1>
        <label htmlFor="password" className="label-text mt-4">
          {t(lang, 'admin.password')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          className="field-input mt-1"
        />
        {state?.error === 'bad-password' && (
          <p className="mt-2 text-sm text-rose-600">{t(lang, 'admin.badPassword')}</p>
        )}
        <button type="submit" className="btn-primary mt-4 w-full" disabled={pending}>
          {t(lang, 'admin.signIn')}
        </button>
      </form>
    </div>
  );
}
