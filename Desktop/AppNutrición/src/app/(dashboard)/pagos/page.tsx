import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";

export default async function PagosPage() {
  const t = await getTranslations("payments");

  return (
    <div>
      <PageHeader
        icon={Wallet}
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Wallet className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">{t("proximamente.titulo")}</h2>
        <p className="text-sm text-muted-foreground max-w-md">{t("proximamente.descripcion")}</p>
      </div>
    </div>
  );
}
