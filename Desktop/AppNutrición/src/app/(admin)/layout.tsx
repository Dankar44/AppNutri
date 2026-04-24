import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "@/app/actions/auth";
import { logoutAdmin } from "@/app/actions/admin";
import { AdminSidebarWrapper } from "./admin-sidebar-wrapper";

export const metadata: Metadata = {
  title: "Annonia Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  return (
    <div className="flex min-h-screen">
      <AdminSidebarWrapper
        adminNombre={admin.email}
        signOutAction={logoutAdmin}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="pt-16 lg:pt-0 w-full max-w-none px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:pt-10 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
