import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoSaveState<T> {
  draft: T | null;
  hasDraft: boolean;
  isRestored: boolean;
  lastSavedAt: Date | null;
  saveDraft: (values: T) => void;
  clearDraft: () => void;
}

/**
 * Generic auto-save hook for forms that persists unsubmitted drafts in localStorage.
 * Restores automatically when form mounts or allows manual discard.
 */
export function useFormDraft<T extends Record<string, any>>(
  storageKey: string,
  currentValues: T,
  options: {
    enabled?: boolean;
    debounceMs?: number;
    // Don't save if form is considered "empty"
    isEmpty?: (values: T) => boolean;
    onRestore?: (saved: T) => void;
  } = {}
): AutoSaveState<T> {
  const {
    enabled = true,
    debounceMs = 500,
    isEmpty,
    onRestore,
  } = options;

  const [hasDraft, setHasDraft] = useState(false);
  const [draft, setDraft] = useState<T | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Load draft on mount
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(`draft_${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data) {
          setDraft(parsed.data);
          setHasDraft(true);
          setLastSavedAt(parsed.savedAt ? new Date(parsed.savedAt) : new Date());
          if (onRestore) {
            onRestore(parsed.data);
            setIsRestored(true);
          }
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey, enabled]);

  // Save draft on change with debounce
  useEffect(() => {
    if (!enabled) return;

    // Skip the very first mount render so we don't overwrite existing draft with initial empty values
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isEmpty && isEmpty(currentValues)) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const payload = {
          data: currentValues,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(`draft_${storageKey}`, JSON.stringify(payload));
        setHasDraft(true);
        setDraft(currentValues);
        setLastSavedAt(new Date());
      } catch {
        // quota exceeded or private mode
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [storageKey, currentValues, enabled, debounceMs, isEmpty]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`draft_${storageKey}`);
      setHasDraft(false);
      setDraft(null);
      setIsRestored(false);
      setLastSavedAt(null);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const saveDraft = useCallback((values: T) => {
    try {
      const payload = {
        data: values,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`draft_${storageKey}`, JSON.stringify(payload));
      setHasDraft(true);
      setDraft(values);
      setLastSavedAt(new Date());
    } catch {
      // ignore
    }
  }, [storageKey]);

  return {
    draft,
    hasDraft,
    isRestored,
    lastSavedAt,
    saveDraft,
    clearDraft,
  };
}
