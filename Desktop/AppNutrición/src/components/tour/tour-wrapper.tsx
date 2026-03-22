"use client";

import type { ReactNode } from "react";
import { TourProvider } from "./tour-provider";
import { TourOverlay } from "./tour-overlay";
import { TourWelcome } from "./tour-welcome";

interface Props {
  audience: "dietista" | "paciente";
  children: ReactNode;
}

export function TourWrapper({ audience, children }: Props) {
  return (
    <TourProvider audience={audience}>
      {children}
      <TourOverlay />
      <TourWelcome />
    </TourProvider>
  );
}
