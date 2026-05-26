import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CrearCentroForm } from "./crear-centro-form";

export default async function CrearCentroPage() {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("admin.centros");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("crearCentroTitle")}</h1>
        <p className="text-muted-foreground mt-1">{t("crearCentroSubtitle")}</p>
      </div>
      <CrearCentroForm />
    </div>
  );
}
