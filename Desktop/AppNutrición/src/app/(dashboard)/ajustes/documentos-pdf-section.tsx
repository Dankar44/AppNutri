"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TemaPdfForm } from "./tema-pdf-form";
import { LogoPdfForm } from "./logo-pdf-form";
import { PdfPreview } from "./pdf-preview";
import { getTheme, type PdfColorTheme } from "@/lib/pdf/pdf-themes";

interface Props {
  temaPdf: string | null;
  colorPrimarioPdf: string | null;
  pdfLogoUrl: string | null;
  marcaPdf: string | null;
}

export function DocumentosPdfSection({ temaPdf, colorPrimarioPdf, pdfLogoUrl, marcaPdf }: Props) {
  const t = useTranslations("settings");
  const [theme, setTheme] = useState<PdfColorTheme>(() => getTheme(temaPdf, colorPrimarioPdf));
  const [brandName, setBrandName] = useState(marcaPdf || "Annonia");
  const [logoUrl, setLogoUrl] = useState<string | null>(pdfLogoUrl);

  function handleBrandChange(name: string, logo: string | null) {
    setBrandName(name || "Annonia");
    setLogoUrl(logo);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
      <div className="space-y-8">
        <TemaPdfForm
          temaPdfInicial={temaPdf}
          colorPrimarioInicial={colorPrimarioPdf}
          onThemeChange={setTheme}
        />
        <div className="border-t border-border pt-6">
          <LogoPdfForm
            logoUrlInicial={pdfLogoUrl}
            marcaPdfInicial={marcaPdf}
            onBrandChange={handleBrandChange}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground font-medium">{t("documentosPdf.vistaPrevia")}</p>
        <PdfPreview theme={theme} brandName={brandName} logoUrl={logoUrl} />
      </div>
    </div>
  );
}
