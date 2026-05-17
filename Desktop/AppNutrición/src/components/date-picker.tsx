"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const DROP_W = 280;
const DROP_H = 340;

function parseTypedDate(input: string, pastOnly: boolean): string | null {
  const clean = input.replace(/[^\d]/g, "");
  if (clean.length !== 8) return null;
  const day = parseInt(clean.slice(0, 2));
  const month = parseInt(clean.slice(2, 4));
  const year = parseInt(clean.slice(4, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  const maxDays = new Date(year, month, 0).getDate();
  if (day > maxDays) return null;
  if (pastOnly && new Date(year, month - 1, day) > new Date()) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTypedInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function DatePicker({
  value,
  onChange,
  required,
  placeholder,
  pastOnly = false,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  pastOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typedValue, setTypedValue] = useState(() => value ? formatDisplay(value) : "");
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split("-")[0]);
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.split("-")[1]) - 1;
    return new Date().getMonth();
  });
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTypedValue(value ? formatDisplay(value) : "");
  }, [value]);

  const calcPos = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 480;

    const top = rect.bottom + DROP_H > vh
      ? Math.max(8, rect.top - DROP_H - 4)
      : rect.bottom + 4;

    const left = isMobile
      ? Math.max(8, (vw - DROP_W) / 2)
      : Math.max(8, Math.min(rect.left, vw - DROP_W - 8));

    setPos({ top, left });
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setShowYearGrid(false);
      }
    }
    function handleScroll() { calcPos(); }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, calcPos]);

  function toggle() {
    if (!open) calcPos();
    setOpen(!open);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
    setShowYearGrid(false);
  }

  function selectYear(y: number) {
    setViewYear(y);
    setShowYearGrid(false);
  }

  const selectedParts = value ? value.split("-").map(Number) : null;
  const isSelected = (day: number) =>
    selectedParts &&
    selectedParts[0] === viewYear &&
    selectedParts[1] === viewMonth + 1 &&
    selectedParts[2] === day;

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);
  const currentYear = new Date().getFullYear();
  const yearRangeStart = Math.floor((viewYear - 6) / 12) * 12;

  return (
    <div className="relative" ref={ref}>
      <div
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-card transition-shadow text-sm ${
          open ? "border-primary ring-2 ring-ring" : "border-input hover:border-primary/40"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder={placeholder ?? "dd/mm/aaaa"}
          value={typedValue}
          onChange={(e) => {
            const formatted = formatTypedInput(e.target.value);
            setTypedValue(formatted);
            const digits = formatted.replace(/[^\d]/g, "");
            if (digits.length === 8) {
              const parsed = parseTypedDate(formatted, pastOnly);
              if (parsed) {
                onChange(parsed);
                const [y, m] = parsed.split("-").map(Number);
                setViewYear(y);
                setViewMonth(m - 1);
              }
            }
          }}
          onBlur={() => {
            if (!typedValue) {
              onChange("");
              return;
            }
            const parsed = parseTypedDate(typedValue, pastOnly);
            if (parsed) {
              onChange(parsed);
            } else {
              setTypedValue(value ? formatDisplay(value) : "");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              inputRef.current?.blur();
            }
          }}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
        />
        <button
          type="button"
          onClick={toggle}
          className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
        >
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {required && !value && (
        <input
          type="text"
          required
          value=""
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      )}

      {open && (
        <div
          ref={dropRef}
          style={{ top: pos.top, left: pos.left, width: DROP_W }}
          className="fixed z-[9999] bg-card rounded-xl border border-border shadow-xl p-3"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors touch-manipulation">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setShowYearGrid(!showYearGrid)} className="text-sm font-semibold hover:text-primary transition-colors">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </button>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors touch-manipulation">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {showYearGrid ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setViewYear((y) => y - 12)} className="p-1.5 rounded-md hover:bg-muted transition-colors touch-manipulation">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-muted-foreground">
                  {yearRangeStart} – {yearRangeStart + 11}
                </span>
                <button type="button" onClick={() => setViewYear((y) => y + 12)} className="p-1.5 rounded-md hover:bg-muted transition-colors touch-manipulation">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    disabled={pastOnly && y > currentYear}
                    onClick={() => selectYear(y)}
                    className={`py-2 text-xs rounded-md transition-colors touch-manipulation ${
                      y === viewYear
                        ? "bg-primary text-primary-foreground font-semibold"
                        : pastOnly && y > currentYear
                          ? "text-muted-foreground/40"
                          : "hover:bg-primary/10 text-foreground"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((label) => (
                  <div key={label} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: startDay }, (_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {Array.from({ length: totalDays }, (_, i) => {
                  const day = i + 1;
                  const sel = isSelected(day);
                  const tod = isToday(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`w-9 h-9 mx-auto text-sm rounded-lg transition-colors touch-manipulation ${
                        sel
                          ? "bg-primary text-primary-foreground font-semibold"
                          : tod
                            ? "border border-primary text-primary font-medium"
                            : "hover:bg-primary/10 active:bg-primary/20 text-foreground"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1 touch-manipulation"
                >
                  Borrar
                </button>
                <button
                  type="button"
                  onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
                  className="text-xs text-primary font-medium hover:text-primary/80 transition-colors py-1 touch-manipulation"
                >
                  Hoy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
