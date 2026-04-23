// Compatibilidad: redirige al nuevo paquete help-kb que está particionado por sección.
export {
  HELP_ENTRIES,
  getSection,
  getEntriesForSection,
  getEntryById,
  getRelatedEntries,
  searchHelp,
} from "./help-kb";
export type { HelpEntry } from "./help-kb";
