import { redirect } from "next/navigation";
import { getOrCrearConversacion } from "@/app/actions/mensajes";

export default async function AbrirConversacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const conv = await getOrCrearConversacion(id);
    redirect(`/mensajes?c=${conv.id}`);
  } catch {
    redirect(`/pacientes/${id}`);
  }
}
