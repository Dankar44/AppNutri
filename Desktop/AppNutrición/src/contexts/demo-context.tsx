"use client";

import { createContext, useContext, useCallback } from "react";
import { toast } from "sonner";

const DemoContext = createContext(false);

export function DemoProvider({
  isDemo,
  children,
}: {
  isDemo: boolean;
  children: React.ReactNode;
}) {
  return <DemoContext value={isDemo}>{children}</DemoContext>;
}

export function useIsDemo() {
  return useContext(DemoContext);
}

export function useDemoGuard() {
  const isDemo = useContext(DemoContext);
  return useCallback(() => {
    if (isDemo) {
      toast.info(
        "Estás explorando la demo. ¿Necesitas una cuenta? Habla con la persona que te ha contactado para obtener una.",
        { id: "demo-blocked", duration: 6000 },
      );
      return true;
    }
    return false;
  }, [isDemo]);
}
