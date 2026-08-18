import type { Metadata } from 'next';
import { FormApp } from '@/components/form/FormApp';
import { isLocked, loadByToken } from '@/lib/instances';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/checklist/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'EMS Checklist',
  robots: { index: false, follow: false },
};

export default async function FormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const loaded = await loadByToken(token);

  if (!loaded) return <NotFound />;

  const { instance, checklist, state, attachments } = loaded;
  const locked = isLocked(instance);

  if (locked) {
    return (
      <Submitted
        lang={instance.lang}
        title={checklist.titleCs}
        contactEmail={checklist.submissionContact?.email}
      />
    );
  }

  return (
    <FormApp
      token={token}
      checklist={checklist}
      initialState={state}
      initialAttachments={attachments}
      initialStatus={instance.status}
      locked={locked}
      lang={instance.lang}
      instanceLabel={instance.label}
    />
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <div className="card w-full p-6 text-center">
        <p className="text-3xl">🔍</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          {t('cs', 'form.notFound')} / {t('en', 'form.notFound')}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{t('cs', 'form.notFoundBody')}</p>
        <p className="mt-1 text-sm text-slate-500">{t('en', 'form.notFoundBody')}</p>
      </div>
    </div>
  );
}

function Submitted({
  lang,
  title,
  contactEmail,
}: {
  lang: Lang;
  title: string;
  contactEmail?: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <div className="card w-full p-6 text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          {t(lang, 'form.submittedTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{title}</p>
        <p className="mt-3 text-sm text-slate-600">{t(lang, 'form.submittedBody')}</p>
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}`}
            className="mt-1 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            {contactEmail}
          </a>
        )}
      </div>
    </div>
  );
}
