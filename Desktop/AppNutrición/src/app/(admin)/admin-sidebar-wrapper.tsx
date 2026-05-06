"use client";

import { AdminSidebar } from "@/components/admin-sidebar";

interface Props {
  adminNombre: string;
  signOutAction: () => Promise<void>;
  mensajesCount?: number;
}

export function AdminSidebarWrapper({ adminNombre, signOutAction, mensajesCount }: Props) {
  return (
    <AdminSidebar
      adminNombre={adminNombre}
      onSignOut={() => signOutAction()}
      mensajesCount={mensajesCount}
    />
  );
}
