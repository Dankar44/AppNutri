"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle2, Pencil, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  reenviarVerificacionAdmin,
  activarCuentaAdmin,
  corregirEmailCuentaIncompleta,
  eliminarCuentaIncompleta,
} from "@/app/actions/admin";

interface Props {
  authId: string;
  email: string;
  nombre: string;
}

export function CuentaIncompletaActions({ authId, email, nombre }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "reenviar" | "activar" | "eliminar" | "email">(null);
  const [editing, setEditing] = useState(false);
  const [emailValue, setEmailValue] = useState(email);
  const disabled = busy !== null;

  async function handleReenviar() {
    setBusy("reenviar");
    const res = await reenviarVerificacionAdmin(authId);
    if (res.ok) toast.success("Email de verificación reenviado a " + email);
    else toast.error(res.error || "No se pudo reenviar");
    setBusy(null);
  }

  async function handleActivar() {
    if (!confirm(`¿Activar la cuenta de ${nombre} (${email}) sin verificar el email? Podrá iniciar sesión con la contraseña que puso al registrarse.`)) return;
    setBusy("activar");
    const res = await activarCuentaAdmin(authId);
    if (res.ok) { toast.success("Cuenta activada"); router.refresh(); }
    else { toast.error(res.error || "No se pudo activar"); setBusy(null); }
  }

  async function handleEliminar() {
    if (!confirm(`¿Eliminar definitivamente la cuenta incompleta de ${nombre} (${email})? Podrá registrarse de nuevo desde cero.`)) return;
    setBusy("eliminar");
    const res = await eliminarCuentaIncompleta(authId);
    if (res.ok) { toast.success("Cuenta eliminada"); router.refresh(); }
    else { toast.error(res.error || "No se pudo eliminar"); setBusy(null); }
  }

  async function handleGuardarEmail() {
    const nuevo = emailValue.trim().toLowerCase();
    if (nuevo === email.toLowerCase()) { setEditing(false); return; }
    setBusy("email");
    const res = await corregirEmailCuentaIncompleta(authId, nuevo);
    if (res.ok) { toast.success("Email corregido a " + nuevo); setEditing(false); router.refresh(); }
    else { toast.error(res.error || "No se pudo corregir"); setBusy(null); }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={emailValue}
          onChange={(e) => setEmailValue(e.target.value)}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleGuardarEmail}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy === "email" && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar
        </button>
        <button
          onClick={() => { setEditing(false); setEmailValue(email); }}
          disabled={disabled}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleReenviar}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 disabled:opacity-60"
      >
        {busy === "reenviar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Reenviar verificación
      </button>
      <button
        onClick={handleActivar}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/15 disabled:opacity-60"
      >
        {busy === "activar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Activar
      </button>
      <button
        onClick={() => setEditing(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted disabled:opacity-60"
      >
        <Pencil className="w-3.5 h-3.5" /> Corregir email
      </button>
      <button
        onClick={handleEliminar}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-60"
      >
        {busy === "eliminar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Eliminar
      </button>
    </div>
  );
}
