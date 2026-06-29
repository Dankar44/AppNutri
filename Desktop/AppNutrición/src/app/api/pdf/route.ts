import { NextRequest, NextResponse } from "next/server";
import { getBrowser, resetBrowser } from "@/lib/browser";

export async function POST(req: NextRequest) {
  let html: string;
  let filename: string;
  try {
    ({ html, filename } = (await req.json()) as { html: string; filename: string });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!html) {
    return NextResponse.json({ error: "No HTML" }, { status: 400 });
  }

  // Hasta 2 intentos: si el navegador compartido murió (memoria/crash en un servidor modesto), se
  // descarta y se relanza uno fresco, de modo que un fallo transitorio no llegue como 500 al usuario.
  let lastErr: unknown;
  for (let intento = 0; intento < 2; intento++) {
    let page: Awaited<ReturnType<Awaited<ReturnType<typeof getBrowser>>["newPage"]>> | undefined;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename || "plan.pdf"}"`,
        },
      });
    } catch (err) {
      lastErr = err;
      // El navegador pudo quedar inservible: lo descartamos para que el reintento lo relance.
      await resetBrowser();
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          /* el navegador pudo morir; nada que cerrar */
        }
      }
    }
  }

  console.error("[api/pdf]", lastErr);
  return NextResponse.json({ error: "Error generando PDF" }, { status: 500 });
}
