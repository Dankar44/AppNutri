import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCentrosAdmin } from "@/app/actions/admin";
import { CentrosList } from "./centros-list";
import { CentrosFilter } from "./centros-filter";

export default async function CentrosPage({
  searchParams,
}: {
  searchParams: Promise<{ busqueda?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("admin.centros");
  const params = await searchParams;
  const centros = await getCentrosAdmin(params.busqueda);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle", { count: centros.length })}
          </p>
        </div>
      </div>
      <CentrosFilter busqueda={params.busqueda} />
      <CentrosList centros={centros} />
    </div>
  );
}
