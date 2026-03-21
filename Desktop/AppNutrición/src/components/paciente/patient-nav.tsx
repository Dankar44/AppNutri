"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, UtensilsCrossed, BookOpen, TrendingUp, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutPaciente } from "@/app/actions/paciente-auth";
import { useState } from "react";

const navItems = [
  { href: "/paciente/portal", label: "Inicio", icon: Leaf },
  { href: "/paciente/portal/dieta", label: "Mi dieta", icon: UtensilsCrossed },
  { href: "/paciente/portal/diario", label: "Diario", icon: BookOpen },
  { href: "/paciente/portal/evolucion", label: "Evolución", icon: TrendingUp },
];

export function PatientNav({ nombre }: { nombre: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/paciente/portal" className="flex items-center gap-2">
            <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="font-bold text-sm sm:text-base hidden sm:inline">NutriApp</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Hamburger móvil */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-1 rounded hover:bg-muted"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden md:inline">{nombre}</span>
          <button
            onClick={() => logoutPaciente()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Nav móvil desplegable */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-border px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
