"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

/** Los filtros van en la dirección: así un enlace a «los de la URJC sin estrenar» se puede pegar. */
export function FiltroProfesores({
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
  const router = useRouter();
  const params = useSearchParams();

  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(params.toString());
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    router.push(`/admin/profesores?${nuevos.toString()}`);
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
      <select value={licencia} onChange={(e) => cambiar("licencia", e.target.value)} className={campo}>
        <option value="">Todas las universidades</option>
        {instituciones.map((i) => (
          <option key={i.id} value={i.id}>{i.nombre}</option>
        ))}
      </select>

      <select value={estado} onChange={(e) => cambiar("estado", e.target.value)} className={campo}>
        <option value="">Todos</option>
        <option value="sinUniversidad">Sin universidad</option>
        <option value="sinEstrenar">No han entrado nunca</option>
      </select>

      <div className="relative flex-1 min-w-[12rem]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          name="buscar"
          defaultValue={buscar}
          placeholder="Buscar por nombre o correo…"
          className={`${campo} w-full pl-9`}
        />
      </div>
    </form>
  );
}
