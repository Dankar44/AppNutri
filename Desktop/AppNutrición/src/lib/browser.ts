import puppeteer, { type Browser } from "puppeteer-core";

let browser: Browser | null = null;

function getChromePath(): string {
  // Permite fijar la ruta a mano, igual que hace html-to-pdf.ts. Es lo que necesita quien
  // trabaje en Windows, y también quien tenga Chrome instalado en otro sitio.
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  if (process.platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }
  if (process.platform === "win32") {
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }
  return "/usr/bin/chromium-browser";
}

export async function getBrowser(): Promise<Browser> {
  if (browser?.connected) return browser;

  browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });

  browser.on("disconnected", () => {
    browser = null;
  });

  return browser;
}

/** Cierra y descarta el navegador compartido (p. ej. tras un crash) para que el siguiente uso lo relance. */
export async function resetBrowser(): Promise<void> {
  const b = browser;
  browser = null;
  if (b) {
    try {
      await b.close();
    } catch {
      /* el navegador ya estaba muerto */
    }
  }
}
