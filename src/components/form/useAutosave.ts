'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormStatus } from '@/db/schema';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface PendingEdit {
  value: unknown;
  failNote?: string | null;
}

const DEBOUNCE_MS = 600;
const RETRY_MS = [2000, 5000, 15000, 30000];

/**
 * Per-field autosave with coalescing and retry.
 *
 * Everything typed goes into a pending map and is flushed as one batch shortly
 * after the installer stops typing. A failed flush keeps its edits pending and
 * retries with backoff, so a dropped connection in a switchroom loses nothing as
 * long as the tab stays open.
 */
export function useAutosave(token: string, onStatus?: (s: FormStatus) => void) {
  const pending = useRef(new Map<string, PendingEdit>());
  const inFlight = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryIndex = useRef(0);
  const [state, setState] = useState<SaveState>('idle');

  const flush = useCallback(async (): Promise<void> => {
    // Wait for a request already on the wire rather than returning early —
    // otherwise flushNow() could resolve before the last edits are saved.
    if (inFlight.current) {
      await inFlight.current;
      if (pending.current.size === 0) return;
    }
    if (pending.current.size === 0) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState('offline');
      return;
    }

    const batch = Array.from(pending.current.entries()).map(([fieldId, edit]) => ({
      fieldId,
      value: edit.value,
      failNote: edit.failNote,
    }));
    setState('saving');

    const run = (async () => {
      try {
        const res = await fetch(`/api/f/${token}/answers`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ updates: batch }),
        });
        if (!res.ok) throw new Error(await res.text());
        const body = (await res.json()) as { status?: FormStatus };

        // Only clear entries that didn't change while the request was in flight.
        for (const item of batch) {
          const current = pending.current.get(item.fieldId);
          if (
            current &&
            current.value === item.value &&
            (current.failNote ?? null) === (item.failNote ?? null)
          ) {
            pending.current.delete(item.fieldId);
          }
        }
        retryIndex.current = 0;
        setState(pending.current.size ? 'saving' : 'saved');
        if (body.status) onStatus?.(body.status);
      } catch {
        const wait = RETRY_MS[Math.min(retryIndex.current, RETRY_MS.length - 1)];
        retryIndex.current += 1;
        setState('error');
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), wait);
      }
    })();

    inFlight.current = run;
    try {
      await run;
    } finally {
      if (inFlight.current === run) inFlight.current = null;
    }

    // Edits that arrived mid-request still need sending.
    if (pending.current.size && retryIndex.current === 0) await flush();
  }, [token, onStatus]);

  const queue = useCallback(
    (fieldId: string, value: unknown, failNote?: string | null) => {
      pending.current.set(fieldId, { value, failNote });
      setState('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  /**
   * Force everything pending to the server and wait for it. Returns false if
   * something still hasn't saved, so a caller (submit) can decline to proceed.
   */
  const flushNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await flush();
    return pending.current.size === 0;
  }, [flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0) e.preventDefault();
    };
    const online = () => void flush();
    window.addEventListener('beforeunload', warn);
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('beforeunload', warn);
      window.removeEventListener('online', online);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  return { queue, flushNow, state, hasPending: () => pending.current.size > 0 };
}
