import type { HelpEntrySkeleton } from "../types";

export const AJUSTES_GUIAS_ENTRIES: HelpEntrySkeleton[] = [
  { id: "ajg-1", section: "ajustes-guias", related: ["ajg-2", "ajg-8", "ajg-15"] },
  { id: "ajg-2", section: "ajustes-guias", related: ["ajg-1", "ajg-3", "ajg-9"] },
  { id: "ajg-3", section: "ajustes-guias", related: ["ajg-2", "ajg-4", "ajg-5"] },
  { id: "ajg-4", section: "ajustes-guias", related: ["ajg-3", "ajg-5", "ajg-6"] },
  { id: "ajg-5", section: "ajustes-guias", related: ["ajg-4", "ajg-6", "ajg-7"] },
  { id: "ajg-6", section: "ajustes-guias", related: ["ajg-5", "ajg-7", "ajg-13"] },
  { id: "ajg-7", section: "ajustes-guias", related: ["ajg-5", "ajg-6", "ajg-13"] },
  { id: "ajg-8", section: "ajustes-guias", related: ["ajg-1", "ajg-10", "ajg-15"] },
  { id: "ajg-9", section: "ajustes-guias", related: ["ajg-2", "ajg-10", "ajg-11"] },
  { id: "ajg-10", section: "ajustes-guias", related: ["ajg-2", "ajg-9", "ajg-11"] },
  { id: "ajg-11", section: "ajustes-guias", related: ["ajg-1", "ajg-8", "ajg-15"] },
  { id: "ajg-12", section: "ajustes-guias", related: ["ajg-2", "ajg-9", "ajg-13"] },
  { id: "ajg-13", section: "ajustes-guias", related: ["ajg-2", "ajg-5", "ajg-15"] },
  { id: "ajg-14", section: "ajustes-guias", related: ["ajg-1", "ajg-8", "ajg-15"] },
  { id: "ajg-15", section: "ajustes-guias", related: ["ajg-1", "ajg-2", "ajg-8"] },
];
