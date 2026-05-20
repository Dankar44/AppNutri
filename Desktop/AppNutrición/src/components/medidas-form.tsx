"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { crearMedida, type MedidaFormData } from "@/app/actions/medidas";
import { DatePicker } from "@/components/date-picker";
import { useTranslations } from "next-intl";
import { useUncontrolledFormPersist } from "@/lib/form-persist";
import { isNextNavigation, withTimeout } from "@/lib/utils";

interface MedidasFormProps {
  pacienteId: string;
  defaultPeso?: number | null;
  defaultAltura?: number | null;
  defaults?: Partial<Record<string, number | null>>;
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
  defaults = {},
  onSuccess,
}: MedidasFormProps) {
  const d = (key: string) => defaults[key] ?? undefined;
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const t = useTranslations("patients.medidasForm");
  const tc = useTranslations("common.deploy");
  const formRef = useRef<HTMLFormElement>(null);
  const { wasRestored, clear: clearDraft } = useUncontrolledFormPersist(
    `medidas-${pacienteId}`,
    formRef,
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);

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
      grasaSubcutanea: num("grasaSubcutanea"),
      musculoEsqueletico: num("musculoEsqueletico"),
      agua: num("agua"),
      masaOsea: num("masaOsea"),
      perimetroAbdomen: num("perimetroAbdomen"),
      grasaVisceral: num("grasaVisceral"),
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
      await withTimeout(crearMedida(data));
      toast.success(t("medidasRegistradas"));
      clearDraft();
      formRef.current?.reset();
      onSuccess?.();
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      toast.error(t("errorRegistrarMedidas"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className="block text-sm font-semibold mb-1.5">{t("fechaMediciones")}</label>
        <DatePicker value={fecha} onChange={setFecha} />
      </div>

      <SectionTitle>{t("medicionesBasicas")}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <NumField name="peso" label={t("peso")} unit="kg" min={0.1} max={500} defaultValue={defaultPeso} />
        <NumField name="altura" label={t("altura")} unit="cm" min={30} max={300} defaultValue={defaultAltura} />
        <NumField name="perimetroCadera" label={t("perimetroCadera")} unit="cm" min={0} max={300} defaultValue={d("perimetroCadera")} />
        <NumField name="perimetroCintura" label={t("perimetroCintura")} unit="cm" min={0} max={300} defaultValue={d("perimetroCintura")} />
        <NumField name="perimetroAbdomen" label={t("perimetroAbdomen")} unit="cm" min={0} max={300} defaultValue={d("perimetroAbdomen")} />
        <NumField name="perimetroBrazo" label={t("perimetroBrazo")} unit="cm" min={0} max={100} defaultValue={d("perimetroBrazo")} />
      </div>

      <SectionTitle>{t("composicionCorporal")}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <NumField name="grasaCorporal" label={t("grasaCorporal")} unit="%" min={0} max={100} defaultValue={d("grasaCorporal")} />
        <NumField name="masaMuscular" label={t("masaMuscular")} unit="kg" min={0} max={200} defaultValue={d("masaMuscular")} />
        <NumField name="grasaSubcutanea" label={t("grasaSubcutanea")} unit="%" min={0} max={100} defaultValue={d("grasaSubcutanea")} />
        <NumField name="musculoEsqueletico" label={t("musculoEsqueletico")} unit="%" min={0} max={100} defaultValue={d("musculoEsqueletico")} />
        <NumField name="agua" label={t("agua")} unit="%" min={0} max={100} defaultValue={d("agua")} />
        <NumField name="masaOsea" label={t("masaOsea")} unit="kg" min={0} max={50} defaultValue={d("masaOsea")} />
        <NumField name="grasaVisceral" label={t("grasaVisceral")} unit="" step="1" min={0} max={60} defaultValue={d("grasaVisceral")} />
      </div>

      <SectionTitle>{t("plieguesCutaneos")}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <NumField name="pliegueAbdominal" label={t("pliegueAbdominal")} unit="mm" min={0} max={100} defaultValue={d("pliegueAbdominal")} />
        <NumField name="pliegueAxilar" label={t("pliegueAxilar")} unit="mm" min={0} max={100} defaultValue={d("pliegueAxilar")} />
        <NumField name="plieguePectoral" label={t("plieguePectoral")} unit="mm" min={0} max={100} defaultValue={d("plieguePectoral")} />
        <NumField name="pliegueSubescapular" label={t("pliegueSubescapular")} unit="mm" min={0} max={100} defaultValue={d("pliegueSubescapular")} />
        <NumField name="pliegueSuprailiaco" label={t("pliegueSuprailiaco")} unit="mm" min={0} max={100} defaultValue={d("pliegueSuprailiaco")} />
        <NumField name="pliegueTricipital" label={t("pliegueTricipital")} unit="mm" min={0} max={100} defaultValue={d("pliegueTricipital")} />
        <NumField name="pliegueMuslo" label={t("pliegueMuslo")} unit="mm" min={0} max={100} defaultValue={d("pliegueMuslo")} />
      </div>

      <SectionTitle>{t("datosAnaliticos")}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <NumField name="colesterolHDL" label={t("colesterolHDL")} unit="mg/dL" min={0} max={500} defaultValue={d("colesterolHDL")} />
        <NumField name="colesterolLDL" label={t("colesterolLDL")} unit="mg/dL" min={0} max={500} defaultValue={d("colesterolLDL")} />
        <NumField name="colesterolTotal" label={t("colesterolTotal")} unit="mg/dL" min={0} max={500} defaultValue={d("colesterolTotal")} />
        <NumField name="presionDiastolica" label={t("presionDiastolica")} unit="mmHg" min={0} max={300} defaultValue={d("presionDiastolica")} />
        <NumField name="presionSistolica" label={t("presionSistolica")} unit="mmHg" min={0} max={300} defaultValue={d("presionSistolica")} />
        <NumField name="trigliceridos" label={t("trigliceridos")} unit="mg/dL" min={0} max={1000} defaultValue={d("trigliceridos")} />
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
