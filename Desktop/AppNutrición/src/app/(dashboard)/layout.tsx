import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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
import { revisarCursoDelAlumno } from "@/lib/docencia-acceso";
import { COOKIE_ESPACIO, espacioGuardado, licenciaVigente } from "@/lib/docencia";
import { avisarDePlazosVencidos } from "@/lib/avisos-docencia";

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

  // `getCurrentDietista` ya devuelve la fila entera del dietista, así que el rol sale de ahí:
  // una consulta más en el layout la pagarían TODOS los nutricionistas en cada carga del panel.
  // La puerta al espacio docente se enseña solo a quien puede entrar: un enlace que te echa es
  // peor que no tenerlo. Se abre en dos casos, los mismos que en `getDatosProfesor`: estar en una
  // universidad con la licencia al día, o haberse ido de una y estar dentro del plazo que le queda
  // (hasta el 31 de agosto de ese curso). La consulta la pagan solo los profesores, que son pocos.
  const profesor =
    dietista.rolDocente === "PROFESOR" &&
    (dietista.licenciaDocenteId
      ? licenciaVigente(
          await prisma.licenciaDocente.findUnique({
            where: { id: dietista.licenciaDocenteId },
            select: { activa: true, fechaFin: true },
          }),
        )
      : !!dietista.docenciaHasta && dietista.docenciaHasta.getTime() >= Date.now());

  // El curso se cierra solo, sin tarea programada: se mira aquí, que es el único momento en el
  // que importa. Al alumno no se le echa — si se ha quedado sin clases pasa a cuenta normal y se
  // le enseña el aviso una vez. La consulta la pagan los alumnos y los exalumnos con el aviso sin
  // ver, no los cientos de nutricionistas.
  if (dietista.rolDocente === "ALUMNO" || (dietista.exAlumnoDesde && !dietista.avisoFinCursoVisto)) {
    const { avisoPendiente } = await revisarCursoDelAlumno(dietista);
    if (avisoPendiente) redirect("/curso-terminado");
  }

  // El espacio (docente / aula / consulta) en el que estaba: el menú arranca ahí y no parpadea.
  const espacioInicial = espacioGuardado((await cookies()).get(COOKIE_ESPACIO)?.value);

  // Los plazos vencidos se miran en cualquier página del espacio docente, no solo en su inicio: si
  // el profesor pulsa la campana nada más entrar, el aviso tiene que estar ya ahí (Guillermo, 8 sep
  // 2026, que abrió /notificaciones directo y no vio nada).
  //
  // Va AQUÍ, antes de contar las notificaciones, y se ESPERA: lanzarlo y olvidarlo dejaba el aviso
  // creado después de pintar, y ponerlo más abajo hacía que el contador de la campana se calculase
  // sin él. Es una consulta pequeña, acotada al último mes, y en cuanto avisa el candado hace que
  // no vuelva a encontrar nada. Solo corre en el espacio docente.
  if (espacioInicial === "docente") {
    await avisarDePlazosVencidos(prisma).catch((e) =>
      console.error("[docencia] No se pudo avisar de los plazos:", e),
    );
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
            esProfesor={profesor}
            esAlumno={dietista.rolDocente === "ALUMNO"}
            espacioInicial={espacioInicial}
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
