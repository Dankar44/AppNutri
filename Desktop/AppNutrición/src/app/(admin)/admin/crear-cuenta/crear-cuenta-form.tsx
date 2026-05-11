"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Copy, Check } from "lucide-react";
import { crearCuentaNutricionista } from "@/app/actions/admin";

export function CrearCuentaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creada, setCreada] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim();
    const password = (form.get("password") as string);
    const nombre = (form.get("nombre") as string).trim();
    const apellidos = (form.get("apellidos") as string).trim();

    const res = await crearCuentaNutricionista({ email, password, nombre, apellidos });

    if (res.ok) {
      toast.success("Cuenta creada correctamente");
      setCreada({ email, password });
    } else {
      toast.error(res.error || "Error al crear la cuenta");
    }

    setLoading(false);
  }

  function handleCopy() {
    if (!creada) return;
    navigator.clipboard.writeText(`Email: ${creada.email}\nContraseña: ${creada.password}\nLogin: https://annonia.com/login`);
    setCopied(true);
    toast.success("Credenciales copiadas");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setCreada(null);
    setCopied(false);
  }

  if (creada) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Check className="w-5 h-5" />
            <p className="font-semibold">Cuenta creada</p>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{creada.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Contraseña:</span>{" "}
              <span className="font-mono font-medium">{creada.password}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Login:</span>{" "}
              <span className="font-medium">https://annonia.com/login</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado" : "Copiar credenciales"}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              Crear otra cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              name="nombre"
              required
              maxLength={100}
              placeholder="Ej: María"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellidos</label>
            <input
              name="apellidos"
              maxLength={100}
              placeholder="Ej: García López"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder="nutricionista@ejemplo.com"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña *</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              maxLength={100}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        <UserPlus className="w-4 h-4" />
        {loading ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
