"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ExternalLink, Loader2, LinkIcon, AlertCircle, Unplug } from "lucide-react";
import {
  createStripeConnectAccount,
  getStripeOnboardingLink,
  disconnectStripeAccount,
  getStripeDashboardLink,
} from "@/app/actions/stripe";
import { toast } from "sonner";

interface Props {
  status: {
    connected: boolean;
    accountId: string | null;
    onboarded: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  };
}

export function StripeConnectCard({ status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const { url } = await createStripeConnectAccount();
      window.location.href = url;
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al conectar con Stripe");
      setLoading(false);
    }
  }

  async function handleCompleteOnboarding() {
    setLoading(true);
    try {
      const { url } = await getStripeOnboardingLink();
      window.location.href = url;
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al generar link de onboarding");
      setLoading(false);
    }
  }

  async function handleDashboard() {
    setLoading(true);
    try {
      const { url } = await getStripeDashboardLink();
      window.open(url, "_blank");
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al abrir el dashboard de Stripe");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("¿Seguro que quieres desconectar tu cuenta de Stripe? Los pagos pendientes con link dejarán de funcionar.")) return;
    setDisconnecting(true);
    try {
      await disconnectStripeAccount();
      toast.success("Cuenta de Stripe desconectada");
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al desconectar");
    } finally {
      setDisconnecting(false);
    }
  }

  // ─── No conectado ────────────────────────────────────────
  if (!status.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-4">
          <LinkIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Conecta tu cuenta de Stripe</p>
            <p>Conecta tu propia cuenta de Stripe para cobrar a tus pacientes directamente. El dinero va a tu cuenta bancaria.</p>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#635BFF] text-white font-medium hover:bg-[#5851DB] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Conectando...</>
          ) : (
            <><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> Conectar Stripe</>
          )}
        </button>
      </div>
    );
  }

  // ─── Conectado pero onboarding incompleto ────────────────
  if (!status.onboarded) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">Configuración incompleta</p>
            <p className="text-amber-700">Tu cuenta de Stripe está conectada pero necesitas completar la verificación para poder recibir pagos.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCompleteOnboarding}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#635BFF] text-white font-medium hover:bg-[#5851DB] transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</>
            ) : (
              <><ExternalLink className="w-4 h-4" /> Completar verificación</>
            )}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
          >
            {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  // ─── Completamente conectado y verificado ────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-green-800 mb-1">Stripe conectado</p>
          <p className="text-green-700">Tu cuenta está verificada y lista para recibir pagos. Los cobros que crees generarán un link de pago automáticamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className={`rounded-lg p-2 ${status.chargesEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          <p className="font-medium">{status.chargesEnabled ? "Activo" : "Inactivo"}</p>
          <p className="text-[10px] mt-0.5">Cobros</p>
        </div>
        <div className={`rounded-lg p-2 ${status.payoutsEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          <p className="font-medium">{status.payoutsEnabled ? "Activo" : "Inactivo"}</p>
          <p className="text-[10px] mt-0.5">Transferencias</p>
        </div>
        <div className={`rounded-lg p-2 ${status.detailsSubmitted ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          <p className="font-medium">{status.detailsSubmitted ? "Completo" : "Pendiente"}</p>
          <p className="text-[10px] mt-0.5">Verificación</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDashboard}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#635BFF] text-white font-medium hover:bg-[#5851DB] transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Abriendo...</>
          ) : (
            <><ExternalLink className="w-4 h-4" /> Dashboard de Stripe</>
          )}
        </button>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
          title="Desconectar Stripe"
        >
          {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
