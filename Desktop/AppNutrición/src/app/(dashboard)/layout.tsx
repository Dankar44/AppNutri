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
import { DemoBanner } from "@/components/demo-banner";
import { BannersDashboard } from "@/components/banners-dashboard";
import { DemoProvider } from "@/contexts/demo-context";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/i18n/locale";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dietista = await getCurrentDietista();
  const locale = await getLocale();

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

  if (!dietista.isDemo) {
    prisma.dietista.update({
      where: { id: dietista.id },
      data: { lastAccessAt: new Date() },
    }).catch(() => {});
  }

  return (
    <DemoProvider isDemo={dietista.isDemo}>
      <TourWrapper audience="dietista">
        {dietista.isDemo && <DemoBanner />}
        {!dietista.isDemo && <BannersDashboard locale={locale} />}
        <div className={`flex min-h-dvh bg-background${dietista.isDemo ? " pt-8" : ""}`}>
          <SidebarWrapper
            dietistaNombre={`${dietista.nombre} ${dietista.apellidos}`}
            signOutAction={signOut}
            notifCount={notifCount}
            mensajesCount={mensajesCount}
            badges={badges}
            isAdmin={isAdminEmail(dietista.email)}
            hasEmpresa={!!dietista.empresaId}
          />
          <main className="flex-1 overflow-y-auto min-w-0 bg-background">
            <div className="w-full max-w-none pt-14 lg:pt-6 lg:px-5 pb-safe lg:pb-6">
              <div className="bg-transparent border-0 rounded-none shadow-none px-4 py-3 sm:px-5 sm:py-4 lg:bg-card lg:rounded-xl lg:border lg:border-border lg:shadow-sm lg:px-8 lg:py-8">
                {children}
              </div>
            </div>
          </main>
          <HelpWidget />
        </div>
      </TourWrapper>
    </DemoProvider>
  );
}
