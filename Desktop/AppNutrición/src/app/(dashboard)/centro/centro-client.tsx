"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Package, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmpresaSection } from "@/app/(dashboard)/ajustes/empresa-section";

const TABS = ["inventario", "equipo"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, React.ElementType> = {
  inventario: Package,
  equipo: Users,
};

export function CentroClient({ isDemo }: { isDemo: boolean }) {
  const t = useTranslations("centro");
  const [activeTab, setActiveTab] = useState<Tab>("equipo");

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((tab) => {
          const Icon = TAB_ICONS[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              {t(`tabs.${tab}`)}
            </button>
          );
        })}
      </div>

      {activeTab === "inventario" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t("inventario.proximamente")}</h3>
          <p className="text-sm text-muted-foreground max-w-md">{t("inventario.proximamenteDesc")}</p>
        </div>
      )}
      {activeTab === "equipo" && <EmpresaSection isDemo={isDemo} />}
    </div>
  );
}
