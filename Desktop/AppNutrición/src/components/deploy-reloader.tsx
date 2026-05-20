"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { hasPersistedForms } from "@/lib/form-persist";

const POLL_INTERVAL_MS = 30_000;

export function VersionChecker() {
  const t = useTranslations("common.deploy");
  const knownBuildId = useRef(process.env.NEXT_PUBLIC_BUILD_ID ?? "dev");
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const deployDetected = useRef(false);

  const checkVersion = useCallback(async () => {
    if (deployDetected.current) return;
    try {
      const res = await fetch("/api/version", { cache: "no-store" });
      if (!res.ok) return;
      const { buildId } = await res.json() as { buildId: string };
      if (buildId !== knownBuildId.current && knownBuildId.current !== "dev") {
        deployDetected.current = true;
        if (hasPersistedForms()) {
          toast(t("nuevaVersion"), {
            description: t("datosGuardados"),
            duration: Infinity,
            action: {
              label: t("recargar"),
              onClick: () => window.location.reload(),
            },
          });
        } else {
          window.location.reload();
        }
      }
    } catch {}
  }, [t]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_BUILD_ID) return;

    function startPolling() {
      checkVersion();
      intervalRef.current = setInterval(checkVersion, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      clearInterval(intervalRef.current);
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [checkVersion]);

  useEffect(() => {
    const isStale = (msg: string) =>
      msg.includes("was not found on the server") ||
      msg.includes("failed-to-find-server-action");

    function handleStaleAction() {
      if (hasPersistedForms()) {
        toast(t("nuevaVersion"), {
          description: t("datosGuardados"),
          duration: Infinity,
          action: {
            label: t("recargar"),
            onClick: () => window.location.reload(),
          },
        });
      } else {
        window.location.reload();
      }
    }

    function onError(e: ErrorEvent) {
      if (isStale(e.message || "")) handleStaleAction();
    }

    function onRejection(e: PromiseRejectionEvent) {
      const msg = e.reason?.message || String(e.reason || "");
      if (isStale(msg)) handleStaleAction();
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [t]);

  return null;
}
