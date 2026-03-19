"use client";

import { Sidebar } from "@/components/sidebar";

interface SidebarWrapperProps {
  dietistaNombre: string;
  signOutAction: () => Promise<void>;
}

export function SidebarWrapper({
  dietistaNombre,
  signOutAction,
}: SidebarWrapperProps) {
  return (
    <Sidebar
      dietistaNombre={dietistaNombre}
      onSignOut={() => signOutAction()}
    />
  );
}
