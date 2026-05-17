"use client";

import { useEffect } from "react";

export function DeployReloader() {
  useEffect(() => {
    const isStale = (msg: string) =>
      msg.includes("was not found on the server") ||
      msg.includes("failed-to-find-server-action");

    function onError(e: ErrorEvent) {
      if (isStale(e.message || "")) window.location.reload();
    }

    function onRejection(e: PromiseRejectionEvent) {
      const msg = e.reason?.message || String(e.reason || "");
      if (isStale(msg)) window.location.reload();
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
