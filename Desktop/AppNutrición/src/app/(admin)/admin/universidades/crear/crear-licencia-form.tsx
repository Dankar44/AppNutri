"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { crearLicenciaDocente } from "@/app/actions/admin-docencia";
import { SelectorCurso } from "@/components/docencia/selector-curso";
import { cursoActual, cursoDeAnio } from "@/lib/docencia";
import { finDeCursoPorDefecto, inicioDeCursoPorDefecto } from "@/lib/docencia";

export function CrearLicenciaForm() {
  const t = useTranslations("admin.universidades");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [institucion, setInstitucion] = useState("");
  const [personaContacto, setPersonaContacto] = useState("");
  const [dominioEmail, setDominioEmail] = useState("");
  // Los cupos se guardan como texto mientras se escriben: con un número, al teclear junto al
  // valor que ya había salía "0200" o "13" en vez de lo que se quería (visto el 30 ago 2026).
  const [maxProfesores, setMaxProfesores] = useState("1");
  const [maxAlumnos, setMaxAlumnos] = useState("0");
  // El curso es lo que se vende: del 1 de septiembre al 31 de agosto. Las fechas salen de él.
  const [curso, setCurso] = useState(cursoActual().anio);
  const [notas, setNotas] = useState("");

  /** Selecciona lo que hay al entrar en el campo, para que al escribir se reemplace. */
  const alEnfocarNumero = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  const soloDigitos = (v: string) => v.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearLicenciaDocente({
        institucion,
        personaContacto: personaContacto || undefined,
        dominioEmail: dominioEmail || undefined,
        maxProfesores: Number(maxProfesores || 0),
        maxAlumnos: Number(maxAlumnos || 0),
        fechaInicio: cursoDeAnio(curso).inicio.toISOString().slice(0, 10),
        fechaFin: cursoDeAnio(curso).fin.toISOString().slice(0, 10),
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
          <label className="text-xs font-medium text-muted-foreground">{t("form.personaContacto")}</label>
          <input
            type="text"
            value={personaContacto}
            onChange={(e) => setPersonaContacto(e.target.value)}
            maxLength={200}
            placeholder={t("form.personaContactoPlaceholder")}
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
              type="text"
              inputMode="numeric"
              value={maxProfesores}
              onChange={(e) => setMaxProfesores(soloDigitos(e.target.value))}
              onFocus={alEnfocarNumero}
              className={input}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("form.maxAlumnos")}</label>
            <input
              type="text"
              inputMode="numeric"
              value={maxAlumnos}
              onChange={(e) => setMaxAlumnos(soloDigitos(e.target.value))}
              onFocus={alEnfocarNumero}
              className={input}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="curso">{t("form.curso")}</label>
          <SelectorCurso id="curso" value={curso} onChange={setCurso} />
          <p className="text-xs text-muted-foreground mt-1">{t("form.cursoAyuda")}</p>
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
