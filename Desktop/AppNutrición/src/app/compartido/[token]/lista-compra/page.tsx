import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import { getPlanPorToken } from "@/app/actions/compartir";
import { generarListaCompra } from "@/lib/shopping-list";
import { ShoppingList } from "@/components/paciente/shopping-list";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedShoppingListPage({ params }: Props) {
  const { token } = await params;
  const plan = await getPlanPorToken(token);
  if (!plan) notFound();

  const categorias = generarListaCompra(plan.dias as Parameters<typeof generarListaCompra>[0]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="font-bold">Annonia</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <Link
          href={`/compartido/${token}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al plan
        </Link>
        <ShoppingList
          planId={plan.id}
          planNombre={plan.nombre}
          categoriasIniciales={categorias}
        />
      </main>
    </div>
  );
}
