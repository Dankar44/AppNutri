import type { HelpEntrySkeleton } from "../types";

export const AJUSTES_PELIGROSO_ENTRIES: HelpEntrySkeleton[] = [
  { id: "ajz-1", section: "ajustes-peligroso", related: ["ajz-2", "ajz-3", "ajz-5"] },
  { id: "ajz-2", section: "ajustes-peligroso", related: ["ajz-1", "ajz-3", "ajz-6"] },
  { id: "ajz-3", section: "ajustes-peligroso", related: ["ajz-1", "ajz-4", "ajz-6"] },
  { id: "ajz-4", section: "ajustes-peligroso", related: ["ajz-3", "ajz-5", "ajz-9"] },
  { id: "ajz-5", section: "ajustes-peligroso", related: ["ajz-3", "ajz-6", "ajz-10"] },
  { id: "ajz-6", section: "ajustes-peligroso", related: ["ajz-3", "ajz-5", "ajz-1"] },
  { id: "ajz-7", section: "ajustes-peligroso", related: ["ajz-4", "ajz-8", "ajz-9"] },
  { id: "ajz-8", section: "ajustes-peligroso", related: ["ajz-1", "ajz-3", "ajz-7"] },
  { id: "ajz-9", section: "ajustes-peligroso", related: ["ajz-4", "ajz-5", "ajz-7"] },
  { id: "ajz-10", section: "ajustes-peligroso", related: ["ajz-3", "ajz-5", "ajz-7"] },
];
