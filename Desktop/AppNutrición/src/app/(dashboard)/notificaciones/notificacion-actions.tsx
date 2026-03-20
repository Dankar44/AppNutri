"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { marcarTodasLeidas } from "@/app/actions/notificaciones";
import { toast } from "sonner";

export function NotificacionActions() {
  const router = useRouter();

  async function handleMarcarTodas() {
    await marcarTodasLeidas();
    toast.success("Todas marcadas como leídas");
    router.refresh();
  }

  return (
    <button
      onClick={handleMarcarTodas}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
    >
      <Check className="w-4 h-4" />
      Marcar todas como leídas
    </button>
  );
}
