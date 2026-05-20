"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { crearConsulta } from "@/app/actions/consultas";
import { crearMedida } from "@/app/actions/medidas";
import { useUncontrolledFormPersist } from "@/lib/form-persist";
import { withTimeout } from "@/lib/utils";

export default function NuevaConsultaPage() {
  const params = useParams();
  const pacienteId = params.id as string;
  const t = useTranslations("patients");
  const tc = useTranslations("common.deploy");
  const [loading, setLoading] = useState(false);
  const [incluirMedidas, setIncluirMedidas] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { wasRestored, clear: clearDraft } = useUncontrolledFormPersist(
    `consulta-nueva-${pacienteId}`,
    formRef,
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const fecha = (form.get("fecha") as string) || undefined;

    try {
      let medidaId: string | undefined;

      if (incluirMedidas) {
        const peso = parseFloat(form.get("peso") as string) || undefined;
        const altura = parseFloat(form.get("altura") as string) || undefined;
        const grasaCorporal = parseFloat(form.get("grasaCorporal") as string) || undefined;

        if (peso || altura || grasaCorporal) {
          const medida = await withTimeout(crearMedida({
            pacienteId,
            fecha,
            peso,
            altura,
            grasaCorporal,
            perimetroCintura: parseFloat(form.get("perimetroCintura") as string) || undefined,
          }));
          medidaId = medida?.id;
        }
      }

      await withTimeout(crearConsulta({
        pacienteId,
        fecha,
        motivo: (form.get("motivo") as string) || undefined,
        notas: (form.get("notas") as string) || undefined,
        medidaId,
      }));

      clearDraft();
      toast.success(t("consultas.consultaRegistrada"));
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("consultas.errorCrearConsulta"));
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/pacientes/${pacienteId}/consultas`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("consultas.volverAConsultas")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("consultas.titulo")}</h1>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <section className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("consultas.datosConsulta")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("consultas.fecha")}</label>
              <input
                name="fecha"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("consultas.motivo")}</label>
              <input
                name="motivo"
                maxLength={200}
                placeholder={t("consultas.motivoPlaceholder")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("consultas.notasClinicas")}</label>
            <textarea
              name="notas"
              rows={5}
              maxLength={2000}
              placeholder={t("consultas.notasPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-y"
            />
          </div>
        </section>

        <section className="bg-card rounded-xl border border-border p-6 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={incluirMedidas}
              onChange={(e) => setIncluirMedidas(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm font-medium">{t("consultas.registrarMedidas")}</span>
          </label>

          {incluirMedidas && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium mb-1">{t("consultas.pesoKg")}</label>
                <input
                  name="peso"
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={500}
                  className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t("consultas.alturaCm")}</label>
                <input
                  name="altura"
                  type="number"
                  step="0.1"
                  min={30}
                  max={300}
                  className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t("consultas.grasaPorcentaje")}</label>
                <input
                  name="grasaCorporal"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t("consultas.cinturaCm")}</label>
                <input
                  name="perimetroCintura"
                  type="number"
                  step="0.1"
                  min={0}
                  max={300}
                  className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm"
                />
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href={`/pacientes/${pacienteId}/consultas`}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            {t("consultas.cancelar")}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? t("consultas.guardando") : t("consultas.registrarConsulta")}
          </button>
        </div>
      </form>
    </div>
  );
}
