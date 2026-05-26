"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Search, Loader2, UserPlus, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { crearCentroAdmin, buscarDietistasParaCentro } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

interface DietistaOption {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
}

export function CrearCentroForm() {
  const t = useTranslations("admin.centros");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modoLider, setModoLider] = useState<"existente" | "nuevo">("existente");
  const [showPassword, setShowPassword] = useState(false);

  const [centroNombre, setCentroNombre] = useState("");
  const [centroDescripcion, setCentroDescripcion] = useState("");
  const [maxMiembros, setMaxMiembros] = useState(5);

  const [busquedaLider, setBusquedaLider] = useState("");
  const [resultados, setResultados] = useState<DietistaOption[]>([]);
  const [selectedLider, setSelectedLider] = useState<DietistaOption | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [liderNombre, setLiderNombre] = useState("");
  const [liderApellidos, setLiderApellidos] = useState("");
  const [liderEmail, setLiderEmail] = useState("");
  const [liderPassword, setLiderPassword] = useState("");

  async function handleBuscar(query: string) {
    setBusquedaLider(query);
    if (query.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const results = await buscarDietistasParaCentro(query);
      setResultados(results);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearCentroAdmin({
        centroNombre,
        centroDescripcion: centroDescripcion || undefined,
        maxMiembros,
        modoLider,
        liderDietistaId: selectedLider?.id,
        liderNombre: modoLider === "nuevo" ? liderNombre : undefined,
        liderApellidos: modoLider === "nuevo" ? liderApellidos : undefined,
        liderEmail: modoLider === "nuevo" ? liderEmail : undefined,
        liderPassword: modoLider === "nuevo" ? liderPassword : undefined,
      });

      if (result.ok) {
        toast.success(t("toastCentroCreado"));
        router.push(`/admin/centros/${result.centroId}`);
      } else {
        toast.error(result.error || t("toastErrorCrear"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t("datosCentro")}
        </h2>

        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("form.nombre")}</label>
          <input
            type="text"
            value={centroNombre}
            onChange={(e) => setCentroNombre(e.target.value)}
            required
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("form.descripcion")}</label>
          <textarea
            value={centroDescripcion}
            onChange={(e) => setCentroDescripcion(e.target.value)}
            maxLength={500}
            rows={2}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("form.maxMiembros")}</label>
          <input
            type="number"
            value={maxMiembros}
            onChange={(e) => setMaxMiembros(Math.max(1, Math.min(100, Number(e.target.value))))}
            min={1}
            max={100}
            className="mt-1 w-32 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">{t("liderCentro")}</h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModoLider("existente")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              modoLider === "existente"
                ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="w-4 h-4" />
            {t("form.liderExistente")}
          </button>
          <button
            type="button"
            onClick={() => setModoLider("nuevo")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              modoLider === "nuevo"
                ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus className="w-4 h-4" />
            {t("form.liderNuevo")}
          </button>
        </div>

        {modoLider === "existente" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={busquedaLider}
                onChange={(e) => handleBuscar(e.target.value)}
                placeholder={t("form.buscarLider")}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            {resultados.length > 0 && !selectedLider && (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border max-h-48 overflow-y-auto">
                {resultados.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedLider(d);
                      setBusquedaLider("");
                      setResultados([]);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium">{d.nombre} {d.apellidos}</span>
                    <span className="text-xs text-muted-foreground ml-2">{d.email}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedLider && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{selectedLider.nombre} {selectedLider.apellidos}</p>
                  <p className="text-xs text-muted-foreground">{selectedLider.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLider(null)}
                  className="text-xs text-indigo-600 hover:underline shrink-0"
                >
                  {t("form.cambiar")}
                </button>
              </div>
            )}
          </div>
        )}

        {modoLider === "nuevo" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("form.liderNombreLabel")}</label>
                <input
                  type="text"
                  value={liderNombre}
                  onChange={(e) => setLiderNombre(e.target.value)}
                  required={modoLider === "nuevo"}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("form.liderApellidosLabel")}</label>
                <input
                  type="text"
                  value={liderApellidos}
                  onChange={(e) => setLiderApellidos(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("form.liderEmailLabel")}</label>
              <input
                type="email"
                value={liderEmail}
                onChange={(e) => setLiderEmail(e.target.value)}
                required={modoLider === "nuevo"}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("form.liderPasswordLabel")}</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={liderPassword}
                  onChange={(e) => setLiderPassword(e.target.value)}
                  minLength={6}
                  required={modoLider === "nuevo"}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={isPending || (modoLider === "existente" && !selectedLider)}
        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
        {t("form.submit")}
      </button>
    </form>
  );
}
