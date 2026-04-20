"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>(
  value: T,
  save: (v: T) => Promise<void>,
  opts: { delayMs?: number; enabled?: boolean } = {}
): { status: Status; flush: () => Promise<void> } {
  const { delayMs = 800, enabled = true } = opts;
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);
  const firstRun = useRef(true);

  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    if (!enabled) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    timer.current = setTimeout(async () => {
      try {
        await save(latest.current);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } catch {
        setStatus("error");
      }
    }, delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled]);

  async function flush() {
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    try {
      await save(latest.current);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  }

  return { status, flush };
}
