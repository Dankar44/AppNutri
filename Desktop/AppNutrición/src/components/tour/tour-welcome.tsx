"use client";

import { Leaf, Rocket, X } from "lucide-react";
import { useTour } from "./tour-provider";

export function TourWelcome() {
  const ctx = useTour();
  if (!ctx) return null;
  const { isFirstVisit, dismissWelcome, startTour, audience, tours } = ctx;

  if (!isFirstVisit) return null;

  const firstTourId = tours[0]?.id;

  function handleStart() {
    dismissWelcome();
    if (firstTourId) startTour(firstTourId);
  }

  function handleSkip() {
    dismissWelcome();
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-8 text-center relative">
        <button onClick={handleSkip} className="absolute top-4 right-4 p-1 rounded hover:bg-muted text-muted-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Leaf className="w-9 h-9 text-primary" />
        </div>

        <h2 className="text-xl font-bold mb-2">
          {audience === "dietista" ? "¡Bienvenido a NutriApp!" : "¡Bienvenido a tu portal!"}
        </h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {audience === "dietista"
            ? "Te guiaremos paso a paso por las funcionalidades de la plataforma para que saques el máximo provecho desde el primer día."
            : "Te mostraremos cómo usar tu portal de nutrición: ver tu dieta, registrar comidas, seguir tu evolución y más."}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleStart}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Rocket className="w-4 h-4" />
            Empezar tour guiado
          </button>
          <button
            onClick={handleSkip}
            className="w-full px-6 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
          >
            Saltar, ya conozco la app
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground mt-4">
          Puedes reactivar las guías en cualquier momento desde {audience === "dietista" ? "Ajustes" : "Mi perfil"}
        </p>
      </div>
    </div>
  );
}
