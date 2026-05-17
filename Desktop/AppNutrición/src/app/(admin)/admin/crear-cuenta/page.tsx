import { CrearCuentaForm } from "./crear-cuenta-form";
import { getTranslations } from "next-intl/server";

export default async function CrearCuentaPage() {
  const t = await getTranslations("admin.crearCuenta");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>
      <CrearCuentaForm />
    </div>
  );
}
