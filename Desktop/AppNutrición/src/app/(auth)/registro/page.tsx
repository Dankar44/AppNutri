"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Leaf, Eye, EyeOff, Loader2, Check, ArrowRight, ArrowLeft,
  Crown, Star, Users, Brain, BarChart3, Share2, Shield, Zap,
} from "lucide-react";
import { toast } from "sonner";

const PLANES = [
  {
    id: "basico",
    nombre: "Básico",
    precio: "9,99",
    features: [
      { texto: "Hasta 25 pacientes activos", icon: Users },
      { texto: "Planes alimenticios ilimitados", icon: Zap },
      { texto: "2.600+ alimentos", icon: BarChart3 },
      { texto: "Recetas personalizadas", icon: Star },
      { texto: "Portal del paciente", icon: Share2 },
      { texto: "Seguimiento de medidas", icon: BarChart3 },
    ],
  },
  {
    id: "profesional",
    nombre: "Profesional",
    precio: "11,99",
    destacado: true,
    features: [
      { texto: "Pacientes ilimitados", icon: Users },
      { texto: "Todo lo del plan Básico", icon: Check },
      { texto: "Generación de dietas con IA", icon: Brain },
      { texto: "Exportación de informes PDF", icon: BarChart3 },
      { texto: "Plantillas de planes", icon: Star },
      { texto: "Soporte prioritario 24/7", icon: Shield },
    ],
  },
];

export default function RegistroPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState("profesional");
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    especialidad: "",
    numColegiado: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSiguiente(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellidos.trim() || !form.email.trim()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setPaso(2);
  }

  async function handleRegistro() {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          apellidos: form.apellidos,
          especialidad: form.especialidad,
          numColegiado: form.numColegiado,
          plan: planSeleccionado,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("¡Cuenta creada! Revisa tu email para confirmarla.");
    router.push("/login");
  }

  return (
    <div className="min-h-dvh flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Leaf className="w-16 h-16 mb-8" />
          <h1 className="text-5xl font-bold mb-4">NutriApp</h1>
          <p className="text-xl text-green-100 max-w-md">
            {paso === 1
              ? "Únete a la plataforma que está transformando la forma en que los dietistas crean dietas personalizadas."
              : paso === 2
                ? "Elige el plan que mejor se adapte a tu consulta. 14 días de prueba gratuita incluidos."
                : "Solo profesionales colegiados pueden acceder a NutriApp. Verificaremos tu número de colegiado."}
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-safe">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-xl sm:text-2xl font-bold">NutriApp</span>
          </div>

          {/* Indicador de pasos */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${paso === 1 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                paso === 1 ? "bg-primary text-white" : paso > 1 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {paso > 1 ? <Check className="w-4 h-4" /> : "1"}
              </span>
              <span className="hidden sm:inline">Datos</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-1.5 text-sm font-medium ${paso === 2 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                paso === 2 ? "bg-primary text-white" : paso > 2 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {paso > 2 ? <Check className="w-4 h-4" /> : "2"}
              </span>
              <span className="hidden sm:inline">Plan</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-1.5 text-sm font-medium ${paso === 3 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                paso === 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}>
                3
              </span>
              <span className="hidden sm:inline">Verificación</span>
            </div>
          </div>

          {/* === PASO 1: Datos personales === */}
          {paso === 1 && (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Crear cuenta</h2>
              <p className="text-muted-foreground text-sm sm:text-base mb-6">
                Regístrate como dietista profesional
              </p>

              <form onSubmit={handleSiguiente} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium mb-1.5">
                      Nombre *
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      value={form.nombre}
                      onChange={(e) => updateForm("nombre", e.target.value)}
                      placeholder="María"
                      required
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                  </div>
                  <div>
                    <label htmlFor="apellidos" className="block text-sm font-medium mb-1.5">
                      Apellidos *
                    </label>
                    <input
                      id="apellidos"
                      type="text"
                      value={form.apellidos}
                      onChange={(e) => updateForm("apellidos", e.target.value)}
                      placeholder="García López"
                      required
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                    Email profesional *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    placeholder="tu@email.com"
                    required
                    maxLength={200}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="especialidad" className="block text-sm font-medium mb-1.5">
                    Especialidad
                    <span className="text-muted-foreground font-normal"> (opcional)</span>
                  </label>
                  <input
                    id="especialidad"
                    type="text"
                    value={form.especialidad}
                    onChange={(e) => updateForm("especialidad", e.target.value)}
                    placeholder="Ej: Nutrición deportiva, Obesidad..."
                    maxLength={200}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      maxLength={128}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* === PASO 2: Elegir plan === */}
          {paso === 2 && (
            <>
              <h2 className="text-3xl font-bold mb-2">Elige tu plan</h2>
              <p className="text-muted-foreground mb-6">
                14 días de prueba gratuita. Cancela cuando quieras.
              </p>

              <div className="space-y-4 mb-6">
                {PLANES.map((plan) => {
                  const selected = planSeleccionado === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPlanSeleccionado(plan.id)}
                      className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {plan.destacado && <Crown className="w-4 h-4 text-amber-500" />}
                          <span className="font-semibold">{plan.nombre}</span>
                          {plan.destacado && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-bold">{plan.precio}€</span>
                        <span className="text-sm text-muted-foreground">/mes</span>
                      </div>

                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5">
                        {plan.features.map((f) => (
                          <div key={f.texto} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <f.icon className="w-3 h-3 text-primary flex-shrink-0" />
                            <span>{f.texto}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="px-4 py-2.5 rounded-lg border border-border font-medium hover:bg-muted transition-colors flex items-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => setPaso(3)}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                No se te cobrará nada durante los 14 días de prueba
              </p>
            </>
          )}

          {/* === PASO 3: Verificación profesional === */}
          {paso === 3 && (
            <>
              <h2 className="text-3xl font-bold mb-2">Verificación profesional</h2>
              <p className="text-muted-foreground mb-6">
                Solo profesionales colegiados pueden acceder a NutriApp
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="numColegiado" className="block text-sm font-medium mb-1.5">
                    Número de colegiado *
                  </label>
                  <input
                    id="numColegiado"
                    type="text"
                    value={form.numColegiado}
                    onChange={(e) => updateForm("numColegiado", e.target.value)}
                    placeholder="Ej: AND-00123, CAT-456..."
                    required
                    maxLength={50}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Verificación manual</p>
                      <p className="text-amber-700">
                        Tu cuenta será revisada por nuestro equipo para verificar que eres un profesional colegiado. Recibirás acceso completo una vez aprobada tu solicitud.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="px-4 py-2.5 rounded-lg border border-border font-medium hover:bg-muted transition-colors flex items-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.numColegiado.trim()) {
                      toast.error("Introduce tu número de colegiado");
                      return;
                    }
                    handleRegistro();
                  }}
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </div>
            </>
          )}

          {/* Links comunes */}
          <p className="text-center mt-6 text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              ¿Eres paciente?{" "}
              <Link href="/paciente/login" className="text-primary font-medium hover:underline">
                Accede al portal de pacientes
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
