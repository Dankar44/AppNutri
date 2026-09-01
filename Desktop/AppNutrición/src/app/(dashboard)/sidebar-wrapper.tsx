"use client";

import { Sidebar } from "@/components/sidebar";

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
    />
  );
}
