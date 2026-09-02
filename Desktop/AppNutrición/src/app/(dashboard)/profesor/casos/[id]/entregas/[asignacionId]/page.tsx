import { redirect } from "next/navigation";

/**
 * Antes aquí había una pantalla aparte con las entregas de una clase. Confundía (parecía la página
 * de la clase, con un "cambiar la fecha límite" que no se sabía a quién afectaba), así que ahora
 * todo eso está en la ficha del caso, clase por clase. Los enlaces antiguos siguen funcionando.
 */
export default async function EntregasPage({
  params,
}: {
  params: Promise<{ id: string; asignacionId: string }>;
}) {
  const { id, asignacionId } = await params;
  redirect(`/profesor/casos/${id}?clase=${asignacionId}#clase-${asignacionId}`);
}
