"use client";

import { useState } from "react";
import { Users, Archive, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { AccesoAlumno } from "./acceso-alumno";
import { QuitarDeLaLista } from "./quitar-de-la-lista";

export interface AlumnoEnLista {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  activa: boolean;
  /** Ya formateado en el servidor: el cliente no traduce fechas. */
  ultimoAcceso: string;
}

/**
 * La lista de alumnos, con los retirados aparte y plegados.
 *
 * Un profesor que da la misma asignatura cinco años acaba con la ficha llena de gente de cursos
 * pasados, y lo que necesita ver de un vistazo es quién está dentro AHORA (Guillermo, 1 sep 2026).
 */
export function ListaAlumnos({
  claseId,
  alumnos,
  claseArchivada,
}: {
  claseId: string;
  alumnos: AlumnoEnLista[];
  claseArchivada: boolean;
}) {
  const t = useTranslations("docencia");
  const [verRetirados, setVerRetirados] = useState(false);

  const activos = alumnos.filter((a) => a.activa);
  const retirados = alumnos.filter((a) => !a.activa);

  const fila = (a: AlumnoEnLista, apagado: boolean) => (
    <div key={a.id} className="flex items-center gap-3 py-3 lg:px-4">
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${apagado ? "text-muted-foreground" : ""}`}>
          {a.nombre} {a.apellidos}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {a.email} · {a.ultimoAcceso}
        </p>
      </div>
      {!claseArchivada && (
        <>
          <AccesoAlumno
            claseId={claseId}
            alumnoId={a.id}
            nombre={`${a.nombre} ${a.apellidos}`}
            activa={a.activa}
          />
          {!a.activa && (
            <QuitarDeLaLista claseId={claseId} alumnoId={a.id} nombre={`${a.nombre} ${a.apellidos}`} />
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-3">{t("clases.conAcceso", { n: activos.length })}</h2>
        {activos.length === 0 ? (
          <div className="text-center py-10 lg:border lg:border-dashed lg:border-border lg:rounded-xl">
            <Users strokeWidth={1.5} className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium">{t("clases.sinAlumnosTitulo")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("clases.sinAlumnosTexto")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border lg:border lg:border-border lg:rounded-xl lg:overflow-hidden">
            {activos.map((a) => fila(a, false))}
          </div>
        )}
      </section>

      {retirados.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setVerRetirados(!verRetirados)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {verRetirados ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Archive className="w-4 h-4" />
            {t("clases.retiradosTitulo", { n: retirados.length })}
          </button>
          {verRetirados && (
            <div className="mt-3 divide-y divide-border lg:border lg:border-border lg:rounded-xl lg:overflow-hidden">
              {retirados.map((a) => fila(a, true))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
