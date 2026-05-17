import type { HelpEntrySkeleton } from "../types";

export const AJUSTES_DEMO_ENTRIES: HelpEntrySkeleton[] = [
  { id: "ajd-1", section: "ajustes-demo", related: ["ajd-2", "ajd-3", "ajd-4"] },
  { id: "ajd-2", section: "ajustes-demo", related: ["ajd-1", "ajd-4", "ajd-13"] },
  { id: "ajd-3", section: "ajustes-demo", related: ["ajd-1", "ajd-6", "ajd-7"] },
  { id: "ajd-4", section: "ajustes-demo", related: ["ajd-1", "ajd-2", "ajd-5"] },
  { id: "ajd-5", section: "ajustes-demo", related: ["ajd-4", "ajd-8", "ajd-9"] },
  { id: "ajd-6", section: "ajustes-demo", related: ["ajd-3", "ajd-7", "ajd-8"] },
  { id: "ajd-7", section: "ajustes-demo", related: ["ajd-3", "ajd-8", "ajd-11"] },
  { id: "ajd-8", section: "ajustes-demo", related: ["ajd-6", "ajd-7", "ajd-11"] },
  { id: "ajd-9", section: "ajustes-demo", related: ["ajd-1", "ajd-10", "ajd-12"] },
  { id: "ajd-10", section: "ajustes-demo", related: ["ajd-9", "ajd-11", "ajd-12"] },
  { id: "ajd-11", section: "ajustes-demo", related: ["ajd-9", "ajd-10", "ajd-12"] },
  { id: "ajd-12", section: "ajustes-demo", related: ["ajd-10", "ajd-11", "ajd-15"] },
  { id: "ajd-13", section: "ajustes-demo", related: ["ajd-9", "ajd-10", "ajd-14"] },
  { id: "ajd-14", section: "ajustes-demo", related: ["ajd-10", "ajd-11", "ajd-15"] },
  { id: "ajd-15", section: "ajustes-demo", related: ["ajd-1", "ajd-12", "ajd-14"] },
];
