"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { actualizarPerfil, type PerfilFormData } from "@/app/actions/perfil";
import { isNextNavigation, withTimeout } from "@/lib/utils";
import { useDemoGuard } from "@/contexts/demo-context";
import { TelefonoInput } from "@/components/telefono-input";

interface Props {
  defaultValues: PerfilFormData;
}

export function PerfilForm({ defaultValues }: Props) {
  const t = useTranslations("settings");
  const router = useRouter();
  const blockIfDemo = useDemoGuard();
  const [loading, setLoading] = useState(false);
  const [telefono, setTelefono] = useState(defaultValues.telefono || "");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blockIfDemo()) return;
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data: PerfilFormData = {
      nombre: form.get("nombre") as string,
      apellidos: form.get("apellidos") as string,
      telefono: (form.get("telefono") as string) || undefined,
      especialidad: (form.get("especialidad") as string) || undefined,
      numColegiado: (form.get("numColegiado") as string) || undefined,
      clinica: (form.get("clinica") as string) || undefined,
    };

    try {
      await withTimeout(actualizarPerfil(data));
      toast.success(t("perfilForm.toastSuccess"));
      router.refresh();
    } catch (error) { if (isNextNavigation(error)) throw error;
      toast.error(t("perfilForm.toastError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("perfilForm.nombreLabel")}</label>
          <input name="nombre" required maxLength={100} defaultValue={defaultValues.nombre}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("perfilForm.apellidosLabel")}</label>
          <input name="apellidos" required maxLength={100} defaultValue={defaultValues.apellidos}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("perfilForm.telefonoLabel")}</label>
        <TelefonoInput
          value={telefono}
          onChange={setTelefono}
          inputClassName="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
        <input type="hidden" name="telefono" value={telefono} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("perfilForm.especialidadLabel")}</label>
        <input name="especialidad" maxLength={200} defaultValue={defaultValues.especialidad || ""}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("perfilForm.numColegiadoLabel")}</label>
          <input name="numColegiado" maxLength={50} defaultValue={defaultValues.numColegiado || ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("perfilForm.clinicaLabel")}</label>
          <input name="clinica" maxLength={200} defaultValue={defaultValues.clinica || ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50">
        {loading ? t("perfilForm.guardando") : t("perfilForm.guardarCambios")}
      </button>
    </form>
  );
}
