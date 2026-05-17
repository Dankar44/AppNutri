import { PulseLoader } from "@/components/pulse-loader";
import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");
  return <PulseLoader text={t("loading.dietas")} />;
}
