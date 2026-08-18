'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Attachment, FormStatus } from '@/db/schema';
import type { CompiledChecklist, CompiledField, Lang } from '@/lib/checklist/types';
import { fieldById, isInput, label } from '@/lib/checklist/types';
import {
  fieldProblems,
  isVisible,
  problemText,
  summarize,
  type FormState,
} from '@/lib/checklist/state';
import { t } from '@/lib/i18n';
import { Field } from './Field';
import { useAutosave } from './useAutosave';

interface Props {
  token: string;
  checklist: CompiledChecklist;
  initialState: FormState;
  initialAttachments: Attachment[];
  initialStatus: FormStatus;
  locked: boolean;
  lang: Lang;
  instanceLabel: string;
}

const REVIEW = -1;

export function FormApp({
  token,
  checklist,
  initialState,
  initialAttachments,
  initialStatus,
  locked,
  lang: initialLang,
  instanceLabel,
}: Props) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [values, setValues] = useState(initialState.values);
  const [failNotes, setFailNotes] = useState(initialState.failNotes);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [status, setStatus] = useState<FormStatus>(initialStatus);
  const [step, setStep] = useState(0);
  const [showProblems, setShowProblems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { queue, flushNow, state: saveState } = useAutosave(token, setStatus);

  const photosByField = useMemo(() => {
    const m = new Map<string, Attachment[]>();
    for (const a of attachments) {
      if (a.kind === 'signature') continue;
      const list = m.get(a.fieldId) ?? [];
      list.push(a);
      m.set(a.fieldId, list);
    }
    return m;
  }, [attachments]);

  const signatureByField = useMemo(() => {
    const m = new Map<string, Attachment>();
    for (const a of attachments) if (a.kind === 'signature') m.set(a.fieldId, a);
    return m;
  }, [attachments]);

  const formState: FormState = useMemo(
    () => ({
      values,
      failNotes,
      photoCounts: Object.fromEntries(
        Array.from(photosByField.entries()).map(([k, v]) => [k, v.length]),
      ),
    }),
    [values, failNotes, photosByField],
  );

  const summary = useMemo(() => summarize(checklist, formState), [checklist, formState]);

  const refreshAttachments = useCallback(async () => {
    const res = await fetch(`/api/f/${token}/attachments`);
    if (res.ok) setAttachments((await res.json()) as Attachment[]);
  }, [token]);

  const setValue = useCallback(
    (field: CompiledField, value: unknown) => {
      setValues((prev) => ({ ...prev, [field.id]: value }));
      queue(field.id, value, failNotes[field.id]);
    },
    [queue, failNotes],
  );

  const setFailNote = useCallback(
    (field: CompiledField, note: string) => {
      setFailNotes((prev) => ({ ...prev, [field.id]: note }));
      setValues((current) => {
        queue(field.id, current[field.id], note);
        return current;
      });
    },
    [queue],
  );

  async function goToStep(next: number) {
    await flushNow();
    setStep(next);
    setShowProblems(next === REVIEW);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await flushNow();
      const res = await fetch(`/api/f/${token}/submit`, { method: 'POST' });
      if (!res.ok) {
        setSubmitError(await res.text());
        setShowProblems(true);
        return;
      }
      window.location.reload();
    } finally {
      setSubmitting(false);
    }
  }

  const section = step === REVIEW ? null : checklist.sections[step];
  const disabled = locked;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 pb-32">
      <Header
        checklist={checklist}
        instanceLabel={instanceLabel}
        lang={lang}
        onLang={setLang}
        percent={summary.percent}
        saveState={saveState}
        status={status}
        locked={locked}
      />

      <SectionNav
        checklist={checklist}
        lang={lang}
        step={step}
        summary={summary}
        onGo={(i) => void goToStep(i)}
      />

      {status === 'issues' && !locked && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t(lang, 'form.blockedBanner')}
        </p>
      )}

      {section ? (
        <section className="mt-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {lang === 'en' ? section.titleEn : section.titleCs}
          </h2>
          {(lang === 'en' ? section.introEn : section.introCs) && (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {lang === 'en' ? section.introEn : section.introCs}
            </p>
          )}

          <div className="mt-4 space-y-3">
            {section.fields
              .filter((f) => isVisible(f, values))
              .map((field) => (
                <Field
                  key={field.id}
                  token={token}
                  field={field}
                  lang={lang}
                  value={values[field.id]}
                  failNote={failNotes[field.id]}
                  photos={photosByField.get(field.id) ?? []}
                  signature={signatureByField.get(field.id)}
                  problems={fieldProblems(field, formState)}
                  disabled={disabled}
                  showProblems={showProblems}
                  onChange={(v) => setValue(field, v)}
                  onFailNote={(n) => setFailNote(field, n)}
                  onAttachmentsChanged={() => void refreshAttachments()}
                />
              ))}
          </div>
        </section>
      ) : (
        <ReviewStep
          checklist={checklist}
          lang={lang}
          summary={summary}
          onGoToField={(fieldId, sectionId) => {
            const idx = checklist.sections.findIndex((s) => s.id === sectionId);
            void goToStep(idx).then(() => {
              setShowProblems(true);
              setTimeout(
                () =>
                  document
                    .getElementById(`field-${fieldId}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                80,
              );
            });
          }}
          onSubmit={() => void submit()}
          submitting={submitting}
          error={submitError}
          locked={locked}
        />
      )}

      <StepFooter
        lang={lang}
        step={step}
        total={checklist.sections.length}
        onPrev={() => void goToStep(step === REVIEW ? checklist.sections.length - 1 : step - 1)}
        onNext={() =>
          void goToStep(step + 1 >= checklist.sections.length ? REVIEW : step + 1)
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ chrome */

function Header({
  checklist,
  instanceLabel,
  lang,
  onLang,
  percent,
  saveState,
  status,
  locked,
}: {
  checklist: CompiledChecklist;
  instanceLabel: string;
  lang: Lang;
  onLang: (l: Lang) => void;
  percent: number;
  saveState: string;
  status: FormStatus;
  locked: boolean;
}) {
  const saveLabels: Record<string, string> = {
    saving: t(lang, 'form.saving'),
    saved: t(lang, 'form.saved'),
    error: t(lang, 'form.saveError'),
    offline: t(lang, 'form.offline'),
    idle: '',
  };
  return (
    <header className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {lang === 'en' ? checklist.titleEn : checklist.titleCs}
          </h1>
          <p className="text-sm text-slate-500">{instanceLabel}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
          {(['cs', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLang(l)}
              className={`rounded px-2.5 py-1 text-xs font-semibold uppercase transition ${
                lang === l ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${
              status === 'issues' ? 'bg-amber-500' : 'bg-brand-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 tabular-nums">{percent}%</span>
      </div>

      <div className="mt-1.5 flex min-h-5 items-center justify-between text-xs">
        <span
          className={
            saveState === 'error' || saveState === 'offline'
              ? 'text-rose-600'
              : 'text-slate-400'
          }
        >
          {locked ? '' : saveLabels[saveState]}
        </span>
        <span className="text-slate-400">{t(lang, `status.${status}` as never)}</span>
      </div>
    </header>
  );
}

function SectionNav({
  checklist,
  lang,
  step,
  summary,
  onGo,
}: {
  checklist: CompiledChecklist;
  lang: Lang;
  step: number;
  summary: ReturnType<typeof summarize>;
  onGo: (i: number) => void;
}) {
  return (
    <nav className="mt-3 -mx-4 overflow-x-auto px-4">
      <ol className="flex gap-1.5 pb-1">
        {checklist.sections.map((s, i) => {
          const p = summary.sections[i];
          const done = p.total > 0 && p.answered === p.total;
          const hasIssues = p.failedChecks.length > 0;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onGo(i)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                  step === i
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasIssues
                      ? 'bg-amber-500'
                      : done
                        ? 'bg-emerald-500'
                        : step === i
                          ? 'bg-white/60'
                          : 'bg-slate-300'
                  }`}
                />
                {i + 1}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => onGo(REVIEW)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
              step === REVIEW
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            ✓ {t(lang, 'form.review')}
          </button>
        </li>
      </ol>
    </nav>
  );
}

function ReviewStep({
  checklist,
  lang,
  summary,
  onGoToField,
  onSubmit,
  submitting,
  error,
  locked,
}: {
  checklist: CompiledChecklist;
  lang: Lang;
  summary: ReturnType<typeof summarize>;
  onGoToField: (fieldId: string, sectionId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  locked: boolean;
}) {
  const missing = summary.problems.filter((p) => p.code === 'required');
  const issues = summary.problems.filter((p) => p.code !== 'required');

  const row = (p: (typeof summary.problems)[number]) => {
    const field = fieldById(checklist, p.fieldId);
    if (!field) return null;
    return (
      <li key={`${p.fieldId}-${p.code}`} className="flex items-start justify-between gap-3 py-2">
        <span className="text-sm text-slate-700">{problemText(p, field, lang)}</span>
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
          onClick={() => onGoToField(p.fieldId, p.sectionId)}
        >
          {t(lang, 'form.goToField')} →
        </button>
      </li>
    );
  };

  return (
    <section className="mt-4">
      <h2 className="text-lg font-semibold text-slate-900">{t(lang, 'form.review')}</h2>
      <p className="mt-1 text-sm text-slate-600">{t(lang, 'form.reviewIntro')}</p>

      {summary.failedChecks.length > 0 && (
        <div className="card mt-4 border-amber-300 p-4">
          <h3 className="text-sm font-semibold text-amber-900">
            {t(lang, 'form.reviewIssues')} ({summary.failedChecks.length})
          </h3>
          <ul className="mt-1 divide-y divide-slate-100">
            {summary.failedChecks.map((id) => {
              const field = fieldById(checklist, id);
              if (!field) return null;
              return (
                <li key={id} className="flex items-start justify-between gap-3 py-2">
                  <span className="text-sm text-slate-700">⚠ {label(field, lang)}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                    onClick={() => onGoToField(id, field.sectionId)}
                  >
                    {t(lang, 'form.goToField')} →
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {missing.length > 0 && (
        <div className="card mt-4 border-rose-300 p-4">
          <h3 className="text-sm font-semibold text-rose-900">
            {t(lang, 'form.reviewMissing')} ({missing.length})
          </h3>
          <ul className="mt-1 divide-y divide-slate-100">{missing.map(row)}</ul>
        </div>
      )}

      {issues.length > 0 && (
        <div className="card mt-4 border-amber-300 p-4">
          <h3 className="text-sm font-semibold text-amber-900">
            {lang === 'cs' ? 'Chybí vysvětlení / doklad' : 'Missing explanation / evidence'} (
            {issues.length})
          </h3>
          <ul className="mt-1 divide-y divide-slate-100">{issues.map(row)}</ul>
        </div>
      )}

      <div className="card mt-4 p-4">
        <p className="text-sm text-slate-600">
          {summary.canSubmit ? t(lang, 'form.reviewOk') : t(lang, 'form.reviewBlocked')}
        </p>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        {!locked && (
          <button
            type="button"
            className="btn-primary mt-3 w-full sm:w-auto"
            disabled={!summary.canSubmit || submitting}
            onClick={onSubmit}
          >
            {submitting ? t(lang, 'form.submitting') : t(lang, 'form.submit')}
          </button>
        )}
      </div>
    </section>
  );
}

function StepFooter({
  lang,
  step,
  total,
  onPrev,
  onNext,
}: {
  lang: Lang;
  step: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={onPrev}
          disabled={step === 0}
        >
          ← {t(lang, 'form.back')}
        </button>
        <span className="text-xs text-slate-400">
          {step === REVIEW
            ? t(lang, 'form.review')
            : `${t(lang, 'form.section')} ${step + 1} ${t(lang, 'form.of')} ${total}`}
        </span>
        <button
          type="button"
          className="btn-primary"
          onClick={onNext}
          disabled={step === REVIEW}
        >
          {step + 1 >= total ? t(lang, 'form.review') : t(lang, 'form.next')} →
        </button>
      </div>
    </div>
  );
}
