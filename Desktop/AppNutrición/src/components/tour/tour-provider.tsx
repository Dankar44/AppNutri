"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToursByAudience, getTourById, type Tour, type TourStep } from "@/lib/tour-data";

interface TourContextType {
  activeTour: Tour | null;
  currentStepIndex: number;
  currentStep: TourStep | null;
  completedTours: string[];
  isFirstVisit: boolean;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
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
  const tours = getToursByAudience(audience);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const completed = getCompleted(audience);
    setCompletedTours(completed);
    // First visit = no tours completed and no welcome dismissed
    const welcomeDismissed = localStorage.getItem(`annonia-welcome-${audience}`);
    setIsFirstVisit(completed.length === 0 && !welcomeDismissed);
    setMounted(true);
  }, [audience]);

  const startTour = useCallback((tourId: string) => {
    const tour = getTourById(tourId);
    if (!tour) return;
    setActiveTour(tour);
    setCurrentStepIndex(0);
    // Navigate to first step's route if needed
    if (tour.steps[0]?.route) {
      router.push(tour.steps[0].route);
    }
  }, [router]);

  const completeTour = useCallback(() => {
    if (!activeTour) return;
    const newCompleted = [...new Set([...completedTours, activeTour.id])];
    setCompletedTours(newCompleted);
    setCompleted(audience, newCompleted);
    setActiveTour(null);
    setCurrentStepIndex(0);
  }, [activeTour, completedTours, audience]);

  const nextStep = useCallback(() => {
    if (!activeTour) return;
    if (currentStepIndex >= activeTour.steps.length - 1) {
      completeTour();
      return;
    }
    const nextIdx = currentStepIndex + 1;
    const nextStepData = activeTour.steps[nextIdx];
    if (nextStepData?.route) {
      router.push(nextStepData.route);
    }
    setCurrentStepIndex(nextIdx);
  }, [activeTour, currentStepIndex, completeTour, router]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      const prevStepData = activeTour?.steps[prevIdx];
      if (prevStepData?.route) {
        router.push(prevStepData.route);
      }
      setCurrentStepIndex(prevIdx);
    }
  }, [currentStepIndex, activeTour, router]);

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
      startTour, nextStep, prevStep, skipTour, dismissWelcome, resetAllTours,
      audience, tours,
    }}>
      {children}
    </TourContext.Provider>
  );
}
