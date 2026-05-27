"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmpresaSection } from "@/app/(dashboard)/ajustes/empresa-section";
import { InventarioTab } from "./inventario-tab";

const TABS = ["inventario", "equipo"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, React.ElementType> = {
  inventario: Package,
  equipo: Users,
};

export function CentroClient({ isDemo }: { isDemo: boolean }) {
  const t = useTranslations("centro");
  const [activeTab, setActiveTab] = useState<Tab>("inventario");

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

      {activeTab === "inventario" && <InventarioTab />}
      {activeTab === "equipo" && <EmpresaSection isDemo={isDemo} />}
    </div>
  );
}
