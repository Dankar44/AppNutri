"use client";

import { useTranslations } from "next-intl";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

function MedalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* Ribbon tails */}
      <path d="M8 13L5 21l3.5-1.5L12 21l3.5-1.5L19 21l-3-8" fill="currentColor" opacity="0.35" />
      {/* Medal body */}
      <circle cx="12" cy="9" r="7" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="9" r="5.5" fill="currentColor" opacity="0.3" />
      {/* Star in center */}
      <path
        d="M12 5.5l1.09 2.21 2.44.35-1.77 1.72.42 2.43L12 11.15l-2.18 1.06.42-2.43-1.77-1.72 2.44-.35L12 5.5z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function EarlyAdopterBadge({ size = "md", className = "" }: Props) {
  const t = useTranslations("settings");

  const sizeMap = {
    sm: { badge: "h-5 gap-1 px-1.5 text-[10px]", icon: "w-3.5 h-3.5" },
    md: { badge: "h-7 gap-1.5 px-2.5 text-xs", icon: "w-4 h-4" },
    lg: { badge: "h-8 gap-2 px-3 text-sm", icon: "w-5 h-5" },
  };
  const s = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center ${s.badge} rounded-full font-semibold bg-gradient-to-r from-violet-500/15 via-purple-400/15 to-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-400/30 dark:border-violet-500/25 ${className}`}
      title={t("earlyAdopter.tooltip")}
    >
      <MedalIcon className={s.icon} />
      <span>{t("earlyAdopter.label")}</span>
    </span>
  );
}

export function EarlyAdopterBadgePatient({ size = "sm", className = "" }: Props) {
  const t = useTranslations("patient-portal");

  const sizeMap = {
    sm: { badge: "h-5 gap-1 px-1.5 text-[10px]", icon: "w-3.5 h-3.5" },
    md: { badge: "h-7 gap-1.5 px-2.5 text-xs", icon: "w-4 h-4" },
    lg: { badge: "h-8 gap-2 px-3 text-sm", icon: "w-5 h-5" },
  };
  const s = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center ${s.badge} rounded-full font-semibold bg-gradient-to-r from-violet-500/15 via-purple-400/15 to-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-400/30 dark:border-violet-500/25 ${className}`}
      title={t("earlyAdopter.tooltip")}
    >
      <MedalIcon className={s.icon} />
      <span>{t("earlyAdopter.label")}</span>
    </span>
  );
}
