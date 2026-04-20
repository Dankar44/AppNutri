"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function AIConfigBanner() {
  return (
    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          IA no configurada
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Para usar la generación con IA, añade tus claves de Groq en{" "}
          <code className="bg-amber-100 dark:bg-amber-500/15 px-1 rounded">.env.local</code> como{" "}
          <code className="bg-amber-100 dark:bg-amber-500/15 px-1 rounded">GROQ_API_KEY_1=gsk_...</code>
        </p>
        <Link
          href="/ajustes"
          className="inline-block mt-2 text-xs text-amber-800 dark:text-amber-300 underline hover:no-underline"
        >
          Ir a Ajustes
        </Link>
      </div>
    </div>
  );
}
