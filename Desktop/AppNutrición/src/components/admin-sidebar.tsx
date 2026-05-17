"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  CreditCard,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Eye,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { AdminRole } from "@/lib/admin";

const navItems = [
  { href: "/admin", labelKey: "nav.panel" as const, icon: LayoutDashboard },
  { href: "/admin/dietistas", labelKey: "nav.dietistas" as const, icon: Users },
  { href: "/admin/verificaciones", labelKey: "nav.verificaciones" as const, icon: ShieldCheck },
  { href: "/admin/seguimiento", labelKey: "nav.seguimiento" as const, icon: Eye },
  { href: "/admin/mensajes", labelKey: "nav.mensajes" as const, icon: MessageSquare },
  { href: "/admin/actividad", labelKey: "nav.actividad" as const, icon: Activity },
  { href: "/admin/suscripciones", labelKey: "nav.suscripciones" as const, icon: CreditCard },
  { href: "/admin/crear-cuenta", labelKey: "nav.crearCuenta" as const, icon: UserPlus },
];

interface AdminSidebarProps {
  adminNombre: string;
  onSignOut: () => void;
  mensajesCount?: number;
  role: AdminRole;
}

export function AdminSidebar({ adminNombre, onSignOut, mensajesCount = 0, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("admin.sidebar");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = role === "creator"
    ? navItems.filter((item) => item.href === "/admin/crear-cuenta")
    : navItems;

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
      <div className="h-16 flex items-center gap-2 px-4 border-b border-indigo-100 shrink-0">
        <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
        {(!collapsed || mobileOpen) && (
          <span className="text-xl font-bold text-foreground">{t("brandName")}</span>
        )}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/15 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed && !mobileOpen ? t(item.labelKey) : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(!collapsed || mobileOpen) && (
                <>
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {item.href === "/admin/mensajes" && mensajesCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      {mensajesCount}
                    </span>
                  )}
                </>
              )}
              {collapsed && !mobileOpen && item.href === "/admin/mensajes" && mensajesCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-indigo-100 p-3 space-y-2">
        <div className="flex items-center px-3 py-2">
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{adminNombre}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                {role === "creator" ? t("roles.creator") : t("roles.admin")}
              </p>
            </div>
          )}
        </div>
        {role === "admin" && (
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            {(!collapsed || mobileOpen) && <span>{t("volverApp")}</span>}
          </Link>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          title={t("cerrarSesion")}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!collapsed || mobileOpen) && <span>{t("cerrarSesion")}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Barra superior móvil */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-indigo-100 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <span className="font-bold text-sm">{t("brandName")}</span>
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
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-indigo-100 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden lg:flex h-screen sticky top-0 bg-card border-r border-indigo-100 flex-col transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
