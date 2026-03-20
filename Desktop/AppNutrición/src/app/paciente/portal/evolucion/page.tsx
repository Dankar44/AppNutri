import { redirect } from "next/navigation";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { EvolucionChart } from "@/components/evolucion-chart";

export default async function PatientEvolucionPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const medidas = await prisma.medidaAntropometrica.findMany({
    where: { pacienteId: session.pacienteId },
    orderBy: { fecha: "asc" },
    select: { fecha: true, peso: true, imc: true, grasaCorporal: true },
  });

  const data = medidas.map((m) => ({
    fecha: new Date(m.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    peso: m.peso,
    imc: m.imc,
    grasa: m.grasaCorporal,
  }));

  const hasPeso = data.some((d) => d.peso !== null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mi evolución</h1>

      {data.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">
            Tu dietista aún no ha registrado medidas
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {hasPeso && (
            <section className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Peso e IMC</h2>
              <EvolucionChart
                data={data}
                lines={[
                  { key: "peso", label: "Peso (kg)", color: "#3b82f6" },
                  { key: "imc", label: "IMC", color: "#f59e0b" },
                ]}
              />
            </section>
          )}
          {data.some((d) => d.grasa !== null) && (
            <section className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">% Grasa corporal</h2>
              <EvolucionChart
                data={data}
                lines={[{ key: "grasa", label: "% Grasa", color: "#ef4444" }]}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
