"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { editarLicenciaDocente } from "@/app/actions/admin-docencia";

interface LicenciaEditable {
  id: string;
  institucion: string;
  dominioEmail: string | null;
  maxProfesores: number;
  maxAlumnos: number;
  curso: string | null;
  /** Ya en formato YYYY-MM-DD, listo para el input date. */
  fechaFin: string | null;
  activa: boolean;
  notas: string | null;
}

export function EditarLicenciaForm({ licencia }: { licencia: LicenciaEditable }) {
  const t = useTranslations("admin.universidades");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [institucion, setInstitucion] = useState(licencia.institucion);
  const [dominioEmail, setDominioEmail] = useState(licencia.dominioEmail ?? "");
  const [maxProfesores, setMaxProfesores] = useState(licencia.maxProfesores);
  const [maxAlumnos, setMaxAlumnos] = useState(licencia.maxAlumnos);
  const [curso, setCurso] = useState(licencia.curso ?? "");
  const [fechaFin, setFechaFin] = useState(licencia.fechaFin ?? "");
  const [activa, setActiva] = useState(licencia.activa);
  const [notas, setNotas] = useState(licencia.notas ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await editarLicenciaDocente(licencia.id, {
        institucion,
        dominioEmail: dominioEmail || undefined,
        maxProfesores,
        maxAlumnos,
        curso: curso || undefined,
        fechaFin: fechaFin || undefined,
        activa,
        notas: notas || undefined,
      });
      if (result.ok) {
        toast.success(t("toastGuardada"));
        router.refresh();
      } else {
        toast.error(result.error || t("toastErrorGuardar"));
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-2xl">
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("form.institucion")}</label>
        <input
          type="text"
          value={institucion}
          onChange={(e) => setInstitucion(e.target.value)}
          required
          maxLength={150}
          className={input}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("form.dominio")}</label>
        <input
          type="text"
          value={dominioEmail}
          onChange={(e) => setDominioEmail(e.target.value)}
          maxLength={200}
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
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className={input} />
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

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={activa}
          onChange={(e) => setActiva(e.target.checked)}
          className="w-4 h-4 accent-indigo-600"
        />
        <span className="text-sm">{t("form.activa")}</span>
      </label>
      <p className="text-xs text-muted-foreground -mt-2">{t("form.activaAyuda")}</p>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t("form.guardar")}
      </button>
    </form>
  );
}
