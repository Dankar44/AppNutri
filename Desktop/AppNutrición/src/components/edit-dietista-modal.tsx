"use client";

import { useState, useEffect } from "react";
import { Pencil, X, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { EditarDietistaData } from "@/app/actions/admin";

interface DietistaEditable {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  especialidad: string | null;
  numColegiado: string | null;
  clinica: string | null;
  creadoPor: string | null;
  fuenteContacto: string | null;
}

interface Props {
  open: boolean;
  dietista: DietistaEditable;
  loading: boolean;
  onSave: (data: EditarDietistaData) => void;
  onCancel: () => void;
}

export function EditDietistaModal({ open, dietista, loading, onSave, onCancel }: Props) {
  const t = useTranslations("admin.dietistas.editar");
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    especialidad: "",
    numColegiado: "",
    clinica: "",
    creadoPor: "",
    fuenteContacto: "",
    nuevaPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        nombre: dietista.nombre,
        apellidos: dietista.apellidos,
        email: dietista.email,
        telefono: dietista.telefono ?? "",
        especialidad: dietista.especialidad ?? "",
        numColegiado: dietista.numColegiado ?? "",
        clinica: dietista.clinica ?? "",
        creadoPor: dietista.creadoPor ?? "",
        fuenteContacto: dietista.fuenteContacto ?? "",
        nuevaPassword: "",
      });
      setShowPassword(false);
    }
  }, [open, dietista]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const emailCambio = form.email.trim().toLowerCase() !== dietista.email.toLowerCase();
  const hayCambios =
    form.nombre !== dietista.nombre ||
    form.apellidos !== dietista.apellidos ||
    emailCambio ||
    form.telefono !== (dietista.telefono ?? "") ||
    form.especialidad !== (dietista.especialidad ?? "") ||
    form.numColegiado !== (dietista.numColegiado ?? "") ||
    form.clinica !== (dietista.clinica ?? "") ||
    form.creadoPor !== (dietista.creadoPor ?? "") ||
    form.fuenteContacto !== (dietista.fuenteContacto ?? "") ||
    form.nuevaPassword.length > 0;

  const passwordInvalida = form.nuevaPassword.length > 0 && form.nuevaPassword.length < 6;
  const puedeGuardar = form.nombre.trim() && form.apellidos.trim() && form.email.trim() && hayCambios && !passwordInvalida;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puedeGuardar || loading) return;
    onSave({
      nombre: form.nombre,
      apellidos: form.apellidos,
      email: form.email,
      telefono: form.telefono || undefined,
      especialidad: form.especialidad || undefined,
      numColegiado: form.numColegiado || undefined,
      clinica: form.clinica || undefined,
      creadoPor: form.creadoPor || undefined,
      fuenteContacto: form.fuenteContacto || undefined,
      nuevaPassword: form.nuevaPassword || undefined,
    });
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2 rounded-full shrink-0 bg-indigo-50 dark:bg-indigo-500/15">
            <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{t("titulo")}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-muted transition-colors shrink-0 -mt-1 -mr-1"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("nombre")}</label>
              <input
                value={form.nombre}
                onChange={(e) => update("nombre", e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("apellidos")}</label>
              <input
                value={form.apellidos}
                onChange={(e) => update("apellidos", e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("email")}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              maxLength={254}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              data-form-type="other"
              className={inputClass}
            />
            {emailCambio && (
              <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{t("avisoEmail")}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("telefono")}</label>
              <input
                value={form.telefono}
                onChange={(e) => update("telefono", e.target.value)}
                maxLength={20}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("numColegiado")}</label>
              <input
                value={form.numColegiado}
                onChange={(e) => update("numColegiado", e.target.value)}
                maxLength={50}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("especialidad")}</label>
            <input
              value={form.especialidad}
              onChange={(e) => update("especialidad", e.target.value)}
              maxLength={200}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("clinica")}</label>
            <input
              value={form.clinica}
              onChange={(e) => update("clinica", e.target.value)}
              maxLength={200}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("creadoPor")}</label>
              <input
                value={form.creadoPor}
                onChange={(e) => update("creadoPor", e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("fuenteContacto")}</label>
              <select
                value={form.fuenteContacto}
                onChange={(e) => update("fuenteContacto", e.target.value)}
                className={inputClass}
              >
                <option value="">{t("fuentePlaceholder")}</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="universidad">Universidad</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="block text-sm font-medium mb-1">{t("nuevaPassword")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.nuevaPassword}
                onChange={(e) => update("nuevaPassword", e.target.value)}
                placeholder={t("nuevaPasswordPlaceholder")}
                maxLength={100}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore
                data-form-type="other"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.nuevaPassword.length > 0 && form.nuevaPassword.length < 6 && (
              <p className="text-xs text-red-500 mt-1">{t("passwordMinLength")}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{t("nuevaPasswordHint")}</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
            >
              {t("cancelar")}
            </button>
            <button
              type="submit"
              disabled={!puedeGuardar || loading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {loading ? t("guardando") : t("guardar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
