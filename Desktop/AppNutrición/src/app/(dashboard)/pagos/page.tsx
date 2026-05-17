import { CreditCard, CircleDollarSign, Receipt, Clock, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getPagos, getEstadisticasPagos } from "@/app/actions/pagos";
import { getPacientes } from "@/app/actions/pacientes";
import { getStripeAccountStatus } from "@/app/actions/stripe";
import { PagosClient } from "./pagos-client";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";
import { intlTag } from "@/i18n/config";

type StatVariant = "neutral" | "success" | "warning";

const VARIANT_STYLES: Record<
  StatVariant,
  {
    gradient: string;
    iconBadgeBg: string;
    iconBadgeFg: string;
    bgIcon: string;
    valueColor: string;
  }
> = {
  neutral: {
    gradient: "bg-gradient-to-br from-transparent to-muted/30",
    iconBadgeBg: "bg-muted",
    iconBadgeFg: "text-muted-foreground",
    bgIcon: "text-muted-foreground/10",
    valueColor: "text-foreground",
  },
  success: {
    gradient: "bg-gradient-to-br from-transparent to-emerald-500/[0.06]",
    iconBadgeBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconBadgeFg: "text-emerald-600 dark:text-emerald-400",
    bgIcon: "text-emerald-500/10",
    valueColor: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    gradient: "bg-gradient-to-br from-transparent to-amber-500/[0.07]",
    iconBadgeBg: "bg-amber-50 dark:bg-amber-500/10",
    iconBadgeFg: "text-amber-600 dark:text-amber-400",
    bgIcon: "text-amber-500/15",
    valueColor: "text-amber-600 dark:text-amber-400",
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  variant: StatVariant;
}) {
  const s = VARIANT_STYLES[variant];
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border p-4 ${s.gradient}`}
    >
      <Icon
        strokeWidth={1.25}
        className={`absolute -bottom-5 -right-5 w-24 h-24 sm:w-28 sm:h-28 ${s.bgIcon} pointer-events-none`}
      />
      <div className="relative flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</span>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconBadgeBg} ${s.iconBadgeFg}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={`relative text-xl font-bold ${s.valueColor}`}>{value}</p>
    </div>
  );
}

export default async function PagosPage() {
  const t = await getTranslations("payments");
  const locale = await getLocale();
  const tag = intlTag(locale);

  function formatEuro(value: number) {
    return new Intl.NumberFormat(tag, { style: "currency", currency: "EUR" }).format(value);
  }

  const [pagos, stats, pacientes, stripeStatus] = await Promise.all([
    getPagos(),
    getEstadisticasPagos(),
    getPacientes(),
    getStripeAccountStatus(),
  ]);

  const pagosSerializados = JSON.parse(JSON.stringify(pagos));
  const pacientesLista = pacientes.map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellidos}` }));

  return (
    <div>
      <PageHeader
        icon={Wallet}
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard
          label={t("stats.totalPagos")}
          value={String(stats.pagosCount)}
          icon={Receipt}
          variant="neutral"
        />
        <StatCard
          label={t("stats.cobrado")}
          value={formatEuro(stats.cobrado)}
          icon={CircleDollarSign}
          variant="success"
        />
        <StatCard
          label={t("stats.pendiente")}
          value={formatEuro(stats.pendiente)}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          label={t("stats.balance")}
          value={formatEuro(stats.cobrado - stats.pendiente)}
          icon={CreditCard}
          variant="neutral"
        />
      </div>

      <PagosClient pagos={pagosSerializados} pacientes={pacientesLista} stripeConnected={stripeStatus.onboarded} />
    </div>
  );
}
