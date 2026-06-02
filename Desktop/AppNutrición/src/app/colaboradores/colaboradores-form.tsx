"use client";

import { useState } from "react";
import { Loader2, Check, MessageCircle, Eye, EyeOff, ArrowLeft, FileText } from "lucide-react";
import { enviarSolicitudColaborador } from "@/app/actions/colaboradores";
import { verificarEmailDisponible } from "@/app/actions/registro";
import { PAISES, PREFIJOS } from "@/lib/paises";

const WHATSAPP_NUMERO = "34654310492";
const WHATSAPP_MSG = "¡Hola! Tengo una duda sobre el programa de colaboradores de Annonia 🌱";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MSG)}`;

const OPCIONES = {
  numPacientes: [
    ["0-2", "Entre 0 y 2"],
    ["2-5", "Entre 2 y 5"],
    ["5-15", "Entre 5 y 15"],
    ["15-30", "Entre 15 y 30"],
    ["30+", "Más de 30"],
  ],
  modalidad: [
    ["presencial", "Solo presencial"],
    ["online", "Solo online"],
    ["ambas", "Presencial y online"],
    ["sin_consulta", "Aún no tengo consulta"],
  ],
  tipoTrabajo: [
    ["autonomo", "Por mi cuenta"],
    ["clinica", "En una clínica/centro con más profesionales"],
  ],
  nivelEstudios: [
    ["estudiante", "Estudiante"],
    ["fp", "FP / Grado superior"],
    ["grado", "Grado universitario"],
    ["master", "Máster"],
    ["doctorado", "Doctorado"],
  ],
  esProfesor: [
    ["no", "No"],
    ["si", "Sí"],
  ],
  discapacidad: [
    ["no", "No"],
    ["si", "Sí"],
    ["prefiero_no_decir", "Prefiero no decirlo"],
  ],
} as const;

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

export function ColaboradoresForm() {
  const [step, setStep] = useState<1 | 2>(1);
  // Paso 1 (en memoria, no se guarda nada todavía)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Paso 2
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [pais, setPais] = useState("");
  const [prefijo, setPrefijo] = useState("+34");
  const [telefono, setTelefono] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [cvNombre, setCvNombre] = useState("");
  const [numPacientes, setNumPacientes] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [tipoTrabajo, setTipoTrabajo] = useState("");
  const [nivelEstudios, setNivelEstudios] = useState("");
  const [esProfesor, setEsProfesor] = useState("");
  const [discapacidad, setDiscapacidad] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function continuarPaso1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) { setError("Introduce un email válido."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setCheckingEmail(true);
    const check = await verificarEmailDisponible(email);
    setCheckingEmail(false);
    if (!check.disponible) { setError(check.error || "Ese email ya está registrado."); return; }
    setStep(2);
  }

  function onCv(e: React.ChangeEvent<HTMLInputElement>) {
    // El CV NO se sube ni se guarda; solo validamos que adjunten un PDF.
    const file = e.target.files?.[0];
    if (!file) { setCvNombre(""); return; }
    if (file.type !== "application/pdf") {
      setError("El currículum debe ser un archivo PDF.");
      e.target.value = "";
      setCvNombre("");
      return;
    }
    setError(null);
    setCvNombre(file.name);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!cvNombre) { setError("Adjunta tu currículum en PDF."); return; }
    setLoading(true);
    const res = await enviarSolicitudColaborador({
      nombre, apellidos, email, password,
      telefono: `${prefijo} ${telefono}`.trim(), pais,
      numPacientes, modalidad, tipoTrabajo, nivelEstudios,
      esProfesor: esProfesor === "si",
      discapacidad,
    });
    setLoading(false);
    if (!res.ok) { setError(res.error || "No hemos podido enviar tu candidatura. Inténtalo de nuevo."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">¡Hemos recibido tu candidatura! 🌱</h2>
        <p className="text-muted-foreground mb-2">
          Te hemos enviado un email para verificarla. Al verificarlo, tendrás acceso a la
          herramienta con la que trabajarás.
        </p>
        <p className="text-muted-foreground mb-6">
          Nos pondremos en contacto contigo por <strong>WhatsApp</strong>.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <MessageCircle className="h-4 w-4" />
          ¿Tienes dudas? Escríbenos por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Indicador de paso */}
      <div className="mb-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={step === 1 ? "text-primary" : ""}>1. Acceso</span>
        <span className="h-px flex-1 bg-border" />
        <span className={step === 2 ? "text-primary" : ""}>2. Tu candidatura</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={continuarPaso1} className="space-y-4">
          <h2 className="text-xl font-bold">Crea tu acceso</h2>
          <p className="text-sm text-muted-foreground -mt-2">
            Con este email y contraseña entrarás a la herramienta cuando te aceptemos.
          </p>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} className={inputCls} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required minLength={6} maxLength={128}
                placeholder="Mínimo 6 caracteres"
                className={`${inputCls} pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Ocultar" : "Mostrar"}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={checkingEmail} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-green-700 disabled:opacity-50">
            {checkingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
            {checkingEmail ? "Comprobando…" : "Continuar"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={enviar} className="space-y-4">
          <button type="button" onClick={() => { setStep(1); setError(null); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h2 className="text-xl font-bold">Tu candidatura</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium mb-1.5">Nombre</label>
              <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} className={inputCls} />
            </div>
            <div>
              <label htmlFor="apellidos" className="block text-sm font-medium mb-1.5">Apellidos</label>
              <input id="apellidos" type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required maxLength={100} className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="pais" className="block text-sm font-medium mb-1.5">País de residencia</label>
            <select id="pais" value={pais} onChange={(e) => setPais(e.target.value)} required className={inputCls}>
              <option value="" disabled>Selecciona tu país</option>
              {PAISES.map((p) => (
                <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium mb-1.5">Teléfono</label>
            <div className="flex gap-2">
              <select aria-label="Prefijo telefónico" value={prefijo} onChange={(e) => setPrefijo(e.target.value)} className={`${inputCls} w-auto shrink-0`}>
                {PREFIJOS.map((p) => (
                  <option key={p.etiqueta} value={p.dial}>{p.etiqueta}</option>
                ))}
              </select>
              <input id="telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required maxLength={20} placeholder="600 000 000" className={inputCls} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Te contactaremos por <strong>WhatsApp</strong> en este número.
            </p>
          </div>

          <div>
            <label htmlFor="cv" className="block text-sm font-medium mb-1.5">Currículum (PDF)</label>
            <label htmlFor="cv" className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50">
              <FileText className="h-4 w-4" />
              {cvNombre || "Adjuntar tu CV en PDF"}
            </label>
            <input id="cv" type="file" accept="application/pdf,.pdf" onChange={onCv} className="hidden" />
          </div>

          <Select id="numPacientes" label="¿Con cuántos pacientes trabajas?" value={numPacientes} onChange={setNumPacientes} options={OPCIONES.numPacientes} />
          <Select id="modalidad" label="¿Cómo das tus consultas?" value={modalidad} onChange={setModalidad} options={OPCIONES.modalidad} />
          <Select id="tipoTrabajo" label="¿Trabajas por tu cuenta o en una clínica?" value={tipoTrabajo} onChange={setTipoTrabajo} options={OPCIONES.tipoTrabajo} />
          <Select id="nivelEstudios" label="Nivel de estudios" value={nivelEstudios} onChange={setNivelEstudios} options={OPCIONES.nivelEstudios} />
          <Select id="esProfesor" label="¿Eres profesor/a en una universidad o grado?" value={esProfesor} onChange={setEsProfesor} options={OPCIONES.esProfesor} />
          <Select id="discapacidad" label="¿Tienes alguna discapacidad?" value={discapacidad} onChange={setDiscapacidad} options={OPCIONES.discapacidad} />

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-green-700 disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Enviando…" : "Enviar candidatura"}
          </button>
        </form>
      )}
    </div>
  );
}

function Select({
  id, label, value, onChange, options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required className={inputCls}>
        <option value="" disabled>Selecciona una opción</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}
