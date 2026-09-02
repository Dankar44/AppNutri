"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { crearCaso, editarCaso, type CasoFormData } from "@/app/actions/casos";

/**
 * #40 — Lo mínimo para arrancar un caso: cómo se llama, qué se les pide, y cómo se llama el
 * paciente. Al crearlo se va DIRECTO a la ficha de ese paciente, que es la de siempre: ahí se
 * rellena la anamnesis, las mediciones, las alergias, el horario… exactamente igual que con un
 * paciente real. Es la gracia (Guillermo, 2 sep 2026).
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
  const [nombre, setNombre] = useState(valores?.nombre ?? "");
  const [consigna, setConsigna] = useState(valores?.consigna ?? "");
  const [pacienteNombre, setPacienteNombre] = useState(valores?.pacienteNombre ?? "");
  const [pacienteApellidos, setPacienteApellidos] = useState(valores?.pacienteApellidos ?? "");

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (casoId) {
        const result = await editarCaso(casoId, { nombre, consigna });
        if (result.ok) {
          toast.success(t("guardado"));
          router.push(`/profesor/casos/${casoId}`);
          router.refresh();
        } else {
          toast.error(result.error || t("errorGuardar"));
        }
        return;
      }
      const result = await crearCaso({ nombre, consigna, pacienteNombre, pacienteApellidos });
      if (result.ok && result.pacienteId) {
        toast.success(t("creado"));
        // A la ficha del paciente, a rellenarlo como uno de verdad.
        router.push(`/pacientes/${result.pacienteId}?espacio=docente`);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const etiqueta = "text-xs font-medium text-muted-foreground";

  return (
    <form onSubmit={guardar} className="space-y-5 max-w-2xl">
      <div>
        <label className={etiqueta}>{t("campos.nombre")}</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
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
          value={consigna}
          onChange={(e) => setConsigna(e.target.value)}
          rows={4}
          placeholder={t("campos.consignaPlaceholder")}
          className={`${input} resize-y`}
        />
        <p className="text-xs text-muted-foreground mt-1">{t("campos.consignaAyuda")}</p>
      </div>

      {!casoId && (
        <div>
          <p className="text-sm font-medium">{t("secciones.elPaciente")}</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">{t("secciones.elPacienteAyuda")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={etiqueta}>{t("campos.pacienteNombre")}</label>
              <input
                type="text"
                value={pacienteNombre}
                onChange={(e) => setPacienteNombre(e.target.value)}
                required
                maxLength={100}
                className={input}
              />
            </div>
            <div>
              <label className={etiqueta}>{t("campos.pacienteApellidos")}</label>
              <input
                type="text"
                value={pacienteApellidos}
                onChange={(e) => setPacienteApellidos(e.target.value)}
                maxLength={100}
                className={input}
              />
            </div>
          </div>
        </div>
      )}

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
          disabled={isPending || !nombre.trim() || (!casoId && !pacienteNombre.trim())}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : casoId ? <Save className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          {casoId ? t("guardar") : t("crearYRellenar")}
        </button>
      </div>
    </form>
  );
}
