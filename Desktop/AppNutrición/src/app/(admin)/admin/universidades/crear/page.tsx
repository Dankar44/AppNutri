import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { CrearLicenciaForm } from "./crear-licencia-form";

export default async function CrearUniversidadPage() {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("admin.universidades");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("crearTitle")}</h1>
        <p className="text-muted-foreground mt-1">{t("crearSubtitle")}</p>
      </div>
      <CrearLicenciaForm />
    </div>
  );
}
