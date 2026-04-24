import Link from "next/link";
import { Leaf, Check, Star, Zap, Users, Brain, Share2, BarChart3, Shield } from "lucide-react";

const PLANES = [
  {
    id: "basico",
    nombre: "Básico",
    precio: "9,99",
    periodo: "mes",
    descripcion: "Ideal para dietistas que empiezan o tienen una consulta pequeña.",
    destacado: false,
    features: [
      { texto: "Hasta 25 pacientes activos", icon: Users },
      { texto: "Planes alimenticios ilimitados", icon: Zap },
      { texto: "Base de datos de 2.600+ alimentos", icon: BarChart3 },
      { texto: "Recetas personalizadas", icon: Star },
      { texto: "Portal del paciente", icon: Share2 },
      { texto: "Seguimiento de medidas", icon: BarChart3 },
      { texto: "Soporte por email", icon: Shield },
    ],
    noIncluye: [
      "Generación de dietas con IA",
      "Pacientes ilimitados",
      "Exportación de informes PDF",
      "Soporte prioritario",
    ],
  },
  {
    id: "profesional",
    nombre: "Profesional",
    precio: "11,99",
    periodo: "mes",
    descripcion: "Para dietistas con consultas establecidas que quieren escalar.",
    destacado: true,
    features: [
      { texto: "Pacientes ilimitados", icon: Users },
      { texto: "Planes alimenticios ilimitados", icon: Zap },
      { texto: "Base de datos de 2.600+ alimentos", icon: BarChart3 },
      { texto: "Recetas personalizadas", icon: Star },
      { texto: "Portal del paciente", icon: Share2 },
      { texto: "Seguimiento de medidas", icon: BarChart3 },
      { texto: "Generación de dietas con IA", icon: Brain },
      { texto: "Exportación de informes PDF", icon: BarChart3 },
      { texto: "Plantillas de planes", icon: Star },
      { texto: "Soporte prioritario 24/7", icon: Shield },
    ],
    noIncluye: [],
  },
];

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/precios" className="flex items-center gap-2">
            <Leaf className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold">Annonia</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro?plan=basico"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          14 días de prueba gratuita
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          El plan perfecto para tu consulta
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tu práctica profesional.
          Sin compromisos, cancela cuando quieras.
        </p>
      </section>

      {/* Planes */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PLANES.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-card p-8 flex flex-col ${
                plan.destacado
                  ? "border-primary shadow-xl shadow-primary/10"
                  : "border-border"
              }`}
            >
              {plan.destacado && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                    <Star className="w-3 h-3" />
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">{plan.nombre}</h2>
                <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold">{plan.precio}€</span>
                <span className="text-muted-foreground">/{plan.periodo}</span>
              </div>

              <Link
                href={`/registro?plan=${plan.id}`}
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors mb-8 block ${
                  plan.destacado
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                Empezar 14 días gratis
              </Link>

              <div className="space-y-3 flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Incluye:
                </p>
                {plan.features.map((feature) => (
                  <div key={feature.texto} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.texto}</span>
                  </div>
                ))}

                {plan.noIncluye.length > 0 && (
                  <>
                    <div className="border-t border-border my-4" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      No incluido:
                    </p>
                    {plan.noIncluye.map((item) => (
                      <div key={item} className="flex items-start gap-2.5 opacity-50">
                        <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center text-xs">—</span>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ rápido */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-bold mb-6">Preguntas frecuentes</h3>
          <div className="space-y-4 text-left">
            <details className="group bg-card rounded-xl border border-border p-4">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                ¿Puedo cambiar de plan en cualquier momento?
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Sí, puedes subir o bajar de plan cuando quieras. El cambio se aplica en el siguiente ciclo de facturación.
              </p>
            </details>
            <details className="group bg-card rounded-xl border border-border p-4">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                ¿Qué pasa después de los 14 días de prueba?
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Al finalizar la prueba, se activará tu plan seleccionado. Si no has añadido un método de pago, tu cuenta pasará a modo lectura.
              </p>
            </details>
            <details className="group bg-card rounded-xl border border-border p-4">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                ¿Puedo cancelar en cualquier momento?
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Sí, sin preguntas. Puedes cancelar desde Ajustes y seguirás teniendo acceso hasta el final de tu periodo pagado.
              </p>
            </details>
            <details className="group bg-card rounded-xl border border-border p-4">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                ¿Mis datos están seguros?
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Absolutamente. Usamos encriptación de extremo a extremo, servidores en la UE y cumplimos con el RGPD. Tus datos y los de tus pacientes están protegidos.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="w-4 h-4 text-primary" />
            <span>Annonia © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/paciente/login" className="hover:text-foreground transition-colors">
              Portal pacientes
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
