import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { generarListaCompra } from "@/lib/shopping-list";
import { ShoppingList } from "@/components/paciente/shopping-list";
import { PageHeader } from "@/components/page-header";

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
                include: {
                  alimento: { select: { id: true, nombre: true, categoria: true, porcion: true } },
                  receta: { select: { id: true, nombre: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return (
      <div>
        <PageHeader icon={ShoppingCart} title="Lista de la compra" />
        <div className="rounded-xl border border-border bg-muted/30 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold mb-1">Sin plan activo</h2>
          <p className="text-muted-foreground">
            Tu nutricionista aún no te ha asignado un plan alimenticio.
          </p>
        </div>
      </div>
    );
  }

  const categorias = generarListaCompra(plan.dias as Parameters<typeof generarListaCompra>[0]);

  return (
    <div>
      <PageHeader icon={ShoppingCart} title="Lista de la compra" />
      <ShoppingList
        planId={plan.id}
        planNombre={plan.nombre}
        categoriasIniciales={categorias}
      />
    </div>
  );
}
