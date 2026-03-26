"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Plus,
  Receipt,
} from "lucide-react";

type EstadoPago = "Pagado" | "Pendiente";

interface Pago {
  id: string;
  cliente: string;
  concepto: string;
  fecha: string;
  estado: EstadoPago;
  importe: number;
}

const pagosIniciales: Pago[] = [
  {
    id: "PAG-001",
    cliente: "María Pérez",
    concepto: "Plan nutricional mensual",
    fecha: "12 mar 2026",
    estado: "Pagado",
    importe: 45,
  },
  {
    id: "PAG-002",
    cliente: "Carlos Ruiz",
    concepto: "Seguimiento quincenal",
    fecha: "09 mar 2026",
    estado: "Pendiente",
    importe: 30,
  },
  {
    id: "PAG-003",
    cliente: "Laura Gómez",
    concepto: "Primera consulta",
    fecha: "02 mar 2026",
    estado: "Pagado",
    importe: 60,
  },
];

function formatEuro(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>(pagosIniciales);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState("");
  const [concepto, setConcepto] = useState("Solicitud manual");
  const [importeInput, setImporteInput] = useState("35");
  const [errorFormulario, setErrorFormulario] = useState("");

  const pacientesDisponibles = useMemo(
    () => Array.from(new Set(pagos.map((pago) => pago.cliente))),
    [pagos]
  );

  const { totalPagosMes, pagosPagados, saldoPendiente, saldoDisponible } =
    useMemo(() => {
      const total = pagos.length;
      const pagados = pagos.filter((p) => p.estado === "Pagado").length;
      const pendiente = pagos
        .filter((p) => p.estado === "Pendiente")
        .reduce((acc, p) => acc + p.importe, 0);
      const disponible = pagos
        .filter((p) => p.estado === "Pagado")
        .reduce((acc, p) => acc + p.importe, 0);

      return {
        totalPagosMes: total,
        pagosPagados: pagados,
        saldoPendiente: pendiente,
        saldoDisponible: disponible,
      };
    }, [pagos]);

  const porcentajePagados =
    totalPagosMes > 0 ? Math.round((pagosPagados / totalPagosMes) * 100) : 0;

  function handleCrearSolicitudPago() {
    const importe = Number(importeInput.replace(",", "."));
    if (!pacienteSeleccionado) {
      setErrorFormulario("Selecciona un paciente.");
      return;
    }
    if (!Number.isFinite(importe) || importe <= 0) {
      setErrorFormulario("Introduce un importe válido mayor que 0.");
      return;
    }

    setErrorFormulario("");
    const nuevoId = `PAG-${String(pagos.length + 1).padStart(3, "0")}`;
    const fecha = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const nuevoPago: Pago = {
      id: nuevoId,
      cliente: pacienteSeleccionado,
      concepto: concepto.trim() || "Solicitud manual",
      fecha: fecha.replace(".", ""),
      estado: "Pendiente",
      importe,
    };

    setPagos((prev) => [nuevoPago, ...prev]);
    setMostrarFormulario(false);
    setConcepto("Solicitud manual");
    setImporteInput("35");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Pagos</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[30%_70%] md:items-start">
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setMostrarFormulario((prev) => !prev);
              setErrorFormulario("");
              if (!pacienteSeleccionado && pacientesDisponibles.length > 0) {
                setPacienteSeleccionado(pacientesDisponibles[0]);
              }
            }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Solicitar pago <Plus className="h-4 w-4" />
          </button>

          {mostrarFormulario && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Nueva solicitud de pago</h3>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Paciente
                  </label>
                  <select
                    value={pacienteSeleccionado}
                    onChange={(e) => setPacienteSeleccionado(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecciona un paciente</option>
                    {pacientesDisponibles.map((paciente) => (
                      <option key={paciente} value={paciente}>
                        {paciente}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Concepto
                  </label>
                  <input
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Ej. Seguimiento mensual"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Importe (EUR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={importeInput}
                    onChange={(e) => setImporteInput(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="0,00"
                  />
                </div>

                {errorFormulario && (
                  <p className="text-xs font-medium text-red-600">
                    {errorFormulario}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCrearSolicitudPago}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Crear solicitud
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setErrorFormulario("");
                    }}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Informaciones</h2>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Más información"
              >
                <CircleDollarSign className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Pagos realizados en el último mes
            </p>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${porcentajePagados}%` }}
              />
            </div>
            <p className="mt-1 text-right text-sm text-muted-foreground">
              {pagosPagados} / {totalPagosMes}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-lg font-semibold text-foreground">
                  {formatEuro(saldoPendiente)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saldo pendiente
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-lg font-semibold text-foreground">
                  {formatEuro(saldoDisponible)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saldo disponible
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-md bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground"
            >
              Transferir saldo disponible
            </button>
          </div>
        </section>

        <section className="md:pt-12">
          <div className="space-y-4 md:border-l md:border-border md:pl-6">
            <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  Conoce el sistema de pagos
                </h2>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Solicita y recibe pagos</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Realiza la solicitud de pagos a tus clientes. Se cobrará una
                    tasa de 5% por cada transacción efectuada.
                  </p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Activar Stripe <CreditCard className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                  <Receipt className="h-8 w-8 text-sky-500" />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold">Historial de pagos</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium">Concepto</th>
                      <th className="px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium">Estado</th>
                      <th className="px-4 py-3 text-right font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago) => (
                      <tr key={pago.id} className="border-t border-border">
                        <td className="px-4 py-3">{pago.cliente}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {pago.concepto}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {pago.fecha}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              pago.estado === "Pagado"
                                ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                                : "rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                            }
                          >
                            {pago.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatEuro(pago.importe)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
