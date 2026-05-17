"use client";

import { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTour } from "./tour-provider";

interface Rect { top: number; left: number; width: number; height: number; }

export function TourOverlay() {
  const ctx = useTour();
  if (!ctx?.activeTour) return null;
  return <TourOverlayContent />;
}

function TourOverlayContent() {
  const ctx = useTour()!;
  const t = useTranslations("settings.tours.overlay");
  const { activeTour, currentStep, currentStepIndex, nextStep, prevStep, skipTour, transitioning, pathname, settleStep } = ctx;
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [searching, setSearching] = useState(false);
  const [settled, setSettled] = useState(false);
  const rafRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elRef = useRef<Element | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipH, setTooltipH] = useState(220);
  const prevStepRef = useRef(currentStepIndex);

  // Reset state synchronously when step changes — prevents flash of old position
  if (prevStepRef.current !== currentStepIndex) {
    prevStepRef.current = currentStepIndex;
    setTargetRect(null);
    setSearching(true);
    setSettled(false);
    elRef.current = null;
  }

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
  }, []);

  const findTarget = useCallback(() => {
    clearTimers();
    setTargetRect(null);
    elRef.current = null;

    if (!currentStep?.target) {
      if (currentStep?.route && pathname !== currentStep.route) {
        setSearching(true);
        setSettled(false);
        return;
      }
      if (currentStep?.route) {
        setSearching(true);
        timerRef.current = setTimeout(() => {
          setSearching(false);
          setSettled(true);
          settleStep();
        }, 500);
      } else {
        setSearching(false);
        setSettled(true);
        settleStep();
      }
      return;
    }

    if (currentStep.route && pathname !== currentStep.route) {
      setSearching(true);
      setSettled(false);
      return;
    }

    setSearching(true);
    setSettled(false);
    let attempts = 0;
    const maxAttempts = 15;

    function poll() {
      const el = document.querySelector(`[data-tour="${currentStep!.target}"]`);
      if (el) {
        const target = el;
        elRef.current = target;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        let lastTop = target.getBoundingClientRect().top;
        let stableCount = 0;
        let scrollChecks = 0;
        const maxScrollChecks = 40;

        function waitForScrollEnd() {
          scrollChecks++;
          if (!target.isConnected) {
            setTargetRect(null);
            setSearching(false);
            setSettled(true);
            settleStep();
            return;
          }
          const rect = target.getBoundingClientRect();
          if (Math.abs(rect.top - lastTop) < 3) {
            stableCount++;
          } else {
            stableCount = 0;
          }
          lastTop = rect.top;

          if (stableCount >= 4 || scrollChecks >= maxScrollChecks) {
            setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
            setSearching(false);
            setSettled(true);
            settleStep();
            return;
          }
          timerRef.current = setTimeout(waitForScrollEnd, 50);
        }
        timerRef.current = setTimeout(waitForScrollEnd, 50);
        return;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        setTargetRect(null);
        elRef.current = null;
        setSearching(false);
        setSettled(true);
        settleStep();
        return;
      }
      pollRef.current = setTimeout(poll, 200);
    }

    poll();
  }, [currentStepIndex, pathname, settleStep, clearTimers, currentStep?.target, currentStep?.route]);

  useEffect(() => {
    findTarget();
    return clearTimers;
  }, [currentStepIndex, findTarget, clearTimers]);

  useEffect(() => {
    if (currentStep?.route && pathname === currentStep.route && searching && !timerRef.current && !pollRef.current) {
      findTarget();
    }
  }, [pathname, currentStep?.route, searching, findTarget]);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = elRef.current;
      if (el && el.isConnected) {
        const rect = el.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    const mainEl = document.querySelector("main");
    mainEl?.addEventListener("scroll", scheduleUpdate);
    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      mainEl?.removeEventListener("scroll", scheduleUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate]);

  // Re-read rect 300ms after settle to absorb late layout shifts (Safari address bar)
  useEffect(() => {
    if (!settled || !elRef.current) return;
    const id = setTimeout(() => {
      const el = elRef.current;
      if (el && el.isConnected) {
        const rect = el.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [settled]);

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const h = tooltipRef.current.offsetHeight;
      if (h !== tooltipH) setTooltipH(h);
    }
  });

  if (!activeTour || !currentStep) return null;

  const totalSteps = activeTour.steps.length;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;
  const isIntro = !currentStep.target;
  const busy = searching || transitioning || (!settled && !isIntro);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 480;
  const pad = 6;

  const tooltipWidth = typeof window !== "undefined" ? Math.min(340, window.innerWidth - 32) : 340;
  const tooltipStyle: React.CSSProperties = { position: "fixed", zIndex: 61, maxWidth: tooltipWidth, width: "calc(100vw - 2rem)" };
  const targetTooBig = targetRect && typeof window !== "undefined" &&
    targetRect.width > window.innerWidth * 0.95;

  if (targetRect && !busy && !targetTooBig) {
    const preferred = isMobile ? "bottom" : (currentStep.position || "bottom");
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height + pad);
    const spaceAbove = targetRect.top - pad;

    let pos = preferred;
    if (pos === "bottom" && spaceBelow < tooltipH + 16 && spaceAbove > tooltipH + 16) pos = "top";
    else if (pos === "top" && spaceAbove < tooltipH + 16 && spaceBelow > tooltipH + 16) pos = "bottom";
    else if ((pos === "left" || pos === "right") && isMobile) pos = "bottom";

    const fitsVertically = spaceBelow >= tooltipH + 16 || spaceAbove >= tooltipH + 16;
    if (!fitsVertically && (pos === "top" || pos === "bottom")) {
      tooltipStyle.top = "50%";
      tooltipStyle.left = "50%";
      tooltipStyle.transform = "translate(-50%, -50%)";
    } else if (pos === "bottom") {
      tooltipStyle.top = targetRect.top + targetRect.height + pad + 8;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - tooltipWidth - 16));
    } else if (pos === "top") {
      tooltipStyle.bottom = window.innerHeight - targetRect.top + pad + 8;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - tooltipWidth - 16));
    } else if (pos === "right") {
      tooltipStyle.top = Math.max(16, Math.min(targetRect.top, window.innerHeight - tooltipH - 16));
      tooltipStyle.left = Math.min(targetRect.left + targetRect.width + pad + 8, window.innerWidth - tooltipWidth - 16);
    } else {
      tooltipStyle.top = Math.max(16, Math.min(targetRect.top, window.innerHeight - tooltipH - 16));
      tooltipStyle.right = Math.max(16, window.innerWidth - targetRect.left + pad + 8);
    }
  } else {
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  const showHighlight = targetRect && !isIntro && !targetTooBig && !busy;

  const clipPath = showHighlight
    ? `polygon(0% 0%, 0% 100%, ${targetRect!.left - pad}px 100%, ${targetRect!.left - pad}px ${targetRect!.top - pad}px, ${targetRect!.left + targetRect!.width + pad}px ${targetRect!.top - pad}px, ${targetRect!.left + targetRect!.width + pad}px ${targetRect!.top + targetRect!.height + pad}px, ${targetRect!.left - pad}px ${targetRect!.top + targetRect!.height + pad}px, ${targetRect!.left - pad}px 100%, 100% 100%, 100% 0%)`
    : undefined;

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] ${isIntro || targetTooBig ? "bg-black/30" : "bg-black/50"}`}
        style={clipPath ? { clipPath } : undefined}
        onClick={(e) => e.stopPropagation()}
      />
      {showHighlight && (
        <div
          className="fixed z-[60] border-2 border-primary rounded-lg pointer-events-none transition-all duration-300 will-change-transform"
          style={{ top: targetRect!.top - pad, left: targetRect!.left - pad, width: targetRect!.width + pad * 2, height: targetRect!.height + pad * 2 }}
        />
      )}
      {targetRect && !isIntro && targetTooBig && !busy && (
        <div
          className="fixed z-[60] h-0.5 bg-primary pointer-events-none animate-pulse"
          style={{ top: targetRect.top - 2, left: 0, width: "100%" }}
        />
      )}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className={`bg-card rounded-xl border border-border shadow-2xl p-4 sm:p-5 ${busy ? "opacity-0 pointer-events-none" : "opacity-100 transition-opacity duration-150"}`}
      >
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0">
              <p className="text-xs text-primary font-medium mb-0.5 truncate">{activeTour.name}</p>
              <h3 className="font-semibold text-sm">{currentStep.title}</h3>
            </div>
            <button onClick={skipTour} className="p-1.5 rounded hover:bg-muted text-muted-foreground shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{currentStep.description}</p>
          {settled && !targetRect && currentStep.target && (
            <p className="text-xs text-muted-foreground/60 mb-3 italic">{t("elementNotFound")}</p>
          )}
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
            <span className="sm:hidden">{t("stepShort", { current: currentStepIndex + 1, total: totalSteps })}</span>
            <span className="hidden sm:inline">{t("stepOf", { current: currentStepIndex + 1, total: totalSteps })}</span>
          </span>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prevStep}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3 h-3" /> {t("previous")}
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLast ? t("finish") : t("next")}{!isLast && <ChevronRight className="w-3 h-3" />}
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
