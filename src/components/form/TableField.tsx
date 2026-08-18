'use client';

import type { CompiledField, Lang } from '@/lib/checklist/types';
import { help, label } from '@/lib/checklist/types';
import { isTableValue, type TableValue } from '@/lib/checklist/state';
import { t } from '@/lib/i18n';

interface Props {
  field: CompiledField;
  lang: Lang;
  value: unknown;
  disabled?: boolean;
  onChange: (v: TableValue) => void;
}

/**
 * Repeatable tables let the installer add as many rows as reality needs — the row
 * counts on the paper form were a print-layout constraint, not a business rule.
 * Fixed-row tables (e.g. the JPS switchboard designations) keep their labelled rows.
 */
export function TableField({ field, lang, value, disabled, onChange }: Props) {
  const columns = field.columns ?? [];
  const fixed = field.fixedRows;

  const current: TableValue = isTableValue(value)
    ? value
    : { rows: initialRows(field) };

  function setCell(rowIdx: number, colId: string, v: unknown) {
    const rows = current.rows.map((r, i) => (i === rowIdx ? { ...r, [colId]: v } : r));
    onChange({ rows });
  }

  function addRow() {
    onChange({ rows: [...current.rows, {}] });
  }

  function removeRow(idx: number) {
    onChange({ rows: current.rows.filter((_, i) => i !== idx) });
  }

  return (
    <div className="mt-2">
      {/* Wide tables scroll inside their own container instead of the page. */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              {fixed && <th className="px-3 py-2 text-left font-medium text-slate-600" />}
              {columns.map((c) => (
                <th
                  key={c.id}
                  className="px-3 py-2 text-left font-medium text-slate-600"
                  title={help(c, lang)}
                >
                  {label(c, lang)}
                  {c.unit ? ` [${c.unit}]` : ''}
                </th>
              ))}
              {!disabled && !fixed && <th className="w-10 px-2" />}
            </tr>
          </thead>
          <tbody>
            {current.rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {fixed && (
                  <th className="bg-slate-50/60 px-3 py-2 text-left font-normal text-slate-600 whitespace-nowrap">
                    {fixed[i] ? label(fixed[i], lang) : ''}
                  </th>
                )}
                {columns.map((c) => (
                  <td key={c.id} className="px-2 py-1.5">
                    {c.type === 'select' ? (
                      <select
                        className="field-input py-1.5 text-sm"
                        value={String(row[c.id] ?? '')}
                        disabled={disabled}
                        onChange={(e) => setCell(i, c.id, e.target.value || null)}
                      >
                        <option value="">{t(lang, 'form.choose')}</option>
                        {c.options?.map((o) => (
                          <option key={String(o.value)} value={String(o.value)}>
                            {label(o, lang)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'
                        }
                        inputMode={c.type === 'number' ? 'decimal' : undefined}
                        className="field-input py-1.5 text-sm"
                        value={String(row[c.id] ?? '')}
                        disabled={disabled}
                        onChange={(e) =>
                          setCell(
                            i,
                            c.id,
                            c.type === 'number'
                              ? e.target.value === ''
                                ? null
                                : Number(e.target.value)
                              : e.target.value,
                          )
                        }
                      />
                    )}
                  </td>
                ))}
                {!disabled && !fixed && (
                  <td className="px-2 text-center">
                    <button
                      type="button"
                      aria-label={t(lang, 'form.removeRow')}
                      className="rounded px-2 py-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => removeRow(i)}
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!disabled && field.repeatable !== false && (
        <button
          type="button"
          className="btn-secondary mt-2 px-3 py-1.5 text-xs"
          onClick={addRow}
        >
          + {t(lang, 'form.addRow')}
        </button>
      )}
    </div>
  );
}

function initialRows(field: CompiledField): Record<string, unknown>[] {
  if (field.fixedRows?.length) return field.fixedRows.map(() => ({}));
  const n = Math.max(1, Math.min(field.suggestedRows ?? 1, 3));
  return Array.from({ length: n }, () => ({}));
}
