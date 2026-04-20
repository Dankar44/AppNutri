"use client";

import {
  Trophy,
  Flame,
  Sparkles,
  Target,
  Check,
  Lock,
  TrendingDown,
  Heart,
  Calendar,
  type LucideIcon,
} from "lucide-react";

interface Medicion {
  fechaISO: string;
  peso: number | null;
  imc: number | null;
  grasa: number | null;
}

interface Props {
  data: Medicion[];
}

interface Hito {
  id: string;
  titulo: string;
  descripcion: string;
  Icon: LucideIcon;
  color: string;
  conseguido: boolean;
  fechaConseguido?: string;
  progreso?: { actual: number; objetivo: number; unit: string };
}

function formatFechaCorta(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function calcularHitos(data: Medicion[]): Hito[] {
  const pesos = data.filter((m) => m.peso !== null) as (Medicion & { peso: number })[];
  const imcs = data.filter((m) => m.imc !== null) as (Medicion & { imc: number })[];
  const hitos: Hito[] = [];

  // Primera medición
  if (data.length > 0) {
    hitos.push({
      id: "primera",
      titulo: "Primer paso",
      descripcion: "Tu primera medición registrada",
      Icon: Sparkles,
      color: "#8b5cf6",
      conseguido: true,
      fechaConseguido: data[0].fechaISO,
    });
  } else {
    hitos.push({
      id: "primera",
      titulo: "Primer paso",
      descripcion: "Tu primera medición",
      Icon: Sparkles,
      color: "#8b5cf6",
      conseguido: false,
    });
  }

  // Pérdida de peso: -1 kg, -5 kg, -10 kg
  if (pesos.length >= 2) {
    const pesoInicial = pesos[0].peso;
    const umbrales = [
      { id: "kg1", kg: 1, titulo: "Primer kilo", Icon: TrendingDown, color: "#10b981" },
      { id: "kg5", kg: 5, titulo: "5 kilos menos", Icon: Trophy, color: "#f59e0b" },
      { id: "kg10", kg: 10, titulo: "10 kilos menos", Icon: Trophy, color: "#ef4444" },
    ];
    for (const u of umbrales) {
      const punto = pesos.find((m) => pesoInicial - m.peso >= u.kg);
      const actualDiff = Math.max(0, pesoInicial - pesos[pesos.length - 1].peso);
      hitos.push({
        id: u.id,
        titulo: u.titulo,
        descripcion: `Bajar ${u.kg} kg desde tu peso inicial`,
        Icon: u.Icon,
        color: u.color,
        conseguido: !!punto,
        fechaConseguido: punto?.fechaISO,
        progreso: punto
          ? undefined
          : { actual: actualDiff, objetivo: u.kg, unit: "kg" },
      });
    }
  } else {
    hitos.push({
      id: "kg1",
      titulo: "Primer kilo",
      descripcion: "Bajar 1 kg desde tu peso inicial",
      Icon: TrendingDown,
      color: "#10b981",
      conseguido: false,
    });
  }

  // IMC saludable (< 25)
  if (imcs.length >= 1) {
    const imcInicial = imcs[0].imc;
    const saludable = imcs.find((m) => m.imc < 25);
    if (imcInicial >= 25) {
      hitos.push({
        id: "imc_sano",
        titulo: "IMC saludable",
        descripcion: "Alcanzar un IMC por debajo de 25",
        Icon: Heart,
        color: "#ec4899",
        conseguido: !!saludable,
        fechaConseguido: saludable?.fechaISO,
      });
    } else {
      hitos.push({
        id: "imc_mantener",
        titulo: "IMC saludable",
        descripcion: "Mantente en tu IMC saludable",
        Icon: Heart,
        color: "#ec4899",
        conseguido: true,
        fechaConseguido: imcs[0].fechaISO,
      });
    }
  }

  // Constancia: 5 y 10 mediciones
  hitos.push({
    id: "med5",
    titulo: "Constancia",
    descripcion: "Registrar 5 mediciones",
    Icon: Calendar,
    color: "#0ea5e9",
    conseguido: data.length >= 5,
    fechaConseguido: data.length >= 5 ? data[4].fechaISO : undefined,
    progreso:
      data.length >= 5 ? undefined : { actual: data.length, objetivo: 5, unit: "mediciones" },
  });

  // Racha descendente (3 mediciones seguidas bajando peso)
  if (pesos.length >= 3) {
    let maxRacha = 1;
    let rachaActual = 1;
    let fechaRacha: string | undefined;
    for (let i = 1; i < pesos.length; i++) {
      if (pesos[i].peso < pesos[i - 1].peso) {
        rachaActual++;
        if (rachaActual > maxRacha) {
          maxRacha = rachaActual;
          fechaRacha = pesos[i].fechaISO;
        }
      } else {
        rachaActual = 1;
      }
    }
    hitos.push({
      id: "racha",
      titulo: "En racha",
      descripcion: "3 mediciones consecutivas bajando",
      Icon: Flame,
      color: "#f97316",
      conseguido: maxRacha >= 3,
      fechaConseguido: fechaRacha,
      progreso:
        maxRacha >= 3 ? undefined : { actual: maxRacha, objetivo: 3, unit: "seguidas" },
    });
  }

  // Ordenar: conseguidos primero, luego los más cercanos
  return hitos.sort((a, b) => {
    if (a.conseguido !== b.conseguido) return a.conseguido ? -1 : 1;
    return 0;
  });
}

export function HitosCard({ data }: Props) {
  const hitos = calcularHitos(data);
  const conseguidos = hitos.filter((h) => h.conseguido).length;

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 p-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground shrink-0">
            <Trophy className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold">Hitos</h2>
            <p className="text-[11px] text-muted-foreground">
              Logros conseguidos durante tu seguimiento
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold leading-none tabular-nums">
            {conseguidos}
            <span className="text-sm font-medium text-muted-foreground">
              /{hitos.length}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
            desbloqueados
          </p>
        </div>
      </header>

      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
          {hitos.map((h) => (
            <HitoItem key={h.id} hito={h} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HitoItem({ hito }: { hito: Hito }) {
  const { Icon, color, titulo, descripcion, conseguido, fechaConseguido, progreso } = hito;

  return (
    <div
      className={`relative flex flex-col items-center text-center rounded-xl border p-3 transition-all ${
        conseguido
          ? "border-border bg-card hover:shadow-sm"
          : "border-dashed border-border bg-muted/30"
      }`}
    >
      <span
        className={`relative inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-2 transition-all ${
          conseguido ? "" : "opacity-40"
        }`}
        style={
          conseguido
            ? { backgroundColor: `${color}15`, color }
            : { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
        }
      >
        <Icon className="w-5 h-5" strokeWidth={1.75} />
        {conseguido ? (
          <span
            className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white border-2 border-card"
            aria-label="Conseguido"
          >
            <Check className="w-2.5 h-2.5" strokeWidth={3} />
          </span>
        ) : (
          <span
            className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground border-2 border-card"
            aria-label="Bloqueado"
          >
            <Lock className="w-2.5 h-2.5" />
          </span>
        )}
      </span>

      <h3
        className={`text-xs font-semibold leading-tight mb-0.5 ${
          conseguido ? "" : "text-muted-foreground"
        }`}
      >
        {titulo}
      </h3>
      <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
        {descripcion}
      </p>

      {conseguido && fechaConseguido ? (
        <p className="text-[10px] text-muted-foreground/80 mt-1 tabular-nums">
          {formatFechaCorta(fechaConseguido)}
        </p>
      ) : progreso ? (
        <div className="mt-1.5 w-full">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(100, (progreso.actual / progreso.objetivo) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
            {progreso.actual.toFixed(progreso.unit === "kg" ? 1 : 0)}/{progreso.objetivo}{" "}
            {progreso.unit}
          </p>
        </div>
      ) : null}
    </div>
  );
}

// Keep Target imported for potential future use without warning
void Target;
