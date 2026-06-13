"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Pencil, CalendarPlus, Power, Trash2, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { eliminarPaciente, toggleActivoPaciente } from "@/app/actions/pacientes";
import { cn, isNextNavigation, withTimeout } from "@/lib/utils";

interface Props {
  pacienteId: string;
  activo: boolean;
  email: string | null;
  esDemo: boolean;
}

type Variante = "primary" | "default" | "danger";

type AccionMovil = {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
  variante: Variante;
  /** Acción que se ejecuta en el segundo toque (cuando el botón ya está abierto). */
  run: () => void;
};

export function PacienteActionBar({ pacienteId, activo, email, esDemo }: Props) {
  const t = useTranslations("patients");
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggleActivo() {
    setLoading(true);
    try {
      await withTimeout(toggleActivoPaciente(pacienteId));
      toast.success(
        activo ? t("actions.marcadoInactivo") : t("actions.marcadoActivo")
      );
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      toast.error(t("actions.errorCambiarEstado"));
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await withTimeout(eliminarPaciente(pacienteId));
      toast.success(t("actions.eliminadoCorrectamente"));
      await new Promise((r) => setTimeout(r, 800));
      window.location.href = "/pacientes";
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      toast.error(t("actions.errorEliminar"));
      setLoading(false);
    }
  }

  // Acciones de la barra móvil, en el mismo orden que en escritorio.
  const acciones: AccionMovil[] = [];
  if (!esDemo) {
    acciones.push({
      id: "cita",
      icon: CalendarPlus,
      label: t("ficha.nuevaCita"),
      title: t("ficha.nuevaCita"),
      variante: "primary",
      run: () => router.push(`/agenda/nueva?paciente=${pacienteId}`),
    });
  }
  if (email) {
    acciones.push({
      id: "email",
      icon: Mail,
      label: t("ficha.enviarEmail"),
      title: email,
      variante: "default",
      run: () => {
        window.location.href = `mailto:${email}`;
      },
    });
  }
  acciones.push({
    id: "editar",
    icon: Pencil,
    label: t("ficha.editarPaciente"),
    title: t("ficha.editarPaciente"),
    variante: "default",
    run: () => router.push(`/pacientes/${pacienteId}/editar`),
  });
  acciones.push({
    id: "estado",
    icon: Power,
    label: activo ? t("actions.desactivar") : t("actions.activar"),
    title: activo ? t("actions.desactivarPaciente") : t("actions.activarPaciente"),
    variante: "default",
    run: handleToggleActivo,
  });
  acciones.push({
    id: "eliminar",
    icon: Trash2,
    label: t("actions.eliminar"),
    title: t("actions.eliminarPaciente"),
    variante: "danger",
    run: () => setShowConfirm(true),
  });

  // Botón abierto en móvil (el primero arranca desplegado: "Nueva cita").
  const [abierto, setAbierto] = useState<string | null>(acciones[0]?.id ?? null);

  function handleTap(accion: AccionMovil) {
    if (loading) return;
    if (abierto === accion.id) {
      accion.run(); // segundo toque: ejecuta
    } else {
      setAbierto(accion.id); // primer toque: abre (y cierra el anterior)
    }
  }

  const cerrada: Record<Variante, string> = {
    primary: "border-primary/40 text-primary",
    default: "border-border text-foreground",
    danger: "border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400",
  };
  const abiertaCls: Record<Variante, string> = {
    primary: "border-primary/40 text-primary bg-primary/10",
    default: "border-border text-foreground bg-muted",
    danger:
      "border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15",
  };

  return (
    <>
      {/* Escritorio: barra completa, un solo clic (comportamiento de siempre) */}
      <div className="hidden lg:flex items-center gap-3 flex-wrap">
        {!esDemo && (
          <Link
            href={`/agenda/nueva?paciente=${pacienteId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
            title={t("ficha.nuevaCita")}
          >
            <CalendarPlus className="w-4 h-4 shrink-0" />
            <span>{t("ficha.nuevaCita")}</span>
          </Link>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
            title={email}
            aria-label={t("ficha.enviarEmail")}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
        <Link
          href={`/pacientes/${pacienteId}/editar`}
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          title={t("ficha.editarPaciente")}
          aria-label={t("ficha.editarPaciente")}
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <button
          onClick={handleToggleActivo}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          title={activo ? t("actions.desactivarPaciente") : t("actions.activarPaciente")}
        >
          <Power className="w-4 h-4" />
          {activo ? t("actions.desactivar") : t("actions.activar")}
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Móvil: acordeón horizontal (un botón abierto a la vez; 1er toque abre, 2º ejecuta) */}
      <div className="flex lg:hidden items-center gap-2 overflow-x-auto scrollbar-thin">
        {acciones.map((accion) => {
          const isOpen = abierto === accion.id;
          const Icon = accion.icon;
          const cargando = loading && (accion.id === "estado" || accion.id === "eliminar");
          return (
            <button
              key={accion.id}
              type="button"
              onClick={() => handleTap(accion)}
              disabled={loading}
              aria-expanded={isOpen}
              aria-label={accion.label}
              title={accion.title}
              className={cn(
                "inline-flex items-center h-11 rounded-lg border overflow-hidden shrink-0 transition-colors disabled:opacity-60",
                isOpen ? abiertaCls[accion.variante] : cerrada[accion.variante]
              )}
            >
              <span className="flex items-center justify-center w-11 h-11 shrink-0">
                {cargando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out",
                  isOpen ? "max-w-[160px] opacity-100 pr-3" : "max-w-0 opacity-0 pr-0"
                )}
              >
                {accion.label}
              </span>
            </button>
          );
        })}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              {t("actions.eliminarPaciente")}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t("actions.eliminarConfirmacion")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                {t("actions.cancelar")}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("actions.eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
