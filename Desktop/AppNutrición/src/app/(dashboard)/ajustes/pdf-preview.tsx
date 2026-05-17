"use client";

import { type PdfColorTheme, TEMAS_PDF } from "@/lib/pdf/pdf-themes";
import { useTranslations } from "next-intl";

interface Props {
  theme: PdfColorTheme;
  brandName: string;
  logoUrl?: string | null;
}

export function PdfPreview({ theme, brandName, logoUrl }: Props) {
  const t = useTranslations("settings.pdfPreview");
  const th = theme;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white shadow-sm" style={{ width: 280, height: 200 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 text-white text-[8px]" style={{ backgroundColor: th.primary }}>
        <div>
          <span className="font-bold">{t("nombrePaciente")}</span>
          <br />
          <span style={{ opacity: 0.85 }}>{t("planDieteticoSemanal")}</span>
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
        style={{ backgroundColor: th.sectionBg, color: th.textMedium, border: `1px solid ${th.border}` }}
      >
        {t("planDieteticoSemanal")}
      </div>

      {/* Mini table */}
      <div className="mx-2 mt-1.5">
        <div className="flex text-[6px] text-white font-bold" style={{ backgroundColor: th.primary }}>
          <div className="w-8 px-1 py-0.5" />
          <div className="flex-1 px-1 py-0.5 text-center">{t("diasCortos.lun")}</div>
          <div className="flex-1 px-1 py-0.5 text-center">{t("diasCortos.mar")}</div>
          <div className="flex-1 px-1 py-0.5 text-center">{t("diasCortos.mie")}</div>
          <div className="flex-1 px-1 py-0.5 text-center">{t("diasCortos.jue")}</div>
          <div className="flex-1 px-1 py-0.5 text-center">{t("diasCortos.vie")}</div>
        </div>
        {(["desayuno", "almuerzo", "cena"] as const).map((mealKey, i) => (
          <div key={mealKey} className="flex text-[5px]" style={{ backgroundColor: i % 2 === 0 ? "white" : th.lightBg }}>
            <div className="w-8 px-1 py-0.5 text-white font-bold text-center" style={{ backgroundColor: th.accent }}>
              {t(`comidas.${mealKey}`).slice(0, 3)}
            </div>
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="flex-1 px-1 py-0.5 text-center"
                style={{ color: th.textMedium, borderBottom: `0.5px solid ${th.borderLight}` }}
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
        style={{ backgroundColor: th.sectionBg, border: `1px solid ${th.borderLight}` }}
      >
        <span style={{ color: "#c88a5c", fontWeight: 700 }}>1800 kcal</span>
        <span style={{ color: "#7d9bb5", fontWeight: 700 }}>90g P</span>
        <span style={{ color: "#6b9e80", fontWeight: 700 }}>220g C</span>
        <span style={{ color: "#c97e79", fontWeight: 700 }}>60g G</span>
      </div>

      {/* Footer */}
      <div className="text-center text-[6px] text-[#a3b0a6] mt-2 pt-1 mx-2" style={{ borderTop: `0.5px solid ${th.borderLight}` }}>
        {brandName} &mdash; 3 de mayo de 2026
        <div className="text-[5px] text-[#c0c8c3] mt-0.5">annonia.com</div>
      </div>
    </div>
  );
}
