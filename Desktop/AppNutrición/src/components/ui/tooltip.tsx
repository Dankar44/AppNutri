"use client";

import { useState, useRef, useId, useEffect, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 200,
  className = "",
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  useEffect(() => setMounted(true), []);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }

  // Recalcular coords cuando se abre
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tipRect = tooltipRef.current?.getBoundingClientRect();
    const tw = tipRect?.width ?? 260;
    const th = tipRect?.height ?? 60;
    const gap = 6;
    let top = 0;
    let left = 0;
    switch (side) {
      case "top":
        top = rect.top - th - gap;
        left = rect.left + rect.width / 2 - tw / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tw / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - th / 2;
        left = rect.left - tw - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - th / 2;
        left = rect.right + gap;
        break;
    }
    // Clamp dentro del viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - th - 8));
    setCoords({ top, left });
  }, [open, side]);

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(e) => {
        if (e.key === "Escape") hide();
      }}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {mounted && open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? "visible" : "hidden",
            }}
            className="pointer-events-none fixed z-[100] px-2.5 py-2 rounded-md bg-card text-card-foreground border border-border shadow-lg text-xs w-64 whitespace-normal leading-snug"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
