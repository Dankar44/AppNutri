"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getPlan, actualizarPlan } from "@/app/actions/planes";
import { useUncontrolledFormPersist } from "@/lib/form-persist";
import { withTimeout } from "@/lib/utils";

export default function EditarPlanPage() {
  const t = useTranslations("diets");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const tc = useTranslations("common.deploy");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { wasRestored, clear: clearDraft } = useUncontrolledFormPersist(
    `plan-editar-${id}`,
    formRef,
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);

  const [plan, setPlan] = useState<{
    nombre: string;
    caloriasObjetivo: number | null;
    proteinasObjetivo: number | null;
    carbohidratosObjetivo: number | null;
    grasasObjetivo: number | null;
  } | null>(null);

  useEffect(() => {
    getPlan(id).then((p) => {
      if (p) {
        setPlan({
          nombre: p.nombre,
          caloriasObjetivo: p.caloriasObjetivo,
          proteinasObjetivo: p.proteinasObjetivo,
          carbohidratosObjetivo: p.carbohidratosObjetivo,
          grasasObjetivo: p.grasasObjetivo,
        });
      }
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      await withTimeout(actualizarPlan(id, {
        nombre: form.get("nombre") as string,
        caloriasObjetivo: parseFloat(form.get("caloriasObjetivo") as string) || undefined,
        proteinasObjetivo: parseFloat(form.get("proteinasObjetivo") as string) || undefined,
        carbohidratosObjetivo: parseFloat(form.get("carbohidratosObjetivo") as string) || undefined,
        grasasObjetivo: parseFloat(form.get("grasasObjetivo") as string) || undefined,
      }));
      clearDraft();
      toast.success(t("editar.toastUpdated"));
      router.push(`/dietas/${id}`);
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("editar.toastUpdateError"));
      setLoading(false);
    }
  }

  if (!plan) return <p className="text-muted-foreground">{t("editar.loading")}</p>;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dietas/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("editar.backToPlan")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("editar.pageTitle")}</h1>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <section className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("editar.nameLabel")}</label>
            <input
              name="nombre"
              required
              maxLength={200}
              defaultValue={plan.nombre}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
        </section>

        <section className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("editar.macroGoals")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("editar.calories")}</label>
              <input
                name="caloriasObjetivo"
                type="number"
                min={0}
                max={20000}
                defaultValue={plan.caloriasObjetivo ?? ""}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("editar.proteins")}</label>
              <input
                name="proteinasObjetivo"
                type="number"
                min={0}
                max={2000}
                defaultValue={plan.proteinasObjetivo ?? ""}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("editar.carbs")}</label>
              <input
                name="carbohidratosObjetivo"
                type="number"
                min={0}
                max={2000}
                defaultValue={plan.carbohidratosObjetivo ?? ""}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("editar.fats")}</label>
              <input
                name="grasasObjetivo"
                type="number"
                min={0}
                max={2000}
                defaultValue={plan.grasasObjetivo ?? ""}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href={`/dietas/${id}`}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            {t("editar.cancel")}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? t("editar.saving") : t("editar.saveChanges")}
          </button>
        </div>
      </form>
    </div>
  );
}
