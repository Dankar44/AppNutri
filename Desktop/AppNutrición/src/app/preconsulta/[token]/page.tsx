import { getTranslations } from "next-intl/server";
import { getPreconsultaContextPorToken } from "@/app/actions/preconsulta";
import { PreconsultaForm } from "@/components/paciente/preconsulta-form";

export const dynamic = "force-dynamic";

export default async function PreconsultaPublicaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const incRaw = typeof sp.inc === "string" ? sp.inc : Array.isArray(sp.inc) ? sp.inc.join(",") : "";
  const inc = incRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const incluyeHorario = inc.includes("horario");
  const incluyeAnamnesis = inc.length === 0 ? true : inc.includes("anamnesis");
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
      <PreconsultaForm
        context={context}
        modo="token"
        token={token}
        incluyeAnamnesis={incluyeAnamnesis}
        incluyeHorario={incluyeHorario}
      />
    </div>
  );
}
