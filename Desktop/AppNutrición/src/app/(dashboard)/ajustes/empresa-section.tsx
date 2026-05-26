"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  Users,
  Crown,
  LogOut,
  UserMinus,
  ArrowRightLeft,
  Check,
  X,
  Loader2,
  Send,
  Pencil,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  obtenerEmpresa,
  crearMiCentro,
  invitarMiembro,
  cancelarInvitacion,
  getMisInvitaciones,
  aceptarInvitacion,
  rechazarInvitacion,
  salirDeEmpresa,
  expulsarMiembro,
  transferirLiderazgo,
  actualizarEmpresa,
  marcarLeidasEmpresa,
} from "@/app/actions/empresa";

type EmpresaData = Awaited<ReturnType<typeof obtenerEmpresa>>;
type Invitacion = Awaited<ReturnType<typeof getMisInvitaciones>>[number];

export function EmpresaSection({ isDemo }: { isDemo: boolean }) {
  const t = useTranslations("settings");
  const [empresa, setEmpresa] = useState<EmpresaData>(null);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    marcarLeidasEmpresa();
  }, []);

  async function loadData() {
    setLoading(true);
    const [emp, inv] = await Promise.all([obtenerEmpresa(), getMisInvitaciones()]);
    setEmpresa(emp);
    setInvitaciones(inv);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isDemo) {
    return (
      <p className="text-sm text-muted-foreground py-4">{t("empresaSettings.demoDisabled")}</p>
    );
  }

  if (!empresa && invitaciones.length > 0) {
    return <InvitacionesPendientesView invitaciones={invitaciones} onUpdate={loadData} />;
  }

  if (!empresa) {
    return <SinCentroView onCreated={loadData} />;
  }

  return <CentroView empresa={empresa} onUpdate={loadData} />;
}

// ─── Sin centro ───

function SinCentroView({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations("settings");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await crearMiCentro({ nombre, descripcion: descripcion || undefined });
      if (res.ok) {
        toast.success(t("empresaSettings.centroCreado"));
        onCreated();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (!mostrarForm) {
    return (
      <div className="text-center py-6">
        <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-medium">{t("empresaSettings.sinCentro")}</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">{t("empresaSettings.sinCentroDesc")}</p>
        <button
          onClick={() => setMostrarForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          {t("empresaSettings.crearMiCentro")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleCrear} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("empresaSettings.crearMiCentro")}</h3>
        <button
          type="button"
          onClick={() => setMostrarForm(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("empresaSettings.cancelar")}
        </button>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {t("empresaSettings.centroNombreLabel")}
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          maxLength={200}
          placeholder={t("empresaSettings.centroNombrePlaceholder")}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {t("empresaSettings.descripcionLabel")}
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder={t("empresaSettings.descripcionPlaceholder")}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || nombre.trim().length < 2}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
        {t("empresaSettings.crearCentroBtn")}
      </button>
    </form>
  );
}

// ─── Invitaciones pendientes (dietista sin centro) ───

function InvitacionesPendientesView({
  invitaciones,
  onUpdate,
}: {
  invitaciones: Invitacion[];
  onUpdate: () => void;
}) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  function handleAceptar(id: string) {
    setActionId(id);
    startTransition(async () => {
      const res = await aceptarInvitacion(id);
      if (res.ok) {
        toast.success(t("empresaSettings.invitacionAceptada"));
        onUpdate();
      } else {
        toast.error(res.error);
      }
      setActionId(null);
    });
  }

  function handleRechazar(id: string) {
    setActionId(id);
    startTransition(async () => {
      const res = await rechazarInvitacion(id);
      if (res.ok) {
        toast.success(t("empresaSettings.invitacionRechazada"));
        onUpdate();
      } else {
        toast.error(res.error);
      }
      setActionId(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t("empresaSettings.invitacionesPendientes")}</span>
      </div>
      {invitaciones.map((inv) => (
        <div
          key={inv.id}
          className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{inv.empresaNombre}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("empresaSettings.invitadoPor", { nombre: inv.liderNombre })} · {inv.totalMiembros}{" "}
                {t("empresaSettings.miembros")}
              </p>
              {inv.empresaDescripcion && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {inv.empresaDescripcion}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleAceptar(inv.id)}
                disabled={isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending && actionId === inv.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {t("empresaSettings.aceptarInvitacion")}
              </button>
              <button
                onClick={() => handleRechazar(inv.id)}
                disabled={isPending}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Vista del centro (miembro o líder) ───

function CentroView({
  empresa,
  onUpdate,
}: {
  empresa: NonNullable<EmpresaData>;
  onUpdate: () => void;
}) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [mostrarInvitar, setMostrarInvitar] = useState(false);
  const [confirmAccion, setConfirmAccion] = useState<{
    tipo: "salir" | "expulsar" | "transferir";
    targetId?: string;
    targetNombre?: string;
  } | null>(null);

  function handleSalir() {
    startTransition(async () => {
      const res = await salirDeEmpresa();
      if (res.ok) {
        toast.success(t("empresaSettings.hasSalido"));
        onUpdate();
      } else {
        toast.error(res.error);
      }
      setConfirmAccion(null);
    });
  }

  function handleExpulsar(miembroId: string) {
    startTransition(async () => {
      const res = await expulsarMiembro(miembroId);
      if (res.ok) {
        toast.success(t("empresaSettings.miembroExpulsado"));
        onUpdate();
      } else {
        toast.error(res.error);
      }
      setConfirmAccion(null);
    });
  }

  function handleTransferir(nuevoLiderId: string) {
    startTransition(async () => {
      const res = await transferirLiderazgo(nuevoLiderId);
      if (res.ok) {
        toast.success(t("empresaSettings.liderazgoTransferido"));
        onUpdate();
      } else {
        toast.error(res.error);
      }
      setConfirmAccion(null);
    });
  }

  function handleCancelarInvitacion(solicitudId: string) {
    startTransition(async () => {
      const res = await cancelarInvitacion(solicitudId);
      if (res.ok) {
        toast.success(t("empresaSettings.invitacionCancelada"));
        onUpdate();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (editando && empresa.esLider) {
    return (
      <EditarCentroForm
        empresa={empresa}
        onSaved={() => {
          setEditando(false);
          onUpdate();
        }}
        onCancel={() => setEditando(false)}
      />
    );
  }

  const plazasDisponibles = empresa.maxMiembros - empresa.miembros.length;
  const porcentajeOcupacion = (empresa.miembros.length / empresa.maxMiembros) * 100;

  return (
    <div className="space-y-5">
      {/* Info del centro */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold">{empresa.nombre}</h3>
            <span className="text-xs text-muted-foreground font-mono">/{empresa.slug}</span>
          </div>
          {empresa.descripcion && (
            <p className="text-sm text-muted-foreground mt-1">{empresa.descripcion}</p>
          )}
        </div>
        {empresa.esLider && (
          <button
            onClick={() => setEditando(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
            title={t("empresaSettings.editarCentro")}
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Barra de licencias */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t("empresaSettings.licencias", {
              count: empresa.miembros.length,
              max: empresa.maxMiembros,
            })}
          </span>
          <span
            className={cn(
              "text-[11px] font-medium",
              plazasDisponibles > 1
                ? "text-green-600 dark:text-green-400"
                : plazasDisponibles === 1
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400",
            )}
          >
            {plazasDisponibles > 0
              ? t("empresaSettings.plazasDisponibles", { count: plazasDisponibles })
              : t("empresaSettings.sinPlazas")}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              porcentajeOcupacion < 80
                ? "bg-green-500"
                : porcentajeOcupacion < 100
                  ? "bg-amber-500"
                  : "bg-red-500",
            )}
            style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
          />
        </div>
      </div>

      {/* Acciones del líder */}
      {empresa.esLider && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMostrarInvitar(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
            {t("empresaSettings.invitarMiembro")}
          </button>
        </div>
      )}

      {/* Formulario de invitar miembro */}
      {mostrarInvitar && empresa.esLider && (
        <InvitarMiembroForm
          onInvited={() => {
            setMostrarInvitar(false);
            onUpdate();
          }}
          onClose={() => setMostrarInvitar(false)}
        />
      )}


      {/* Invitaciones pendientes enviadas por el líder */}
      {empresa.esLider && empresa.solicitudes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t("empresaSettings.invitacionesEnviadas")} ({empresa.solicitudes.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {empresa.solicitudes.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {s.dietista
                      ? `${s.dietista.nombre} ${s.dietista.apellidos ?? ""}`.trim()
                      : s.email}
                  </p>
                  {s.dietista && (
                    <p className="text-[11px] text-muted-foreground">{s.dietista.email}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCancelarInvitacion(s.id)}
                  disabled={isPending}
                  className="shrink-0 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title={t("empresaSettings.cancelarInvitacion")}
                >
                  <X className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de miembros */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t("empresaSettings.miembrosTitle")} ({empresa.miembros.length})
          </span>
        </div>
        <div className="space-y-1.5">
          {empresa.miembros.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {m.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">
                      {m.nombre} {m.apellidos}
                    </span>
                    {m.esLider && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-[10px] font-semibold text-green-700 dark:text-green-400">
                        <Crown className="w-3 h-3" />
                        {t("empresaSettings.lider")}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                </div>
              </div>
              {empresa.esLider && !m.esLider && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      setConfirmAccion({
                        tipo: "transferir",
                        targetId: m.id,
                        targetNombre: m.nombre,
                      })
                    }
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title={t("empresaSettings.transferirLiderazgo")}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmAccion({
                        tipo: "expulsar",
                        targetId: m.id,
                        targetNombre: m.nombre,
                      })
                    }
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title={t("empresaSettings.expulsarMiembro")}
                  >
                    <UserMinus className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botón salir */}
      <div className="pt-2 border-t border-border">
        <button
          onClick={() => setConfirmAccion({ tipo: "salir" })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t("empresaSettings.salirDelCentro")}
        </button>
      </div>

      {/* Modal de confirmación */}
      {confirmAccion && (
        <ConfirmModal
          tipo={confirmAccion.tipo}
          targetNombre={confirmAccion.targetNombre}
          isPending={isPending}
          onConfirm={() => {
            if (confirmAccion.tipo === "salir") handleSalir();
            if (confirmAccion.tipo === "expulsar" && confirmAccion.targetId)
              handleExpulsar(confirmAccion.targetId);
            if (confirmAccion.tipo === "transferir" && confirmAccion.targetId)
              handleTransferir(confirmAccion.targetId);
          }}
          onCancel={() => setConfirmAccion(null)}
        />
      )}
    </div>
  );
}

// ─── Invitar miembro (inline form) ───

function InvitarMiembroForm({
  onInvited,
  onClose,
}: {
  onInvited: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("settings");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await invitarMiembro(email);
      if (res.ok) {
        toast.success(t("empresaSettings.invitacionEnviada"));
        onInvited();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 rounded-lg border border-border bg-muted/30 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("empresaSettings.invitarMiembro")}</span>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("empresaSettings.emailPlaceholder")}
          required
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={isPending || !email.includes("@")}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {t("empresaSettings.enviar")}
        </button>
      </div>
    </form>
  );
}

// ─── Editar centro (solo líder) ───

function EditarCentroForm({
  empresa,
  onSaved,
  onCancel,
}: {
  empresa: NonNullable<EmpresaData>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("settings");
  const [nombre, setNombre] = useState(empresa.nombre);
  const [descripcion, setDescripcion] = useState(empresa.descripcion || "");
  const [slug, setSlug] = useState(empresa.slug);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await actualizarEmpresa({
        nombre: nombre !== empresa.nombre ? nombre : undefined,
        descripcion: descripcion !== (empresa.descripcion || "") ? descripcion : undefined,
        slug: slug !== empresa.slug ? slug : undefined,
      });
      if (res.ok) {
        toast.success(t("empresaSettings.centroActualizado"));
        onSaved();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{t("empresaSettings.editarCentro")}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("empresaSettings.cancelar")}
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {t("empresaSettings.centroNombreLabel")}
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={200}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {t("empresaSettings.descripcionLabel")}
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={500}
          rows={2}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {t("empresaSettings.slugLabel")}
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          maxLength={50}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {t("empresaSettings.guardar")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          {t("empresaSettings.cancelar")}
        </button>
      </div>
    </form>
  );
}

// ─── Modal de confirmación ───

function ConfirmModal({
  tipo,
  targetNombre,
  isPending,
  onConfirm,
  onCancel,
}: {
  tipo: "salir" | "expulsar" | "transferir";
  targetNombre?: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("settings");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border p-5 max-w-sm w-full shadow-xl">
        <h4 className="text-sm font-semibold mb-2">
          {tipo === "salir" && t("empresaSettings.confirmarSalir")}
          {tipo === "expulsar" &&
            t("empresaSettings.confirmarExpulsar", { nombre: targetNombre ?? "" })}
          {tipo === "transferir" &&
            t("empresaSettings.confirmarTransferir", { nombre: targetNombre ?? "" })}
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          {tipo === "salir" && t("empresaSettings.confirmarSalirDesc")}
          {tipo === "expulsar" && t("empresaSettings.confirmarExpulsarDesc")}
          {tipo === "transferir" && t("empresaSettings.confirmarTransferirDesc")}
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
          >
            {t("empresaSettings.cancelar")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50",
              tipo === "transferir"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-red-600 text-white hover:bg-red-700",
            )}
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t("empresaSettings.confirmar")}
          </button>
        </div>
      </div>
    </div>
  );
}
