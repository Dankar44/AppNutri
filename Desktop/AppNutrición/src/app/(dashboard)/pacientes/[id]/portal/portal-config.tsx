"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Check, AlertTriangle, Shield } from "lucide-react";
import { crearAccesoPaciente } from "@/app/actions/paciente-auth";
import { toast } from "sonner";

interface Props {
  pacienteId: string;
  emailDefault: string;
  accesoExistente: {
    email: string;
    activo: boolean;
    tienePassword: boolean;
    perfilCompleto: boolean;
  } | null;
}

function generarPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function PortalConfig({ pacienteId, emailDefault, accesoExistente }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pinGenerado, setPinGenerado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [emailForm, setEmailForm] = useState(accesoExistente?.email || emailDefault);

  const yaTieneCuenta = accesoExistente?.perfilCompleto || accesoExistente?.tienePassword;

  async function handleGenerar() {
    setLoading(true);
    const pin = generarPin();

    try {
      await crearAccesoPaciente(pacienteId, emailForm, pin);
      setPinGenerado(pin);
      setConfirmando(false);
      toast.success("PIN generado correctamente");
      router.refresh();
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al configurar acceso");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Si ya tiene cuenta con contraseña, pedir confirmación
    if (yaTieneCuenta) {
      setConfirmando(true);
    } else {
      handleGenerar();
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {/* Estado actual */}
      {accesoExistente && !pinGenerado && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Estado del acceso</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{accesoExistente.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${accesoExistente.activo ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                {accesoExistente.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contraseña</span>
              <span className="text-xs font-medium">
                {accesoExistente.tienePassword ? "Configurada" : "Solo PIN"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Perfil</span>
              <span className="text-xs font-medium">
                {accesoExistente.perfilCompleto ? "Completado" : "Pendiente"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PIN generado */}
      {pinGenerado && (
        <div className="bg-primary/5 border-2 border-primary rounded-lg p-6 text-center">
          <Key className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-sm font-medium mb-2">Nuevo PIN generado</p>
          <p className="text-3xl font-bold tracking-[0.3em] text-primary mb-3">
            {pinGenerado}
          </p>
          <p className="text-xs text-muted-foreground">
            Comparte este PIN con el paciente. Solo se muestra una vez.
            <br />
            Al entrar se le pedirá crear una nueva contraseña.
          </p>
        </div>
      )}

      {/* Diálogo de confirmación */}
      {confirmando && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Este paciente ya tiene contraseña configurada
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Al generar un nuevo PIN, el paciente perderá su contraseña actual y tendrá que crear una nueva al iniciar sesión con el PIN. Sus dietas, medidas, foto y demás datos NO se verán afectados.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleGenerar}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Generando..." : "Sí, generar nuevo PIN"}
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      {!confirmando && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {accesoExistente ? "Regenerar PIN" : "Crear acceso"}
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1">Email del paciente *</label>
            <input
              name="email"
              type="email"
              required
              maxLength={200}
              value={emailForm}
              onChange={(e) => setEmailForm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              El paciente usará este email para hacer login
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Generando..." : accesoExistente ? "Regenerar PIN" : "Generar PIN y crear acceso"}
          </button>
        </form>
      )}
    </div>
  );
}
