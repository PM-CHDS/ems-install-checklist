'use client';

import type { Attachment } from '@/db/schema';
import type { CompiledField, Lang } from '@/lib/checklist/types';
import { caption, help, isInput, label, onFailPolicy } from '@/lib/checklist/types';
import type { Problem } from '@/lib/checklist/state';
import { isFailed } from '@/lib/checklist/state';
import { t } from '@/lib/i18n';
import { PhotoUploader } from './PhotoUploader';
import { SignaturePad } from './SignaturePad';
import { TableField } from './TableField';

interface Props {
  token: string;
  field: CompiledField;
  lang: Lang;
  value: unknown;
  /** All current answers — a table's fixed rows may be gated on one. */
  values: Record<string, unknown>;
  failNote: string | null | undefined;
  photos: Attachment[];
  signature?: Attachment;
  problems: Problem[];
  disabled?: boolean;
  showProblems: boolean;
  onChange: (value: unknown) => void;
  onFailNote: (note: string) => void;
  onAttachmentsChanged: () => void;
}

export function Field({
  token,
  field,
  lang,
  value,
  values,
  failNote,
  photos,
  signature,
  problems,
  disabled,
  showProblems,
  onChange,
  onFailNote,
  onAttachmentsChanged,
}: Props) {
  const helpText = help(field, lang);
  const failed = isFailed(field, value);
  const policy = onFailPolicy(field);
  const problem = (code: Problem['code']) =>
    showProblems && problems.some((p) => p.code === code);

  /* --- display-only chrome ------------------------------------------------- */

  if (field.type === 'group') {
    return (
      <div id={`field-${field.id}`} className="pt-6 first:pt-0">
        <h3 className="border-b border-slate-200 pb-1.5 text-base font-semibold text-slate-800">
          {label(field, lang)}
        </h3>
        {helpText && <p className="help-text">{helpText}</p>}
        <Images field={field} lang={lang} />
        {field.photo && (
          <PhotoUploader
            token={token}
            fieldId={field.id}
            lang={lang}
            photos={photos}
            disabled={disabled}
            required={field.photoRequired}
            onChanged={onAttachmentsChanged}
          />
        )}
      </div>
    );
  }

  if (field.type === 'note') {
    const warning = field.severity === 'warning';
    return (
      <div
        id={`field-${field.id}`}
        className={`rounded-lg border p-4 ${
          warning
            ? 'border-amber-300 bg-amber-50'
            : 'border-slate-200 bg-slate-50'
        }`}
      >
        <p
          className={`text-sm font-medium ${warning ? 'text-amber-900' : 'text-slate-800'}`}
        >
          {warning && '⚠ '}
          {label(field, lang)}
        </p>
        {helpText && (
          <p
            className={`mt-1 text-sm leading-relaxed ${
              warning ? 'text-amber-800' : 'text-slate-600'
            }`}
          >
            {helpText}
          </p>
        )}
        <Images field={field} lang={lang} />
        {field.photo && (
          <PhotoUploader
            token={token}
            fieldId={field.id}
            lang={lang}
            photos={photos}
            disabled={disabled}
            required={field.photoRequired}
            onChanged={onAttachmentsChanged}
          />
        )}
        {problem('photo_required') && (
          <p className="mt-1 text-sm text-rose-600">{t(lang, 'form.photoRequired')}</p>
        )}
      </div>
    );
  }

  /* --- inputs -------------------------------------------------------------- */

  const missing = problem('required');

  return (
    <div
      id={`field-${field.id}`}
      className={`scroll-mt-24 rounded-lg border p-4 transition ${
        failed
          ? 'border-amber-300 bg-amber-50/40'
          : missing
            ? 'border-rose-300 bg-rose-50/40'
            : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={`input-${field.id}`} className="label-text">
          {label(field, lang)}
          {field.unit ? <span className="text-slate-500"> [{field.unit}]</span> : null}
          {isInput(field) && !field.required && (
            <span className="ml-1 text-xs font-normal text-slate-400">
              ({t(lang, 'form.optional')})
            </span>
          )}
        </label>
      </div>

      {helpText && <p className="help-text">{helpText}</p>}
      <Images field={field} lang={lang} />

      <div className="mt-2">
        <Control
          field={field}
          lang={lang}
          value={value}
          values={values}
          disabled={disabled}
          onChange={onChange}
          token={token}
          signature={signature}
          onAttachmentsChanged={onAttachmentsChanged}
        />
      </div>

      {missing && (
        <p className="mt-1.5 text-sm text-rose-600">
          {lang === 'cs' ? 'Povinná položka' : 'Required'}
        </p>
      )}

      {/* The failed-check flow: explain what happened, attach evidence, carry on. */}
      {failed && policy && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">
            ⚠ {t(lang, 'form.failTitle')}
          </p>
          <label
            htmlFor={`failnote-${field.id}`}
            className="mt-2 block text-sm text-amber-900"
          >
            {t(lang, 'form.failNote')}
            {policy.requireNote && <span className="ml-0.5 text-rose-600">*</span>}
          </label>
          <textarea
            id={`failnote-${field.id}`}
            rows={3}
            className="field-input mt-1"
            placeholder={t(lang, 'form.failNotePlaceholder')}
            value={failNote ?? ''}
            disabled={disabled}
            onChange={(e) => onFailNote(e.target.value)}
          />
          {problem('fail_note') && (
            <p className="mt-1 text-sm text-rose-600">{t(lang, 'form.failNoteRequired')}</p>
          )}
          {problem('fail_photo') && (
            <p className="mt-1 text-sm text-rose-600">
              {t(lang, 'form.failPhotoRequired')}
            </p>
          )}
        </div>
      )}

      {field.photo && field.type !== 'signature' && (
        <>
          <PhotoUploader
            token={token}
            fieldId={field.id}
            lang={lang}
            photos={photos}
            disabled={disabled}
            required={field.photoRequired || (failed && policy?.requirePhoto)}
            onChanged={onAttachmentsChanged}
          />
          {problem('photo_required') && (
            <p className="mt-1 text-sm text-rose-600">{t(lang, 'form.photoRequired')}</p>
          )}
        </>
      )}
    </div>
  );
}

function Control({
  field,
  lang,
  value,
  values,
  disabled,
  onChange,
  token,
  signature,
  onAttachmentsChanged,
}: {
  field: CompiledField;
  lang: Lang;
  value: unknown;
  values: Record<string, unknown>;
  disabled?: boolean;
  onChange: (v: unknown) => void;
  token: string;
  signature?: Attachment;
  onAttachmentsChanged: () => void;
}) {
  switch (field.type) {
    case 'boolean':
      return (
        <div className="flex gap-2">
          {(field.options ?? []).map((o) => {
            const selected = value === o.value;
            const isNo = o.value === false;
            return (
              <button
                key={String(o.value)}
                type="button"
                disabled={disabled}
                onClick={() => onChange(selected ? null : o.value)}
                className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition sm:flex-none sm:min-w-28 ${
                  selected
                    ? isNo
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                } disabled:opacity-60`}
              >
                {label(o, lang)}
              </button>
            );
          })}
        </div>
      );

    case 'select':
      return (
        <select
          id={`input-${field.id}`}
          className="field-input"
          value={value === null || value === undefined ? '' : String(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">{t(lang, 'form.choose')}</option>
          {(field.options ?? []).map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {label(o, lang)}
            </option>
          ))}
        </select>
      );

    case 'number':
      return (
        <input
          id={`input-${field.id}`}
          type="number"
          inputMode="decimal"
          step="any"
          className="field-input sm:max-w-xs"
          value={value === null || value === undefined ? '' : String(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      );

    case 'date':
      return (
        <input
          id={`input-${field.id}`}
          type="date"
          className="field-input sm:max-w-xs"
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    case 'signature':
      return (
        <SignaturePad
          token={token}
          fieldId={field.id}
          lang={lang}
          existing={signature}
          disabled={disabled}
          onSaved={onAttachmentsChanged}
        />
      );

    case 'table':
      return (
        <TableField
          field={field}
          lang={lang}
          value={value}
          values={values}
          disabled={disabled}
          onChange={onChange}
        />
      );

    case 'text':
    default:
      return field.multiline ? (
        <textarea
          id={`input-${field.id}`}
          rows={4}
          className="field-input"
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={`input-${field.id}`}
          type="text"
          className="field-input"
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function Images({ field, lang }: { field: CompiledField; lang: Lang }) {
  if (!field.images?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {field.images.map((img) => (
        <figure key={img.src} className="max-w-xs">
          <a href={img.src} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={caption(img, lang) ?? ''}
              className="rounded-lg border border-slate-200 bg-white"
            />
          </a>
          {caption(img, lang) && (
            <figcaption className="mt-1 text-xs text-slate-500">
              {caption(img, lang)}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
