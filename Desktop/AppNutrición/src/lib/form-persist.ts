"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const STORAGE_PREFIX = "annonia-form-";
const DEBOUNCE_MS = 500;
const EXPIRY_MS = 24 * 60 * 60 * 1000;

interface PersistedForm {
  data: Record<string, unknown>;
  savedAt: number;
  path: string;
}

let expiredCleanedThisSession = false;

function storageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

function saveForm(key: string, data: Record<string, unknown>) {
  try {
    const entry: PersistedForm = {
      data,
      savedAt: Date.now(),
      path: window.location.pathname,
    };
    localStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {}
}

function loadForm(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const entry: PersistedForm = JSON.parse(raw);
    if (Date.now() - entry.savedAt > EXPIRY_MS) {
      localStorage.removeItem(storageKey(key));
      return null;
    }
    return entry.data;
  } catch {
    localStorage.removeItem(storageKey(key));
    return null;
  }
}

function clearForm(key: string) {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {}
}

export function clearAllForms() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function hasPersistedForms(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) return true;
    }
  } catch {}
  return false;
}

function clearExpiredForms() {
  try {
    const now = Date.now();
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      try {
        const entry: PersistedForm = JSON.parse(localStorage.getItem(k)!);
        if (now - entry.savedAt > EXPIRY_MS) localStorage.removeItem(k);
      } catch {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

function runExpiryCleanup() {
  if (expiredCleanedThisSession) return;
  expiredCleanedThisSession = true;
  clearExpiredForms();
}

function isEmptyState(data: Record<string, unknown>): boolean {
  return Object.values(data).every(
    (v) => v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0)
  );
}

export function useFormPersist<T extends Record<string, unknown>>(
  key: string,
  state: T,
  setState: (val: T) => void,
  options?: { enabled?: boolean }
): { wasRestored: boolean; clear: () => void } {
  const enabled = options?.enabled ?? true;
  const [wasRestored, setWasRestored] = useState(false);
  const mountedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    runExpiryCleanup();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const saved = loadForm(key);
    if (saved && !isEmptyState(saved)) {
      setState(saved as T);
      setWasRestored(true);
    }
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled || !mountedRef.current) return;
    if (isEmptyState(state)) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveForm(key, state);
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [key, enabled, state]);

  return {
    wasRestored,
    clear: () => clearForm(key),
  };
}

export function useUncontrolledFormPersist(
  key: string,
  formRef: RefObject<HTMLFormElement | null>,
  options?: { enabled?: boolean }
): { wasRestored: boolean; clear: () => void } {
  const enabled = options?.enabled ?? true;
  const [wasRestored, setWasRestored] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    runExpiryCleanup();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const saved = loadForm(key);
    if (!saved || isEmptyState(saved)) return;

    const form = formRef.current;
    if (!form) return;

    requestAnimationFrame(() => {
      for (const [name, value] of Object.entries(saved)) {
        const el = form.elements.namedItem(name);
        if (!el) continue;
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
          if (el instanceof HTMLInputElement && el.type === "checkbox") {
            el.checked = Boolean(value);
          } else {
            el.value = String(value ?? "");
          }
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      setWasRestored(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const form = formRef.current;
    if (!form) return;

    function persist() {
      const f = formRef.current;
      if (!f) return;
      const data: Record<string, unknown> = {};
      const fd = new FormData(f);
      fd.forEach((v, k) => {
        data[k] = v;
      });
      if (!isEmptyState(data)) {
        saveForm(key, data);
      }
    }

    function onInput() {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(persist, DEBOUNCE_MS);
    }

    form.addEventListener("input", onInput);
    window.addEventListener("beforeunload", persist);

    return () => {
      clearTimeout(debounceRef.current);
      form.removeEventListener("input", onInput);
      window.removeEventListener("beforeunload", persist);
    };
  }, [key, enabled, formRef]);

  return {
    wasRestored,
    clear: () => clearForm(key),
  };
}
