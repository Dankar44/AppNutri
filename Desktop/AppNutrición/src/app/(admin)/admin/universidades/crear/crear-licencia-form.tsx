"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { crearLicenciaDocente } from "@/app/actions/admin-docencia";
import { cursoActual } from "@/lib/docencia";

export function CrearLicenciaForm() {
  const t = useTranslations("admin.universidades");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [institucion, setInstitucion] = useState("");
  const [dominioEmail, setDominioEmail] = useState("");
  const [maxProfesores, setMaxProfesores] = useState(1);
  const [maxAlumnos, setMaxAlumnos] = useState(0);
  const [curso, setCurso] = useState(cursoActual());
  const [fechaFin, setFechaFin] = useState("");
  const [notas, setNotas] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearLicenciaDocente({
        institucion,
        dominioEmail: dominioEmail || undefined,
        maxProfesores,
        maxAlumnos,
        curso: curso || undefined,
        fechaFin: fechaFin || undefined,
        notas: notas || undefined,
      });
      if (result.ok) {
        toast.success(t("toastCreada"));
        router.push(`/admin/universidades/${result.licenciaId}`);
      } else {
        toast.error(result.error || t("toastErrorCrear"));
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t("form.datos")}
        </h2>

        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("form.institucion")}</label>
          <input
            type="text"
            value={institucion}
            onChange={(e) => setInstitucion(e.target.value)}
            required
            maxLength={150}
            placeholder={t("form.institucionPlaceholder")}
            className={input}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("form.dominio")}</label>
          <input
            type="text"
            value={dominioEmail}
            onChange={(e) => setDominioEmail(e.target.value)}
            maxLength={100}
            placeholder={t("form.dominioPlaceholder")}
            className={input}
          />
          <p className="text-xs text-muted-foreground mt-1">{t("form.dominioAyuda")}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("form.maxProfesores")}</label>
            <input
              type="number"
              value={maxProfesores}
              onChange={(e) => setMaxProfesores(Math.max(1, Number(e.target.value)))}
              min={1}
              className={input}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("form.maxAlumnos")}</label>
            <input
              type="number"
              value={maxAlumnos}
              onChange={(e) => setMaxAlumnos(Math.max(0, Number(e.target.value)))}
              min={0}
              className={input}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("form.curso")}</label>
            <input
              type="text"
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              maxLength={20}
              className={input}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("form.fechaFin")}</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={input}
            />
            <p className="text-xs text-muted-foreground mt-1">{t("form.fechaFinAyuda")}</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("form.notas")}</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            maxLength={1000}
            rows={2}
            className={`${input} resize-none`}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
        {t("form.submit")}
      </button>
    </form>
  );
}
