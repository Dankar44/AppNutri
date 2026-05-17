"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { crearMedidaRapida } from "@/app/actions/medidas";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Props {
  pacienteId: string;
}

export function MedidasRapidas({ pacienteId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [grasa, setGrasa] = useState("");
  const t = useTranslations("patients.medidasRapidas");

  const pesoNum = parseFloat(peso);
  const alturaNum = parseFloat(altura);
  const imcCalc = pesoNum > 0 && alturaNum > 0
    ? (pesoNum / ((alturaNum / 100) ** 2)).toFixed(1)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!peso && !altura && !grasa) {
      toast.error(t("introduceAlMenosUnValor"));
      return;
    }
    setLoading(true);
    try {
      await crearMedidaRapida(pacienteId, {
        peso: pesoNum || undefined,
        altura: alturaNum || undefined,
        grasaCorporal: parseFloat(grasa) || undefined,
      });
      toast.success(t("medidaRegistrada"));
      setPeso("");
      setAltura("");
      setGrasa("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error(t("errorRegistrar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {open ? t("cerrar") : t("registroRapido")}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground">{t("pesoKg")}</label>
              <input
                type="number" inputMode="decimal"
                step="0.1"
                min="1"
                max="500"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="70.5"
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">{t("alturaCm")}</label>
              <input
                type="number" inputMode="decimal"
                step="0.1"
                min="30"
                max="300"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                placeholder="170"
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">{t("grasaCorporal")}</label>
            <input
              type="number" inputMode="decimal"
              step="0.1"
              min="0"
              max="80"
              value={grasa}
              onChange={(e) => setGrasa(e.target.value)}
              placeholder="18.5"
              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          {imcCalc && (
            <p className="text-xs text-muted-foreground">IMC: <span className="font-semibold text-foreground">{imcCalc}</span></p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {t("registrarMedida")}
          </button>
        </form>
      )}
    </div>
  );
}
