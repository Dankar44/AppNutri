"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircleQuestion, X, Search, RotateCcw, Leaf } from "lucide-react";
import {
  getSection,
  getEntriesForSection,
  getRelatedEntries,
  searchHelp,
  type HelpEntry,
} from "@/lib/help-knowledge-base";

interface Message {
  type: "assistant" | "user";
  content: string;
}

const SECTION_LABELS: Record<string, string> = {
  general: "General",
  dashboard: "Dashboard",
  pacientes: "Pacientes",
  "paciente-detalle": "Ficha del paciente",
  "paciente-consultas": "Consultas",
  "paciente-medidas": "Medidas",
  dietas: "Dietas",
  "dieta-editor": "Editor de plan",
  "dieta-ia": "Generación con IA",
  "dieta-compartir": "Compartir plan",
  alimentos: "Alimentos",
  recetas: "Recetas",
  agenda: "Agenda",
  reportes: "Reportes",
  notificaciones: "Notificaciones",
  ajustes: "Ajustes",
};

export function HelpWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chips, setChips] = useState<HelpEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HelpEntry[] | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const section = getSection(pathname);
  const sectionLabel = SECTION_LABELS[section] || "esta sección";
  const searchDebounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setMessages([]);
    setChips(getEntriesForSection(section));
    setSearchQuery("");
    setSearchResults(null);
  }, [pathname, section]);

  useEffect(() => {
    if (!open || !bodyRef.current) return;
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, chips]);

  function resetChat() {
    setMessages([]);
    setChips(getEntriesForSection(section));
    setSearchQuery("");
    setSearchResults(null);
  }

  function handleSelectQuestion(entry: HelpEntry) {
    setSearchQuery("");
    setSearchResults(null);
    setMessages((prev) => [
      ...prev,
      { type: "user", content: entry.question },
      { type: "assistant", content: entry.answer },
    ]);
    const related = getRelatedEntries(entry);
    setChips(related.length > 0 ? related : getEntriesForSection(section).slice(0, 4));
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (q.trim().length < 2) { setSearchResults(null); return; }
    searchDebounceRef.current = setTimeout(() => {
      setSearchResults(searchHelp(q));
    }, 200);
  }

  // No mostrar en rutas fuera del dashboard
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/paciente") ||
    pathname.startsWith("/compartido") ||
    pathname === "/"
  ) {
    return null;
  }

  return (
    <>
      {/* Panel */}
      <div
        className={`fixed bottom-20 right-6 z-50 w-[360px] sm:w-[380px] bg-card rounded-2xl border border-border shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        style={{ maxHeight: "min(500px, calc(100vh - 140px))" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-primary/5 rounded-t-2xl">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Asistente NutriApp</p>
            <p className="text-[11px] text-muted-foreground">
              {sectionLabel}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={resetChat}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                title="Volver al inicio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Mensaje de bienvenida */}
          {messages.length === 0 && !searchResults && (
            <div className="bg-muted/60 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm">
              Hola, soy el asistente de NutriApp. Estoy aquí para ayudarte con cualquier duda sobre la aplicación.
              {section !== "general" && (
                <span> Veo que estás en <strong>{sectionLabel}</strong>. Aquí tienes algunas preguntas frecuentes:</span>
              )}
            </div>
          )}

          {/* Mensajes del chat */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm whitespace-pre-line ${
                msg.type === "user"
                  ? "bg-primary text-primary-foreground rounded-xl rounded-tr-sm px-3.5 py-2.5 ml-8"
                  : "bg-muted/60 rounded-xl rounded-tl-sm px-3.5 py-2.5 mr-4"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {/* Resultados de búsqueda */}
          {searchResults !== null ? (
            searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No encontré resultados para &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}:
                </p>
                {searchResults.slice(0, 8).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleSelectQuestion(entry)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors"
                  >
                    {entry.question}
                  </button>
                ))}
              </div>
            )
          ) : (
            /* Chips de preguntas sugeridas */
            chips.length > 0 && (
              <div className="space-y-1.5">
                {messages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Preguntas relacionadas:</p>
                )}
                {chips.slice(0, 6).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleSelectQuestion(entry)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors"
                  >
                    {entry.question}
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer: buscador */}
        <div className="border-t border-border p-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar en la ayuda..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Burbuja flotante */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-muted text-muted-foreground hover:bg-muted/80 rotate-0"
            : "bg-primary text-primary-foreground hover:bg-primary/90 animate-[pulse_3s_ease-in-out_infinite]"
        }`}
        title="Ayuda"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircleQuestion className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
