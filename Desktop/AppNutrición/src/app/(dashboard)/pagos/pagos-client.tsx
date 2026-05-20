"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CreditCard, Loader2, X, Link2, Copy, Check, ExternalLink, RefreshCw, Banknote } from "lucide-react";
import { crearPago, marcarPagado, eliminarPago, generarLinkPago } from "@/app/actions/pagos";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFormPersist } from "@/lib/form-persist";
import { useLocale } from "next-intl";
import { intlTag, type Locale } from "@/i18n/config";
import { withTimeout } from "@/lib/utils";

interface Pago {
  id: string;
  pacienteNombre: string | null;
  concepto: string;
  importe: number;
  estado: string;
  metodoPago: string | null;
  fechaPago: string | null;
  stripePaymentUrl: string | null;
  stripeSessionId: string | null;
  createdAt: string;
}

interface Props {
  pagos: Pago[];
  pacientes: { id: string; nombre: string }[];
  stripeConnected: boolean;
}

export function PagosClient({ pagos, pacientes, stripeConnected }: Props) {
  const t = useTranslations("payments");
  const locale = useLocale() as Locale;
  const tag = intlTag(locale);

  function formatEuro(value: number) {
    return new Intl.NumberFormat(tag, { style: "currency", currency: "EUR" }).format(value);
  }

  function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString(tag, { day: "numeric", month: "short", year: "numeric" });
  }
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showManualPago, setShowManualPago] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [pacienteId, setPacienteId] = useState("");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [notas, setNotas] = useState("");

  const tc = useTranslations("common.deploy");
  const pagoFormState = useMemo(
    () => ({ pacienteId, concepto, importe, notas }),
    [pacienteId, concepto, importe, notas],
  );
  const { wasRestored, clear: clearDraft } = useFormPersist(
    "pago-nuevo",
    pagoFormState,
    (val) => {
      setPacienteId(String(val.pacienteId ?? ""));
      setConcepto(String(val.concepto ?? ""));
      setImporte(String(val.importe ?? ""));
      setNotas(String(val.notas ?? ""));
    },
    { enabled: showForm },
  );

  useEffect(() => {
    if (wasRestored) {
      setShowForm(true);
      toast.success(tc("datosRestaurados"));
    }
  }, [wasRestored, tc]);

  // Manual payment state
  const [metodoPago, setMetodoPago] = useState("");

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!concepto.trim() || !importe) { toast.error(t("toasts.completaConceptoImporte")); return; }
    setLoading(true);
    try {
      await withTimeout(crearPago({ pacienteId: pacienteId || undefined, concepto, importe: parseFloat(importe), notas }));
      clearDraft();
      toast.success(stripeConnected ? t("toasts.cobroCreadoConLink") : t("toasts.cobroCreado"));
      setShowForm(false);
      setConcepto(""); setImporte(""); setNotas(""); setPacienteId("");
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error(t("toasts.errorCrearCobro"));
    } finally { setLoading(false); }
  }

  async function handleGenerarLink(pagoId: string) {
    setGeneratingLink(pagoId);
    try {
      const { url } = await withTimeout(generarLinkPago(pagoId));
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success(t("toasts.linkGeneradoCopiado"));
      }
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error(err instanceof Error ? err.message : t("toasts.errorGenerarLink"));
    } finally { setGeneratingLink(null); }
  }

  async function handleCopyLink(url: string, pagoId: string) {
    await navigator.clipboard.writeText(url);
    setCopiedId(pagoId);
    toast.success(t("toasts.linkCopiado"));
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleMarcarPagado(pagoId: string) {
    if (!metodoPago.trim()) { toast.error(t("toasts.indicaMetodoPago")); return; }
    setLoading(true);
    try {
      await withTimeout(marcarPagado(pagoId, metodoPago.trim()));
      toast.success(t("toasts.pagoMarcadoPagado"));
      setShowManualPago(null);
      setMetodoPago("");
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error(t("toasts.errorMarcarPagado"));
    } finally { setLoading(false); }
  }

  async function handleEliminar(pagoId: string) {
    try {
      await withTimeout(eliminarPago(pagoId));
      toast.success(t("toasts.cobroEliminado"));
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error(t("toasts.errorEliminar"));
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Stripe no conectado */}
      {!stripeConnected && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
          <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">{t("stripeNotConnected.titulo")}</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              {t.rich("stripeNotConnected.descripcion", {
                linkAjustes: (chunks) => <a href="/ajustes" className="underline font-medium hover:text-amber-900">{chunks}</a>,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Botón crear */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-border hover:bg-muted/60 sm:bg-primary sm:text-primary-foreground sm:border-primary sm:hover:bg-primary/90 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> {t("buttons.nuevoCobro")}
        </button>
      </div>

      {/* Formulario crear */}
      {showForm && (
        <form onSubmit={handleCrear} className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold">{t("form.titulo")}</h3>
          {stripeConnected && (
            <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-lg">
              {t("form.stripeLinkAuto")}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("form.pacienteLabel")}</label>
              <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm">
                <option value="">{t("form.sinPacienteAsignado")}</option>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("form.importeLabel")}</label>
              <input type="number" step="0.01" min="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} required placeholder={t("form.importePlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">{t("form.conceptoLabel")}</label>
              <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} required maxLength={200} placeholder={t("form.conceptoPlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">{t("form.notasLabel")}</label>
              <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={500} placeholder={t("form.notasPlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">{t("buttons.cancelar")}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} {t("buttons.crearCobro")}
            </button>
          </div>
        </form>
      )}

      {/* Modal marcar como pagado manualmente */}
      {showManualPago && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Banknote className="w-5 h-5 text-primary" /> {t("manualPayment.titulo")}</h3>
              <button onClick={() => { setShowManualPago(null); setMetodoPago(""); }} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t("manualPayment.descripcion")}</p>
            <div>
              <label className="block text-sm font-medium mb-1">{t("manualPayment.metodoLabel")}</label>
              <input type="text" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} maxLength={50} placeholder={t("manualPayment.metodoPlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
            <button onClick={() => handleMarcarPagado(showManualPago)} disabled={loading || !metodoPago.trim()}
              className="w-full mt-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("manualPayment.guardando")}</> : t("manualPayment.confirmarPago")}
            </button>
          </div>
        </div>
      )}

      {/* Lista de pagos */}
      {pagos.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">{t("emptyState.titulo")}</h3>
          <p className="text-muted-foreground">{t("emptyState.descripcion")}</p>
        </div>
      ) : (
        <>
        {/* Mobile: cards */}
        <div className="sm:hidden space-y-3">
          {pagos.map((pago) => (
            <div key={pago.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{pago.concepto}</p>
                  {pago.pacienteNombre && <p className="text-xs text-muted-foreground">{pago.pacienteNombre}</p>}
                </div>
                <span className="text-base font-bold tabular-nums shrink-0">{formatEuro(pago.importe)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    pago.estado === "PAGADO" ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  }`}>
                    {pago.estado === "PAGADO" ? t("estados.pagado") : t("estados.pendiente")}
                  </span>
                  {pago.metodoPago && <span className="text-xs text-muted-foreground">{pago.metodoPago}</span>}
                  <span className="text-xs text-muted-foreground">{pago.fechaPago ? formatFecha(pago.fechaPago) : formatFecha(pago.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {pago.estado === "PENDIENTE" && (
                    <>
                      {pago.stripePaymentUrl ? (
                        <>
                          <button onClick={() => handleCopyLink(pago.stripePaymentUrl!, pago.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#635BFF] text-white hover:bg-[#5851DB]">
                            {copiedId === pago.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a href={pago.stripePaymentUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center p-1 rounded text-xs text-[#635BFF] hover:bg-[#635BFF]/10">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </>
                      ) : stripeConnected ? (
                        <button onClick={() => handleGenerarLink(pago.id)}
                          disabled={generatingLink === pago.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#635BFF] text-white hover:bg-[#5851DB] disabled:opacity-50">
                          {generatingLink === pago.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                        </button>
                      ) : null}
                      <button onClick={() => setShowManualPago(pago.id)}
                        className="inline-flex items-center p-1 rounded text-xs font-medium border border-border hover:bg-muted">
                        <Banknote className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button onClick={() => handleEliminar(pago.id)}
                    className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("table.concepto")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("table.paciente")}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">{t("table.importe")}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">{t("table.estado")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">{t("table.fecha")}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">{t("table.acciones")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{pago.concepto}</p>
                      {pago.metodoPago && <p className="text-xs text-muted-foreground">{pago.metodoPago}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {pago.pacienteNombre || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-sm">{formatEuro(pago.importe)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        pago.estado === "PAGADO" ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}>
                        {pago.estado === "PAGADO" ? t("estados.pagado") : t("estados.pendiente")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {pago.fechaPago ? formatFecha(pago.fechaPago) : formatFecha(pago.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {pago.estado === "PENDIENTE" && (
                          <>
                            {pago.stripePaymentUrl ? (
                              <>
                                <button onClick={() => handleCopyLink(pago.stripePaymentUrl!, pago.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#635BFF] text-white hover:bg-[#5851DB]"
                                  title={t("actions.copiarLinkTitle")}>
                                  {copiedId === pago.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  {copiedId === pago.id ? t("actions.copiado") : t("actions.link")}
                                </button>
                                <a href={pago.stripePaymentUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center p-1 rounded text-xs text-[#635BFF] hover:bg-[#635BFF]/10"
                                  title={t("actions.abrirPaginaPagoTitle")}>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </>
                            ) : stripeConnected ? (
                              <button onClick={() => handleGenerarLink(pago.id)}
                                disabled={generatingLink === pago.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#635BFF] text-white hover:bg-[#5851DB] disabled:opacity-50"
                                title={t("actions.generarLinkTitle")}>
                                {generatingLink === pago.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                                {t("actions.link")}
                              </button>
                            ) : null}
                            <button onClick={() => setShowManualPago(pago.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-border hover:bg-muted"
                              title={t("actions.marcarPagadoTitle")}>
                              <Banknote className="w-3 h-3" /> {t("actions.pagado")}
                            </button>
                          </>
                        )}
                        <button onClick={() => handleEliminar(pago.id)}
                          className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
