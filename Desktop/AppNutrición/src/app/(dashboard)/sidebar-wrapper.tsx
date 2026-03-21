"use client";

import { Sidebar } from "@/components/sidebar";

interface SidebarWrapperProps {
  dietistaNombre: string;
  signOutAction: () => Promise<void>;
  notifCount: number;
  isAdmin?: boolean;
}

export function SidebarWrapper({
  dietistaNombre,
  signOutAction,
  notifCount,
  isAdmin,
}: SidebarWrapperProps) {
  return (
    <Sidebar
      dietistaNombre={dietistaNombre}
      onSignOut={() => signOutAction()}
      notifCount={notifCount}
      isAdmin={isAdmin}
    />
  );
}
