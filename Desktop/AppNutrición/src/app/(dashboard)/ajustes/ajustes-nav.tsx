"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  Lock,
  Briefcase,
  FileText,
  Plug,
  Sparkles,
  CreditCard,
  Wallet,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Lista de secciones del panel de Ajustes. Definida dentro del componente cliente
 * para que los iconos Lucide (React components) no crucen la frontera server/client.
 */
const SECTIONS: NavSection[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "contrasena", label: "Contraseña", icon: Lock },
  { id: "profesional", label: "Profesional", icon: Briefcase },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "integraciones", label: "Integraciones", icon: Plug },
  { id: "paciente-demo", label: "Paciente de ejemplo", icon: Sparkles },
  { id: "suscripcion", label: "Suscripción", icon: CreditCard },
  { id: "cobros", label: "Cobros", icon: Wallet },
  { id: "guias", label: "Guías", icon: GraduationCap },
  { id: "peligroso", label: "Zona peligrosa", icon: AlertTriangle },
];

/**
 * Barra lateral de secciones del panel de Ajustes. En desktop se pega arriba
 * (sticky) y el item activo cambia cuando el scroll atraviesa cada sección.
 */
export function AjustesNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? "");
  const clickLockRef = useRef<number>(0);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        setActiveId(hash);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < clickLockRef.current) return;
        const visibles = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibles[0]) setActiveId(visibles[0].target.id);
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.3, 0.6],
      },
    );

    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    clickLockRef.current = Date.now() + 800;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      className={cn(
        "shrink-0 z-10",
        // Mobile: barra horizontal scroll-able
        "w-full lg:w-56",
        // Desktop: sticky al top del contenedor scroll con scroll interno si hace falta
        "lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 leading-snug px-3 mb-2 hidden lg:block">
        Ajustes
      </p>
      <ul className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-thin pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0">
        {SECTIONS.map((s) => {
          const active = activeId === s.id;
          const Icon = s.icon;
          return (
            <li key={s.id} className="shrink-0 lg:shrink">
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                className={cn(
                  "inline-flex lg:flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{s.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
