"use client";

import { useState } from "react";
import { Camera, Loader2, Check, Lock } from "lucide-react";
import { actualizarPerfilPaciente, actualizarFotoPaciente, cambiarPasswordPaciente } from "@/app/actions/paciente-auth";
import { toast } from "sonner";

interface Props {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  fotoUrl: string;
}

export function PerfilPacienteForm({ nombre, apellidos, email, telefono, fotoUrl }: Props) {
  const [form, setForm] = useState({ nombre, apellidos, telefono });
  const [saving, setSaving] = useState(false);
  const [foto, setFoto] = useState(fotoUrl);

  const [passForm, setPassForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [savingPass, setSavingPass] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellidos.trim()) {
      toast.error("Nombre y apellidos son obligatorios");
      return;
    }
    setSaving(true);
    try {
      await actualizarPerfilPaciente(form);
      toast.success("Perfil actualizado");
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Máximo 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setFoto(dataUrl);
      try {
        await actualizarFotoPaciente(dataUrl);
        toast.success("Foto actualizada");
      } catch {
        toast.error("Error al subir la foto");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passForm.nueva.length < 6) {
      toast.error("Mínimo 6 caracteres");
      return;
    }
    if (passForm.nueva !== passForm.confirmar) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSavingPass(true);
    try {
      await cambiarPasswordPaciente(passForm.actual, passForm.nueva);
      toast.success("Contraseña cambiada");
      setPassForm({ actual: "", nueva: "", confirmar: "" });
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      const msg = err instanceof Error ? err.message : "Error al cambiar contraseña";
      toast.error(msg);
    } finally {
      setSavingPass(false);
    }
  }

  const initials = `${nombre[0] || ""}${apellidos[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Foto + datos */}
      <section className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-border">
          <label className="relative cursor-pointer shrink-0 self-center">
            {foto ? (
              <img src={foto} alt="Foto" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                {initials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
          </label>
          <div>
            <p className="font-semibold text-lg">{nombre} {apellidos}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => update("nombre", e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Apellidos</label>
              <input
                type="text"
                value={form.apellidos}
                onChange={(e) => update("apellidos", e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => update("telefono", e.target.value)}
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">El email no se puede cambiar</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </section>

      {/* Cambiar contraseña */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          Cambiar contraseña
        </h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Contraseña actual</label>
            <input
              type="password"
              value={passForm.actual}
              onChange={(e) => setPassForm({ ...passForm, actual: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                value={passForm.nueva}
                onChange={(e) => setPassForm({ ...passForm, nueva: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={passForm.confirmar}
                onChange={(e) => setPassForm({ ...passForm, confirmar: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPass}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Cambiar contraseña
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
