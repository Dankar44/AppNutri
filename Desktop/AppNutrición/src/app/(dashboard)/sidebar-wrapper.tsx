"use client";

import { Sidebar } from "@/components/sidebar";
import type { EspacioActivo } from "@/lib/docencia";

interface SidebarWrapperProps {
  dietistaNombre: string;
  signOutAction: () => Promise<void>;
  notifCount: number;
  mensajesCount?: number;
  badges?: Record<string, number>;
  isAdmin?: boolean;
  hasEmpresa?: boolean;
  esProfesor?: boolean;
  espacioActivo?: EspacioActivo;
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
  espacioActivo,
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
      espacioActivo={espacioActivo}
    />
  );
}
