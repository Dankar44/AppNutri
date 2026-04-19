"use client";

import { Sidebar } from "@/components/sidebar";

interface SidebarWrapperProps {
  dietistaNombre: string;
  signOutAction: () => Promise<void>;
  notifCount: number;
  mensajesCount?: number;
  isAdmin?: boolean;
}

export function SidebarWrapper({
  dietistaNombre,
  signOutAction,
  notifCount,
  mensajesCount = 0,
  isAdmin,
}: SidebarWrapperProps) {
  return (
    <Sidebar
      dietistaNombre={dietistaNombre}
      onSignOut={() => signOutAction()}
      notifCount={notifCount}
      mensajesCount={mensajesCount}
      isAdmin={isAdmin}
    />
  );
}
