"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  googleLinked: { email: string } | null;
};

export function GoogleLoginCard({ googleLinked }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleLink() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/ajustes`,
      },
    });
    if (error) {
      toast.error("No se pudo vincular la cuenta de Google.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
          <GoogleGlyph />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Inicio de sesión con Google</p>
          <p className="text-xs text-muted-foreground">
            Vincula tu cuenta de Google para iniciar sesión con un solo clic, sin
            contraseña.
          </p>
        </div>
      </div>

      {googleLinked ? (
        <div className="mt-3 flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">
            Vinculada con{" "}
            <strong className="font-semibold">{googleLinked.email}</strong>
          </span>
        </div>
      ) : (
        <button
          onClick={handleLink}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <GoogleGlyph />
          )}
          {loading ? "Conectando…" : "Vincular cuenta de Google"}
        </button>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
