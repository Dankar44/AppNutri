import { Calendar as CalendarIcon } from "lucide-react";
import { getCitasPaciente } from "@/app/actions/citas-flujo";
import { CitasPortalClient } from "./citas-client";

export default async function CitasPortalPage() {
  const citas = await getCitasPaciente();

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          Mis citas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solicita nuevas citas con tu nutricionista y gestiona las que ya tienes.
        </p>
      </header>

      <CitasPortalClient citasIniciales={citas} />
    </section>
  );
}
