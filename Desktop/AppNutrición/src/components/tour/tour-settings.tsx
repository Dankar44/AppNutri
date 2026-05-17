"use client";

import { useState } from "react";
import { Play, Check, RotateCcw, GraduationCap, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTour } from "./tour-provider";

export function TourSettings() {
  const t = useTranslations("settings.tours.settings");
  const ctx = useTour();
  const [expanded, setExpanded] = useState(false);

  if (!ctx) return null;
  const { tours, completedTours, startTour, resetAllTours } = ctx;

  const completedCount = tours.filter((t) => completedTours.includes(t.id)).length;
  const previewCount = 3;
  const visibleTours = expanded ? tours : tours.slice(0, previewCount);

  return (
    <section className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          {t("title")}
        </h2>
        {completedTours.length > 0 && (
          <button onClick={resetAllTours} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> {t("reset")}
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {t("progress", { completed: completedCount, total: tours.length })}
      </p>

      <div className="space-y-2">
        {visibleTours.map((tour) => {
          const isCompleted = completedTours.includes(tour.id);
          return (
            <div key={tour.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isCompleted ? "border-border bg-muted/30" : "border-border hover:border-primary/30"}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{tour.name}</p>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
                      <Check className="w-2.5 h-2.5" /> {t("completed")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{tour.description}</p>
              </div>
              <button onClick={() => startTour(tour.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors shrink-0 ml-3">
                <Play className="w-3 h-3" /> {isCompleted ? t("repeat") : t("start")}
              </button>
            </div>
          );
        })}
      </div>

      {tours.length > previewCount && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 py-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? t("showLess") : t("showMore", { count: tours.length - previewCount })}
        </button>
      )}
    </section>
  );
}
