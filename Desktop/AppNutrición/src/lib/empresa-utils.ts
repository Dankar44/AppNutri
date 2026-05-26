import { prisma } from "@/lib/prisma";

export function generarSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function getCompanyMemberIds(
  dietistaId: string,
  empresaId: string | null,
): Promise<string[]> {
  if (!empresaId) return [dietistaId];
  const members = await prisma.dietista.findMany({
    where: { empresaId },
    select: { id: true },
  });
  return members.map((m) => m.id);
}
