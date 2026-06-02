import { Briefcase } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { CopyPhone } from "./copy-phone";

const LABELS = {
  numPacientes: { "0-2": "0–2", "2-5": "2–5", "5-15": "5–15", "15-30": "15–30", "30+": "+30" } as Record<string, string>,
  modalidad: { presencial: "Presencial", online: "Online", ambas: "Ambas", sin_consulta: "Sin consulta" } as Record<string, string>,
  tipoTrabajo: { autonomo: "Autónomo", clinica: "Clínica/centro" } as Record<string, string>,
  nivelEstudios: { estudiante: "Estudiante", fp: "FP / Grado sup.", grado: "Grado", master: "Máster", doctorado: "Doctorado" } as Record<string, string>,
  discapacidad: { si: "Sí", no: "No", prefiero_no_decir: "Prefiere no decir" } as Record<string, string>,
};

function l(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}

export default async function OfertasPage() {
  const solicitudes = await prisma.solicitudColaborador.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-primary dark:bg-green-500/10">
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ofertas</h1>
          <p className="text-muted-foreground mt-0.5">
            Candidaturas recibidas desde el programa de colaboradores ({solicitudes.length})
          </p>
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Todavía no hay candidaturas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Pacientes</th>
                <th className="px-4 py-3 font-medium">Modalidad</th>
                <th className="px-4 py-3 font-medium">Trabajo</th>
                <th className="px-4 py-3 font-medium">Estudios</th>
                <th className="px-4 py-3 font-medium">Profesor/a</th>
                <th className="px-4 py-3 font-medium">Discapacidad</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{`${s.nombre ?? ""} ${s.apellidos ?? ""}`.trim() || "—"}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3"><CopyPhone phone={s.telefono} /></td>
                  <td className="px-4 py-3">{s.pais}</td>
                  <td className="px-4 py-3">{l(LABELS.numPacientes, s.numPacientes)}</td>
                  <td className="px-4 py-3">{l(LABELS.modalidad, s.modalidad)}</td>
                  <td className="px-4 py-3">{l(LABELS.tipoTrabajo, s.tipoTrabajo)}</td>
                  <td className="px-4 py-3">{l(LABELS.nivelEstudios, s.nivelEstudios)}</td>
                  <td className="px-4 py-3">{s.esProfesor ? "Sí" : "No"}</td>
                  <td className="px-4 py-3">{l(LABELS.discapacidad, s.discapacidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
