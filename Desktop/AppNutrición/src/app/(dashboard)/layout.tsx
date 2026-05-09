import { redirect } from "next/navigation";
import { getCurrentDietista, signOut } from "@/app/actions/auth";
import {
  getNotificacionesCount,
  getBadgesNavegacion,
} from "@/app/actions/notificaciones";
import { getConversacionesNoLeidasCount } from "@/app/actions/mensajes";
import { isAdminEmail } from "@/lib/admin";
import { SidebarWrapper } from "./sidebar-wrapper";
import { HelpWidget } from "@/components/help/help-widget";
import { TourWrapper } from "@/components/tour/tour-wrapper";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dietista = await getCurrentDietista();

  if (!dietista) {
    redirect("/login");
  }

  if (!dietista.verificado) {
    redirect("/pendiente");
  }

  let notifCount = 0;
  let mensajesCount = 0;
  let badges: Record<string, number> = {};
  try {
    [notifCount, mensajesCount, badges] = await Promise.all([
      getNotificacionesCount(),
      getConversacionesNoLeidasCount(),
      getBadgesNavegacion(),
    ]);
  } catch {
    // No bloquear el dashboard si las notificaciones fallan
  }

  prisma.dietista.update({
    where: { id: dietista.id },
    data: { lastAccessAt: new Date() },
  }).catch(() => {});

  return (
    <TourWrapper audience="dietista">
      <div className="flex min-h-dvh bg-background">
        <SidebarWrapper
          dietistaNombre={`${dietista.nombre} ${dietista.apellidos}`}
          signOutAction={signOut}
          notifCount={notifCount}
          mensajesCount={mensajesCount}
          badges={badges}
          isAdmin={isAdminEmail(dietista.email)}
        />
        <main className="flex-1 overflow-y-auto min-w-0 bg-background">
          <div className="w-full max-w-none pt-14 lg:pt-6 lg:px-5 pb-safe lg:pb-6">
            <div className="main-content-card">
              {children}
            </div>
          </div>
        </main>
        <HelpWidget />
      </div>
    </TourWrapper>
  );
}
