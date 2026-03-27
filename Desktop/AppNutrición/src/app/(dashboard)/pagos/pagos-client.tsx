"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Trash2, CreditCard, Loader2, X } from "lucide-react";
import { crearPago, marcarPagado, eliminarPago } from "@/app/actions/pagos";
import { toast } from "sonner";

interface Pago {
  id: string;
  pacienteNombre: string | null;
  concepto: string;
  importe: number;
  estado: string;
  metodoPago: string | null;
  fechaPago: string | null;
  createdAt: string;
}

interface Props {
  pagos: Pago[];
  pacientes: { id: string; nombre: string }[];
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function PagosClient({ pagos, pacientes }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showPagar, setShowPagar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [pacienteId, setPacienteId] = useState("");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [notas, setNotas] = useState("");

  // Pagar state
  const [numTarjeta, setNumTarjeta] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!concepto.trim() || !importe) { toast.error("Completa concepto e importe"); return; }
    setLoading(true);
    try {
      await crearPago({ pacienteId: pacienteId || undefined, concepto, importe: parseFloat(importe), notas });
      toast.success("Pago creado");
      setShowForm(false);
      setConcepto(""); setImporte(""); setNotas(""); setPacienteId("");
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al crear pago");
    } finally { setLoading(false); }
  }

  async function handlePagar(pagoId: string) {
    if (!numTarjeta || !expiry || !cvv) { toast.error("Completa los datos de la tarjeta"); return; }
    setLoading(true);
    // Simular procesamiento (2 segundos)
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const metodo = `Tarjeta ****${numTarjeta.replace(/\s/g, "").slice(-4)}`;
      await marcarPagado(pagoId, metodo);
      toast.success("Pago procesado correctamente");
      setShowPagar(null);
      setNumTarjeta(""); setExpiry(""); setCvv("");
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al procesar pago");
    } finally { setLoading(false); }
  }

  async function handleEliminar(pagoId: string) {
    try {
      await eliminarPago(pagoId);
      toast.success("Pago eliminado");
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="space-y-6">
      {/* Botón crear */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo cobro
        </button>
      </div>

      {/* Formulario crear */}
      {showForm && (
        <form onSubmit={handleCrear} className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold">Crear solicitud de cobro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Paciente</label>
              <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm">
                <option value="">Sin paciente asignado</option>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Importe (EUR) *</label>
              <input type="number" step="0.01" min="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} required placeholder="35.00"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Concepto *</label>
              <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} required maxLength={200} placeholder="Ej: Consulta mensual, Plan nutricional..."
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Notas</label>
              <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={500} placeholder="Opcional"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Crear cobro
            </button>
          </div>
        </form>
      )}

      {/* Modal pagar con tarjeta */}
      {showPagar && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Pagar con tarjeta</h3>
              <button onClick={() => setShowPagar(null)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg mb-4">Modo de prueba — cualquier tarjeta funciona</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Número de tarjeta</label>
                <input type="text" value={numTarjeta} onChange={(e) => setNumTarjeta(e.target.value)} maxLength={19} placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Caducidad</label>
                  <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} maxLength={5} placeholder="12/28"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={4} placeholder="123"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono" />
                </div>
              </div>
            </div>
            <button onClick={() => handlePagar(showPagar)} disabled={loading}
              className="w-full mt-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : "Pagar ahora"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de pagos */}
      {pagos.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin pagos</h3>
          <p className="text-muted-foreground">Crea tu primera solicitud de cobro</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Concepto</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Paciente</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Importe</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Fecha</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{pago.concepto}</p>
                      {pago.metodoPago && <p className="text-xs text-muted-foreground">{pago.metodoPago}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {pago.pacienteNombre || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-sm">{formatEuro(pago.importe)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        pago.estado === "PAGADO" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {pago.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {pago.fechaPago ? formatFecha(pago.fechaPago) : formatFecha(pago.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {pago.estado === "PENDIENTE" && (
                          <button onClick={() => setShowPagar(pago.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                            <CreditCard className="w-3 h-3" /> Pagar
                          </button>
                        )}
                        <button onClick={() => handleEliminar(pago.id)}
                          className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
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
      )}
    </div>
  );
}
