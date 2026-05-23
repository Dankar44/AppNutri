import { NextRequest, NextResponse } from "next/server";
import { getBrowser } from "@/lib/browser";

export async function POST(req: NextRequest) {
  try {
    const { html, filename } = (await req.json()) as {
      html: string;
      filename: string;
    };

    if (!html) {
      return NextResponse.json({ error: "No HTML" }, { status: 400 });
    }

    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
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
    } finally {
      await page.close();
    }
  } catch (err) {
    console.error("[api/pdf]", err);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
