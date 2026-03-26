import { redirect } from "next/navigation";
import { getCurrentDietista, signOut } from "@/app/actions/auth";
import { getNotificacionesCount } from "@/app/actions/notificaciones";
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
  try {
    notifCount = await getNotificacionesCount();
  } catch {
    // No bloquear el dashboard si las notificaciones fallan
  }

  return (
    <TourWrapper audience="dietista">
      <div className="flex min-h-screen">
        <SidebarWrapper
          dietistaNombre={`${dietista.nombre} ${dietista.apellidos}`}
          signOutAction={signOut}
          notifCount={notifCount}
          isAdmin={isAdminEmail(dietista.email)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="pt-16 lg:pt-0 w-full max-w-none px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:pt-10 lg:pb-8">
            {children}
          </div>
        </main>
        <HelpWidget />
      </div>
    </TourWrapper>
  );
}
