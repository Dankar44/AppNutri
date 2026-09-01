"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

/** Los filtros van en la dirección: así un enlace a "los de la URJC retirados" se puede pegar. */
export function FiltroAlumnos({
  instituciones,
  licencia,
  estado,
  buscar,
}: {
  instituciones: { id: string; nombre: string }[];
  licencia: string;
  estado: string;
  buscar: string;
}) {
  const t = useTranslations("admin.alumnos");
  const router = useRouter();
  const params = useSearchParams();

  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(params.toString());
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    router.push(`/admin/alumnos?${nuevos.toString()}`);
  }

  const campo =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        cambiar("buscar", (new FormData(e.currentTarget).get("buscar") as string) ?? "");
      }}
      className="flex flex-wrap gap-2 mb-4"
    >
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          name="buscar"
          defaultValue={buscar}
          placeholder={t("buscarPlaceholder")}
          className={`${campo} w-full pl-9`}
        />
      </div>
      <select value={licencia} onChange={(e) => cambiar("licencia", e.target.value)} className={campo}>
        <option value="">{t("todasInstituciones")}</option>
        {instituciones.map((i) => (
          <option key={i.id} value={i.id}>{i.nombre}</option>
        ))}
      </select>
      <select value={estado} onChange={(e) => cambiar("estado", e.target.value)} className={campo}>
        <option value="">{t("todosEstados")}</option>
        <option value="activos">{t("estado.activo")}</option>
        <option value="retirados">{t("estado.retirado")}</option>
      </select>
    </form>
  );
}
