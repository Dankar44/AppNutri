"use client";

import { type PdfColorTheme, TEMAS_PDF } from "@/lib/pdf/pdf-themes";

interface Props {
  theme: PdfColorTheme;
  brandName: string;
  logoUrl?: string | null;
}

export function PdfPreview({ theme, brandName, logoUrl }: Props) {
  const t = theme;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white shadow-sm" style={{ width: 280, height: 200 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 text-white text-[8px]" style={{ backgroundColor: t.primary }}>
        <div>
          <span className="font-bold">NOMBRE PACIENTE</span>
          <br />
          <span style={{ opacity: 0.85 }}>PLAN DIETÉTICO SEMANAL</span>
        </div>
        <div className="font-extrabold text-[10px]">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-4 max-w-[60px] object-contain" />
          ) : (
            brandName
          )}
        </div>
      </div>

      {/* Section title */}
      <div
        className="text-center font-bold text-[7px] py-1 mx-2 mt-1.5 rounded"
        style={{ backgroundColor: t.sectionBg, color: t.textMedium, border: `1px solid ${t.border}` }}
      >
        PLAN DIETÉTICO SEMANAL
      </div>

      {/* Mini table */}
      <div className="mx-2 mt-1.5">
        <div className="flex text-[6px] text-white font-bold" style={{ backgroundColor: t.primary }}>
          <div className="w-8 px-1 py-0.5" />
          <div className="flex-1 px-1 py-0.5 text-center">Lun</div>
          <div className="flex-1 px-1 py-0.5 text-center">Mar</div>
          <div className="flex-1 px-1 py-0.5 text-center">Mié</div>
          <div className="flex-1 px-1 py-0.5 text-center">Jue</div>
          <div className="flex-1 px-1 py-0.5 text-center">Vie</div>
        </div>
        {["Desayuno", "Almuerzo", "Cena"].map((meal, i) => (
          <div key={meal} className="flex text-[5px]" style={{ backgroundColor: i % 2 === 0 ? "white" : t.lightBg }}>
            <div className="w-8 px-1 py-0.5 text-white font-bold text-center" style={{ backgroundColor: t.accent }}>
              {meal.slice(0, 3)}
            </div>
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="flex-1 px-1 py-0.5 text-center"
                style={{ color: t.textMedium, borderBottom: `0.5px solid ${t.borderLight}` }}
              >
                ···
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Macros row */}
      <div
        className="flex justify-center gap-3 mx-2 mt-1.5 py-1 rounded text-[6px]"
        style={{ backgroundColor: t.sectionBg, border: `1px solid ${t.borderLight}` }}
      >
        <span style={{ color: "#c88a5c", fontWeight: 700 }}>1800 kcal</span>
        <span style={{ color: "#7d9bb5", fontWeight: 700 }}>90g P</span>
        <span style={{ color: "#6b9e80", fontWeight: 700 }}>220g C</span>
        <span style={{ color: "#c97e79", fontWeight: 700 }}>60g G</span>
      </div>

      {/* Footer */}
      <div className="text-center text-[6px] text-[#a3b0a6] mt-2 pt-1 mx-2" style={{ borderTop: `0.5px solid ${t.borderLight}` }}>
        {brandName} &mdash; 3 de mayo de 2026
        <div className="text-[5px] text-[#c0c8c3] mt-0.5">annonia.com</div>
      </div>
    </div>
  );
}
