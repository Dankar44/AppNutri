import { ArrowLeft, Sparkles, User, AlertTriangle } from "lucide-react";

export default function TourDemoIAPage() {
  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
          Generación IA de demostración — Solo para el tour guiado
        </p>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver al plan
        </span>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" /> Generar dieta con IA
        </h1>
        <p className="text-muted-foreground mt-1">Para Laura Martínez García</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <section data-tour="ia-config" className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Configuración del plan</h2>
            <p className="text-sm text-muted-foreground mt-1">Define los parámetros para la generación</p>
          </div>

          {/* Fase */}
          <div data-tour="ia-fase">
            <label className="block text-sm font-medium mb-1.5">Fase nutricional</label>
            <select defaultValue="mantenimiento" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm">
              <option value="">Personalizado</option>
              <option value="deficit">Déficit calórico (perder grasa)</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="volumen">Volumen (ganar masa muscular)</option>
              <option value="definicion">Definición (mantener músculo, perder grasa)</option>
              <option value="reverse">Reverse diet (subida progresiva)</option>
            </select>
          </div>

          {/* Tipo de dieta */}
          <div data-tour="ia-tipo-dieta">
            <label className="block text-sm font-medium mb-1.5">Tipo de dieta</label>
            <select defaultValue="" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm">
              <option value="">Mediterránea (por defecto)</option>
              <option value="baja_carbohidratos">Baja en carbohidratos</option>
              <option value="alta_proteina">Alta en proteínas</option>
              <option value="vegetariana">Vegetariana</option>
              <option value="vegana">Vegana</option>
              <option value="cetogenica">Cetogénica (keto)</option>
              <option value="sin_gluten">Sin gluten</option>
            </select>
          </div>

          {/* Comidas */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Comidas al día</label>
            <select defaultValue="6" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm">
              <option value="3">3 comidas</option>
              <option value="4">4 comidas</option>
              <option value="5">5 comidas</option>
              <option value="6">6 comidas</option>
            </select>
          </div>

          {/* Macros */}
          <div data-tour="ia-macros">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Macros diarios</label>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Ajustados a mantenimiento</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Calorías (kcal) *</span>
                <input type="number" defaultValue={1800} readOnly className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Proteínas (g)</span>
                <input type="number" defaultValue={120} readOnly className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Carbohidratos (g)</span>
                <input type="number" defaultValue={200} readOnly className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Grasas (g)</span>
                <input type="number" defaultValue={65} readOnly className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium mt-1" />
              </div>
            </div>
          </div>

          {/* Preferencias */}
          <div data-tour="ia-preferencias">
            <label className="block text-sm font-medium mb-2">Preferencias</label>
            <div className="grid grid-cols-2 gap-2">
              {["Fácil de preparar", "Batch cooking", "Económico", "Muy variado"].map((pref) => (
                <label key={pref} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1.5">
                  <input type="checkbox" defaultChecked={pref === "Fácil de preparar"} className="w-4 h-4 accent-primary" />
                  {pref}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA */}
        <div className="flex flex-col gap-6">
          {/* Datos del paciente */}
          <section data-tour="ia-paciente-info" className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Datos del paciente
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><span className="text-xs text-muted-foreground">Nombre</span><p className="font-medium">Laura Martínez García</p></div>
              <div><span className="text-xs text-muted-foreground">Objetivo</span><p className="font-medium">Mantenimiento</p></div>
              <div><span className="text-xs text-muted-foreground">Peso</span><p className="font-medium">65.2 kg</p></div>
              <div><span className="text-xs text-muted-foreground">Altura</span><p className="font-medium">168 cm</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-start gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs"><span className="font-medium text-red-600 dark:text-red-400">Alergias:</span> Frutos secos, Marisco</p>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs"><span className="font-medium text-amber-600 dark:text-amber-400">Intolerancias:</span> Lactosa</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {["Mediterránea", "Sin gluten"].map((p) => (
                <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p}</span>
              ))}
            </div>
          </section>

          {/* Instrucciones */}
          <section data-tour="ia-instrucciones" className="bg-card rounded-xl border border-border p-6 flex flex-col flex-1">
            <h2 className="text-lg font-semibold mb-2">Instrucciones adicionales</h2>
            <p className="text-sm text-muted-foreground mb-4">La IA seguirá estas instrucciones con prioridad máxima.</p>
            <textarea
              defaultValue="Que sea rico en pescado y verduras. Desayuno siempre con avena. Evitar lácteos por la intolerancia."
              readOnly
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm resize-y flex-1 min-h-[120px]"
            />
          </section>
        </div>
      </div>

      <div data-tour="ia-generar-btn" className="mt-4">
        <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
          <Sparkles className="w-5 h-5" /> Generar plan con IA
        </span>
      </div>
    </div>
  );
}
