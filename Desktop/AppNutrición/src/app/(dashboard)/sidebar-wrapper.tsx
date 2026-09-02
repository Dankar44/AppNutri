"use client";

import { Sidebar } from "@/components/sidebar";
import type { Espacio } from "@/lib/docencia";

interface SidebarWrapperProps {
  dietistaNombre: string;
  signOutAction: () => Promise<void>;
  notifCount: number;
  mensajesCount?: number;
  badges?: Record<string, number>;
  isAdmin?: boolean;
  hasEmpresa?: boolean;
  esProfesor?: boolean;
  esAlumno?: boolean;
  espacioInicial?: Espacio | null;
}

export function SidebarWrapper({
  dietistaNombre,
  signOutAction,
  notifCount,
  mensajesCount = 0,
  badges = {},
  isAdmin,
  hasEmpresa,
  esProfesor,
  esAlumno,
  espacioInicial,
}: SidebarWrapperProps) {
  return (
    <Sidebar
      dietistaNombre={dietistaNombre}
      onSignOut={() => {
        signOutAction();
      }}
      notifCount={notifCount}
      mensajesCount={mensajesCount}
      badges={badges}
      isAdmin={isAdmin}
      hasEmpresa={hasEmpresa}
      esProfesor={esProfesor}
      esAlumno={esAlumno}
      espacioInicial={espacioInicial}
    />
  );
}
