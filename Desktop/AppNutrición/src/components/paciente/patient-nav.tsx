"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf, LayoutDashboard, UtensilsCrossed, TrendingUp, MessageSquareText,
  ShoppingCart, Settings, FileDown, LogOut, Menu, X, BookOpen, Calendar,
  MessageSquare, Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutPaciente } from "@/app/actions/paciente-auth";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Mi plan",
    items: [
      { href: "/paciente/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/paciente/portal/dieta", label: "Mi dieta", icon: UtensilsCrossed, exact: true },
      { href: "/paciente/portal/dieta/lista-compra", label: "Lista de la compra", icon: ShoppingCart },
      { href: "/paciente/portal/recomendaciones", label: "Recomendaciones", icon: MessageSquareText },
    ],
  },
  {
    title: "Mi seguimiento",
    items: [
      { href: "/paciente/portal/seguimiento", label: "Diario", icon: BookOpen, exact: true },
      { href: "/paciente/portal/seguimiento/horario", label: "Mi horario", icon: Clock },
      { href: "/paciente/portal/evolucion", label: "Evolución", icon: TrendingUp },
    ],
  },
  {
    title: "Con mi nutri",
    items: [
      { href: "/paciente/portal/citas", label: "Mis citas", icon: Calendar },
      { href: "/paciente/portal/mensajes", label: "Mensajes", icon: MessageSquare },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { href: "/paciente/portal/exportar-pdf", label: "Generar PDF", icon: FileDown },
      { href: "/paciente/portal/perfil", label: "Mi perfil", icon: Settings },
    ],
  },
];

interface Props {
  nombre: string;
  apellidos: string;
  fotoUrl?: string | null;
  badges?: Record<string, number>;
}

export function PatientNav({ nombre, apellidos, fotoUrl, badges: badgesInit = {} }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>(badgesInit);

  const initials = `${nombre[0] || ""}${apellidos[0] || ""}`.toUpperCase();

  // Sincronizar cuando el layout server pase nuevos badges
  useEffect(() => {
    setBadges(badgesInit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(badgesInit)]);

  // Polling cada 45s para refrescar mensajes / contrapropuestas sin navegar
  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      try {
        const res = await fetch("/api/patient-sidebar-counts", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { badges: Record<string, number> };
        setBadges(data.badges ?? {});
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

  // Refrescar al navegar (si aceptas cita, el badge baja)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/patient-sidebar-counts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setBadges(data.badges ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Cerrar menú al navegar / resize
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
        <span className="text-xl font-bold">NutriApp</span>
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 rounded hover:bg-muted lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav por secciones */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && "mt-6")}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 leading-snug">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                const badgeCount = badges[item.href] ?? 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="relative shrink-0">
                      <item.icon className="w-5 h-5" />
                      {badgeCount > 0 && (
                        <span className="lg:hidden absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-sidebar" />
                      )}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold shrink-0",
                          item.href === "/paciente/portal/mensajes"
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

      {/* Footer con foto */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          {fotoUrl ? (
            <img src={fotoUrl} alt={nombre} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{nombre} {apellidos}</p>
            <p className="text-xs text-muted-foreground">Paciente</p>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
        <button
          onClick={() => logoutPaciente()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Barra superior móvil */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 pt-safe bg-card border-b border-border flex items-center px-3 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="p-2.5 -ml-1 rounded-lg hover:bg-muted transition-colors min-h-11 min-w-11 flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Leaf className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">NutriApp</span>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {fotoUrl ? (
            <img src={fotoUrl} alt={nombre} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
              {initials}
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-64 xs:w-72 max-w-[85vw] pt-safe pb-safe bg-sidebar border-r border-border flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      <aside data-tour="sidebar" className="hidden lg:flex h-screen sticky top-0 bg-sidebar border-r border-border flex-col w-64">
        {sidebarContent}
      </aside>
    </>
  );
}
