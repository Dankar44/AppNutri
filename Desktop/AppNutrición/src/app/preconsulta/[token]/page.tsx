import { getTranslations } from "next-intl/server";
import { getPreconsultaContextPorToken } from "@/app/actions/preconsulta";
import { PreconsultaForm } from "@/components/paciente/preconsulta-form";

export const dynamic = "force-dynamic";

export default async function PreconsultaPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const context = await getPreconsultaContextPorToken(token);

  if (!context) {
    const t = await getTranslations("patients.preconsulta");
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/30 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold mb-2">{t("enlaceInvalido")}</h1>
          <p className="text-muted-foreground">{t("enlaceInvalidoTexto")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      <PreconsultaForm context={context} modo="token" token={token} />
    </div>
  );
}
