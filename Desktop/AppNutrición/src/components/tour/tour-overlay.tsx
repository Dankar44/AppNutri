"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTour } from "./tour-provider";

interface Rect { top: number; left: number; width: number; height: number; }

export function TourOverlay() {
  const ctx = useTour();
  if (!ctx?.activeTour) return null;
  return <TourOverlayContent />;
}

function TourOverlayContent() {
  const ctx = useTour()!;
  const { activeTour, currentStep, currentStepIndex, nextStep, prevStep, skipTour } = ctx;
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const rafRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const elRef = useRef<Element | null>(null);

  const findTarget = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!currentStep?.target) { setTargetRect(null); elRef.current = null; return; }
    timerRef.current = setTimeout(() => {
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
      elRef.current = el;
      if (!el) { setTargetRect(null); return; }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      timerRef.current = setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }, 400);
    }, 300);
  }, [currentStep]);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = elRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }
    });
  }, []);

  useEffect(() => {
    findTarget();
    window.addEventListener("resize", scheduleUpdate);
    const mainEl = document.querySelector("main");
    mainEl?.addEventListener("scroll", scheduleUpdate);
    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      mainEl?.removeEventListener("scroll", scheduleUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [findTarget, scheduleUpdate, currentStepIndex]);

  if (!activeTour || !currentStep) return null;

  const totalSteps = activeTour.steps.length;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;
  const pad = 8;
  const tooltipH = 220;
  const tooltipStyle: React.CSSProperties = { position: "fixed", zIndex: 61, maxWidth: "340px" };

  if (targetRect) {
    const preferred = currentStep.position || "bottom";
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height + pad);
    const spaceAbove = targetRect.top - pad;
    const pos = preferred === "bottom" && spaceBelow < tooltipH && spaceAbove > tooltipH ? "top"
      : preferred === "top" && spaceAbove < tooltipH && spaceBelow > tooltipH ? "bottom" : preferred;
    if (pos === "bottom") { tooltipStyle.top = targetRect.top + targetRect.height + pad + 8; tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 360)); }
    else if (pos === "top") { tooltipStyle.bottom = window.innerHeight - targetRect.top + pad + 8; tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 360)); }
    else if (pos === "right") { tooltipStyle.top = Math.max(16, Math.min(targetRect.top, window.innerHeight - tooltipH - 16)); tooltipStyle.left = Math.min(targetRect.left + targetRect.width + pad + 8, window.innerWidth - 360); }
    else { tooltipStyle.top = Math.max(16, Math.min(targetRect.top, window.innerHeight - tooltipH - 16)); tooltipStyle.right = Math.max(16, window.innerWidth - targetRect.left + pad + 8); }
  } else { tooltipStyle.top = "50%"; tooltipStyle.left = "50%"; tooltipStyle.transform = "translate(-50%, -50%)"; }

  const clipPath = targetRect
    ? `polygon(0% 0%, 0% 100%, ${targetRect.left - pad}px 100%, ${targetRect.left - pad}px ${targetRect.top - pad}px, ${targetRect.left + targetRect.width + pad}px ${targetRect.top - pad}px, ${targetRect.left + targetRect.width + pad}px ${targetRect.top + targetRect.height + pad}px, ${targetRect.left - pad}px ${targetRect.top + targetRect.height + pad}px, ${targetRect.left - pad}px 100%, 100% 100%, 100% 0%)`
    : undefined;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" style={clipPath ? { clipPath } : undefined} onClick={skipTour} />
      {targetRect && (
        <div className="fixed z-[60] border-2 border-primary rounded-lg pointer-events-none"
          style={{ top: targetRect.top - pad, left: targetRect.left - pad, width: targetRect.width + pad * 2, height: targetRect.height + pad * 2 }} />
      )}
      <div style={tooltipStyle} className="bg-card rounded-xl border border-border shadow-2xl p-4 sm:p-5 w-[calc(100vw-2rem)] max-w-[340px]">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-primary font-medium mb-0.5">{activeTour.name}</p>
            <h3 className="font-semibold text-sm">{currentStep.title}</h3>
          </div>
          <button onClick={skipTour} className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{currentStep.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Paso {currentStepIndex + 1} de {totalSteps}</span>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button onClick={prevStep} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted">
                <ChevronLeft className="w-3 h-3" /> Anterior
              </button>
            )}
            <button onClick={nextStep} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
              {isLast ? "Finalizar" : "Siguiente"}{!isLast && <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-3">
          {activeTour.steps.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStepIndex ? "bg-primary" : i < currentStepIndex ? "bg-primary/40" : "bg-border"}`} />
          ))}
        </div>
      </div>
    </>
  );
}
