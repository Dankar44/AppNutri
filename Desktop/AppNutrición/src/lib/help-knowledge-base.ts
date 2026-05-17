// Compatibilidad: redirige al nuevo paquete help-kb que está particionado por sección.
export {
  buildHelpEntries,
  getSection,
  getEntriesForSection,
  getEntryById,
  getRelatedEntries,
  searchHelp,
} from "./help-kb";
export type { HelpEntry, HelpEntrySkeleton, HelpTranslator } from "./help-kb";
