"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical, Loader2, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { guardarCamposAnamnesis } from "@/app/actions/perfil";
import type {
  CampoPersonalizadoDefinicion,
  TipoCampoAnamnesis,
  SeccionAnamnesis,
} from "@/lib/ficha-informacion-types";

const TIPO_LABELS: Record<TipoCampoAnamnesis, string> = {
  texto: "Texto corto",
  textarea: "Texto largo",
  selector: "Desplegable",
};

const SECCION_LABELS: Record<SeccionAnamnesis, string> = {
  consulta: "Consulta",
  personalSocial: "Personal y social",
  clinica: "Clínica",
  alimentaria: "Alimentaria",
  personalizado: "Sección propia",
};

function generateId() {
  return "c_" + Math.random().toString(36).slice(2, 10);
}

export function CamposAnamnesisForm({
  initialCampos,
}: {
  initialCampos: CampoPersonalizadoDefinicion[];
}) {
  const [campos, setCampos] = useState<CampoPersonalizadoDefinicion[]>(initialCampos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [newLabel, setNewLabel] = useState("");
  const [newTipo, setNewTipo] = useState<TipoCampoAnamnesis>("texto");
  const [newSeccion, setNewSeccion] = useState<SeccionAnamnesis>("personalizado");
  const [newOpciones, setNewOpciones] = useState("");

  const [editLabel, setEditLabel] = useState("");
  const [editTipo, setEditTipo] = useState<TipoCampoAnamnesis>("texto");
  const [editSeccion, setEditSeccion] = useState<SeccionAnamnesis>("personalizado");
  const [editOpciones, setEditOpciones] = useState("");

  function save(updated: CampoPersonalizadoDefinicion[]) {
    setCampos(updated);
    startTransition(async () => {
      const res = await guardarCamposAnamnesis(updated);
      if (res.ok) {
        toast.success("Campos guardados");
      } else {
        toast.error(res.error || "Error al guardar");
      }
    });
  }

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) {
      toast.error("El nombre del campo es obligatorio");
      return;
    }
    if (campos.length >= 20) {
      toast.error("Máximo 20 campos personalizados");
      return;
    }
    const opciones =
      newTipo === "selector"
        ? newOpciones
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;
    if (newTipo === "selector" && (!opciones || opciones.length < 2)) {
      toast.error("Un desplegable necesita al menos 2 opciones separadas por comas");
      return;
    }
    const campo: CampoPersonalizadoDefinicion = {
      id: generateId(),
      label,
      tipo: newTipo,
      seccion: newSeccion,
      ...(opciones ? { opciones } : {}),
    };
    save([...campos, campo]);
    setNewLabel("");
    setNewTipo("texto");
    setNewSeccion("personalizado");
    setNewOpciones("");
    setAdding(false);
  }

  function handleDelete(id: string) {
    save(campos.filter((c) => c.id !== id));
  }

  function startEdit(campo: CampoPersonalizadoDefinicion) {
    setEditingId(campo.id);
    setEditLabel(campo.label);
    setEditTipo(campo.tipo);
    setEditSeccion(campo.seccion);
    setEditOpciones(campo.opciones?.join(", ") || "");
  }

  function handleSaveEdit() {
    const label = editLabel.trim();
    if (!label) {
      toast.error("El nombre del campo es obligatorio");
      return;
    }
    const opciones =
      editTipo === "selector"
        ? editOpciones
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;
    if (editTipo === "selector" && (!opciones || opciones.length < 2)) {
      toast.error("Un desplegable necesita al menos 2 opciones separadas por comas");
      return;
    }
    save(
      campos.map((c) =>
        c.id === editingId
          ? { ...c, label, tipo: editTipo, seccion: editSeccion, ...(opciones ? { opciones } : { opciones: undefined }) }
          : c
      )
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {campos.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          No has creado campos personalizados todavía. Los campos que añadas aquí aparecerán en la anamnesis de todos tus pacientes.
        </p>
      )}

      {campos.length > 0 && (
        <div className="space-y-2">
          {campos.map((campo) => (
            <div
              key={campo.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />

              {editingId === campo.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                    placeholder="Nombre del campo"
                  />
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={editTipo}
                      onChange={(e) => setEditTipo(e.target.value as TipoCampoAnamnesis)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      {Object.entries(TIPO_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <select
                      value={editSeccion}
                      onChange={(e) => setEditSeccion(e.target.value as SeccionAnamnesis)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      {Object.entries(SECCION_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  {editTipo === "selector" && (
                    <input
                      type="text"
                      value={editOpciones}
                      onChange={(e) => setEditOpciones(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                      placeholder="Opciones separadas por comas (ej: Sí, No, A veces)"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{campo.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIPO_LABELS[campo.tipo]} · {SECCION_LABELS[campo.seccion]}
                      {campo.opciones && ` · ${campo.opciones.join(", ")}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(campo)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(campo.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Nombre del campo
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ej: Horas de entrenamiento semanal"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as TipoCampoAnamnesis)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(TIPO_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sección</label>
              <select
                value={newSeccion}
                onChange={(e) => setNewSeccion(e.target.value as SeccionAnamnesis)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(SECCION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          {newTipo === "selector" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Opciones (separadas por comas)
              </label>
              <input
                type="text"
                value={newOpciones}
                onChange={(e) => setNewOpciones(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ej: Sí, No, A veces"
              />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
              )}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Añadir campo
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={campos.length >= 20}
          className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Añadir campo personalizado
          {campos.length > 0 && (
            <span className="text-xs text-muted-foreground">({campos.length}/20)</span>
          )}
        </button>
      )}
    </div>
  );
}
