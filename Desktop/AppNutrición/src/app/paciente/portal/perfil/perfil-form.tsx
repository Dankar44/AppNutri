"use client";

import { useState } from "react";
import { Camera, Loader2, Check, Lock, UserRound } from "lucide-react";
import { actualizarPerfilPaciente, actualizarFotoPaciente, cambiarPasswordPaciente } from "@/app/actions/paciente-auth";
import { toast } from "sonner";
import { compressImage, IMAGE_PRESETS } from "@/lib/image-compress";
import { useTranslations } from "next-intl";
import { isNextNavigation } from "@/lib/utils";

interface Props {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  fotoUrl: string;
}

export function PerfilPacienteForm({ nombre, apellidos, email, telefono, fotoUrl }: Props) {
  const t = useTranslations("patient-portal");
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
      toast.error(t("perfil.toast.nombreObligatorio"));
      return;
    }
    setSaving(true);
    try {
      await actualizarPerfilPaciente(form);
      toast.success(t("perfil.toast.perfilActualizado"));
    } catch (err) {
      if (isNextNavigation(err)) throw err;
      toast.error(t("perfil.toast.errorGuardar"));
    } finally {
      setSaving(false);
    }
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("perfil.toast.maxFoto"));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      try {
        const dataUrl = await compressImage(raw, IMAGE_PRESETS.PROFILE_PHOTO);
        setFoto(dataUrl);
        await actualizarFotoPaciente(dataUrl);
        toast.success(t("perfil.toast.fotoActualizada"));
      } catch {
        toast.error(t("perfil.toast.errorFoto"));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passForm.nueva.length < 6) {
      toast.error(t("perfil.toast.passwordCorta"));
      return;
    }
    if (passForm.nueva !== passForm.confirmar) {
      toast.error(t("perfil.toast.passwordNoCoincide"));
      return;
    }
    setSavingPass(true);
    try {
      await cambiarPasswordPaciente(passForm.actual, passForm.nueva);
      toast.success(t("perfil.toast.passwordCambiada"));
      setPassForm({ actual: "", nueva: "", confirmar: "" });
    } catch (err) {
      if (isNextNavigation(err)) throw err;
      const msg = err instanceof Error ? err.message : t("perfil.toast.errorPassword");
      toast.error(msg);
    } finally {
      setSavingPass(false);
    }
  }

  const initials = `${nombre[0] || ""}${apellidos[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Cabecera con foto + nombre (centrada) */}
      <section className="bg-card rounded-xl border border-border p-5 flex items-center justify-center gap-4">
        <label className="relative cursor-pointer shrink-0">
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
        <div className="min-w-0">
          <p className="font-semibold text-lg">{nombre} {apellidos}</p>
          <p className="text-sm text-muted-foreground truncate">{email}</p>
        </div>
      </section>

      {/* Matriz: datos personales | cambiar contraseña */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserRound className="w-5 h-5 text-muted-foreground" />
          {t("perfil.datosPersonales")}
        </h2>
        <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("perfil.nombre")}</label>
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
              <label className="block text-sm font-medium mb-1.5">{t("perfil.apellidos")}</label>
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
              <label className="block text-sm font-medium mb-1.5">{t("perfil.telefono")}</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => update("telefono", e.target.value)}
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("perfil.email")}</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("perfil.emailNoEditable")}</p>
            </div>
          </div>
          <div className="flex justify-end mt-auto pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t("perfil.guardarCambios")}
            </button>
          </div>
        </form>
      </section>

      {/* Cambiar contraseña */}
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          {t("perfil.cambiarPassword.title")}
        </h2>
        <form onSubmit={handlePassword} className="flex-1 flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("perfil.cambiarPassword.actual")}</label>
            <input
              type="password"
              value={passForm.actual}
              onChange={(e) => setPassForm({ ...passForm, actual: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("perfil.cambiarPassword.nueva")}</label>
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
              <label className="block text-sm font-medium mb-1.5">{t("perfil.cambiarPassword.confirmar")}</label>
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
          <div className="flex justify-end mt-auto pt-2">
            <button
              type="submit"
              disabled={savingPass}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {t("perfil.cambiarPassword.submit")}
            </button>
          </div>
        </form>
      </section>
      </div>
    </div>
  );
}
