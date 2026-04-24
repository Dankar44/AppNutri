"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Credenciales incorrectas. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    toast.success("¡Bienvenido de nuevo!");
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      toast.error("No se pudo iniciar sesión con Google.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Leaf className="w-16 h-16 mb-8" />
          <h1 className="text-5xl font-bold mb-4">Annonia</h1>
          <p className="text-xl text-green-100 max-w-md">
            La plataforma profesional para dietistas. Crea dietas
            personalizadas, gestiona tus pacientes y optimiza tu consulta.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Dietas personalizadas en minutos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Base de datos de +2000 alimentos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Seguimiento completo de pacientes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho con formulario */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 pb-safe">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-xl sm:text-2xl font-bold">Annonia</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Iniciar sesión</h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8">
            Accede a tu cuenta de dietista
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full mb-5 flex items-center justify-center gap-3 rounded-lg border border-input bg-card py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleGlyph />
            )}
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
            <div className="flex-1 h-px bg-border" />
            o con tu email
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  maxLength={128}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="text-primary font-medium hover:underline"
            >
              Regístrate gratis
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              ¿Eres paciente?{" "}
              <Link
                href="/paciente/login"
                className="text-primary font-medium hover:underline"
              >
                Accede al portal de pacientes
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
