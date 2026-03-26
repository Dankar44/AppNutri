"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function FichaAccordion({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2.5 font-semibold text-foreground">
          <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
          {title}
        </span>
        <ChevronUp
          className={cn(
            "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
            !open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-border/60 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
