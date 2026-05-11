"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import type { AdminRole } from "@/lib/admin";

interface Props {
  adminNombre: string;
  signOutAction: () => Promise<void>;
  mensajesCount?: number;
  role: AdminRole;
}

export function AdminSidebarWrapper({ adminNombre, signOutAction, mensajesCount, role }: Props) {
  return (
    <AdminSidebar
      adminNombre={adminNombre}
      onSignOut={() => signOutAction()}
      mensajesCount={mensajesCount}
      role={role}
    />
  );
}
