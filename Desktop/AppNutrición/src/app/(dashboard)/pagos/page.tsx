import { CreditCard, CircleDollarSign, Receipt, Clock } from "lucide-react";
import { getPagos, getEstadisticasPagos } from "@/app/actions/pagos";
import { getPacientes } from "@/app/actions/pacientes";
import { formatDate } from "@/lib/utils";
import { PagosClient } from "./pagos-client";

function formatEuro(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

export default async function PagosPage() {
  const [pagos, stats, pacientes] = await Promise.all([
    getPagos(),
    getEstadisticasPagos(),
    getPacientes(),
  ]);

  const pagosSerializados = JSON.parse(JSON.stringify(pagos));
  const pacientesLista = pacientes.map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellidos}` }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pagos</h1>
          <p className="text-muted-foreground mt-1">Gestiona los cobros de tus pacientes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Total pagos</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold">{stats.pagosCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Cobrado</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-green-600">{formatEuro(stats.cobrado)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Pendiente</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-600">{formatEuro(stats.pendiente)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Balance</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold">{formatEuro(stats.cobrado - stats.pendiente)}</p>
        </div>
      </div>

      <PagosClient pagos={pagosSerializados} pacientes={pacientesLista} />
    </div>
  );
}
