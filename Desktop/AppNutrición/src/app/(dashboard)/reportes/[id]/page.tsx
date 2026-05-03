import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPaciente } from "@/app/actions/pacientes";
import { getPlanesPaciente, getPlan } from "@/app/actions/planes";
import { getMedidasEvolucion } from "@/app/actions/medidas";
import { getConsultas } from "@/app/actions/consultas";
import { formatDate } from "@/lib/utils";
import { GenerarPDFButtons } from "./generar-pdf";
import { getCurrentDietista } from "@/app/actions/auth";
import { getTheme } from "@/lib/pdf/pdf-themes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReportesPacientePage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

  const [planes, medidas, consultas, dietista] = await Promise.all([
    getPlanesPaciente(id),
    getMedidasEvolucion(id),
    getConsultas(id),
    getCurrentDietista(),
  ]);

  const tema = dietista ? getTheme(dietista.temaPdf, dietista.colorPrimarioPdf) : undefined;
  const reportBranding = dietista ? { brandName: dietista.marcaPdf || undefined, linkColor: tema?.linkColor } : undefined;

  const ultimaMedida = medidas.length > 0 ? medidas[medidas.length - 1] : null;
  const primeraMedida = medidas.length > 0 ? medidas[0] : null;

  const cambiosPeso =
    primeraMedida?.peso && ultimaMedida?.peso
      ? Math.round((ultimaMedida.peso - primeraMedida.peso) * 10) / 10
      : null;

  // Obtener plan activo con datos completos para PDF de dieta
  const planActivo = planes.length > 0 ? await getPlan(planes[0].id) : null;
  const dietaData = planActivo
    ? {
        nombre: planActivo.nombre,
        dias: planActivo.dias.map((d) => ({
          dia: d.dia,
          comidas: d.comidas.map((c) => ({
            tipo: c.tipo,
            alimentos: c.alimentos.map((a) => ({
              nombre: a.alimento?.nombre || a.receta?.nombre || "Sin nombre",
              cantidad: a.cantidad,
              enlaceProducto: a.alimento?.enlaceProducto ?? null,
            })),
          })),
        })),
      }
    : null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/reportes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a reportes
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Informes de {paciente.nombre} {paciente.apellidos}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Planes</p>
          <p className="text-2xl sm:text-3xl font-bold">{planes.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Consultas</p>
          <p className="text-2xl sm:text-3xl font-bold">{consultas.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Evolución peso</p>
          <p className="text-2xl sm:text-3xl font-bold">
            {cambiosPeso !== null ? (
              <span className={cambiosPeso < 0 ? "text-green-600 dark:text-green-400" : cambiosPeso > 0 ? "text-red-600 dark:text-red-400" : ""}>
                {cambiosPeso > 0 ? "+" : ""}{cambiosPeso} kg
              </span>
            ) : (
              "-"
            )}
          </p>
        </div>
      </div>

      <section className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Generar informes PDF</h2>
        <GenerarPDFButtons
          branding={reportBranding}
          paciente={{
            nombre: paciente.nombre,
            apellidos: paciente.apellidos,
            email: paciente.email,
            telefono: paciente.telefono,
            peso: paciente.peso,
            altura: paciente.altura,
            objetivo: paciente.objetivo,
          }}
          medidas={medidas.map((m) => ({
            fecha: new Date(m.fecha).toLocaleDateString("es-ES"),
            peso: m.peso,
            imc: m.imc,
            grasa: m.grasaCorporal,
          }))}
          consultas={consultas.map((c) => ({
            fecha: new Date(c.fecha).toLocaleDateString("es-ES"),
            motivo: c.motivo,
            notas: c.notas,
          }))}
          dieta={dietaData}
        />
      </section>

      {consultas.length > 0 && (
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Últimas consultas
          </h2>
          <div className="space-y-3">
            {consultas.slice(0, 5).map((c) => (
              <div key={c.id} className="p-3 rounded-lg border border-border">
                <p className="text-sm font-medium">{formatDate(c.fecha)}</p>
                {c.motivo && <p className="text-xs text-muted-foreground">{c.motivo}</p>}
                {c.notas && <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{c.notas}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
