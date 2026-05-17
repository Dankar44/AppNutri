export interface HelpEntry {
  id: string;
  section: string;
  question: string;
  answer: string;
  related: string[];
  keywords: string[];
}

/**
 * Esqueleto de una entrada de ayuda sin textos traducibles.
 * Los archivos de sección exportan esto; luego index.ts inyecta
 * question/answer/keywords desde los JSON de traducciones.
 */
export interface HelpEntrySkeleton {
  id: string;
  section: string;
  related: string[];
}
