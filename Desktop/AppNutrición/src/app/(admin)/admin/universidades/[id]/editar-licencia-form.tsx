"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { editarLicenciaDocente } from "@/app/actions/admin-docencia";
import { SelectorCurso } from "@/components/docencia/selector-curso";
import { cursoActual, cursoDeAnio, cursoDeFechaFin } from "@/lib/docencia";

interface LicenciaEditable {
  id: string;
  institucion: string;
  personaContacto: string | null;
  dominioEmail: string | null;
  maxProfesores: number;
  maxAlumnos: number;
  /** Ya en formato YYYY-MM-DD, listos para el calendario. */
  fechaInicio: string;
  fechaFin: string | null;
  activa: boolean;
  notas: string | null;
}

export function EditarLicenciaForm({ licencia }: { licencia: LicenciaEditable }) {
  const t = useTranslations("admin.universidades");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [institucion, setInstitucion] = useState(licencia.institucion);
  const [personaContacto, setPersonaContacto] = useState(licencia.personaContacto ?? "");
  const [dominioEmail, setDominioEmail] = useState(licencia.dominioEmail ?? "");
  // Texto mientras se edita: con un input numérico, escribir junto al valor que ya había dejaba
  // "0200" o "13" en vez de lo tecleado.
  const [maxProfesores, setMaxProfesores] = useState(String(licencia.maxProfesores));
  const [maxAlumnos, setMaxAlumnos] = useState(String(licencia.maxAlumnos));

  const alEnfocarNumero = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  const soloDigitos = (v: string) => v.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  // El curso al que corresponde la licencia. Si no tenía fecha de fin, se propone el de ahora.
  const [curso, setCurso] = useState(
    (licencia.fechaFin ? cursoDeFechaFin(new Date(licencia.fechaFin)) : null)?.anio ?? cursoActual().anio,
  );
  const [activa, setActiva] = useState(licencia.activa);
  const [notas, setNotas] = useState(licencia.notas ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await editarLicenciaDocente(licencia.id, {
        institucion,
        personaContacto: personaContacto || undefined,
        dominioEmail: dominioEmail || undefined,
        maxProfesores: Number(maxProfesores || 0),
        maxAlumnos: Number(maxAlumnos || 0),
        fechaInicio: cursoDeAnio(curso).inicio.toISOString().slice(0, 10),
        fechaFin: cursoDeAnio(curso).fin.toISOString().slice(0, 10),
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
