import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

function rutaDesdeVariable(variable: string | undefined, ...segmentos: string[]): string | undefined {
  return variable ? path.join(variable, ...segmentos) : undefined;
}

function localizarNavegador(): string {
  const rutasDelSistema = process.platform === "win32"
    ? [
        rutaDesdeVariable(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
        rutaDesdeVariable(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
        rutaDesdeVariable(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe"),
        rutaDesdeVariable(process.env.LOCALAPPDATA, "Microsoft", "Edge", "Application", "msedge.exe"),
      ]
    : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
      : [
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
        ];

  const candidatos = [process.env.CHROMIUM_PATH, ...rutasDelSistema].filter(
    (ruta): ruta is string => Boolean(ruta),
  );
  const encontrado = candidatos.find((ruta) => fs.existsSync(ruta));
  if (encontrado) return encontrado;

  throw new Error(
    "No se ha encontrado un navegador compatible para generar el PDF. " +
      "Instala Google Chrome o configura CHROMIUM_PATH con la ruta a su ejecutable.",
  );
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: localizarNavegador(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
