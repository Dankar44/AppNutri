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
import { useTranslations } from "next-intl";
import { setNotifPreferencias, type NotifPreferencias } from "@/app/actions/notificaciones";

type CategoriaConfig = {
  categoryKey: string;
  items: {
    key: keyof NotifPreferencias;
    icon: LucideIcon;
  }[];
};

const CATEGORIAS: CategoriaConfig[] = [
  {
    categoryKey: "citas",
    items: [
      { key: "CITA_HOY", icon: CalendarClock },
      { key: "CITA_SOLICITADA", icon: CalendarPlus },
      { key: "CITA_CONFIRMADA", icon: CalendarCheck },
      { key: "CITA_CONTRAPROPUESTA", icon: CalendarDays },
      { key: "CITA_RECHAZADA", icon: CalendarX },
      { key: "CITA_CANCELADA_POR_PACIENTE", icon: CalendarX },
    ],
  },
  {
    categoryKey: "seguimiento",
    items: [
      { key: "PACIENTE_SIN_CONSULTA", icon: UserX },
      { key: "PACIENTE_SIN_MEDIDAS", icon: Scale },
      { key: "PLAN_ANTIGUO", icon: FileWarning },
    ],
  },
  {
    categoryKey: "actividad",
    items: [
      { key: "DIARIO_NUEVO", icon: BookOpen },
    ],
  },
  {
    categoryKey: "pagos",
    items: [
      { key: "PAGO_RECIBIDO", icon: Wallet },
      { key: "PAGO_PENDIENTE", icon: WalletCards },
      { key: "PAGO_FALLIDO", icon: AlertCircle },
    ],
  },
];

export function PreferenciasForm({ prefs: prefsIniciales }: { prefs: NotifPreferencias }) {
  const t = useTranslations("notifications");
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
        toast.success(t("preferencias.toastSaved"));
        setDirty(false);
      } catch {
        toast.error(t("preferencias.toastSaveError"));
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
          <p className="text-sm font-semibold">{t("preferencias.allNotifications")}</p>
          <p className="text-xs text-muted-foreground">
            {t("preferencias.toggleAllDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleTodos(true)}
            disabled={todosActivos}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("preferencias.enableAll")}
          </button>
          <button
            type="button"
            onClick={() => toggleTodos(false)}
            disabled={ningunoActivo}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("preferencias.disableAll")}
          </button>
        </div>
      </div>

      {CATEGORIAS.map((cat) => (
        <section key={cat.categoryKey} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold">{t(`preferencias.categories.${cat.categoryKey}.label`)}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t(`preferencias.categories.${cat.categoryKey}.description`)}</p>
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
                  <p className="text-sm font-semibold leading-tight">{t(`preferencias.items.${item.key}.title`)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(`preferencias.items.${item.key}.description`)}</p>
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
          {pending ? t("preferencias.saving") : dirty ? t("preferencias.saveChanges") : t("preferencias.noChanges")}
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
