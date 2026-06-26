"use client";

import { useState } from "react";
import { User, Target, HeartPulse, Check, Loader2, Plus, X, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TelefonoInput } from "@/components/telefono-input";
import { DatePicker } from "@/components/date-picker";
import { FichaAccordion } from "./ficha-accordion";
import { FichaLabel, FichaInput, FichaSelect, FichaTwoCol } from "./ficha-form-fields";
import { AnamnesisRenderer } from "./anamnesis-renderer";
import { HorarioPaciente } from "./horario/horario-paciente";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import {
  guardarPreconsultaPorToken,
  guardarPreconsultaPaciente,
  guardarHorarioPorToken,
  type PreconsultaContext,
  type PreconsultaInput,
} from "@/app/actions/preconsulta";

function emptyFicha(raw: FichaInformacionData | null | undefined): FichaInformacionData {
  const r = raw ?? {};
  return {
    consulta: { ...(r.consulta ?? {}) },
    personalSocial: { ...(r.personalSocial ?? {}) },
    clinica: { ...(r.clinica ?? {}) },
    alimentaria: { ...(r.alimentaria ?? {}) },
    camposPersonalizados: { ...(r.camposPersonalizados ?? {}) },
  };
}

function TagField({
  label,
  placeholder,
  tags,
  onChange,
  addLabel,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  addLabel: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  }
  return (
    <div>
      <FichaLabel>{label}</FichaLabel>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          maxLength={100}
          className="flex-1 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <button
          type="button"
          onClick={add}
          aria-label={`${addLabel} ${label.toLowerCase()}`}
          className="px-3 rounded-lg border border-input hover:bg-muted transition-colors min-h-10 min-w-10 shrink-0 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {tag}
              <button type="button" onClick={() => onChange(tags.filter((x) => x !== tag))} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PreconsultaForm({
  context,
  modo,
  token,
  incluyeAnamnesis = true,
  incluyeHorario = false,
}: {
  context: PreconsultaContext;
  modo: "token" | "portal";
  token?: string;
  /** Qué pasos pide el enlace. Si ambos: primero anamnesis, luego horario. */
  incluyeAnamnesis?: boolean;
  incluyeHorario?: boolean;
}) {
  const tp = useTranslations("patients.preconsulta");
  const tForm = useTranslations("patients.form");

  const p = context.prefill;
  const [datos, setDatos] = useState({
    telefono: p.telefono,
    fechaNacimiento: p.fechaNacimiento,
    sexo: p.sexo,
    peso: p.peso != null ? String(p.peso) : "",
    altura: p.altura != null ? String(p.altura) : "",
    objetivo: p.objetivo || "MANTENIMIENTO",
    objetivoDetalle: p.objetivoDetalle,
  });
  const [alergias, setAlergias] = useState<string[]>(p.alergias);
  const [intolerancias, setIntolerancias] = useState<string[]>(p.intolerancias);
  const [patologias, setPatologias] = useState<string[]>(p.patologias);
  const [medicamentos, setMedicamentos] = useState<string[]>(p.medicamentos);
  const [suplementos, setSuplementos] = useState<string[]>(p.suplementos);
  const [ficha, setFichaState] = useState<FichaInformacionData>(() => emptyFicha(p.ficha));

  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState<"anamnesis" | "horario" | "fin">(incluyeAnamnesis ? "anamnesis" : "horario");

  function upd(field: string, value: string) {
    setDatos((d) => ({ ...d, [field]: value }));
  }
  function setField(seccion: keyof FichaInformacionData, key: string, value: string) {
    setFichaState((d) => {
      const sec = (d[seccion] as Record<string, string>) || {};
      return { ...d, [seccion]: { ...sec, [key]: value } };
    });
  }
  function setCustom(id: string, value: string) {
    setFichaState((d) => ({ ...d, camposPersonalizados: { ...(d.camposPersonalizados ?? {}), [id]: value } }));
  }

  const OBJETIVOS = [
    { value: "PERDER_PESO", label: tForm("objetivoPerderPeso") },
    { value: "GANAR_MASA", label: tForm("objetivoGanarMasa") },
    { value: "MANTENIMIENTO", label: tForm("objetivoMantenimiento") },
    { value: "PATOLOGIA", label: tForm("objetivoPatologia") },
    { value: "DEPORTIVO", label: tForm("objetivoRendimiento") },
    { value: "OTRO", label: tForm("objetivoOtro") },
  ];
  const SEXOS = [
    { value: "", label: tForm("seleccionar") },
    { value: "MASCULINO", label: tForm("sexoMasculino") },
    { value: "FEMENINO", label: tForm("sexoFemenino") },
    { value: "OTRO", label: tForm("sexoOtro") },
  ];

  const marca = context.branding.marcaPdf || context.branding.nombre;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    const input: PreconsultaInput = {
      telefono: datos.telefono || undefined,
      fechaNacimiento: datos.fechaNacimiento || undefined,
      sexo: datos.sexo || undefined,
      peso: datos.peso ? parseFloat(datos.peso) : undefined,
      altura: datos.altura ? parseFloat(datos.altura) : undefined,
      objetivo: datos.objetivo || undefined,
      objetivoDetalle: datos.objetivoDetalle || undefined,
      alergias,
      intolerancias,
      patologias,
      medicamentos,
      suplementos,
      ficha,
    };
    try {
      const res =
        modo === "token"
          ? await guardarPreconsultaPorToken(token ?? "", input)
          : await guardarPreconsultaPaciente(input);
      if (res.ok) {
        setPaso(incluyeHorario ? "horario" : "fin");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(res.error || tp("errorGuardar"));
      }
    } catch {
      toast.error(tp("errorGuardar"));
    } finally {
      setEnviando(false);
    }
  }

  if (paso === "fin") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{tp("graciasTitulo")}</h1>
        <p className="text-muted-foreground">{tp("graciasTexto", { dietista: marca })}</p>
      </div>
    );
  }

  if (paso === "horario") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="text-center mb-6">
          {context.branding.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={context.branding.logoUrl} alt={marca} className="h-12 mx-auto mb-4 object-contain" />
          )}
          <h1 className="text-2xl font-bold">{tp("horarioTitulo")}</h1>
          <p className="text-sm text-muted-foreground mt-2">{tp("horarioIntro")}</p>
        </header>
        <HorarioPaciente
          initialEntries={context.horario}
          onSave={async (entries) => {
            const res = await guardarHorarioPorToken(token ?? "", entries);
            if (res.ok) {
              setPaso("fin");
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              toast.error(res.error || tp("errorGuardar"));
              throw new Error(res.error || "error");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <header className="text-center mb-6">
        {context.branding.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={context.branding.logoUrl} alt={marca} className="h-12 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-2xl font-bold">{tp("titulo")}</h1>
        <p className="text-lg text-foreground mt-1">{tp("saludo", { nombre: context.nombre })}</p>
        <p className="text-sm text-muted-foreground mt-2">{tp("intro", { dietista: marca })}</p>
      </header>

      {context.yaCompletada && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm px-4 py-3 mb-4">
          {tp("yaCompletadaAviso")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-1">
        {/* Tus datos */}
        <FichaAccordion title={tp("tusDatos")} icon={User}>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>{tForm("telefono")}</FichaLabel>
                <TelefonoInput
                  value={datos.telefono}
                  onChange={(v) => upd("telefono", v)}
                  inputClassName="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            }
            right={
              <div>
                <FichaLabel>{tForm("fechaNacimiento")}</FichaLabel>
                <DatePicker value={datos.fechaNacimiento} onChange={(v) => upd("fechaNacimiento", v)} pastOnly />
              </div>
            }
          />
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>{tForm("sexo")}</FichaLabel>
                <FichaSelect value={datos.sexo || ""} onChange={(v) => upd("sexo", v)} options={SEXOS} />
              </div>
            }
            right={<div />}
          />
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>{tForm("pesoKg")}</FichaLabel>
                <FichaInput type="number" value={datos.peso} onChange={(v) => upd("peso", v)} placeholder={tForm("pesoPlaceholder")} />
              </div>
            }
            right={
              <div>
                <FichaLabel>{tForm("alturaCm")}</FichaLabel>
                <FichaInput type="number" value={datos.altura} onChange={(v) => upd("altura", v)} placeholder={tForm("alturaPlaceholder")} />
              </div>
            }
          />
        </FichaAccordion>

        {/* Tu objetivo */}
        <FichaAccordion title={tp("tuObjetivo")} icon={Target}>
          <div>
            <FichaLabel>{tp("objetivoPrincipal")}</FichaLabel>
            <FichaSelect value={datos.objetivo} onChange={(v) => upd("objetivo", v)} options={OBJETIVOS} />
          </div>
          <div>
            <FichaLabel>{tForm("detalleObjetivo")}</FichaLabel>
            <FichaInput value={datos.objetivoDetalle} onChange={(v) => upd("objetivoDetalle", v)} placeholder={tForm("detalleObjetivoPlaceholder")} />
          </div>
        </FichaAccordion>

        {/* Historial médico (tags → arrays del paciente) */}
        <FichaAccordion title={tp("historialMedico")} icon={HeartPulse}>
          <p className="text-xs text-muted-foreground -mt-1">{tp("ayudaHistorial")}</p>
          <TagField label={tForm("alergias")} placeholder={tForm("alergiasPlaceholder")} tags={alergias} onChange={setAlergias} addLabel={tForm("anadir")} />
          <TagField label={tForm("intolerancias")} placeholder={tForm("intoleranciasPlaceholder")} tags={intolerancias} onChange={setIntolerancias} addLabel={tForm("anadir")} />
          <TagField label={tForm("patologias")} placeholder={tForm("patologiasPlaceholder")} tags={patologias} onChange={setPatologias} addLabel={tForm("anadir")} />
          <TagField label={tForm("medicamentos")} placeholder={tForm("medicamentosPlaceholder")} tags={medicamentos} onChange={setMedicamentos} addLabel={tForm("anadir")} />
          <TagField label={tForm("suplementos")} placeholder={tForm("suplementosPlaceholder")} tags={suplementos} onChange={setSuplementos} addLabel={tForm("anadir")} />
        </FichaAccordion>

        {/* Anamnesis: secciones y preguntas según la plantilla del paciente */}
        <AnamnesisRenderer
          estructura={context.estructura}
          data={ficha}
          onBuiltin={(seccion, campo, value) => setField(seccion as keyof FichaInformacionData, campo, value)}
          onCustom={setCustom}
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={enviando}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {enviando ? tp("enviando") : incluyeHorario ? tp("siguienteHorario") : tp("enviar")}
          </button>
        </div>
      </form>
    </div>
  );
}
