import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // #39 — Por la misma puerta que el login: /entrar decide si va al espacio docente o al panel.
    redirect("/entrar");
  } else {
    redirect("/landing");
  }
}
