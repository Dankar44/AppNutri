import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentDietista } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { CentroClient } from "./centro-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("centro");
  return { title: t("metadata.title") };
}

export default async function CentroPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");
  if (!dietista.verificado) redirect("/pendiente");

  return <CentroClient isDemo={!!dietista.isDemo} />;
}
