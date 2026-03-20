"use client";

interface MacroResumenProps {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra?: number;
  label?: string;
}

export function MacroResumen({
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  fibra,
  label,
}: MacroResumenProps) {
  const totalMacros = proteinas + carbohidratos + grasas;
  const protPct = totalMacros > 0 ? (proteinas / totalMacros) * 100 : 0;
  const carbPct = totalMacros > 0 ? (carbohidratos / totalMacros) * 100 : 0;
  const grasPct = totalMacros > 0 ? (grasas / totalMacros) * 100 : 0;

  return (
    <div className="space-y-3">
      {label && <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>}
      <div className="text-center">
        <p className="text-2xl font-bold text-amber-600">{Math.round(calorias)}</p>
        <p className="text-xs text-muted-foreground">kcal</p>
      </div>
      <div className="space-y-2">
        <MacroBarH label="Proteínas" value={proteinas} pct={protPct} color="bg-blue-500" />
        <MacroBarH label="Carbohidratos" value={carbohidratos} pct={carbPct} color="bg-green-500" />
        <MacroBarH label="Grasas" value={grasas} pct={grasPct} color="bg-red-500" />
        {fibra !== undefined && fibra > 0 && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground">Fibra</span>
            <span className="font-medium">{Math.round(fibra * 10) / 10}g</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MacroBarH({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {Math.round(value * 10) / 10}g ({Math.round(pct)}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
