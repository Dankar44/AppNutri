"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { crearMedida, type MedidaFormData } from "@/app/actions/medidas";
import { DatePicker } from "@/components/date-picker";
import { useTranslations } from "next-intl";

interface MedidasFormProps {
  pacienteId: string;
  defaultPeso?: number | null;
  defaultAltura?: number | null;
  onSuccess?: () => void;
}

function NumField({
  name,
  label,
  unit,
  step = "0.1",
  min,
  max,
  defaultValue,
}: {
  name: string;
  label: string;
  unit: string;
  step?: string;
  min?: number;
  max?: number;
  defaultValue?: number | null;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <div className="relative">
        <input
          name={name}
          type="number" inputMode="decimal"
          step={step}
          min={min}
          max={max}
          defaultValue={defaultValue ?? ""}
          placeholder=""
          className="w-full px-3 py-2.5 pr-12 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {unit}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground mt-6 mb-3">{children}</h3>;
}

export function MedidasForm({
  pacienteId,
  defaultPeso,
  defaultAltura,
  onSuccess,
}: MedidasFormProps) {
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const t = useTranslations("patients.medidasForm");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const num = (name: string) => parseFloat(form.get(name) as string) || undefined;

    const data: MedidaFormData = {
      pacienteId,
      fecha: fecha || undefined,
      peso: num("peso"),
      altura: num("altura"),
      grasaCorporal: num("grasaCorporal"),
      masaMuscular: num("masaMuscular"),
      perimetroCintura: num("perimetroCintura"),
      perimetroCadera: num("perimetroCadera"),
      perimetroBrazo: num("perimetroBrazo"),
      pliegueAbdominal: num("pliegueAbdominal"),
      pliegueAxilar: num("pliegueAxilar"),
      plieguePectoral: num("plieguePectoral"),
      pliegueSubescapular: num("pliegueSubescapular"),
      pliegueSuprailiaco: num("pliegueSuprailiaco"),
      pliegueTricipital: num("pliegueTricipital"),
      pliegueMuslo: num("pliegueMuslo"),
      colesterolHDL: num("colesterolHDL"),
      colesterolLDL: num("colesterolLDL"),
      colesterolTotal: num("colesterolTotal"),
      presionDiastolica: num("presionDiastolica"),
      presionSistolica: num("presionSistolica"),
      trigliceridos: num("trigliceridos"),
      notas: (form.get("notas") as string) || undefined,
    };

    try {
      await crearMedida(data);
      toast.success(t("medidasRegistradas"));
      e.currentTarget.reset();
      onSuccess?.();
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("errorRegistrarMedidas"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className="block text-sm font-semibold mb-1.5">{t("fechaMediciones")}</label>
        <DatePicker value={fecha} onChange={setFecha} />
      </div>

      <SectionTitle>{t("medicionesBasicas")}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <NumField name="peso" label={t("peso")} unit="kg" min={0.1} max={500} defaultValue={defaultPeso} />
        <NumField name="altura" label={t("altura")} unit="cm" min={30} max={300} defaultValue={defaultAltura} />
        <NumField name="perimetroCadera" label={t("perimetroCadera")} unit="cm" min={0} max={300} />
        <NumField name="perimetroCintura" label={t("perimetroCintura")} unit="cm" min={0} max={300} />
      </div>

      <SectionTitle>{t("composicionCorporal")}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <NumField name="grasaCorporal" label={t("grasaCorporal")} unit="%" min={0} max={100} />
        <NumField name="masaMuscular" label={t("masaMuscular")} unit="kg" min={0} max={200} />
        <NumField name="perimetroBrazo" label={t("perimetroBrazo")} unit="cm" min={0} max={100} />
      </div>

      <SectionTitle>{t("plieguesCutaneos")}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <NumField name="pliegueAbdominal" label={t("pliegueAbdominal")} unit="mm" min={0} max={100} />
        <NumField name="pliegueAxilar" label={t("pliegueAxilar")} unit="mm" min={0} max={100} />
        <NumField name="plieguePectoral" label={t("plieguePectoral")} unit="mm" min={0} max={100} />
        <NumField name="pliegueSubescapular" label={t("pliegueSubescapular")} unit="mm" min={0} max={100} />
        <NumField name="pliegueSuprailiaco" label={t("pliegueSuprailiaco")} unit="mm" min={0} max={100} />
        <NumField name="pliegueTricipital" label={t("pliegueTricipital")} unit="mm" min={0} max={100} />
        <NumField name="pliegueMuslo" label={t("pliegueMuslo")} unit="mm" min={0} max={100} />
      </div>

      <SectionTitle>{t("datosAnaliticos")}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <NumField name="colesterolHDL" label={t("colesterolHDL")} unit="mg/dL" min={0} max={500} />
        <NumField name="colesterolLDL" label={t("colesterolLDL")} unit="mg/dL" min={0} max={500} />
        <NumField name="colesterolTotal" label={t("colesterolTotal")} unit="mg/dL" min={0} max={500} />
        <NumField name="presionDiastolica" label={t("presionDiastolica")} unit="mmHg" min={0} max={300} />
        <NumField name="presionSistolica" label={t("presionSistolica")} unit="mmHg" min={0} max={300} />
        <NumField name="trigliceridos" label={t("trigliceridos")} unit="mg/dL" min={0} max={1000} />
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? t("guardando") : t("registrar")}
        </button>
      </div>
    </form>
  );
}
