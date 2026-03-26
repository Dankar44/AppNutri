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
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/notification-bell";

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
      title: "Plan de alimentación",
      items: [
        { href: "/dietas", label: "Dietas", icon: UtensilsCrossed },
        { href: "/alimentos", label: "Alimentos", icon: Apple },
        { href: "/recetas", label: "Recetas", icon: CookingPot },
      ],
    },
    {
      title: "Acompañamiento",
      items: [{ href: "/mensajes", label: "Mensajes", icon: Mail }],
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
  isAdmin?: boolean;
}

export function Sidebar({ dietistaNombre, onSignOut, notifCount = 0, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <span className="text-xl font-bold text-foreground">NutriApp</span>
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
                return (
                  <Link
                    key={item.href + (admin ? "-admin" : "")}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      admin
                        ? isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-indigo-600/70 hover:bg-indigo-50 hover:text-indigo-700"
                        : isActive
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={collapsed && !mobileOpen ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between px-3 py-2">
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{dietistaNombre}</p>
              <p className="text-xs text-muted-foreground">Dietista</p>
            </div>
          )}
          <NotificationBell initialCount={notifCount} />
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Leaf className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">NutriApp</span>
        <div className="ml-auto">
          <NotificationBell initialCount={notifCount} />
        </div>
      </div>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar drawer móvil */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-border flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

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
