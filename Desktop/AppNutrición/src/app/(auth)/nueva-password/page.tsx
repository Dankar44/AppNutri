"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowLeft, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { verificarTokenRecuperacion, resetearPassword } from "@/app/actions/recovery";

export default function NuevaPasswordPage() {
  return (
    <Suspense>
      <NuevaPasswordContent />
    </Suspense>
  );
}

function NuevaPasswordContent() {
  const t = useTranslations("auth.nuevaPassword");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }
    verificarTokenRecuperacion(token).then((res) => {
      setTokenValid(res.ok);
      setValidating(false);
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error(t("errorMinLength"));
      return;
    }

    if (password !== confirm) {
      toast.error(t("errorNoMatch"));
      return;
    }

    setLoading(true);

    const res = await resetearPassword(token, password);

    if (!res.ok) {
      toast.error(res.error || t("errorGeneric"));
      setLoading(false);
      return;
    }

    toast.success(t("successMessage"));
    router.push("/login");
  }

  if (validating) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-8 pt-safe pb-safe">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-muted-foreground text-sm">{t("errorNoSession")}</p>
          <Link
            href="/recuperar-password"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-green-700 transition-colors text-sm"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8 pt-safe pb-safe">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <Leaf className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">Annonia</span>
        </div>

        <h2 className="text-2xl font-bold mb-2">{t("title")}</h2>
        <p className="text-muted-foreground text-sm mb-8">
          {t("subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                required
                minLength={6}
                maxLength={128}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">
              {t("confirmLabel")}
            </label>
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("confirmPlaceholder")}
              required
              minLength={6}
              maxLength={128}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t("submitting") : t("submitButton")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
