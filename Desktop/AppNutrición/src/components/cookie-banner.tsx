"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Shield, X } from "lucide-react";

const COOKIE_KEY = "annonia-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    window.dispatchEvent(new CustomEvent("cookie-consent-change", { detail: "accepted" }));
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(COOKIE_KEY, "rejected");
    window.dispatchEvent(new CustomEvent("cookie-consent-change", { detail: "rejected" }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:p-6 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/15 border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ animation: "cookieSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-emerald-500" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <Cookie className="w-5.5 h-5.5 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Tu privacidad nos importa
                </h3>
                <button
                  onClick={reject}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                Usamos cookies <strong className="text-gray-700 dark:text-gray-300">estrictamente necesarias</strong> para que la app funcione
                y cookies de <strong className="text-gray-700 dark:text-gray-300">preferencias</strong> para recordar tu configuración (tema, tours).
                Usamos cookies de análisis (Google Analytics) solo si aceptas. No usamos cookies de publicidad.
              </p>

              <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
                <Shield className="w-3.5 h-3.5" />
                <span>Analytics solo con consentimiento · Sin publicidad · LSSI-CE y RGPD</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-5">
                <button
                  onClick={accept}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-500 transition-colors shadow-sm"
                >
                  Aceptar todas
                </button>
                <button
                  onClick={reject}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Solo necesarias
                </button>
                <Link
                  href="/legal/cookies"
                  onClick={reject}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-center sm:ml-2 py-2.5 sm:py-0 transition-colors"
                >
                  Política de cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
