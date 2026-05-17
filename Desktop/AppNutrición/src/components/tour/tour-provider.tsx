"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getToursByAudience, getTourById, type Tour, type TourStep } from "@/lib/tour-data";

interface TourContextType {
  activeTour: Tour | null;
  currentStepIndex: number;
  currentStep: TourStep | null;
  completedTours: string[];
  isFirstVisit: boolean;
  transitioning: boolean;
  pathname: string;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  settleStep: () => void;
  dismissWelcome: () => void;
  resetAllTours: () => void;
  audience: "dietista" | "paciente";
  tours: Tour[];
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  return useContext(TourContext);
}

function getStorageKey(audience: string) {
  return `annonia-tours-${audience}`;
}

function getCompleted(audience: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(audience));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setCompleted(audience: string, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(audience), JSON.stringify(ids));
}

interface Props {
  audience: "dietista" | "paciente";
  children: ReactNode;
}

export function TourProvider({ audience, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const tours = getToursByAudience(audience, t);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const completed = getCompleted(audience);
    setCompletedTours(completed);
    const welcomeDismissed = localStorage.getItem(`annonia-welcome-${audience}`);
    setIsFirstVisit(completed.length === 0 && !welcomeDismissed);
    setMounted(true);
  }, [audience]);

  const settleStep = useCallback(() => {
    setTransitioning(false);
    isNavigatingRef.current = false;
  }, []);

  const startTour = useCallback((tourId: string) => {
    const tour = getTourById(tourId, t);
    if (!tour) return;
    setActiveTour(tour);
    setCurrentStepIndex(0);
    if (tour.steps[0]?.route && tour.steps[0].route !== pathname) {
      setTransitioning(true);
      isNavigatingRef.current = true;
      router.push(tour.steps[0].route);
    }
  }, [router, pathname, t]);

  const completeTour = useCallback(() => {
    if (!activeTour) return;
    const newCompleted = [...new Set([...completedTours, activeTour.id])];
    setCompletedTours(newCompleted);
    setCompleted(audience, newCompleted);
    setActiveTour(null);
    setCurrentStepIndex(0);
    setTransitioning(false);
    isNavigatingRef.current = false;
  }, [activeTour, completedTours, audience]);

  const nextStep = useCallback(() => {
    if (!activeTour || isNavigatingRef.current) return;
    if (currentStepIndex >= activeTour.steps.length - 1) {
      completeTour();
      return;
    }
    const nextIdx = currentStepIndex + 1;
    const nextStepData = activeTour.steps[nextIdx];
    if (nextStepData?.route && nextStepData.route !== pathname) {
      setTransitioning(true);
      isNavigatingRef.current = true;
      router.push(nextStepData.route);
    }
    setCurrentStepIndex(nextIdx);
  }, [activeTour, currentStepIndex, completeTour, router, pathname]);

  const prevStep = useCallback(() => {
    if (currentStepIndex <= 0 || isNavigatingRef.current) return;
    const prevIdx = currentStepIndex - 1;
    const prevStepData = activeTour?.steps[prevIdx];
    if (prevStepData?.route && prevStepData.route !== pathname) {
      setTransitioning(true);
      isNavigatingRef.current = true;
      router.push(prevStepData.route);
    }
    setCurrentStepIndex(prevIdx);
  }, [currentStepIndex, activeTour, router, pathname]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const dismissWelcome = useCallback(() => {
    setIsFirstVisit(false);
    localStorage.setItem(`annonia-welcome-${audience}`, "true");
  }, [audience]);

  const resetAllTours = useCallback(() => {
    setCompletedTours([]);
    setCompleted(audience, []);
    localStorage.removeItem(`annonia-welcome-${audience}`);
    setIsFirstVisit(true);
  }, [audience]);

  const currentStep = activeTour?.steps[currentStepIndex] || null;

  return (
    <TourContext.Provider value={{
      activeTour, currentStepIndex, currentStep, completedTours, isFirstVisit: mounted && isFirstVisit,
      transitioning, pathname,
      startTour, nextStep, prevStep, skipTour, settleStep, dismissWelcome, resetAllTours,
      audience, tours,
    }}>
      {children}
    </TourContext.Provider>
  );
}
