"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

type Props = {
  /** "icon" = solo botón redondo. "inline" = botón con texto (para mobile menú). */
  variant?: "icon" | "inline";
  className?: string;
};

export function ThemeToggle({ variant = "icon", className }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    toggleTheme({
      origin: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    });
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        className={
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full " +
          (className ?? "")
        }
      >
        <span className="relative w-5 h-5 shrink-0">
          <Sun
            className={
              "absolute inset-0 w-5 h-5 transition-all duration-500 " +
              (isDark
                ? "-rotate-90 scale-50 opacity-0"
                : "rotate-0 scale-100 opacity-100")
            }
            strokeWidth={1.75}
          />
          <Moon
            className={
              "absolute inset-0 w-5 h-5 transition-all duration-500 " +
              (isDark
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-90 scale-50 opacity-0")
            }
            strokeWidth={1.75}
          />
        </span>
        <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={
        "relative w-9 h-9 rounded-lg hover:bg-muted transition-colors flex items-center justify-center text-foreground " +
        (className ?? "")
      }
    >
      <Sun
        className={
          "absolute w-5 h-5 transition-all duration-500 " +
          (isDark
            ? "-rotate-90 scale-50 opacity-0"
            : "rotate-0 scale-100 opacity-100")
        }
        strokeWidth={1.75}
      />
      <Moon
        className={
          "absolute w-5 h-5 transition-all duration-500 " +
          (isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-50 opacity-0")
        }
        strokeWidth={1.75}
      />
    </button>
  );
}
