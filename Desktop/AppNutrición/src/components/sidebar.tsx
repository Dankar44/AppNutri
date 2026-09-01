"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Apple,
  CookingPot,
  CalendarDays,
  FileBarChart,
  Settings,
  Leaf,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Wallet,
  MessageSquare,
  Building2,
  Sparkles,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { esRutaDocente } from "@/lib/docencia";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIsDemo } from "@/contexts/demo-context";
import { getNovedades } from "@/content/novedades";
import {
  EVENTO_NOVEDADES_VISTAS,
  esNueva,
  getCorteNovedades,
} from "@/lib/novedades-vistas";


type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Enlace al panel admin (estilo distinto) */
  admin?: boolean;
  /**
   * Abre en pestaña nueva. Para páginas que viven fuera del dashboard (la de
   * novedades es pública): así el nutri las lee sin perder donde estaba.
   */
  externo?: boolean;
};

type NavSection = { title: string; items: NavItem[] };

/**
 * #39 — El espacio docente es OTRO sitio, no el panel con una sección más: mientras el profesor
 * está ahí no ve Pacientes, Agenda, Pagos ni Mensajes, que son de su consulta. Lo que sí se queda
 * es el material (dietas, alimentos y recetas), porque lo comparte con sus alumnos.
 */
function seccionesDocentes(t: (key: string) => string, opts?: { isAdmin?: boolean }): NavSection[] {
  return [
    {
      title: t("nav.docencia"),
      items: [
        { href: "/profesor", label: t("navItems.inicioDocente"), icon: GraduationCap },
        { href: "/profesor/clases", label: t("navItems.clases"), icon: Users },
        // Alumnos, Casos y Entregas se añaden cuando existan: un menú lleno de sitios vacíos es
        // peor que uno corto.
      ],
    },
    {
      title: t("nav.material"),
      items: [
        // Con la marca del espacio para no perder el menú docente al entrar (ver esRutaDocente).
        { href: "/dietas?espacio=docente", label: t("navItems.dietas"), icon: UtensilsCrossed },
        { href: "/alimentos?espacio=docente", label: t("navItems.alimentos"), icon: Apple },
        { href: "/recetas?espacio=docente", label: t("navItems.recetas"), icon: CookingPot },
      ],
    },
    {
      title: t("nav.cuenta"),
      items: [
        // El paso a su consulta, en el menú y no solo dentro de la página: es donde se busca.
        { href: "/dashboard", label: t("navItems.miCuentaProfesional"), icon: Briefcase },
        { href: "/ajustes?espacio=docente", label: t("navItems.ajustes"), icon: Settings },
        { href: "/novedades?espacio=docente", label: t("navItems.novedades"), icon: Sparkles, externo: true },
        ...(opts?.isAdmin
          ? [{ href: "/admin-login", label: t("navItems.admin"), icon: ShieldCheck, admin: true as const }]
          : []),
      ],
    },
  ];
}

/**
 * #39 — El menú del alumno.
 *
 * Tiene los mismos dos espacios que el profesor (Guillermo, 1 sep 2026): su aula, con las clases
 * en las que está, y su cuenta profesional, porque durante la carrera muchos ya empiezan a ver
 * gente de verdad. El material es el mismo: lo que su profesor comparte le sale ahí mezclado con
 * lo suyo, etiquetado.
 */
function seccionesAlumno(t: (key: string) => string): NavSection[] {
  return [
    {
      title: t("nav.aula"),
      items: [
        { href: "/aula", label: t("navItems.misClases"), icon: GraduationCap },
        // Los casos y las entregas se añaden cuando existan.
      ],
    },
    {
      title: t("nav.material"),
      items: [
        { href: "/dietas?espacio=aula", label: t("navItems.dietas"), icon: UtensilsCrossed },
        { href: "/alimentos?espacio=aula", label: t("navItems.alimentos"), icon: Apple },
        { href: "/recetas?espacio=aula", label: t("navItems.recetas"), icon: CookingPot },
      ],
    },
    {
      title: t("nav.cuenta"),
      items: [
        { href: "/dashboard", label: t("navItems.miCuentaProfesional"), icon: Briefcase },
        { href: "/ajustes?espacio=aula", label: t("navItems.ajustes"), icon: Settings },
        { href: "/novedades?espacio=aula", label: t("navItems.novedades"), icon: Sparkles, externo: true },
      ],
    },
  ];
}

function getNavSections(
  t: (key: string) => string,
  opts?: {
    isAdmin?: boolean;
    hasEmpresa?: boolean;
    esProfesor?: boolean;
    esAlumno?: boolean;
    enEspacioDocente?: boolean;
  },
): NavSection[] {
  if (opts?.esProfesor && opts.enEspacioDocente) return seccionesDocentes(t, opts);
  if (opts?.esAlumno && opts.enEspacioDocente) return seccionesAlumno(t);

  return [
    {
      title: t("nav.gestion"),
      items: [
        { href: "/dashboard", label: t("navItems.dashboard"), icon: LayoutDashboard },
        { href: "/pacientes", label: t("navItems.pacientes"), icon: Users },
        { href: "/agenda", label: t("navItems.agenda"), icon: CalendarDays },
        { href: "/pagos", label: t("navItems.pagos"), icon: Wallet },
      ],
    },
    {
      title: t("nav.dietas"),
      items: [
        // Con la marca del espacio para no perder el menú docente al entrar (ver esRutaDocente).
        { href: "/dietas?espacio=docente", label: t("navItems.dietas"), icon: UtensilsCrossed },
        { href: "/alimentos?espacio=docente", label: t("navItems.alimentos"), icon: Apple },
        { href: "/recetas?espacio=docente", label: t("navItems.recetas"), icon: CookingPot },
      ],
    },
    {
      title: t("nav.acompanamiento"),
      items: [{ href: "/mensajes", label: t("navItems.mensajes"), icon: MessageSquare }],
    },
    ...(opts?.hasEmpresa
      ? [
          {
            title: t("nav.miCentro"),
            items: [{ href: "/centro", label: t("navItems.centro"), icon: Building2 }],
          },
        ]
      : []),
    // #39 — Solo para profesores. Enlace normal: ninguna dirección del menú puede tener efectos
    // secundarios, porque Next hace prefetch de los enlaces visibles y los dispararía él solo.
    ...(opts?.esProfesor
      ? [
          {
            title: t("nav.docencia"),
            items: [{ href: "/profesor", label: t("navItems.espacioDocente"), icon: GraduationCap }],
          },
        ]
      : []),
    {
      title: t("nav.centroDeControl"),
      items: [
        { href: "/reportes", label: t("navItems.reportes"), icon: FileBarChart },
        { href: "/ajustes?espacio=docente", label: t("navItems.ajustes"), icon: Settings },
        { href: "/novedades?espacio=docente", label: t("navItems.novedades"), icon: Sparkles, externo: true },
        ...(opts?.isAdmin
          ? [{ href: "/admin-login", label: t("navItems.admin"), icon: ShieldCheck, admin: true as const }]
          : []),
      ],
    },
  ];
}

interface SidebarProps {
  dietistaNombre: string;
  onSignOut: () => void;
  notifCount?: number;
  mensajesCount?: number;
  /** Badges a pintar por item del sidebar, clave = href. */
  badges?: Record<string, number>;
  isAdmin?: boolean;
  hasEmpresa?: boolean;
  esProfesor?: boolean;
  /** Su cuenta viene de una clase: no es "nutricionista", es alumno, y hay que llamarle así. */
  esAlumno?: boolean;
}

export function Sidebar({ dietistaNombre, onSignOut, notifCount = 0, mensajesCount: mensajesCountInit = 0, badges: badgesInit = {}, isAdmin, hasEmpresa, esProfesor, esAlumno }: SidebarProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enEspacioDocente = esRutaDocente(pathname, searchParams.get("espacio"));

  // De todas las direcciones del menú, la que más encaja con donde estamos. Se calcula una vez
  // para que dos enlaces encadenados (/profesor y /profesor/clases) no se enciendan los dos.
  const rutaActiva = useMemo(() => {
    const todas = getNavSections(() => "", { isAdmin, hasEmpresa, esProfesor, esAlumno, enEspacioDocente })
      .flatMap((s) => s.items.map((i) => i.href.split("?")[0]));
    return todas
      .filter((r) => pathname === r || pathname.startsWith(r + "/"))
      .sort((a, b) => b.length - a.length)[0];
  }, [pathname, isAdmin, hasEmpresa, esProfesor, esAlumno, enEspacioDocente]);
  const isDemo = useIsDemo();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mensajesCount, setMensajesCount] = useState(mensajesCountInit);
  const [badges, setBadges] = useState<Record<string, number>>(badgesInit);

  useEffect(() => { setMounted(true); }, []);

  // Punto verde de novedades. Vive solo en el navegador (localStorage), aparte
  // del sistema de notificaciones: un changelog no debe contar como aviso.
  const [novedadesSinLeer, setNovedadesSinLeer] = useState(false);
  useEffect(() => {
    const evaluar = () => {
      const ultima = getNovedades()[0]?.fecha;
      setNovedadesSinLeer(!!ultima && esNueva(ultima, getCorteNovedades()));
    };
    evaluar();
    // El evento lo emite la página de novedades al darlas por leídas; `storage`
    // cubre que se lean en otra pestaña.
    window.addEventListener(EVENTO_NOVEDADES_VISTAS, evaluar);
    window.addEventListener("storage", evaluar);
    return () => {
      window.removeEventListener(EVENTO_NOVEDADES_VISTAS, evaluar);
      window.removeEventListener("storage", evaluar);
    };
  }, []);

  // Sincronizar estado local cuando cambie el SSR (al navegar el server devuelve nuevos counts)
  useEffect(() => {
    setMensajesCount(mensajesCountInit);
  }, [mensajesCountInit]);
  useEffect(() => {
    setBadges(badgesInit);
    // Serializamos para evitar loops por referencia nueva
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(badgesInit)]);

  // Polling cada 45s — así se refresca sin navegar cuando llegan mensajes/notifs nuevas
  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      try {
        const res = await fetch("/api/sidebar-counts", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          mensajesCount: number;
          badges: Record<string, number>;
        };
        setMensajesCount(data.mensajesCount);
        setBadges(data.badges);
      } catch {
        // silencioso
      }
    }
    const id = setInterval(fetchCounts, 90_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Al navegar a una ruta, refrescar inmediatamente (pulsar sobre Mensajes marca leído, etc.)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/sidebar-counts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setMensajesCount(data.mensajesCount);
        setBadges(data.badges);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Cerrar menú móvil al hacer resize a desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Bloquear el scroll del fondo mientras el menú móvil está abierto: el dedo
  // solo mueve el menú, no la página de detrás (patrón position:fixed para iOS).
  useEffect(() => {
    if (!mobileOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <Leaf className="w-7 h-7 text-primary shrink-0" />
        {(!collapsed || mobileOpen) && (
          <span className="text-xl font-bold text-foreground">Annonia</span>
        )}
        {/* Botón cerrar en móvil */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-muted lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto overscroll-contain">
        {getNavSections(t, { isAdmin, hasEmpresa, esProfesor, esAlumno, enEspacioDocente }).map((section, sectionIndex) => (
          <div
            key={section.title}
            className={cn(sectionIndex > 0 && "mt-6")}
          >
            {(!collapsed || mobileOpen) && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 leading-snug">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const admin = item.admin === true;
                // Algunos enlaces llevan `?espacio=docente`; para marcar el activo y buscar su
                // aviso solo cuenta la ruta.
                const ruta = item.href.split("?")[0];
                const isActive = admin
                  ? pathname.startsWith("/admin-login") ||
                    pathname === "/admin" ||
                    pathname.startsWith("/admin/")
                  // Solo se enciende el enlace MÁS concreto: estando en /profesor/clases se
                  // encendían a la vez "Inicio" (/profesor) y "Clases", porque una es prefijo
                  // de la otra.
                  : ruta === rutaActiva;
                const badgeCount =
                  ruta === "/mensajes"
                    ? mensajesCount
                    : (badges[ruta] ?? 0);
                const puntoNovedades =
                  ruta === "/novedades" && novedadesSinLeer;
                return (
                  <Link
                    key={item.href + (admin ? "-admin" : "")}
                    href={item.href}
                    {...(item.externo
                      ? {
                          target: "_blank",
                          rel: "noopener noreferrer",
                          // Sin cambio de ruta el drawer móvil no se cerraría solo
                          onClick: () => setMobileOpen(false),
                        }
                      : {})}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg text-sm font-medium transition-colors",
                      admin
                        ? isActive
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                          : "text-indigo-600/70 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:text-indigo-700"
                        : isActive
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={collapsed && !mobileOpen ? item.label : undefined}
                  >
                    <span className="relative shrink-0">
                      <item.icon className="w-5 h-5" />
                      {badgeCount > 0 && (!collapsed || mobileOpen) ? null : badgeCount > 0 ? (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-sidebar" />
                      ) : null}
                      {/* Con el menú plegado, el punto va sobre el icono */}
                      {puntoNovedades && collapsed && !mobileOpen && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 ring-2 ring-sidebar" />
                      )}
                    </span>
                    {(!collapsed || mobileOpen) && (
                      <span className="flex-1 flex items-center gap-2">
                        {item.label}
                        {puntoNovedades && (
                          <span
                            aria-label={t("navItems.novedadesSinLeer")}
                            className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                          />
                        )}
                      </span>
                    )}
                    {badgeCount > 0 && (!collapsed || mobileOpen) && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold shrink-0",
                          ruta === "/mensajes"
                            ? "bg-primary text-primary-foreground"
                            : "bg-red-500 text-white",
                        )}
                      >
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{dietistaNombre}</p>
              {/* En el espacio docente pone "Profesor": es donde está y es lo que es allí. */}
              <p className="text-xs text-muted-foreground">
                {esAlumno
                  ? t("sidebar.alumno")
                  : esProfesor && enEspacioDocente
                    ? t("sidebar.profesor")
                    : t("sidebar.dietista")}
              </p>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <NotificationBell initialCount={notifCount} />
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          title={t("sidebar.cerrarSesionTitle")}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!collapsed || mobileOpen) && <span>{t("sidebar.cerrarSesion")}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Barra superior móvil */}
      <div
        className={cn(
          "lg:hidden fixed left-0 right-0 z-40 h-14 pt-safe bg-card border-b border-border flex items-center px-3",
          // En la demo el banner naranja (fixed top-0, ~32px) tapaba el botón de menú.
          // Bajamos la barra justo debajo del banner para que sea clicable.
          isDemo ? "top-8" : "top-0",
        )}
      >
        <div className="min-w-20 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label={t("sidebar.abrirMenu")}
            className="p-2.5 -ml-1 rounded-lg hover:bg-muted transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Leaf className="w-7 h-7 text-primary shrink-0" />
          <span className="text-xl font-bold">Annonia</span>
        </div>
        <div className="min-w-20 shrink-0 flex items-center justify-end gap-1">
          <ThemeToggle />
          <NotificationBell initialCount={notifCount} />
        </div>
      </div>

      {/* Overlay + drawer móvil: solo se monta en cliente para evitar hydration mismatch */}
      {mounted && (
        <>
          {mobileOpen && (
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}
          <aside
            className={cn(
              "lg:hidden fixed top-0 left-0 z-50 h-full w-full pt-safe pb-safe bg-sidebar flex flex-col transition-transform duration-300",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Sidebar desktop */}
      <aside
        data-tour="sidebar"
        className={cn(
          "hidden lg:flex h-screen sticky top-0 bg-sidebar border-r border-border flex-col transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
