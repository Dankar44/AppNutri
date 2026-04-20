"use client";

import { Toaster } from "sonner";
import { useTheme } from "./theme-provider";

export function ThemeAwareToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      closeButton
      offset={16}
      toastOptions={{
        className: "sm:!mr-4 sm:!mt-4",
      }}
    />
  );
}
