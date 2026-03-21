import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { generarListaCompra } from "@/lib/shopping-list";
import { ShoppingList } from "@/components/paciente/shopping-list";

export default async function PatientShoppingListPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const plan = await prisma.planAlimenticio.findFirst({
    where: { pacienteId: session.pacienteId, activo: true },
    orderBy: { createdAt: "desc" },
    include: {
      dias: {
        include: {
          comidas: {
            include: {
              alimentos: {
                include: { alimento: { select: { id: true, nombre: true, categoria: true, porcion: true } }, receta: { select: { id: true, nombre: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return <p className="text-center py-12 text-muted-foreground">Sin plan activo</p>;
  }

  const categorias = generarListaCompra(plan.dias as Parameters<typeof generarListaCompra>[0]);

  return (
    <div>
      <Link
        href="/paciente/portal/dieta"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mi dieta
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Lista de la compra</h1>
      <ShoppingList categorias={categorias} />
    </div>
  );
}
