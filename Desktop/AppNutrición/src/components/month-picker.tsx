"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function MonthPicker({
  value,
  onChange,
  placeholder = "Seleccionar mes",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split("-")[0]);
    return new Date().getFullYear();
  });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const selectedYear = value ? parseInt(value.split("-")[0]) : null;
  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : null;

  // Position the dropdown relative to the button
  useEffect(() => {
    if (!open) return;
    function updatePos() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dropH = 280;
      const spaceBelow = window.innerHeight - r.bottom;
      setPos({
        top: spaceBelow > dropH ? r.bottom + window.scrollY + 4 : r.top + window.scrollY - dropH - 4,
        left: r.left + window.scrollX,
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      const btn = anchorRef.current;
      const drop = document.getElementById("month-picker-dropdown");
      const t = e.target as Node | null;
      if (!t) return;
      if (btn && btn.contains(t)) return;
      if (drop && drop.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [open]);

  function selectMonth(month: number) {
    const mm = String(month + 1).padStart(2, "0");
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  function handleThisMonth() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    onChange(`${now.getFullYear()}-${mm}`);
    setViewYear(now.getFullYear());
    setOpen(false);
  }

  const displayText = value
    ? `${MESES_LARGOS[selectedMonth!]} de ${selectedYear}`
    : "";

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background text-sm hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className={displayText ? "font-medium" : "text-muted-foreground"}>
          {displayText || placeholder}
        </span>
      </button>

      {open && pos
        ? createPortal(
            <div
              id="month-picker-dropdown"
              className="w-64 rounded-xl border border-border bg-card shadow-xl p-3"
              style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
            >
              {/* Year nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold">{viewYear}</span>
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {MESES_CORTOS.map((mes, i) => {
                  const isSelected = selectedYear === viewYear && selectedMonth === i;
                  return (
                    <button
                      key={mes}
                      type="button"
                      onClick={() => selectMonth(i)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 text-foreground"
                      }`}
                    >
                      {mes}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={handleThisMonth}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Este mes
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
