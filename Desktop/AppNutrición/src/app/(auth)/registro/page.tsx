"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    especialidad: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          apellidos: form.apellidos,
          especialidad: form.especialidad,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("¡Cuenta creada! Revisa tu email para confirmarla.");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Leaf className="w-16 h-16 mb-8" />
          <h1 className="text-5xl font-bold mb-4">NutriApp</h1>
          <p className="text-xl text-green-100 max-w-md">
            Únete a la plataforma que está transformando la forma en que los
            dietistas crean dietas personalizadas.
          </p>
        </div>
      </div>

      {/* Panel derecho con formulario */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">NutriApp</span>
          </div>

          <h2 className="text-3xl font-bold mb-2">Crear cuenta</h2>
          <p className="text-muted-foreground mb-8">
            Regístrate como dietista profesional
          </p>

          <form onSubmit={handleRegistro} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium mb-1.5"
                >
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => updateForm("nombre", e.target.value)}
                  placeholder="María"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
              <div>
                <label
                  htmlFor="apellidos"
                  className="block text-sm font-medium mb-1.5"
                >
                  Apellidos
                </label>
                <input
                  id="apellidos"
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => updateForm("apellidos", e.target.value)}
                  placeholder="García López"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                Email profesional
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="especialidad"
                className="block text-sm font-medium mb-1.5"
              >
                Especialidad
                <span className="text-muted-foreground font-normal">
                  {" "}
                  (opcional)
                </span>
              </label>
              <input
                id="especialidad"
                type="text"
                value={form.especialidad}
                onChange={(e) => updateForm("especialidad", e.target.value)}
                placeholder="Ej: Nutrición deportiva, Obesidad..."
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
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
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow pr-12"
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
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
