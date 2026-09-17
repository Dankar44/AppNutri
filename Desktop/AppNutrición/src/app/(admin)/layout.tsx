import type { Metadata } from "next";
import { Eye } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { logoutAdmin } from "@/app/actions/admin";
import { getTotalNoLeidosSoporteAdmin } from "@/app/actions/admin-soporte";
import { AdminSidebarWrapper } from "./admin-sidebar-wrapper";

export const metadata: Metadata = {
  title: "Annonia Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin({ soloLectura: true });
  if (!admin) redirect("/admin-login");

  const mensajesCount =
    admin.role === "admin" || admin.role === "lector" ? await getTotalNoLeidosSoporteAdmin() : 0;

  return (
    <div className="flex min-h-screen">
      <AdminSidebarWrapper
        adminNombre={admin.email}
        signOutAction={logoutAdmin}
        mensajesCount={mensajesCount}
        role={admin.role}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="pt-16 lg:pt-0 w-full max-w-none px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:pt-10 lg:pb-8">
          {admin.role === "lector" && (
            // Los botones de acción siguen a la vista pero no hacen nada: sin este aviso,
            // quien entra con una cuenta de solo lectura cree que la aplicación falla.
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <Eye className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Esta cuenta es de <strong className="font-semibold">solo lectura</strong>. Puedes
                consultar todo el panel, pero no crear, editar ni eliminar nada.
              </p>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
