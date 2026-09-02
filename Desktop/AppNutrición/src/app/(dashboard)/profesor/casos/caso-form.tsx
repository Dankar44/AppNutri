"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { crearCaso, editarCaso, type CasoFormData } from "@/app/actions/casos";

/**
 * #40 — El formulario del caso: un paciente ficticio con su historia.
 *
 * Son los mismos campos que la ficha de un paciente de verdad, porque de aquí sale uno. Solo el
 * nombre del caso y el del paciente son obligatorios: el profesor decide cuánto detalle le da.
 */
export function CasoForm({
  casoId,
  valores,
}: {
  casoId?: string;
  valores?: Partial<CasoFormData>;
}) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [datos, setDatos] = useState<CasoFormData>({
    nombre: valores?.nombre ?? "",
    consigna: valores?.consigna ?? "",
    pacienteNombre: valores?.pacienteNombre ?? "",
    pacienteApellidos: valores?.pacienteApellidos ?? "",
    sexo: valores?.sexo ?? "",
    fechaNacimiento: valores?.fechaNacimiento ?? "",
    peso: valores?.peso ?? null,
    altura: valores?.altura ?? null,
    objetivo: valores?.objetivo ?? "MANTENIMIENTO",
    objetivoDetalle: valores?.objetivoDetalle ?? "",
    nivelActividad: valores?.nivelActividad ?? "",
    patologias: valores?.patologias ?? "",
    alergias: valores?.alergias ?? "",
    intolerancias: valores?.intolerancias ?? "",
    medicamentos: valores?.medicamentos ?? "",
    suplementos: valores?.suplementos ?? "",
    preferencias: valores?.preferencias ?? "",
    notas: valores?.notas ?? "",
  });
  // Los números van como texto: si no, escribir "0200" o borrar el campo se pelea con el estado.
  const [peso, setPeso] = useState(valores?.peso != null ? String(valores.peso) : "");
  const [altura, setAltura] = useState(valores?.altura != null ? String(valores.altura) : "");

  const cambiar = (campo: keyof CasoFormData, valor: string) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const carga: CasoFormData = {
        ...datos,
        peso: peso.trim() === "" ? null : Number(peso.replace(",", ".")),
        altura: altura.trim() === "" ? null : Number(altura.replace(",", ".")),
      };
      const result = casoId ? await editarCaso(casoId, carga) : await crearCaso(carga);
      if (result.ok) {
        toast.success(casoId ? t("guardado") : t("creado"));
        router.push(casoId ? `/profesor/casos/${casoId}` : `/profesor/casos/${(result as { casoId?: string }).casoId ?? ""}`);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const etiqueta = "text-xs font-medium text-muted-foreground";
  const seccion = "py-5 lg:p-5 lg:border lg:border-border lg:rounded-xl lg:bg-card space-y-4 border-b border-border lg:border-b";

  const listas: [keyof CasoFormData, string][] = [
    ["patologias", t("campos.patologias")],
    ["alergias", t("campos.alergias")],
    ["intolerancias", t("campos.intolerancias")],
    ["medicamentos", t("campos.medicamentos")],
    ["suplementos", t("campos.suplementos")],
    ["preferencias", t("campos.preferencias")],
  ];

  return (
    <form onSubmit={guardar} className="space-y-5">
      <section className={seccion}>
        <h2 className="font-semibold">{t("secciones.elCaso")}</h2>
        <div>
          <label className={etiqueta}>{t("campos.nombre")}</label>
          <input
            type="text"
            value={datos.nombre}
            onChange={(e) => cambiar("nombre", e.target.value)}
            required
            maxLength={150}
            autoFocus
            placeholder={t("campos.nombrePlaceholder")}
            className={input}
          />
        </div>
        <div>
          <label className={etiqueta}>{t("campos.consigna")}</label>
          <textarea
            value={datos.consigna}
            onChange={(e) => cambiar("consigna", e.target.value)}
            rows={4}
            placeholder={t("campos.consignaPlaceholder")}
            className={`${input} resize-y`}
          />
          <p className="text-xs text-muted-foreground mt-1">{t("campos.consignaAyuda")}</p>
        </div>
      </section>

      <section className={seccion}>
        <h2 className="font-semibold">{t("secciones.elPaciente")}</h2>
        <p className="text-xs text-muted-foreground -mt-2">{t("secciones.elPacienteAyuda")}</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiqueta}>{t("campos.pacienteNombre")}</label>
            <input type="text" value={datos.pacienteNombre} onChange={(e) => cambiar("pacienteNombre", e.target.value)} required maxLength={100} className={input} />
          </div>
          <div>
            <label className={etiqueta}>{t("campos.pacienteApellidos")}</label>
            <input type="text" value={datos.pacienteApellidos} onChange={(e) => cambiar("pacienteApellidos", e.target.value)} maxLength={100} className={input} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiqueta}>{t("campos.sexo")}</label>
            <select value={datos.sexo} onChange={(e) => cambiar("sexo", e.target.value)} className={input}>
              <option value="">{t("campos.sinDato")}</option>
              <option value="FEMENINO">{t("sexo.FEMENINO")}</option>
              <option value="MASCULINO">{t("sexo.MASCULINO")}</option>
              <option value="OTRO">{t("sexo.OTRO")}</option>
            </select>
          </div>
          <div>
            <label className={etiqueta}>{t("campos.fechaNacimiento")}</label>
            <input type="date" value={datos.fechaNacimiento} onChange={(e) => cambiar("fechaNacimiento", e.target.value)} className={input} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiqueta}>{t("campos.peso")}</label>
            <input type="text" inputMode="decimal" value={peso} onFocus={(e) => e.target.select()} onChange={(e) => setPeso(e.target.value)} className={input} />
          </div>
          <div>
            <label className={etiqueta}>{t("campos.altura")}</label>
            <input type="text" inputMode="decimal" value={altura} onFocus={(e) => e.target.select()} onChange={(e) => setAltura(e.target.value)} className={input} />
          </div>
        </div>
        <div>
          <label className={etiqueta}>{t("campos.objetivo")}</label>
          <select value={datos.objetivo} onChange={(e) => cambiar("objetivo", e.target.value)} className={input}>
            {["MANTENIMIENTO", "PERDER_PESO", "GANAR_MASA", "PATOLOGIA", "DEPORTIVO", "OTRO"].map((o) => (
              <option key={o} value={o}>{t(`objetivo.${o}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={etiqueta}>{t("campos.nivelActividad")}</label>
          <input type="text" value={datos.nivelActividad} onChange={(e) => cambiar("nivelActividad", e.target.value)} maxLength={120} placeholder={t("campos.nivelActividadPlaceholder")} className={input} />
        </div>
      </section>

      <section className={seccion}>
        <h2 className="font-semibold">{t("secciones.suHistoria")}</h2>
        <div>
          <label className={etiqueta}>{t("campos.notas")}</label>
          <textarea
            value={datos.notas}
            onChange={(e) => cambiar("notas", e.target.value)}
            rows={6}
            placeholder={t("campos.notasPlaceholder")}
            className={`${input} resize-y`}
          />
          <p className="text-xs text-muted-foreground mt-1">{t("campos.notasAyuda")}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {listas.map(([campo, label]) => (
            <div key={campo}>
              <label className={etiqueta}>{label}</label>
              <textarea
                value={(datos[campo] as string) ?? ""}
                onChange={(e) => cambiar(campo, e.target.value)}
                rows={2}
                placeholder={t("campos.unoPorLinea")}
                className={`${input} resize-y`}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          {t("cancelar")}
        </button>
        <button
          type="submit"
          disabled={isPending || !datos.nombre.trim() || !datos.pacienteNombre.trim()}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {casoId ? t("guardar") : t("crear")}
        </button>
      </div>
    </form>
  );
}
