"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { asignarPlantillaPaciente, type PlantillaResumen } from "@/app/actions/plantillas-anamnesis";

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

export function SelectorPlantillaAnamnesis({
  pacienteId,
  plantillas,
  valorActual,
  onCrearNueva,
}: {
  pacienteId: string;
  plantillas: PlantillaResumen[];
  valorActual: string | null;
  onCrearNueva: () => void;
}) {
  const t = useTranslations("patients.preconsulta");
  const router = useRouter();
  const [valor, setValor] = useState(valorActual ?? "");
  const [pending, startTransition] = useTransition();

  // Mantener el select sincronizado con el valor real tras refrescar.
  useEffect(() => {
    setValor(valorActual ?? "");
  }, [valorActual]);

  function onChange(nuevo: string) {
    if (nuevo === "__nuevo__") {
      onCrearNueva();
      return;
    }
    const anterior = valor;
    setValor(nuevo);
    startTransition(async () => {
      const res = await asignarPlantillaPaciente(pacienteId, nuevo || null);
      if (res.ok) {
        toast.success(t("plantillaAplicada"));
        router.refresh();
      } else {
        setValor(anterior);
        toast.error(res.error || t("plantillaAplicada"));
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        aria-label={t("plantillaLabel")}
        className={SELECT_CLS}
      >
        <option value="">{t("plantillaGenerica")}</option>
        {plantillas.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
        <option value="__nuevo__">＋ {t("crearTipo")}</option>
      </select>
    </div>
  );
}
