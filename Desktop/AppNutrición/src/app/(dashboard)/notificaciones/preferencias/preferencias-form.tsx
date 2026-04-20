"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarDays,
  UserX,
  Scale,
  FileWarning,
  BookOpen,
  Save,
  Wallet,
  WalletCards,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { setNotifPreferencias, type NotifPreferencias } from "@/app/actions/notificaciones";

type Categoria = {
  label: string;
  descripcion: string;
  items: {
    key: keyof NotifPreferencias;
    titulo: string;
    descripcion: string;
    icon: LucideIcon;
  }[];
};

const CATEGORIAS: Categoria[] = [
  {
    label: "Citas",
    descripcion: "Notificaciones relacionadas con citas de pacientes",
    items: [
      {
        key: "CITA_HOY",
        titulo: "Cita de hoy",
        descripcion: "Recordatorio de las citas del día",
        icon: CalendarClock,
      },
      {
        key: "CITA_SOLICITADA",
        titulo: "Solicitud de cita",
        descripcion: "Cuando un paciente solicita una nueva cita",
        icon: CalendarPlus,
      },
      {
        key: "CITA_CONFIRMADA",
        titulo: "Cita confirmada",
        descripcion: "El paciente acepta la cita que propusiste",
        icon: CalendarCheck,
      },
      {
        key: "CITA_CONTRAPROPUESTA",
        titulo: "Contrapropuesta",
        descripcion: "El paciente propone otra fecha u hora",
        icon: CalendarDays,
      },
      {
        key: "CITA_RECHAZADA",
        titulo: "Cita rechazada",
        descripcion: "El paciente rechaza la cita propuesta",
        icon: CalendarX,
      },
      {
        key: "CITA_CANCELADA_POR_PACIENTE",
        titulo: "Cita cancelada",
        descripcion: "El paciente cancela una cita ya confirmada",
        icon: CalendarX,
      },
    ],
  },
  {
    label: "Seguimiento de pacientes",
    descripcion: "Alertas sobre el seguimiento clínico",
    items: [
      {
        key: "PACIENTE_SIN_CONSULTA",
        titulo: "Paciente sin consulta",
        descripcion: "Pacientes sin citas en los últimos 30 días",
        icon: UserX,
      },
      {
        key: "PACIENTE_SIN_MEDIDAS",
        titulo: "Paciente sin medidas",
        descripcion: "Pacientes sin nuevas medidas antropométricas",
        icon: Scale,
      },
      {
        key: "PLAN_ANTIGUO",
        titulo: "Plan antiguo",
        descripcion: "Planes alimenticios con más de 60 días",
        icon: FileWarning,
      },
    ],
  },
  {
    label: "Actividad del paciente",
    descripcion: "Interacciones del paciente con la app",
    items: [
      {
        key: "DIARIO_NUEVO",
        titulo: "Entrada en diario",
        descripcion: "Cuando un paciente registra comida o síntomas",
        icon: BookOpen,
      },
    ],
  },
  {
    label: "Pagos",
    descripcion: "Movimientos de cobros de tus pacientes",
    items: [
      {
        key: "PAGO_RECIBIDO",
        titulo: "Pago recibido",
        descripcion: "Un paciente ha completado un pago",
        icon: Wallet,
      },
      {
        key: "PAGO_PENDIENTE",
        titulo: "Pago pendiente",
        descripcion: "Factura o cobro a la espera de confirmación",
        icon: WalletCards,
      },
      {
        key: "PAGO_FALLIDO",
        titulo: "Pago fallido",
        descripcion: "Un cobro no se ha podido procesar",
        icon: AlertCircle,
      },
    ],
  },
];

export function PreferenciasForm({ prefs: prefsIniciales }: { prefs: NotifPreferencias }) {
  const [prefs, setPrefs] = useState(prefsIniciales);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  function toggle(key: keyof NotifPreferencias) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setDirty(true);
  }

  function toggleTodos(enabled: boolean) {
    const nuevo = { ...prefs };
    for (const k of Object.keys(nuevo) as (keyof NotifPreferencias)[]) {
      nuevo[k] = enabled;
    }
    setPrefs(nuevo);
    setDirty(true);
  }

  function guardar() {
    startTransition(async () => {
      try {
        await setNotifPreferencias(prefs);
        toast.success("Preferencias guardadas");
        setDirty(false);
      } catch {
        toast.error("Error al guardar");
      }
    });
  }

  const todosActivos = Object.values(prefs).every(Boolean);
  const ningunoActivo = Object.values(prefs).every((v) => !v);

  return (
    <div className="space-y-6">
      {/* Toggle global */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card rounded-2xl border border-border p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold">Todas las notificaciones</p>
          <p className="text-xs text-muted-foreground">
            Activa o desactiva todos los tipos a la vez
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleTodos(true)}
            disabled={todosActivos}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Activar todas
          </button>
          <button
            type="button"
            onClick={() => toggleTodos(false)}
            disabled={ningunoActivo}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Desactivar todas
          </button>
        </div>
      </div>

      {CATEGORIAS.map((cat) => (
        <section key={cat.label} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold">{cat.label}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{cat.descripcion}</p>
          </div>
          <div className="divide-y divide-border">
            {cat.items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggle(item.key)}
                className="w-full flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-muted/40 transition-colors text-left"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    prefs[item.key] ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <item.icon
                    strokeWidth={1.75}
                    className={`w-5 h-5 ${
                      prefs[item.key] ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.descripcion}</p>
                </div>
                <Switch checked={prefs[item.key]} />
              </button>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={guardar}
          disabled={!dirty || pending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <Save className="w-4 h-4" />
          {pending ? "Guardando..." : dirty ? "Guardar cambios" : "Sin cambios"}
        </button>
      </div>
    </div>
  );
}

function Switch({ checked }: { checked: boolean }) {
  return (
    <span
      className={`relative inline-block w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
        checked ? "bg-primary" : "bg-muted-foreground/20"
      }`}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </span>
  );
}
