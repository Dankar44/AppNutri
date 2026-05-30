"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { editarDietista, type EditarDietistaData } from "@/app/actions/admin";
import { EditDietistaModal } from "@/components/edit-dietista-modal";

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
  dietista: DietistaEditable;
}

export function EditarDietistaButton({ dietista }: Props) {
  const t = useTranslations("admin.dietistas.editar");
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(data: EditarDietistaData) {
    setSaving(true);
    const res = await editarDietista(dietista.id, data);
    if (!res.ok) {
      toast.error(res.error || t("toastError"));
      setSaving(false);
      return;
    }
    const toastKey = data.nuevaPassword ? "toastExitoConPassword" : "toastExito";
    toast.success(t(toastKey, { nombre: `${data.nombre} ${data.apellidos}` }));
    setShowModal(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title={t("boton")}
        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <EditDietistaModal
        open={showModal}
        dietista={dietista}
        loading={saving}
        onSave={handleSave}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
