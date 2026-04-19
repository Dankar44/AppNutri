import { redirect } from "next/navigation";
import { getCurrentDietista, signOut } from "@/app/actions/auth";
import { getNotificacionesCount } from "@/app/actions/notificaciones";
import { getConversacionesNoLeidasCount } from "@/app/actions/mensajes";
import { isAdminEmail } from "@/lib/admin";
import { SidebarWrapper } from "./sidebar-wrapper";
import { HelpWidget } from "@/components/help/help-widget";
import { TourWrapper } from "@/components/tour/tour-wrapper";

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
  try {
    [notifCount, mensajesCount] = await Promise.all([
      getNotificacionesCount(),
      getConversacionesNoLeidasCount(),
    ]);
  } catch {
    // No bloquear el dashboard si las notificaciones fallan
  }

  return (
    <TourWrapper audience="dietista">
      <div className="flex min-h-dvh">
        <SidebarWrapper
          dietistaNombre={`${dietista.nombre} ${dietista.apellidos}`}
          signOutAction={signOut}
          notifCount={notifCount}
          mensajesCount={mensajesCount}
          isAdmin={isAdminEmail(dietista.email)}
        />
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="pt-14 lg:pt-0 pt-safe w-full max-w-none px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 lg:pt-5 lg:pb-5 pb-safe">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-3 sm:p-5">
              {children}
            </div>
          </div>
        </main>
        <HelpWidget />
      </div>
    </TourWrapper>
  );
}
