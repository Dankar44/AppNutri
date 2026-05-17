"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { eliminarPlan } from "@/app/actions/planes";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function PlanActions({ planId }: { planId: string }) {
  const t = useTranslations("diets.planActions");
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);

  async function handleDelete() {
    try {
      await eliminarPlan(planId);
      toast.success(t("toastDeleted"));
      await new Promise((r) => setTimeout(r, 800));
      window.location.href = "/dietas";
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("toastDeleteError"));
    }
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-xs sm:text-sm text-muted-foreground">{t("confirmDelete")}</span>
        <button
          onClick={handleDelete}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
        >
          {t("yes")}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-border text-xs sm:text-sm font-medium hover:bg-muted transition-colors"
        >
          {t("no")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none min-h-10 sm:min-h-0"
      aria-label={t("delete")}
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{t("delete")}</span>
    </button>
  );
}
