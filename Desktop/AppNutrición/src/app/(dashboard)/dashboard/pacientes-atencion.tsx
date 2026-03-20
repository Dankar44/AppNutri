import Link from "next/link";
import { AlertTriangle, Ruler, UtensilsCrossed } from "lucide-react";

interface PacienteAlerta {
  id: string;
  nombre: string;
}

interface Props {
  sinConsulta: PacienteAlerta[];
  sinMedidas: PacienteAlerta[];
  planesAntiguos: PacienteAlerta[];
}

export function PacientesAtencion({ sinConsulta, sinMedidas, planesAntiguos }: Props) {
  const total = sinConsulta.length + sinMedidas.length + planesAntiguos.length;
  if (total === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Todos tus pacientes están al día
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {sinConsulta.map((p) => (
        <Link key={`c-${p.id}`} href={`/pacientes/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{p.nombre}</p>
            <p className="text-xs text-muted-foreground">Sin consulta en +30 días</p>
          </div>
        </Link>
      ))}
      {sinMedidas.map((p) => (
        <Link key={`m-${p.id}`} href={`/pacientes/${p.id}/medidas`} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
          <Ruler className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{p.nombre}</p>
            <p className="text-xs text-muted-foreground">Sin medidas en +30 días</p>
          </div>
        </Link>
      ))}
      {planesAntiguos.map((p) => (
        <Link key={`p-${p.id}`} href={`/pacientes/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
          <UtensilsCrossed className="w-4 h-4 text-orange-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{p.nombre}</p>
            <p className="text-xs text-muted-foreground">Plan sin actualizar en +30 días</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
