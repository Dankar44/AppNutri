import { redirect } from "next/navigation";
import { FileDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { capitalizarNombre } from "@/lib/utils";
import { ExportarPDFPaciente } from "./exportar-form";
import { PageHeader } from "@/components/page-header";
import { getTheme } from "@/lib/pdf/pdf-themes";
import { extraerOtrasRecomendaciones } from "@/lib/recomendaciones";

export default async function ExportarPDFPage() {
  const t = await getTranslations("patient-portal.exportarPdf");
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: {
      nombre: true,
      apellidos: true,
      ocultarCalorias: true,
      dietista: { select: { nombre: true, apellidos: true, marcaPdf: true, pdfLogoUrl: true, temaPdf: true, colorPrimarioPdf: true, clinica: true } },
    },
  });
  if (!paciente) redirect("/paciente/login");

  // Plan activo con todo el detalle
  const plan = await prisma.planAlimenticio.findFirst({
    where: { pacienteId: session.pacienteId, activo: true },
    orderBy: { createdAt: "desc" },
    include: {
      dias: {
        orderBy: { dia: "asc" },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: {
              alimentos: {
                orderBy: { orden: "asc" },
                include: {
                  alimento: true,
                  receta: { include: { ingredientes: { include: { alimento: { select: { id: true, nombre: true, categoria: true, porcion: true, enlaceProducto: true, imagenUrl: true } } } } } },
                  alternativas: {
                    orderBy: { orden: "asc" },
                    include: {
                      alimento: { select: { nombre: true } },
                      receta: { select: { nombre: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Recomendaciones y horario via raw SQL
  let recomendaciones = "";
  let horario: unknown[] = [];
  try {
    const rows = await prisma.$queryRawUnsafe<{ recomendaciones: string | null; horario: unknown }[]>(
      `SELECT recomendaciones, horario FROM pacientes WHERE id = $1`,
      session.pacienteId
    );
    // El campo puede ser JSON estructurado; extraer solo el texto limpio (igual que el PDF del nutricionista).
    recomendaciones = extraerOtrasRecomendaciones(rows[0]?.recomendaciones);
    const raw = rows[0]?.horario;
    horario = Array.isArray(raw) ? raw : [];
  } catch { /* ignore */ }

  const pacienteNombre = `${capitalizarNombre(paciente.nombre)} ${capitalizarNombre(paciente.apellidos)}`;
  const dietistaNombre = paciente.dietista
    ? `${capitalizarNombre(paciente.dietista.nombre)} ${capitalizarNombre(paciente.dietista.apellidos)}`
    : "Annonia";

  const tema = paciente.dietista ? getTheme(paciente.dietista.temaPdf, paciente.dietista.colorPrimarioPdf) : undefined;
  const brandName = paciente.dietista?.marcaPdf || undefined;
  const logoDataUrl = paciente.dietista?.pdfLogoUrl || undefined;
  const clinica = paciente.dietista?.clinica || undefined;

  return (
    <div>
      <PageHeader
        icon={FileDown}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {!plan ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">{t("sinPlan.title")}</h3>
          <p className="text-muted-foreground">{t("sinPlan.description")}</p>
        </div>
      ) : (
        <ExportarPDFPaciente
          plan={JSON.parse(JSON.stringify(plan))}
          pacienteNombre={pacienteNombre}
          dietistaNombre={dietistaNombre}
          recomendaciones={recomendaciones}
          horario={JSON.parse(JSON.stringify(horario))}
          tema={tema ? JSON.parse(JSON.stringify(tema)) : undefined}
          brandName={brandName}
          logoDataUrl={logoDataUrl}
          clinica={clinica}
          ocultarCalorias={paciente.ocultarCalorias}
        />
      )}
    </div>
  );
}
