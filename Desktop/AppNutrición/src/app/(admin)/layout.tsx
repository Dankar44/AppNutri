import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "@/app/actions/auth";
import { logoutAdmin } from "@/app/actions/admin";
import { AdminSidebarWrapper } from "./admin-sidebar-wrapper";

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
        <div className="pt-16 lg:pt-0 p-4 sm:p-6 lg:px-10 lg:pt-10 lg:pb-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
