import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { listInstances, listPublishedChecklists } from '@/lib/instances';
import { t } from '@/lib/i18n';
import { adminLang, dateLocale } from '@/lib/admin-lang';
import type { Lang } from '@/lib/checklist/types';
import { LanguageSwitch } from './LanguageSwitch';
import { LoginForm } from './LoginForm';
import { NewInstanceForm } from './NewInstanceForm';
import { StatusBadge } from './StatusBadge';
import { signOut } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const lang = await adminLang();
  if (!(await isAdmin())) return <LoginForm lang={lang} />;

  const [rows, available] = await Promise.all([
    listInstances(),
    listPublishedChecklists(),
  ]);
  const baseUrl = process.env.PUBLIC_BASE_URL ?? '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{t(lang, 'admin.title')}</h1>
        <div className="flex items-center gap-3">
          <LanguageSwitch lang={lang} />
          <form action={signOut}>
            <button className="btn-ghost text-sm">{t(lang, 'admin.signOut')}</button>
          </form>
        </div>
      </header>

      <NewInstanceForm
        lang={lang}
        checklists={available.map((c) => ({
          slug: c.slug,
          version: c.version,
          title: lang === 'en' ? c.titleEn : c.titleCs,
        }))}
      />

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {t(lang, 'admin.instances')} ({rows.length})
        </h2>

        {rows.length === 0 ? (
          <p className="card mt-3 p-6 text-center text-sm text-slate-500">
            {t(lang, 'admin.noInstances')}
          </p>
        ) : (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t(lang, 'admin.label')}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, 'admin.checklist')}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, 'admin.status')}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, 'admin.progress')}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, 'admin.lastActivity')}</th>
                  <th className="px-4 py-2.5 font-medium">{t(lang, 'admin.link')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ instance, summary, failed, attachmentCount }) => (
                    <tr key={instance.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/${instance.id}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {instance.label}
                        </Link>
                        {instance.customerName && (
                          <p className="text-xs text-slate-500">{instance.customerName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {instance.checklistSlug} v{instance.checklistVersion}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={instance.status} lang={lang} />
                        {failed > 0 && (
                          <span className="ml-1.5 text-xs text-amber-700">⚠ {failed}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                instance.status === 'issues' ? 'bg-amber-500' : 'bg-brand-500'
                              }`}
                              style={{ width: `${summary.percent}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-slate-500">
                            {summary.answered}/{summary.total}
                          </span>
                          {attachmentCount > 0 && (
                            <span className="text-xs text-slate-400">
                              📎 {attachmentCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(instance.lastActivityAt ?? instance.createdAt, lang)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`${baseUrl}/f/${instance.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-600 hover:underline"
                        >
                          {t(lang, 'admin.open')} ↗
                        </a>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(d: Date | null, lang: Lang) {
  if (!d) return '—';
  return new Intl.DateTimeFormat(dateLocale(lang), {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}
