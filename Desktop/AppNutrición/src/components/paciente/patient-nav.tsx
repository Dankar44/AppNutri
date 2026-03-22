"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf, UtensilsCrossed, BookOpen, TrendingUp, MessageSquareText,
  ShoppingCart, Settings, FileDown, LogOut, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutPaciente } from "@/app/actions/paciente-auth";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/paciente/portal", label: "Inicio", icon: Leaf, exact: true },
  { href: "/paciente/portal/dieta", label: "Mi dieta", icon: UtensilsCrossed },
  { href: "/paciente/portal/diario", label: "Diario", icon: BookOpen },
  { href: "/paciente/portal/evolucion", label: "Evolución", icon: TrendingUp },
  { href: "/paciente/portal/dieta/lista-compra", label: "Lista de la compra", icon: ShoppingCart },
  { href: "/paciente/portal/recomendaciones", label: "Recomendaciones", icon: MessageSquareText },
  { href: "/paciente/portal/exportar-pdf", label: "Generar PDF", icon: FileDown },
  { href: "/paciente/portal/perfil", label: "Mi perfil", icon: Settings },
];

interface Props {
  nombre: string;
  apellidos: string;
  fotoUrl?: string | null;
}

export function PatientNav({ nombre, apellidos, fotoUrl }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = `${nombre[0] || ""}${apellidos[0] || ""}`.toUpperCase();

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

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
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
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{nombre} {apellidos}</p>
            <p className="text-xs text-muted-foreground">Paciente</p>
          </div>
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <Leaf className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">NutriApp</span>
        <div className="ml-auto flex items-center gap-2">
          {fotoUrl ? (
            <img src={fotoUrl} alt={nombre} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
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
      <aside className="hidden lg:flex h-screen sticky top-0 bg-sidebar border-r border-border flex-col w-64">
        {sidebarContent}
      </aside>
    </>
  );
}
