"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  User,
  Link2,
  UtensilsCrossed,
  FileText,
  BookOpen,
  Brain,
  Folder,
  Save,
  Printer,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import {
  SELECT_SI_NO_OCASION,
  SELECT_ESTADO_CIVIL,
  SELECT_FUNCION_INTESTINAL,
  SELECT_CALIDAD_SUENO,
  SELECT_TIPOS_DIETA,
  SELECT_INGESTA_AGUA,
  SELECT_OBJETIVOS_CLINICOS,
  OPCION_VACIA,
} from "@/lib/ficha-informacion-types";
import { guardarFichaInformacionPaciente } from "@/app/actions/pacientes";
import { FichaAccordion } from "./ficha-accordion";
import {
  FichaLabel,
  FichaTextarea,
  FichaInput,
  FichaSelect,
  FichaTwoCol,
} from "./ficha-form-fields";

type PacienteResumen = {
  patologias: string[];
  medicamentos: string[];
  alergias: string[];
  intolerancias: string[];
};

function emptyFicha(): FichaInformacionData {
  return {
    consulta: {},
    personalSocial: {},
    clinica: {},
    alimentaria: {},
  };
}

function mergeInitial(raw: FichaInformacionData | null | undefined): FichaInformacionData {
  const e = emptyFicha();
  if (!raw || typeof raw !== "object") return e;
  return {
    consulta: { ...e.consulta, ...raw.consulta },
    personalSocial: { ...e.personalSocial, ...raw.personalSocial },
    clinica: { ...e.clinica, ...raw.clinica },
    alimentaria: { ...e.alimentaria, ...raw.alimentaria },
  };
}

function patch<K extends keyof FichaInformacionData>(
  prev: FichaInformacionData,
  section: K,
  key: string,
  value: string
): FichaInformacionData {
  const sec = (prev[section] as Record<string, string>) || {};
  return {
    ...prev,
    [section]: { ...sec, [key]: value },
  };
}

export function PacienteFichaInformacionTab({
  pacienteId,
  initialFicha,
  resumen,
}: {
  pacienteId: string;
  initialFicha: FichaInformacionData | null | undefined;
  resumen: PacienteResumen;
}) {
  const [data, setData] = useState(() => mergeInitial(initialFicha));
  const [pending, startTransition] = useTransition();

  function setField<K extends keyof FichaInformacionData>(
    section: K,
    key: string,
    value: string
  ) {
    setData((d) => patch(d, section, key, value));
  }

  function guardar() {
    startTransition(async () => {
      try {
        await guardarFichaInformacionPaciente(pacienteId, data);
        toast.success("Información guardada");
      } catch {
        toast.error("No se pudo guardar");
      }
    });
  }

  const c = data.consulta ?? {};
  const ps = data.personalSocial ?? {};
  const cl = data.clinica ?? {};
  const al = data.alimentaria ?? {};

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_min(20rem,100%)] gap-6 xl:gap-8">
      <div className="xl:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-2 border-b border-border">
        <button
          type="button"
          onClick={() => toast.message("Próximamente", { description: "Cuestionarios al paciente." })}
          className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors w-fit"
        >
          <ClipboardList className="w-4 h-4" />
          Enviar cuestionario
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            title="Guardar"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="min-w-0 space-y-1">
        <FichaAccordion title="Informaciones de consulta" icon={Calendar}>
          <div>
            <FichaLabel>Motivo de consulta</FichaLabel>
            <FichaTextarea
              value={c.motivo ?? ""}
              onChange={(v) => setField("consulta", "motivo", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>Expectativas</FichaLabel>
            <FichaTextarea
              value={c.expectativas ?? ""}
              onChange={(v) => setField("consulta", "expectativas", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>Objetivos clínicos</FichaLabel>
            <FichaSelect
              value={c.objetivosClinicos || OPCION_VACIA}
              onChange={(v) => setField("consulta", "objetivosClinicos", v)}
              options={SELECT_OBJETIVOS_CLINICOS}
            />
            <div className="mt-2">
              <FichaTextarea
                value={c.objetivosClinicosDetalle ?? ""}
                onChange={(v) =>
                  setField("consulta", "objetivosClinicosDetalle", v)
                }
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Otras informaciones</FichaLabel>
            <FichaTextarea
              value={c.otras ?? ""}
              onChange={(v) => setField("consulta", "otras", v)}
              rows={2}
            />
          </div>
        </FichaAccordion>

        <FichaAccordion title="Historia personal y social" icon={User}>
          <div>
            <FichaLabel>Función intestinal</FichaLabel>
            <FichaSelect
              value={ps.funcionIntestinal || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "funcionIntestinal", v)}
              options={SELECT_FUNCION_INTESTINAL}
            />
            <div className="mt-2">
              <FichaTextarea
                value={ps.funcionIntestinalDetalle ?? ""}
                onChange={(v) =>
                  setField("personalSocial", "funcionIntestinalDetalle", v)
                }
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Calidad del sueño</FichaLabel>
            <FichaSelect
              value={ps.calidadSueno || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "calidadSueno", v)}
              options={SELECT_CALIDAD_SUENO}
            />
            <div className="mt-2">
              <FichaTextarea
                value={ps.calidadSuenoDetalle ?? ""}
                onChange={(v) =>
                  setField("personalSocial", "calidadSuenoDetalle", v)
                }
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Fumador</FichaLabel>
            <FichaSelect
              value={ps.fumador || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "fumador", v)}
              options={SELECT_SI_NO_OCASION}
            />
            <div className="mt-2">
              <FichaTextarea
                value={ps.fumadorDetalle ?? ""}
                onChange={(v) => setField("personalSocial", "fumadorDetalle", v)}
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Bebe alcohol</FichaLabel>
            <FichaSelect
              value={ps.alcohol || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "alcohol", v)}
              options={SELECT_SI_NO_OCASION}
            />
            <div className="mt-2">
              <FichaTextarea
                value={ps.alcoholDetalle ?? ""}
                onChange={(v) => setField("personalSocial", "alcoholDetalle", v)}
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Estado civil</FichaLabel>
            <FichaSelect
              value={ps.estadoCivil || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "estadoCivil", v)}
              options={SELECT_ESTADO_CIVIL}
            />
            <div className="mt-2">
              <FichaTextarea
                value={ps.estadoCivilDetalle ?? ""}
                onChange={(v) =>
                  setField("personalSocial", "estadoCivilDetalle", v)
                }
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Actividad física</FichaLabel>
            <FichaTextarea
              value={ps.actividadFisica ?? ""}
              onChange={(v) => setField("personalSocial", "actividadFisica", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>Raza / etnia</FichaLabel>
            <FichaSelect
              value={ps.raza || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "raza", v)}
              options={[
                { value: OPCION_VACIA, label: "Selecciona una opción" },
                { value: "no_indica", label: "Prefiere no indicar" },
                { value: "otra", label: "Otra (detallar)" },
              ]}
            />
            <div className="mt-2">
              <FichaTextarea
                value={ps.razaDetalle ?? ""}
                onChange={(v) => setField("personalSocial", "razaDetalle", v)}
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Otras informaciones</FichaLabel>
            <FichaTextarea
              value={ps.otrasPersonal ?? ""}
              onChange={(v) => setField("personalSocial", "otrasPersonal", v)}
              rows={2}
            />
          </div>
        </FichaAccordion>

        <FichaAccordion title="Historia clínica" icon={Link2}>
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 mb-3 text-sm">
            <p className="font-medium text-foreground mb-2">
              Registrado en la ficha del paciente
            </p>
            <TagLine label="Patologías" tags={resumen.patologias} />
            <TagLine label="Medicación" tags={resumen.medicamentos} />
            <p className="text-xs text-muted-foreground mt-2">
              Para editar listas completas usa{" "}
              <span className="font-medium text-foreground">Editar paciente</span>.
            </p>
          </div>
          <div>
            <FichaLabel>Detalle patologías / evolución</FichaLabel>
            <FichaTextarea
              value={cl.patologiasDetalle ?? ""}
              onChange={(v) => setField("clinica", "patologiasDetalle", v)}
              rows={3}
            />
          </div>
          <div>
            <FichaLabel>Medicación (texto libre)</FichaLabel>
            <FichaTextarea
              value={cl.medicacion ?? ""}
              onChange={(v) => setField("clinica", "medicacion", v)}
              rows={2}
              placeholder="Ninguna"
            />
          </div>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>Antecedentes personales</FichaLabel>
                <FichaInput
                  value={cl.antecedentesPersonales ?? ""}
                  onChange={(v) =>
                    setField("clinica", "antecedentesPersonales", v)
                  }
                  placeholder="Ninguno"
                />
              </div>
            }
            right={
              <div>
                <FichaLabel>Antecedentes familiares</FichaLabel>
                <FichaInput
                  value={cl.antecedentesFamiliares ?? ""}
                  onChange={(v) =>
                    setField("clinica", "antecedentesFamiliares", v)
                  }
                  placeholder="Ninguno"
                />
              </div>
            }
          />
          <div>
            <FichaLabel>Otras informaciones</FichaLabel>
            <FichaTextarea
              value={cl.otrasClinicas ?? ""}
              onChange={(v) => setField("clinica", "otrasClinicas", v)}
              rows={2}
            />
          </div>
        </FichaAccordion>

        <FichaAccordion title="Historia alimentaria" icon={UtensilsCrossed}>
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 mb-3 text-sm">
            <TagLine label="Alergias" tags={resumen.alergias} />
            <TagLine label="Intolerancias" tags={resumen.intolerancias} />
          </div>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>Hora habitual para levantarse</FichaLabel>
                <FichaInput
                  value={al.horaLevantarse ?? ""}
                  onChange={(v) => setField("alimentaria", "horaLevantarse", v)}
                  placeholder="HH:MM"
                />
              </div>
            }
            right={
              <div>
                <FichaLabel>Hora habitual para acostarse</FichaLabel>
                <FichaInput
                  value={al.horaAcostarse ?? ""}
                  onChange={(v) => setField("alimentaria", "horaAcostarse", v)}
                  placeholder="HH:MM"
                />
              </div>
            }
          />
          <div>
            <FichaLabel>Tipos de dieta</FichaLabel>
            <FichaSelect
              value={al.tiposDieta || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "tiposDieta", v)}
              options={SELECT_TIPOS_DIETA}
            />
            <div className="mt-2">
              <FichaTextarea
                value={al.tiposDietaDetalle ?? ""}
                onChange={(v) => setField("alimentaria", "tiposDietaDetalle", v)}
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Alimentos favoritos</FichaLabel>
            <FichaInput
              value={al.alimentosFavoritos ?? ""}
              onChange={(v) => setField("alimentaria", "alimentosFavoritos", v)}
              placeholder="Ninguno"
            />
          </div>
          <div>
            <FichaLabel>Alimentos rechazados</FichaLabel>
            <FichaInput
              value={al.alimentosRechazados ?? ""}
              onChange={(v) =>
                setField("alimentaria", "alimentosRechazados", v)
              }
              placeholder="Ninguno"
            />
          </div>
          <div>
            <FichaLabel>Alergias (ampliar / notas)</FichaLabel>
            <FichaSelect
              value={al.alergiasResumen || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "alergiasResumen", v)}
              options={[
                { value: OPCION_VACIA, label: "Ninguna" },
                { value: "registradas", label: "Ver listado arriba; ampliar abajo" },
              ]}
            />
            <div className="mt-2">
              <FichaTextarea
                value={al.alergiasDetalle ?? ""}
                onChange={(v) => setField("alimentaria", "alergiasDetalle", v)}
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Intolerancias (ampliar / notas)</FichaLabel>
            <FichaSelect
              value={al.intoleranciasResumen || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "intoleranciasResumen", v)}
              options={[
                { value: OPCION_VACIA, label: "Ninguno" },
                { value: "registradas", label: "Ver listado arriba; ampliar abajo" },
              ]}
            />
            <div className="mt-2">
              <FichaTextarea
                value={al.intoleranciasDetalle ?? ""}
                onChange={(v) =>
                  setField("alimentaria", "intoleranciasDetalle", v)
                }
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Deficiencias nutricionales</FichaLabel>
            <FichaSelect
              value={al.deficiencias || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "deficiencias", v)}
              options={[
                { value: OPCION_VACIA, label: "Ninguno" },
                { value: "si", label: "Sí (detallar abajo)" },
              ]}
            />
            <div className="mt-2">
              <FichaTextarea
                value={al.deficienciasDetalle ?? ""}
                onChange={(v) =>
                  setField("alimentaria", "deficienciasDetalle", v)
                }
                rows={2}
              />
            </div>
          </div>
          <div>
            <FichaLabel>Ingesta de agua</FichaLabel>
            <FichaSelect
              value={al.ingestaAgua || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "ingestaAgua", v)}
              options={SELECT_INGESTA_AGUA}
            />
          </div>
          <div>
            <FichaLabel>Otras informaciones</FichaLabel>
            <FichaTextarea
              value={al.otrasAlimentaria ?? ""}
              onChange={(v) => setField("alimentaria", "otrasAlimentaria", v)}
              rows={2}
            />
          </div>
        </FichaAccordion>

      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 self-start">
        <FichaSidebarBox
          title="Observaciones"
          icon={FileText}
          empty="Todavía no has registrado observaciones"
        />
        <FichaSidebarBox
          title="Diarios alimentarios"
          icon={BookOpen}
          empty="Todavía no hay entradas vinculadas aquí"
        />
        <FichaSidebarBox
          title="Comportamientos alimentarios"
          icon={Brain}
          empty="Todavía no has registrado ningún comportamiento alimentario"
        />
        <FichaSidebarBox
          title="Archivos"
          icon={Folder}
          empty="Ningún archivo en esta ficha (próximamente)"
        />
      </aside>
    </div>
  );
}

function TagLine({ label, tags }: { label: string; tags: string[] }) {
  if (!tags.length) {
    return (
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">{label}:</span> ninguna
      </p>
    );
  }
  return (
    <p className="text-muted-foreground mb-1">
      <span className="font-medium text-foreground">{label}:</span>{" "}
      {tags.join(", ")}
    </p>
  );
}

function FichaSidebarBox({
  title,
  icon: Icon,
  empty,
}: {
  title: string;
  icon: React.ElementType;
  empty: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
          title="Próximamente"
        >
          +
        </button>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
        <Icon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground leading-snug">{empty}</p>
      </div>
    </div>
  );
}
