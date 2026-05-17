import type { HelpEntrySkeleton } from "../types";

export const AJUSTES_PERFIL_ENTRIES: HelpEntrySkeleton[] = [
  { id: "ajp-1", section: "ajustes-perfil", related: ["ajp-2", "ajp-8", "ajp-19"] },
  { id: "ajp-2", section: "ajustes-perfil", related: ["ajp-1", "ajp-3", "ajp-8"] },
  { id: "ajp-3", section: "ajustes-perfil", related: ["ajp-2", "ajp-18", "ajp-20"] },
  { id: "ajp-4", section: "ajustes-perfil", related: ["ajp-3", "ajp-18", "ajp-19"] },
  { id: "ajp-5", section: "ajustes-perfil", related: ["ajp-6", "ajp-7", "ajp-19"] },
  { id: "ajp-6", section: "ajustes-perfil", related: ["ajp-5", "ajp-7", "ajp-19"] },
  { id: "ajp-7", section: "ajustes-perfil", related: ["ajp-5", "ajp-6", "ajp-19"] },
  { id: "ajp-8", section: "ajustes-perfil", related: ["ajp-2", "ajp-3", "ajp-18"] },
  { id: "ajp-9", section: "ajustes-perfil", related: ["ajp-16", "ajp-19", "ajp-20"] },
  { id: "ajp-10", section: "ajustes-perfil", related: ["ajp-11", "ajp-12", "ajp-15"] },
  { id: "ajp-11", section: "ajustes-perfil", related: ["ajp-10", "ajp-12", "ajp-18"] },
  { id: "ajp-12", section: "ajustes-perfil", related: ["ajp-10", "ajp-11", "ajp-18"] },
  { id: "ajp-13", section: "ajustes-perfil", related: ["ajp-10", "ajp-14", "ajp-15"] },
  { id: "ajp-14", section: "ajustes-perfil", related: ["ajp-10", "ajp-15", "ajp-19"] },
  { id: "ajp-15", section: "ajustes-perfil", related: ["ajp-10", "ajp-14", "ajp-19"] },
  { id: "ajp-16", section: "ajustes-perfil", related: ["ajp-9", "ajp-19", "ajp-20"] },
  { id: "ajp-17", section: "ajustes-perfil", related: ["ajp-3", "ajp-12", "ajp-18"] },
  { id: "ajp-18", section: "ajustes-perfil", related: ["ajp-3", "ajp-11", "ajp-12"] },
  { id: "ajp-19", section: "ajustes-perfil", related: ["ajp-15", "ajp-20", "ajp-3"] },
  { id: "ajp-20", section: "ajustes-perfil", related: ["ajp-1", "ajp-8", "ajp-19"] },
];
