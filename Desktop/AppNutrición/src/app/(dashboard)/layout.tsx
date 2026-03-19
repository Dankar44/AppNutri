import { redirect } from "next/navigation";
import { getCurrentDietista, signOut } from "@/app/actions/auth";
import { SidebarWrapper } from "./sidebar-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dietista = await getCurrentDietista();

  if (!dietista) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <SidebarWrapper
        dietistaNombre={`${dietista.nombre} ${dietista.apellidos}`}
        signOutAction={signOut}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
