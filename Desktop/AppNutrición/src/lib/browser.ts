import puppeteer, { type Browser } from "puppeteer-core";

let browser: Browser | null = null;

function getChromePath(): string {
  if (process.platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
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
