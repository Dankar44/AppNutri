"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Enlace al panel admin (estilo distinto) */
  admin?: boolean;
};

type NavSection = { title: string; items: NavItem[] };

function getNavSections(isAdmin?: boolean): NavSection[] {
  return [
    {
      title: "Gestión",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/pacientes", label: "Pacientes", icon: Users },
        { href: "/agenda", label: "Agenda", icon: CalendarDays },
        { href: "/pagos", label: "Pagos", icon: Wallet },
      ],
    },
    {
      title: "Dietas",
      items: [
        { href: "/dietas", label: "Dietas", icon: UtensilsCrossed },
        { href: "/alimentos", label: "Alimentos", icon: Apple },
        { href: "/recetas", label: "Recetas", icon: CookingPot },
      ],
    },
    {
      title: "Acompañamiento",
      items: [{ href: "/mensajes", label: "Mensajes", icon: MessageSquare }],
    },
    {
      title: "Centro de control",
      items: [
        { href: "/reportes", label: "Reportes", icon: FileBarChart },
        { href: "/ajustes", label: "Ajustes", icon: Settings },
        ...(isAdmin
          ? [{ href: "/admin-login", label: "Admin", icon: ShieldCheck, admin: true as const }]
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
}

export function Sidebar({ dietistaNombre, onSignOut, notifCount = 0, mensajesCount: mensajesCountInit = 0, badges: badgesInit = {}, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mensajesCount, setMensajesCount] = useState(mensajesCountInit);
  const [badges, setBadges] = useState<Record<string, number>>(badgesInit);

  useEffect(() => { setMounted(true); }, []);

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
    const id = setInterval(fetchCounts, 45_000);
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
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {getNavSections(isAdmin).map((section, sectionIndex) => (
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
                const isActive = admin
                  ? pathname.startsWith("/admin-login") ||
                    pathname === "/admin" ||
                    pathname.startsWith("/admin/")
                  : pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                const badgeCount =
                  item.href === "/mensajes"
                    ? mensajesCount
                    : (badges[item.href] ?? 0);
                return (
                  <Link
                    key={item.href + (admin ? "-admin" : "")}
                    href={item.href}
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
                    </span>
                    {(!collapsed || mobileOpen) && (
                      <span className="flex-1">{item.label}</span>
                    )}
                    {badgeCount > 0 && (!collapsed || mobileOpen) && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold shrink-0",
                          item.href === "/mensajes"
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
              <p className="text-xs text-muted-foreground">Dietista</p>
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
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!collapsed || mobileOpen) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Barra superior móvil */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 pt-safe bg-card border-b border-border flex items-center px-3">
        <div className="min-w-20 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
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
