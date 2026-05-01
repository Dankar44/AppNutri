"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Apple,
  Beef,
  Candy,
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Cookie,
  Droplet,
  Droplets,
  Egg,
  Fish,
  Leaf,
  Mail,
  Milk,
  MoreHorizontal,
  Nut,
  Package,
  Pencil,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  Wheat,
  Wine,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CategoriaCompra, ItemCompra } from "@/lib/shopping-list";

// ─── Categorías: meta (icono + color) ───

const CATEGORIA_META: Record<
  string,
  {
    label: string;
    icon: typeof Apple;
    color: string; // tailwind text color
    bg: string; // tailwind bg
    ring: string; // tailwind border
    order: number;
  }
> = {
  FRUTAS: {
    label: "Frutas",
    icon: Apple,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    ring: "border-rose-200 dark:border-rose-500/30",
    order: 1,
  },
  VERDURAS: {
    label: "Verduras",
    icon: Leaf,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    ring: "border-emerald-200 dark:border-emerald-500/30",
    order: 2,
  },
  CEREALES: {
    label: "Cereales",
    icon: Wheat,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    ring: "border-amber-200 dark:border-amber-500/30",
    order: 3,
  },
  LEGUMBRES: {
    label: "Legumbres",
    icon: Package,
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/10",
    ring: "border-orange-200 dark:border-orange-500/30",
    order: 4,
  },
  CARNES: {
    label: "Carnes",
    icon: Beef,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/10",
    ring: "border-red-200 dark:border-red-500/30",
    order: 5,
  },
  PESCADOS: {
    label: "Pescados",
    icon: Fish,
    color: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    ring: "border-sky-200 dark:border-sky-500/30",
    order: 6,
  },
  LACTEOS: {
    label: "Lácteos",
    icon: Milk,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    ring: "border-blue-200 dark:border-blue-500/30",
    order: 7,
  },
  HUEVOS: {
    label: "Huevos",
    icon: Egg,
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-500/10",
    ring: "border-yellow-200 dark:border-yellow-500/30",
    order: 8,
  },
  FRUTOS_SECOS: {
    label: "Frutos secos",
    icon: Nut,
    color: "text-amber-800 dark:text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    ring: "border-amber-200 dark:border-amber-500/30",
    order: 9,
  },
  ACEITES: {
    label: "Aceites",
    icon: Droplet,
    color: "text-lime-700 dark:text-lime-400",
    bg: "bg-lime-50 dark:bg-lime-500/10",
    ring: "border-lime-200 dark:border-lime-500/30",
    order: 10,
  },
  BEBIDAS: {
    label: "Bebidas",
    icon: Wine,
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    ring: "border-purple-200 dark:border-purple-500/30",
    order: 11,
  },
  CONDIMENTOS: {
    label: "Condimentos",
    icon: Droplets,
    color: "text-teal-700 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-500/10",
    ring: "border-teal-200 dark:border-teal-500/30",
    order: 12,
  },
  DULCES: {
    label: "Dulces",
    icon: Candy,
    color: "text-pink-700 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-500/10",
    ring: "border-pink-200 dark:border-pink-500/30",
    order: 13,
  },
  PANADERIA: {
    label: "Panadería",
    icon: Cookie,
    color: "text-orange-800 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/10",
    ring: "border-orange-200 dark:border-orange-500/30",
    order: 14,
  },
  OTROS: {
    label: "Otros",
    icon: Package,
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-500/10",
    ring: "border-slate-200 dark:border-slate-500/30",
    order: 99,
  },
};

function metaFor(cat: string) {
  return CATEGORIA_META[cat] || CATEGORIA_META.OTROS;
}

// ─── Tipos locales ───

interface LocalItem extends ItemCompra {
  id: string;
  custom?: boolean;
}

type SortMode = "categoria" | "alfabetico" | "cantidad";

interface ShoppingListProps {
  planId: string;
  planNombre: string;
  categoriasIniciales: CategoriaCompra[];
}

// ─── Helpers de formato ───

function formatearCantidad(g: number) {
  const rounded = Math.round(g);
  if (rounded >= 1000) {
    return `${(rounded / 1000).toFixed(rounded % 1000 === 0 ? 0 : 2)} kg`;
  }
  return `${rounded} g`;
}

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ─── localStorage helpers ───

function storageKey(planId: string, kind: "checked" | "deleted" | "custom" | "collapsed" | "prefs") {
  return `annonia:lista:${planId}:${kind}`;
}

function loadSet(planId: string, kind: "checked" | "deleted" | "collapsed") {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem(storageKey(planId, kind));
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set<string>(arr) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function saveSet(planId: string, kind: "checked" | "deleted" | "collapsed", set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(planId, kind), JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

function loadCustom(planId: string): LocalItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(planId, "custom"));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveCustom(planId: string, items: LocalItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(planId, "custom"), JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function loadPrefs(planId: string): { sort: SortMode; dense: boolean } {
  if (typeof window === "undefined") return { sort: "categoria", dense: false };
  try {
    const raw = localStorage.getItem(storageKey(planId, "prefs"));
    if (!raw) return { sort: "categoria", dense: false };
    const p = JSON.parse(raw);
    return {
      sort: p.sort === "alfabetico" || p.sort === "cantidad" ? p.sort : "categoria",
      dense: !!p.dense,
    };
  } catch {
    return { sort: "categoria", dense: false };
  }
}

function savePrefs(planId: string, prefs: { sort: SortMode; dense: boolean }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(planId, "prefs"), JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

// ─── Componente principal ───

export function ShoppingList({ planId, planNombre, categoriasIniciales }: ShoppingListProps) {
  // Build initial items with stable IDs from categorias
  const itemsDesdePlan = useMemo<LocalItem[]>(() => {
    const out: LocalItem[] = [];
    for (const cat of categoriasIniciales) {
      for (const item of cat.items) {
        out.push({
          id: `plan:${cat.categoria}:${item.nombre}`,
          nombre: item.nombre,
          categoria: cat.categoria,
          cantidadTotal: item.cantidadTotal,
          enlaceProducto: item.enlaceProducto || null,
        });
      }
    }
    return out;
  }, [categoriasIniciales]);

  // State
  const [mounted, setMounted] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<LocalItem[]>([]);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [prefs, setPrefs] = useState<{ sort: SortMode; dense: boolean }>({
    sort: "categoria",
    dense: false,
  });
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [undoAction, setUndoAction] = useState<{ label: string; apply: () => void } | null>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage
  useEffect(() => {
    setCheckedIds(loadSet(planId, "checked"));
    setDeletedIds(loadSet(planId, "deleted"));
    setCustomItems(loadCustom(planId));
    setCollapsedCats(loadSet(planId, "collapsed"));
    setPrefs(loadPrefs(planId));
    setMounted(true);
  }, [planId]);

  // Persist
  useEffect(() => {
    if (mounted) saveSet(planId, "checked", checkedIds);
  }, [checkedIds, planId, mounted]);
  useEffect(() => {
    if (mounted) saveSet(planId, "deleted", deletedIds);
  }, [deletedIds, planId, mounted]);
  useEffect(() => {
    if (mounted) saveCustom(planId, customItems);
  }, [customItems, planId, mounted]);
  useEffect(() => {
    if (mounted) saveSet(planId, "collapsed", collapsedCats);
  }, [collapsedCats, planId, mounted]);
  useEffect(() => {
    if (mounted) savePrefs(planId, prefs);
  }, [prefs, planId, mounted]);

  // All items combined
  const allItems = useMemo(() => {
    const map = new Map<string, LocalItem>();
    for (const it of itemsDesdePlan) {
      if (!deletedIds.has(it.id)) map.set(it.id, it);
    }
    for (const it of customItems) {
      if (!deletedIds.has(it.id)) map.set(it.id, it);
    }
    return [...map.values()];
  }, [itemsDesdePlan, customItems, deletedIds]);

  const totalItems = allItems.length;
  const totalChecked = allItems.filter((i) => checkedIds.has(i.id)).length;
  const pctChecked = totalItems === 0 ? 0 : Math.round((totalChecked / totalItems) * 100);
  const pesoTotal = allItems.reduce((sum, i) => sum + (i.cantidadTotal || 0), 0);
  const categoriasActivas = new Set(allItems.map((i) => i.categoria));

  // Filter + sort
  const visibleItems = useMemo(() => {
    const q = normalizar(query);
    let list = allItems.filter((i) => {
      if (filterCat && i.categoria !== filterCat) return false;
      if (q && !normalizar(i.nombre).includes(q)) return false;
      return true;
    });

    if (prefs.sort === "alfabetico") {
      list = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    } else if (prefs.sort === "cantidad") {
      list = [...list].sort((a, b) => b.cantidadTotal - a.cantidadTotal);
    } else {
      list = [...list].sort((a, b) => {
        const oa = metaFor(a.categoria).order;
        const ob = metaFor(b.categoria).order;
        if (oa !== ob) return oa - ob;
        return a.nombre.localeCompare(b.nombre, "es");
      });
    }
    return list;
  }, [allItems, query, filterCat, prefs.sort]);

  // Group by category for rendering
  const grouped = useMemo(() => {
    const groups = new Map<string, LocalItem[]>();
    for (const it of visibleItems) {
      if (!groups.has(it.categoria)) groups.set(it.categoria, []);
      groups.get(it.categoria)!.push(it);
    }
    return [...groups.entries()].sort(
      ([a], [b]) => metaFor(a).order - metaFor(b).order
    );
  }, [visibleItems]);

  // Acciones
  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        (navigator as Navigator & { vibrate: (p: number) => void }).vibrate(15);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const toggleCollapse = useCallback((cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsedCats(new Set()), []);
  const collapseAll = useCallback(() => {
    setCollapsedCats(new Set([...categoriasActivas]));
  }, [categoriasActivas]);

  const showUndo = useCallback((label: string, apply: () => void) => {
    setUndoAction({ label, apply });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoAction(null), 6000);
  }, []);

  const clearChecked = useCallback(() => {
    if (checkedIds.size === 0) {
      toast.info("No hay artículos marcados");
      return;
    }
    const snapshot = new Set(checkedIds);
    setCheckedIds(new Set());
    toast.success(`${snapshot.size} marca${snapshot.size !== 1 ? "s" : ""} borrada${snapshot.size !== 1 ? "s" : ""}`);
    showUndo("Deshacer desmarcar todo", () => setCheckedIds(snapshot));
  }, [checkedIds, showUndo]);

  const removeChecked = useCallback(() => {
    if (checkedIds.size === 0) {
      toast.info("No hay artículos marcados");
      return;
    }
    const snapshot = new Set(deletedIds);
    setDeletedIds((prev) => {
      const next = new Set(prev);
      for (const id of checkedIds) next.add(id);
      return next;
    });
    setCheckedIds(new Set());
    toast.success("Ocultados los artículos comprados");
    showUndo("Recuperar comprados", () => setDeletedIds(snapshot));
  }, [checkedIds, deletedIds, showUndo]);

  const removeItem = useCallback(
    (id: string) => {
      const item = allItems.find((i) => i.id === id);
      setDeletedIds((prev) => new Set(prev).add(id));
      setCheckedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (item) {
        toast.success(`${item.nombre} eliminado`);
        showUndo("Recuperar " + item.nombre, () => {
          setDeletedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        });
      }
    },
    [allItems, showUndo]
  );

  const editQuantity = useCallback((id: string, newCantidad: number) => {
    if (id.startsWith("custom:")) {
      setCustomItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, cantidadTotal: newCantidad } : it))
      );
    } else {
      // For plan items, we keep the plan value but store the override as a custom item
      // Simplest: treat as custom edit — store in customItems with same ID prefix overridden
      // Actually, simpler: don't allow editing plan items to keep plan source of truth.
      toast.info("Solo puedes editar cantidad de artículos añadidos manualmente");
    }
  }, []);

  const addCustom = useCallback(
    (nombre: string, categoria: string, cantidad: number) => {
      const id = `custom:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const nuevo: LocalItem = {
        id,
        nombre: nombre.trim(),
        categoria,
        cantidadTotal: cantidad,
        custom: true,
      };
      setCustomItems((prev) => [...prev, nuevo]);
      // Un-delete in case
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success(`${nombre} añadido`);
    },
    []
  );

  const regenerar = useCallback(() => {
    if (
      !confirm(
        "¿Regenerar la lista desde tu plan? Se perderán los artículos personalizados y las marcas."
      )
    )
      return;
    setCheckedIds(new Set());
    setDeletedIds(new Set());
    setCustomItems([]);
    toast.success("Lista regenerada desde el plan");
  }, []);

  // Shares
  const buildPlainText = useCallback(() => {
    const lines: string[] = [`🛒 Lista de la compra — ${planNombre}`, ""];
    const groupedAll = new Map<string, LocalItem[]>();
    for (const it of allItems) {
      if (!groupedAll.has(it.categoria)) groupedAll.set(it.categoria, []);
      groupedAll.get(it.categoria)!.push(it);
    }
    const sortedCats = [...groupedAll.entries()].sort(
      ([a], [b]) => metaFor(a).order - metaFor(b).order
    );
    for (const [cat, items] of sortedCats) {
      lines.push(`📌 ${metaFor(cat).label}`);
      for (const it of items) {
        const check = checkedIds.has(it.id) ? "✅" : "▫️";
        const urlSuffix = it.enlaceProducto ? ` → ${it.enlaceProducto}` : "";
        lines.push(`  ${check} ${it.nombre} — ${formatearCantidad(it.cantidadTotal)}${urlSuffix}`);
      }
      lines.push("");
    }
    lines.push(`Total: ${totalItems} artículos · ${formatearCantidad(pesoTotal)}`);
    return lines.join("\n");
  }, [planNombre, allItems, checkedIds, totalItems, pesoTotal]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText());
      toast.success("Lista copiada al portapapeles");
    } catch {
      toast.error("No se pudo copiar");
    }
  }, [buildPlainText]);

  const shareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(buildPlainText());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }, [buildPlainText]);

  const shareEmail = useCallback(() => {
    const subject = encodeURIComponent(`Lista de la compra — ${planNombre}`);
    const body = encodeURIComponent(buildPlainText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [buildPlainText, planNombre]);

  const downloadTxt = useCallback(() => {
    try {
      const blob = new Blob([buildPlainText()], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lista-compra-${planNombre.replace(/\s+/g, "-").toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Archivo descargado");
    } catch {
      toast.error("No se pudo descargar");
    }
  }, [buildPlainText, planNombre]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "a") {
        setShowAddModal(true);
      } else if (e.key === "Escape") {
        setShoppingMode(false);
        setShowAddModal(false);
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close more menu on outside click
  useEffect(() => {
    if (!moreMenuOpen) return;
    function onDown(e: MouseEvent) {
      if (moreMenuRef.current && e.target instanceof Node && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreMenuOpen]);

  // ─── Shopping mode (fullscreen) ───
  if (shoppingMode) {
    const pendientes = allItems.filter((i) => !checkedIds.has(i.id));
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="max-w-2xl mx-auto p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Modo compra
              </p>
              <h1 className="text-2xl font-bold">{planNombre}</h1>
            </div>
            <button
              onClick={() => setShoppingMode(false)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Salir"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">
                {totalChecked} de {totalItems}
              </span>
              <span className="text-muted-foreground">{pctChecked}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-primary transition-all"
                style={{ width: `${pctChecked}%` }}
              />
            </div>
          </div>

          {pendientes.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-1">¡Lista completada!</h2>
              <p className="text-muted-foreground">Has marcado todos los artículos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendientes.map((it) => {
                const meta = metaFor(it.categoria);
                const Icon = meta.icon;
                return (
                  <button
                    key={it.id}
                    onClick={() => toggleCheck(it.id)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-left"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", meta.bg)}>
                      <Icon className={cn("w-5 h-5", meta.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold truncate">
                        {it.enlaceProducto ? (
                          <a href={it.enlaceProducto} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 hover:text-primary hover:underline">
                            {it.nombre}
                            <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground/60" />
                          </a>
                        ) : it.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">{meta.label}</p>
                    </div>
                    <span className="text-lg font-bold tabular-nums">
                      {formatearCantidad(it.cantidadTotal)}
                    </span>
                    <span className="w-6 h-6 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Vista normal ───

  return (
    <div>
      {/* Hero resumen */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card mb-5">
        <div className="absolute -top-10 -right-10 opacity-[0.04] dark:opacity-[0.08]">
          <ShoppingCart className="w-52 h-52" strokeWidth={1} />
        </div>
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80 mb-1">
                Plan de compra
              </p>
              <h2 className="text-lg sm:text-xl font-bold leading-tight">
                Generada a partir de {planNombre}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Marca los artículos según los vayas comprando. Se guardan en este dispositivo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShoppingMode(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
                title="Entrar en modo compra (fullscreen)"
              >
                <Sparkles className="w-4 h-4" />
                Modo compra
              </button>
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen((v) => !v)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {moreMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-card shadow-lg z-30 py-1">
                    <MenuItem
                      icon={Copy}
                      label="Copiar al portapapeles"
                      onClick={() => {
                        copyToClipboard();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      icon={ShareWhatsAppIcon}
                      label="Enviar por WhatsApp"
                      onClick={() => {
                        shareWhatsApp();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      icon={Mail}
                      label="Enviar por email"
                      onClick={() => {
                        shareEmail();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      icon={Printer}
                      label="Imprimir"
                      onClick={() => {
                        window.print();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      icon={DownloadIcon}
                      label="Descargar .txt"
                      onClick={() => {
                        downloadTxt();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <div className="my-1 border-t border-border" />
                    <MenuItem
                      icon={ChevronsUp}
                      label="Expandir todo"
                      onClick={() => {
                        expandAll();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      icon={ChevronsDown}
                      label="Colapsar todo"
                      onClick={() => {
                        collapseAll();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <div className="my-1 border-t border-border" />
                    <MenuItem
                      icon={Trash2}
                      label="Eliminar comprados"
                      onClick={() => {
                        removeChecked();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      icon={Check}
                      label="Desmarcar todo"
                      onClick={() => {
                        clearChecked();
                        setMoreMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      icon={Sparkles}
                      label="Regenerar desde plan"
                      onClick={() => {
                        regenerar();
                        setMoreMenuOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPIs + progreso */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <Kpi label="Artículos" value={String(totalItems)} />
            <Kpi label="Comprados" value={`${totalChecked}/${totalItems}`} />
            <Kpi label="Categorías" value={String(categoriasActivas.size)} />
            <Kpi label="Peso total" value={formatearCantidad(pesoTotal)} />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-semibold tabular-nums">{pctChecked}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-primary transition-all"
                style={{ width: `${pctChecked}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar… (atajo: /)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
              aria-label="Limpiar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(["categoria", "alfabetico", "cantidad"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setPrefs((p) => ({ ...p, sort: mode }))}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                prefs.sort === mode
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "categoria" ? "Categoría" : mode === "alfabetico" ? "A-Z" : "Cantidad"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          title="Añadir artículo (atajo: A)"
        >
          <Plus className="w-4 h-4" />
          Añadir
        </button>
      </div>

      {/* Chips de categoría */}
      {allItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <CategoryChip
            active={filterCat === null}
            onClick={() => setFilterCat(null)}
            label={`Todas (${totalItems})`}
          />
          {[...categoriasActivas]
            .sort((a, b) => metaFor(a).order - metaFor(b).order)
            .map((cat) => {
              const meta = metaFor(cat);
              const count = allItems.filter((i) => i.categoria === cat).length;
              const Icon = meta.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    filterCat === cat
                      ? cn(meta.bg, meta.ring, meta.color)
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {meta.label} ({count})
                </button>
              );
            })}
        </div>
      )}

      {/* Lista / Empty state */}
      {allItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/20 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold mb-1">Tu lista está vacía</h2>
          <p className="text-muted-foreground mb-4">
            Añade artículos manualmente o regenera desde tu plan.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Añadir primer artículo
          </button>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/20 p-8 text-center">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No se encontraron artículos con esos filtros.</p>
        </div>
      ) : prefs.sort === "categoria" ? (
        <div className="space-y-4">
          {grouped.map(([cat, items]) => {
            const meta = metaFor(cat);
            const Icon = meta.icon;
            const collapsed = collapsedCats.has(cat);
            const catCheckedCount = items.filter((i) => checkedIds.has(i.id)).length;
            const catWeight = items.reduce((s, i) => s + i.cantidadTotal, 0);
            return (
              <section
                key={cat}
                className={cn("rounded-2xl border bg-card overflow-hidden", meta.ring)}
              >
                <button
                  onClick={() => toggleCollapse(cat)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      meta.bg
                    )}
                  >
                    <Icon className={cn("w-5 h-5", meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("text-base font-semibold", meta.color)}>{meta.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {catCheckedCount}/{items.length} ·{" "}
                      {formatearCantidad(catWeight)}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      collapsed && "-rotate-90"
                    )}
                  />
                </button>
                {!collapsed && (
                  <div className={cn(prefs.dense ? "divide-y divide-border/40" : "p-2 space-y-1.5")}>
                    {items.map((it) => (
                      <ItemRow
                        key={it.id}
                        item={it}
                        checked={checkedIds.has(it.id)}
                        editing={editingId === it.id}
                        dense={prefs.dense}
                        meta={meta}
                        onToggle={() => toggleCheck(it.id)}
                        onDelete={() => removeItem(it.id)}
                        onStartEdit={() =>
                          it.id.startsWith("custom:") ? setEditingId(it.id) : null
                        }
                        onEndEdit={(val) => {
                          editQuantity(it.id, val);
                          setEditingId(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        // Flat list (alfabetico / cantidad)
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/40">
          {visibleItems.map((it) => {
            const meta = metaFor(it.categoria);
            return (
              <ItemRow
                key={it.id}
                item={it}
                checked={checkedIds.has(it.id)}
                editing={editingId === it.id}
                dense
                meta={meta}
                showCategoryBadge
                onToggle={() => toggleCheck(it.id)}
                onDelete={() => removeItem(it.id)}
                onStartEdit={() =>
                  it.id.startsWith("custom:") ? setEditingId(it.id) : null
                }
                onEndEdit={(val) => {
                  editQuantity(it.id, val);
                  setEditingId(null);
                }}
              />
            );
          })}
        </div>
      )}

      {/* Footer resumen */}
      {totalItems > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-sm">
            <span className="font-semibold">{totalChecked}</span> comprados ·{" "}
            <span className="font-semibold">{totalItems - totalChecked}</span> pendientes
          </div>
          {totalChecked === totalItems && totalItems > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
              <Check className="w-4 h-4" />
              ¡Lista completa!
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={removeChecked}
                disabled={checkedIds.size === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ocultar comprados
              </button>
            </div>
          )}
        </div>
      )}

      {/* Undo toast */}
      {undoAction && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 print:hidden">
          <div className="bg-foreground text-background rounded-full shadow-lg px-4 py-2 flex items-center gap-3">
            <span className="text-sm">{undoAction.label}</span>
            <button
              onClick={() => {
                undoAction.apply();
                setUndoAction(null);
              }}
              className="text-sm font-semibold text-primary-foreground/80 hover:text-primary-foreground underline underline-offset-2"
            >
              Deshacer
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={(nombre, cat, cant) => {
            addCustom(nombre, cat, cant);
            setShowAddModal(false);
          }}
        />
      )}

      {/* FAB móvil */}
      <button
        onClick={() => setShowAddModal(true)}
        className="sm:hidden fixed right-5 bottom-20 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center print:hidden"
        aria-label="Añadir artículo"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

// ─── Subcomponentes ───

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 backdrop-blur px-3 py-2 border border-border/50">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
        active
          ? "bg-primary/10 text-primary border-primary/30"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span>{label}</span>
    </button>
  );
}

function ItemRow({
  item,
  checked,
  editing,
  dense,
  meta,
  showCategoryBadge,
  onToggle,
  onDelete,
  onStartEdit,
  onEndEdit,
}: {
  item: LocalItem;
  checked: boolean;
  editing: boolean;
  dense: boolean;
  meta: (typeof CATEGORIA_META)[string];
  showCategoryBadge?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onEndEdit: (val: number) => void;
}) {
  const [editValue, setEditValue] = useState(String(Math.round(item.cantidadTotal)));

  useEffect(() => {
    if (editing) setEditValue(String(Math.round(item.cantidadTotal)));
  }, [editing, item.cantidadTotal]);

  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 transition-colors",
        dense ? "px-3 py-2" : "rounded-lg border border-transparent hover:border-border px-3 py-2 bg-background/40",
        checked && "opacity-60"
      )}
    >
      {/* Custom checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          checked
            ? "bg-primary border-primary text-primary-foreground scale-105"
            : "border-muted-foreground/40 hover:border-primary hover:bg-primary/5"
        )}
        aria-label={checked ? "Desmarcar" : "Marcar como comprado"}
      >
        {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </button>

      {showCategoryBadge && (
        <span
          className={cn(
            "hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0",
            meta.bg,
            meta.color
          )}
        >
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm truncate transition-all",
            checked && "line-through text-muted-foreground"
          )}
        >
          {item.enlaceProducto ? (
            <a
              href={item.enlaceProducto}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 hover:text-primary hover:underline"
            >
              {item.nombre}
              <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground/60" />
            </a>
          ) : (
            item.nombre
          )}
          {item.custom && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-primary font-semibold">
              Añadido
            </span>
          )}
        </p>
      </div>

      {/* Cantidad (editable solo en custom) */}
      {editing ? (
        <input
          type="number"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onEndEdit(Math.max(0, parseFloat(editValue) || 0))}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") onEndEdit(item.cantidadTotal);
          }}
          className="w-20 px-2 py-1 text-sm text-right tabular-nums rounded border border-primary/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      ) : (
        <button
          onClick={onStartEdit}
          className={cn(
            "text-sm tabular-nums text-muted-foreground shrink-0",
            item.custom && "hover:text-primary cursor-pointer",
            !item.custom && "cursor-default"
          )}
          title={item.custom ? "Editar cantidad" : undefined}
        >
          {formatearCantidad(item.cantidadTotal)}
          {item.custom && <Pencil className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-60" />}
        </button>
      )}

      <button
        onClick={onDelete}
        className="p-1.5 rounded text-muted-foreground/50 hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-500 transition-colors shrink-0 sm:opacity-0 sm:group-hover:opacity-100 print:hidden"
        aria-label="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddItemModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (nombre: string, categoria: string, cantidad: number) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("OTROS");
  const [cantidad, setCantidad] = useState("100");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    const n = nombre.trim();
    const q = parseFloat(cantidad);
    if (!n) {
      toast.error("Introduce un nombre");
      return;
    }
    if (isNaN(q) || q <= 0) {
      toast.error("Introduce una cantidad válida");
      return;
    }
    onAdd(n, categoria, q);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Añadir artículo</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
            <input
              ref={inputRef}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ej: Pan integral"
              maxLength={60}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {Object.entries(CATEGORIA_META)
                  .sort(([, a], [, b]) => a.order - b.order)
                  .map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cantidad (g)</label>
              <input
                type="number"
                inputMode="decimal"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                min={1}
                max={100000}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Iconos custom inline (no están en lucide como un solo uso) ───

function ShareWhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
