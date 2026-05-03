export interface PdfColorTheme {
  primary: string;
  accent: string;
  lightBg: string;
  sectionBg: string;
  border: string;
  borderLight: string;
  textDark: string;
  textMedium: string;
  textLight: string;
  dayHeaderBg: string;
  dayHeaderText: string;
  linkColor: string;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generarTemaDesdeColor(hex: string): PdfColorTheme {
  const [h, s] = hexToHsl(hex);
  return {
    primary: hex,
    accent: hslToHex(h, Math.min(s, 40), 63),
    lightBg: hslToHex(h, 25, 96),
    sectionBg: hslToHex(h, 30, 93),
    border: hslToHex(h, 20, 85),
    borderLight: hslToHex(h, 15, 90),
    textDark: hslToHex(h, 25, 18),
    textMedium: hslToHex(h, 22, 30),
    textLight: hslToHex(h, 12, 42),
    dayHeaderBg: "#e8d8a8",
    dayHeaderText: "#6b5932",
    linkColor: hex,
  };
}

const VERDE: PdfColorTheme = {
  primary: "#6b9e80",
  accent: "#8bb39a",
  lightBg: "#f5f9f6",
  sectionBg: "#eaf3ec",
  border: "#d4e4d9",
  borderLight: "#e2ebe5",
  textDark: "#2c3e33",
  textMedium: "#3d5a48",
  textLight: "#55695c",
  dayHeaderBg: "#e8d8a8",
  dayHeaderText: "#6b5932",
  linkColor: "#6b9e80",
};

const AZUL: PdfColorTheme = {
  primary: "#5b8fb9",
  accent: "#7da8c9",
  lightBg: "#f4f8fb",
  sectionBg: "#e8f0f6",
  border: "#cddce8",
  borderLight: "#dde8ef",
  textDark: "#2a3640",
  textMedium: "#3b5268",
  textLight: "#566d7e",
  dayHeaderBg: "#e8d8a8",
  dayHeaderText: "#6b5932",
  linkColor: "#5b8fb9",
};

const MORADO: PdfColorTheme = {
  primary: "#8b6baa",
  accent: "#a388bc",
  lightBg: "#f8f5fb",
  sectionBg: "#f0eaf5",
  border: "#ddd2e8",
  borderLight: "#e8e0ee",
  textDark: "#332840",
  textMedium: "#4e3d63",
  textLight: "#6a5a7c",
  dayHeaderBg: "#e8d8a8",
  dayHeaderText: "#6b5932",
  linkColor: "#8b6baa",
};

const NARANJA: PdfColorTheme = {
  primary: "#c28550",
  accent: "#d4a478",
  lightBg: "#fdf8f4",
  sectionBg: "#f8efe6",
  border: "#e8d8c6",
  borderLight: "#efe3d6",
  textDark: "#3d2f22",
  textMedium: "#5e4a38",
  textLight: "#7a6654",
  dayHeaderBg: "#e8d8a8",
  dayHeaderText: "#6b5932",
  linkColor: "#c28550",
};

const OSCURO: PdfColorTheme = {
  primary: "#4a5568",
  accent: "#718096",
  lightBg: "#f7f8f9",
  sectionBg: "#edf0f2",
  border: "#d2d8de",
  borderLight: "#e2e6ea",
  textDark: "#1a202c",
  textMedium: "#2d3748",
  textLight: "#4a5568",
  dayHeaderBg: "#e8d8a8",
  dayHeaderText: "#6b5932",
  linkColor: "#4a5568",
};

export const TEMAS_PDF: Record<string, PdfColorTheme> = {
  verde: VERDE,
  azul: AZUL,
  morado: MORADO,
  naranja: NARANJA,
  oscuro: OSCURO,
};

export const TEMA_DEFAULT = "verde";

export function getTheme(temaId: string | null | undefined, colorPrimario: string | null | undefined): PdfColorTheme {
  if (temaId === "personalizado" && colorPrimario && /^#[0-9a-fA-F]{6}$/.test(colorPrimario)) {
    return generarTemaDesdeColor(colorPrimario);
  }
  if (temaId && TEMAS_PDF[temaId]) {
    return TEMAS_PDF[temaId];
  }
  return VERDE;
}
