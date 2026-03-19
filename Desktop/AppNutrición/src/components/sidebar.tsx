"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Apple,
  CalendarDays,
  FileBarChart,
  Settings,
  Leaf,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/dietas", label: "Dietas", icon: UtensilsCrossed },
  { href: "/alimentos", label: "Alimentos", icon: Apple },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/reportes", label: "Reportes", icon: FileBarChart },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

interface SidebarProps {
  dietistaNombre: string;
  onSignOut: () => void;
}

export function Sidebar({ dietistaNombre, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-sidebar border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <Leaf className="w-7 h-7 text-primary shrink-0" />
        {!collapsed && (
          <span className="text-xl font-bold text-foreground">NutriApp</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{dietistaNombre}</p>
            <p className="text-xs text-muted-foreground">Dietista</p>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
