"use client";

import { useState } from "react";
import {
  User,
  Target,
  HeartPulse,
  Calendar,
  Link2,
  UtensilsCrossed,
  ClipboardList,
  Check,
  Loader2,
  Plus,
  X,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TelefonoInput } from "@/components/telefono-input";
import { DatePicker } from "@/components/date-picker";
import { TimePicker } from "@/components/time-picker";
import { FichaAccordion } from "./ficha-accordion";
import {
  FichaLabel,
  FichaInput,
  FichaTextarea,
  FichaSelect,
  FichaTwoCol,
} from "./ficha-form-fields";
import {
  getSelectSiNoOcasion,
  getSelectEstadoCivil,
  getSelectFuncionIntestinal,
  getSelectCalidadSueno,
  getSelectTiposDieta,
  getSelectIngestaAgua,
  OPCION_VACIA,
  type FichaInformacionData,
  type CampoPersonalizadoDefinicion,
  type SeccionAnamnesis,
} from "@/lib/ficha-informacion-types";
import {
  guardarPreconsultaPorToken,
  guardarPreconsultaPaciente,
  type PreconsultaContext,
  type PreconsultaInput,
} from "@/app/actions/preconsulta";

const HORA_INPUT_CLS =
  "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2";

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

function CamposCustomRender({
  campos,
  valores,
  onChange,
}: {
  campos: CampoPersonalizadoDefinicion[];
  valores: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  if (campos.length === 0) return null;
  return (
    <>
      {campos.map((campo) => (
        <div key={campo.id}>
          <FichaLabel>{campo.label}</FichaLabel>
          {campo.tipo === "textarea" ? (
            <FichaTextarea value={valores[campo.id] ?? ""} onChange={(v) => onChange(campo.id, v)} rows={2} />
          ) : campo.tipo === "selector" && campo.opciones ? (
            <FichaSelect
              value={valores[campo.id] ?? OPCION_VACIA}
              onChange={(v) => onChange(campo.id, v)}
              options={[
                { value: OPCION_VACIA, label: "—" },
                ...campo.opciones.map((o) => ({ value: o, label: o })),
              ]}
            />
          ) : (
            <FichaInput value={valores[campo.id] ?? ""} onChange={(v) => onChange(campo.id, v)} />
          )}
        </div>
      ))}
    </>
  );
}

export function PreconsultaForm({
  context,
  modo,
  token,
}: {
  context: PreconsultaContext;
  modo: "token" | "portal";
  token?: string;
}) {
  const tp = useTranslations("patients.preconsulta");
  const t = useTranslations("patients.informacion");
  const tExtra = useTranslations("patients.informacionExtra");
  const tSelect = useTranslations("patients");
  const tForm = useTranslations("patients.form");

  const SELECT_SI_NO_OCASION = getSelectSiNoOcasion(tSelect);
  const SELECT_ESTADO_CIVIL = getSelectEstadoCivil(tSelect);
  const SELECT_FUNCION_INTESTINAL = getSelectFuncionIntestinal(tSelect);
  const SELECT_CALIDAD_SUENO = getSelectCalidadSueno(tSelect);
  const SELECT_TIPOS_DIETA = getSelectTiposDieta(tSelect);
  const SELECT_INGESTA_AGUA = getSelectIngestaAgua(tSelect);

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
  const [enviado, setEnviado] = useState(false);

  function upd(field: string, value: string) {
    setDatos((d) => ({ ...d, [field]: value }));
  }
  function setField<K extends keyof FichaInformacionData>(section: K, key: string, value: string) {
    setFichaState((d) => {
      const sec = (d[section] as Record<string, string>) || {};
      return { ...d, [section]: { ...sec, [key]: value } };
    });
  }
  function setCustom(id: string, value: string) {
    setFichaState((d) => ({ ...d, camposPersonalizados: { ...(d.camposPersonalizados ?? {}), [id]: value } }));
  }

  const camposPorSeccion = context.campos.reduce<Record<SeccionAnamnesis, CampoPersonalizadoDefinicion[]>>(
    (acc, c) => {
      acc[c.seccion].push(c);
      return acc;
    },
    { consulta: [], personalSocial: [], clinica: [], alimentaria: [], personalizado: [] },
  );

  const c = ficha.consulta ?? {};
  const ps = ficha.personalSocial ?? {};
  const cl = ficha.clinica ?? {};
  const al = ficha.alimentaria ?? {};
  const cp = ficha.camposPersonalizados ?? {};

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
        setEnviado(true);
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

  if (enviado) {
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

        {/* Historial médico */}
        <FichaAccordion title={tp("historialMedico")} icon={HeartPulse}>
          <p className="text-xs text-muted-foreground -mt-1">{tp("ayudaHistorial")}</p>
          <TagField label={tForm("alergias")} placeholder={tForm("alergiasPlaceholder")} tags={alergias} onChange={setAlergias} addLabel={tForm("anadir")} />
          <TagField label={tForm("intolerancias")} placeholder={tForm("intoleranciasPlaceholder")} tags={intolerancias} onChange={setIntolerancias} addLabel={tForm("anadir")} />
          <TagField label={tForm("patologias")} placeholder={tForm("patologiasPlaceholder")} tags={patologias} onChange={setPatologias} addLabel={tForm("anadir")} />
          <TagField label={tForm("medicamentos")} placeholder={tForm("medicamentosPlaceholder")} tags={medicamentos} onChange={setMedicamentos} addLabel={tForm("anadir")} />
          <TagField label={tForm("suplementos")} placeholder={tForm("suplementosPlaceholder")} tags={suplementos} onChange={setSuplementos} addLabel={tForm("anadir")} />
        </FichaAccordion>

        {/* Sobre tu consulta */}
        <FichaAccordion title={t("informacionesConsulta")} icon={Calendar}>
          <div>
            <FichaLabel>{t("motivoConsulta")}</FichaLabel>
            <FichaTextarea value={c.motivo ?? ""} onChange={(v) => setField("consulta", "motivo", v)} rows={2} />
          </div>
          <div>
            <FichaLabel>{t("expectativas")}</FichaLabel>
            <FichaTextarea value={c.expectativas ?? ""} onChange={(v) => setField("consulta", "expectativas", v)} rows={2} />
          </div>
          <div>
            <FichaLabel>{t("otrasInformaciones")}</FichaLabel>
            <FichaTextarea value={c.otras ?? ""} onChange={(v) => setField("consulta", "otras", v)} rows={2} />
          </div>
          <CamposCustomRender campos={camposPorSeccion.consulta} valores={cp} onChange={setCustom} />
        </FichaAccordion>

        {/* Historia personal y social */}
        <FichaAccordion title={t("historiaPersonalSocial")} icon={User}>
          <div>
            <FichaLabel>{t("funcionIntestinal")}</FichaLabel>
            <FichaSelect value={ps.funcionIntestinal || OPCION_VACIA} onChange={(v) => setField("personalSocial", "funcionIntestinal", v)} options={SELECT_FUNCION_INTESTINAL} />
            {ps.funcionIntestinal === "otro" && (
              <div className="mt-2">
                <FichaTextarea value={ps.funcionIntestinalDetalle ?? ""} onChange={(v) => setField("personalSocial", "funcionIntestinalDetalle", v)} rows={2} placeholder={t("especifica")} />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("calidadSueno")}</FichaLabel>
            <FichaSelect value={ps.calidadSueno || OPCION_VACIA} onChange={(v) => setField("personalSocial", "calidadSueno", v)} options={SELECT_CALIDAD_SUENO} />
            {(ps.calidadSueno === "regular" || ps.calidadSueno === "mala") && (
              <div className="mt-2">
                <FichaTextarea value={ps.calidadSuenoDetalle ?? ""} onChange={(v) => setField("personalSocial", "calidadSuenoDetalle", v)} rows={2} placeholder={t("describeProblemaSueno")} />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("fumador")}</FichaLabel>
            <FichaSelect value={ps.fumador || OPCION_VACIA} onChange={(v) => setField("personalSocial", "fumador", v)} options={SELECT_SI_NO_OCASION} />
            {(ps.fumador === "si" || ps.fumador === "ocasional") && (
              <div className="mt-2">
                <FichaTextarea value={ps.fumadorDetalle ?? ""} onChange={(v) => setField("personalSocial", "fumadorDetalle", v)} rows={2} placeholder={t("frecuenciaCantidad")} />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("bebeAlcohol")}</FichaLabel>
            <FichaSelect value={ps.alcohol || OPCION_VACIA} onChange={(v) => setField("personalSocial", "alcohol", v)} options={SELECT_SI_NO_OCASION} />
            {(ps.alcohol === "si" || ps.alcohol === "ocasional") && (
              <div className="mt-2">
                <FichaTextarea value={ps.alcoholDetalle ?? ""} onChange={(v) => setField("personalSocial", "alcoholDetalle", v)} rows={2} placeholder={tExtra("frecuenciaTipoBebida")} />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("estadoCivil")}</FichaLabel>
            <FichaSelect value={ps.estadoCivil || OPCION_VACIA} onChange={(v) => setField("personalSocial", "estadoCivil", v)} options={SELECT_ESTADO_CIVIL} />
            {ps.estadoCivil === "otro" && (
              <div className="mt-2">
                <FichaTextarea value={ps.estadoCivilDetalle ?? ""} onChange={(v) => setField("personalSocial", "estadoCivilDetalle", v)} rows={2} placeholder={t("especifica")} />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("actividadFisica")}</FichaLabel>
            <FichaTextarea value={ps.actividadFisica ?? ""} onChange={(v) => setField("personalSocial", "actividadFisica", v)} rows={2} />
          </div>
          <div>
            <FichaLabel>{t("razaEtnia")}</FichaLabel>
            <FichaSelect
              value={ps.raza || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "raza", v)}
              options={[
                { value: OPCION_VACIA, label: t("seleccionaOpcion") },
                { value: "caucasica", label: t("razaCaucasica") },
                { value: "hispana", label: t("razaHispana") },
                { value: "afrodescendiente", label: t("razaAfrodescendiente") },
                { value: "asiatica", label: t("razaAsiatica") },
                { value: "arabe", label: t("razaArabe") },
                { value: "indigena", label: t("razaIndigena") },
                { value: "mestiza", label: t("razaMestiza") },
                { value: "otra", label: t("razaOtra") },
              ]}
            />
            {ps.raza === "otra" && (
              <div className="mt-2">
                <FichaInput value={ps.razaDetalle ?? ""} onChange={(v) => setField("personalSocial", "razaDetalle", v)} placeholder={t("especifica")} />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("otrasInformaciones")}</FichaLabel>
            <FichaTextarea value={ps.otrasPersonal ?? ""} onChange={(v) => setField("personalSocial", "otrasPersonal", v)} rows={2} />
          </div>
          <CamposCustomRender campos={camposPorSeccion.personalSocial} valores={cp} onChange={setCustom} />
        </FichaAccordion>

        {/* Historia clínica */}
        <FichaAccordion title={tExtra("historiaClinica")} icon={Link2}>
          <div>
            <FichaLabel>{tExtra("detallePatologias")}</FichaLabel>
            <FichaTextarea value={cl.patologiasDetalle ?? ""} onChange={(v) => setField("clinica", "patologiasDetalle", v)} rows={3} />
          </div>
          <div>
            <FichaLabel>{tExtra("medicacionTextoLibre")}</FichaLabel>
            <FichaTextarea value={cl.medicacion ?? ""} onChange={(v) => setField("clinica", "medicacion", v)} rows={2} placeholder={tExtra("ninguna")} />
          </div>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>{tExtra("antecedentesPersonales")}</FichaLabel>
                <FichaInput value={cl.antecedentesPersonales ?? ""} onChange={(v) => setField("clinica", "antecedentesPersonales", v)} placeholder={tExtra("ninguno")} />
              </div>
            }
            right={
              <div>
                <FichaLabel>{tExtra("antecedentesFamiliares")}</FichaLabel>
                <FichaInput value={cl.antecedentesFamiliares ?? ""} onChange={(v) => setField("clinica", "antecedentesFamiliares", v)} placeholder={tExtra("ninguno")} />
              </div>
            }
          />
          <div>
            <FichaLabel>{t("otrasInformaciones")}</FichaLabel>
            <FichaTextarea value={cl.otrasClinicas ?? ""} onChange={(v) => setField("clinica", "otrasClinicas", v)} rows={2} />
          </div>
          <CamposCustomRender campos={camposPorSeccion.clinica} valores={cp} onChange={setCustom} />
        </FichaAccordion>

        {/* Historia alimentaria */}
        <FichaAccordion title={tExtra("historiaAlimentaria")} icon={UtensilsCrossed}>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>{tExtra("horaLevantarse")}</FichaLabel>
                <TimePicker value={al.horaLevantarse ?? ""} onChange={(v) => setField("alimentaria", "horaLevantarse", v)} inputClassName={HORA_INPUT_CLS} ariaLabel={tExtra("horaLevantarse")} />
              </div>
            }
            right={
              <div>
                <FichaLabel>{tExtra("horaAcostarse")}</FichaLabel>
                <TimePicker value={al.horaAcostarse ?? ""} onChange={(v) => setField("alimentaria", "horaAcostarse", v)} inputClassName={HORA_INPUT_CLS} ariaLabel={tExtra("horaAcostarse")} />
              </div>
            }
          />
          <div>
            <FichaLabel>{tExtra("tiposDieta")}</FichaLabel>
            <FichaSelect value={al.tiposDieta || OPCION_VACIA} onChange={(v) => setField("alimentaria", "tiposDieta", v)} options={SELECT_TIPOS_DIETA} />
            {al.tiposDieta === "otra" && (
              <div className="mt-2">
                <FichaTextarea value={al.tiposDietaDetalle ?? ""} onChange={(v) => setField("alimentaria", "tiposDietaDetalle", v)} rows={2} placeholder={tExtra("describeTipoDieta")} />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{tExtra("alimentosFavoritos")}</FichaLabel>
            <FichaInput value={al.alimentosFavoritos ?? ""} onChange={(v) => setField("alimentaria", "alimentosFavoritos", v)} placeholder={tExtra("ninguno")} />
          </div>
          <div>
            <FichaLabel>{tExtra("alimentosRechazados")}</FichaLabel>
            <FichaInput value={al.alimentosRechazados ?? ""} onChange={(v) => setField("alimentaria", "alimentosRechazados", v)} placeholder={tExtra("ninguno")} />
          </div>
          <div>
            <FichaLabel>{tExtra("deficienciasNutricionales")}</FichaLabel>
            <FichaSelect
              value={al.deficiencias || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "deficiencias", v)}
              options={[
                { value: OPCION_VACIA, label: tExtra("ninguna") },
                { value: "si", label: tExtra("siDetallar") },
              ]}
            />
            {al.deficiencias === "si" && (
              <div className="mt-2">
                <FichaTextarea value={al.deficienciasDetalle ?? ""} onChange={(v) => setField("alimentaria", "deficienciasDetalle", v)} rows={2} placeholder={tExtra("detallaDeficiencias")} />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{tExtra("ingestaAgua")}</FichaLabel>
            <FichaSelect value={al.ingestaAgua || OPCION_VACIA} onChange={(v) => setField("alimentaria", "ingestaAgua", v)} options={SELECT_INGESTA_AGUA} />
          </div>
          <div>
            <FichaLabel>{t("otrasInformaciones")}</FichaLabel>
            <FichaTextarea value={al.otrasAlimentaria ?? ""} onChange={(v) => setField("alimentaria", "otrasAlimentaria", v)} rows={2} />
          </div>
          <CamposCustomRender campos={camposPorSeccion.alimentaria} valores={cp} onChange={setCustom} />
        </FichaAccordion>

        {camposPorSeccion.personalizado.length > 0 && (
          <FichaAccordion title={tExtra("camposPersonalizados")} icon={ClipboardList}>
            <CamposCustomRender campos={camposPorSeccion.personalizado} valores={cp} onChange={setCustom} />
          </FichaAccordion>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={enviando}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {enviando ? tp("enviando") : tp("enviar")}
          </button>
        </div>
      </form>
    </div>
  );
}
