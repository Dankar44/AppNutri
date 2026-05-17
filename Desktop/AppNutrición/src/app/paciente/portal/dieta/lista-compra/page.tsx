import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { generarListaCompra } from "@/lib/shopping-list";
import { ShoppingList } from "@/components/paciente/shopping-list";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";

export default async function PatientShoppingListPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");
  const t = await getTranslations("patient-portal");

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
                  alimento: { select: { id: true, nombre: true, categoria: true, porcion: true, unidad: true, enlaceProducto: true, imagenUrl: true } },
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
        <PageHeader icon={ShoppingCart} title={t("listaCompra.title")} />
        <div className="lg:rounded-xl lg:border lg:border-border sm:bg-muted/30 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold mb-1">{t("listaCompra.sinPlan.title")}</h2>
          <p className="text-muted-foreground">
            {t("listaCompra.sinPlan.description")}
          </p>
        </div>
      </div>
    );
  }

  const categorias = generarListaCompra(plan.dias as Parameters<typeof generarListaCompra>[0]);

  return (
    <div>
      <PageHeader icon={ShoppingCart} title={t("listaCompra.title")} />
      <ShoppingList
        planId={plan.id}
        planNombre={plan.nombre}
        categoriasIniciales={categorias}
      />
    </div>
  );
}
