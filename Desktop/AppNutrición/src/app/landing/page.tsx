import type { Metadata } from "next";
import Link from "next/link";
import {
  Leaf, ArrowRight, Check, Star, Zap, Users, Brain, Share2,
  BarChart3, Shield, CalendarDays, MessageSquare, Utensils,
  LineChart, Smartphone, Globe, ChevronDown, Sparkles,
  Apple, Carrot, Cherry, Citrus, CupSoda, Egg, Fish,
  Grape, IceCreamCone, Milk, Nut, Salad, Sandwich, Soup, Wheat, Beef, Banana, Croissant, Pizza, Vegan, Bean,
} from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { JsonLd } from "@/components/json-ld";
import {
  ORGANIZATION_JSONLD,
  WEBSITE_JSONLD,
  SOFTWARE_APPLICATION_JSONLD,
  LANDING_FAQ_JSONLD,
} from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Annonia — Software de Nutrición para Dietistas | Dietas Personalizadas con IA",
  description:
    "Software para nutricionistas y dietistas: crea dietas personalizadas, gestiona pacientes, agenda citas online y genera planes alimenticios con inteligencia artificial. Prueba gratis 14 días.",
  alternates: { canonical: "/landing" },
  openGraph: {
    title: "Annonia — Software de Nutrición para Dietistas",
    description: "Software para nutricionistas: dietas personalizadas con IA, gestión de pacientes, agenda y portal del paciente. Desde 9,99€/mes.",
    type: "website",
    locale: "es_ES",
    siteName: "Annonia",
    url: "/landing",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Annonia — Software de nutrición para dietistas y nutricionistas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Annonia — Software de Nutrición para Dietistas",
    description: "Dietas personalizadas con IA, gestión de pacientes y agenda online. Prueba gratis 14 días.",
    images: ["/og-image.png"],
  },
};

const FEATURES = [
  {
    icon: Utensils,
    title: "Dietas personalizadas",
    description: "Planes alimenticios completos con +2.600 alimentos y cálculo automático de macronutrientes.",
  },
  {
    icon: Users,
    title: "Gestión de pacientes",
    description: "Ficha clínica completa, historial nutricional, medidas corporales y seguimiento en un solo lugar.",
  },
  {
    icon: Brain,
    title: "Generación de dietas con IA",
    description: "Crea planes nutricionales optimizados con inteligencia artificial, adaptados a cada paciente.",
  },
  {
    icon: CalendarDays,
    title: "Agenda de consultas",
    description: "Gestión de citas presenciales y online con Google Calendar y Google Meet integrados.",
  },
  {
    icon: MessageSquare,
    title: "Mensajería con pacientes",
    description: "Comunicación directa y segura con tus pacientes. Archivos, imágenes y notificaciones.",
  },
  {
    icon: Smartphone,
    title: "Portal del paciente",
    description: "Tus pacientes acceden a su dieta, seguimiento y recomendaciones desde cualquier dispositivo.",
  },
  {
    icon: LineChart,
    title: "Informes nutricionales",
    description: "Gráficas de evolución interactivas e informes PDF profesionales con un clic.",
  },
  {
    icon: Share2,
    title: "Compartir y exportar",
    description: "Comparte planes alimenticios por enlace, exporta PDFs y envía todo por email.",
  },
];

const SHOWCASE_SECTIONS = [
  {
    tag: "Para dietistas",
    title: "Software de gestión para tu consulta de nutrición",
    description:
      "Dedica más tiempo a tus pacientes y menos a tareas administrativas. Annonia centraliza fichas, planes alimenticios, citas y mensajería en un software de nutrición diseñado por y para dietistas.",
    features: [
      "Planes alimenticios con cálculo automático de macros",
      "Recetas propias y globales con ingredientes vinculados",
      "Generación de dietas con inteligencia artificial",
      "Exportación de informes PDF profesionales",
    ],
    cta: { text: "Empieza gratis", href: "/registro" },
    imagePosition: "right" as const,
    visualIcons: [Utensils, BarChart3, LineChart, Star],
    visualLabels: ["Planificar", "Analizar", "Seguir", "Personalizar"],
  },
  {
    tag: "Para pacientes",
    title: "Portal del paciente con seguimiento nutricional",
    description:
      "Tus pacientes acceden desde el móvil o el ordenador. Consultan su dieta personalizada, registran su evolución y se comunican contigo de forma directa.",
    features: [
      "Dieta semanal con horarios personalizados",
      "Registro diario de seguimiento y peso",
      "Mensajería directa con el nutricionista",
      "Lista de la compra automática",
    ],
    cta: { text: "Descubre el portal", href: "/registro" },
    imagePosition: "left" as const,
    visualIcons: [Smartphone, MessageSquare, LineChart, Share2],
    visualLabels: ["Mi dieta", "Mensajes", "Evolución", "Compartir"],
  },
  {
    tag: "Inteligencia artificial",
    title: "Genera planes alimenticios con IA en segundos",
    description:
      "Nuestra IA analiza el perfil, objetivos y restricciones de cada paciente para proponerte un plan nutricional equilibrado que puedes ajustar antes de asignarlo.",
    features: [
      "Adaptada a alergias, intolerancias y preferencias",
      "Respeta los objetivos calóricos y de macros",
      "Sugerencias basadas en la base de datos completa",
      "Editable al 100% antes de asignar",
    ],
    cta: { text: "Prueba la IA", href: "/registro" },
    imagePosition: "right" as const,
    visualIcons: [Brain, Sparkles, Zap, Check],
    visualLabels: ["Analizar", "Generar", "Optimizar", "Validar"],
  },
];

const PLANES = [
  {
    id: "basico",
    nombre: "Básico",
    precio: "9,99",
    periodo: "mes",
    descripcion: "Ideal para dietistas que empiezan.",
    destacado: false,
    features: [
      "Hasta 25 pacientes activos",
      "Planes alimenticios ilimitados",
      "Base de datos de 2.600+ alimentos",
      "Recetas personalizadas",
      "Portal del paciente",
      "Seguimiento de medidas",
    ],
  },
  {
    id: "profesional",
    nombre: "Profesional",
    precio: "11,99",
    periodo: "mes",
    descripcion: "Para consultas establecidas.",
    destacado: true,
    features: [
      "Todo lo del plan Básico",
      "Pacientes ilimitados",
      "Generación de dietas con IA",
      "Exportación de informes PDF",
      "Plantillas de planes",
      "Soporte prioritario 24/7",
    ],
  },
];

const FAQS = [
  {
    q: "¿Puedo probar Annonia gratis?",
    a: "Sí, tienes 14 días de prueba gratuita con acceso completo. No necesitas tarjeta de crédito.",
  },
  {
    q: "¿Mis datos y los de mis pacientes están seguros?",
    a: "Absolutamente. Usamos encriptación, servidores en la UE y cumplimos con el RGPD. La seguridad de los datos clínicos es nuestra prioridad.",
  },
  {
    q: "¿Puedo cambiar de plan o cancelar?",
    a: "Sí, sin compromisos. Cambia o cancela desde Ajustes. Mantienes acceso hasta el final del periodo pagado.",
  },
  {
    q: "¿Mis pacientes necesitan crear cuenta?",
    a: "No. Tú les envías un acceso con email y PIN. Ellos acceden al portal sin registrarse.",
  },
  {
    q: "¿Funciona en el móvil?",
    a: "Sí, todo está optimizado para móvil, tablet y escritorio. Es una web app progresiva que puedes instalar.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <JsonLd data={ORGANIZATION_JSONLD} />
      <JsonLd data={WEBSITE_JSONLD} />
      <JsonLd data={SOFTWARE_APPLICATION_JSONLD} />
      <JsonLd data={LANDING_FAQ_JSONLD} />

      {/* ─── NAVBAR ─── */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5">
            <Leaf className="w-7 h-7 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Annonia</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#funcionalidades" className="hover:text-green-600 transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-green-600 transition-colors">Cómo funciona</a>
            <a href="#precios" className="hover:text-green-600 transition-colors">Precios</a>
            <a href="#faq" className="hover:text-green-600 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] flex items-end bg-green-50 overflow-hidden">
        {/* Background placeholder */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-100/80 via-green-50/60 to-green-50/90 flex items-center justify-center">
          <span className="text-green-300/60 text-lg font-medium">Falta imagen</span>
        </div>

        {/* Floating notification card */}
        <ScrollReveal direction="right" delay={600} className="hidden lg:block absolute top-[35%] right-[8%] z-10">
          <div className="bg-white rounded-2xl shadow-xl shadow-black/10 px-5 py-4 flex items-start gap-3 max-w-xs">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Nutricionista Teresa</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                ¡Muy bien Carmen, ya veo más colores en el plato! 👏
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Hero text overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14 lg:pb-16 pt-24 w-full">
          <ScrollReveal direction="up" delay={100}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-gray-900 max-w-2xl">
              Nutrición <span className="bg-green-200/70 px-1.5 -mx-0.5">personalizada</span>
              <br />
              al alcance de todos
            </h1>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={250}>
            <p className="text-lg sm:text-xl text-gray-600 mt-6 mb-8 max-w-xl leading-relaxed">
              El software para dietistas que te permite crear dietas personalizadas, gestionar pacientes y hacer crecer tu consulta con inteligencia artificial.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={350}>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/registro"
                className="group px-8 py-4 text-base font-semibold rounded-2xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5 flex items-center gap-2"
              >
                Empieza gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#como-funciona"
                className="px-8 py-4 text-base font-semibold rounded-2xl border-2 border-green-200 text-green-700 hover:bg-white/60 hover:border-green-300 transition-all"
              >
                Ver cómo funciona
              </a>
            </div>
            <p className="mt-5 text-sm text-gray-400">
              14 días gratis · Sin tarjeta · Cancela cuando quieras
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── WAVE hero → stats ─── */}
      <div className="relative">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block -mb-px bg-green-50">
          <path d="M0 80V40C240 0 480 0 720 20C960 40 1200 60 1440 30V80H0Z" fill="#166534" />
        </svg>
        <section className="bg-green-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <p className="text-sm font-medium text-green-200 shrink-0">
                El software elegido por dietistas y nutricionistas
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
                {[
                  { value: "2.600+", label: "Alimentos" },
                  { value: "IA", label: "Generación" },
                  { value: "100%", label: "RGPD" },
                  { value: "24/7", label: "Disponible" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-green-300 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─── FOOD ICONS + HEADLINE ─── */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-b from-green-50/40 to-white">
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          <Utensils className="absolute top-[2%] left-[2%] w-8 h-8 text-green-300 opacity-[0.55] -rotate-[15deg]" />
          <Fish className="absolute top-[3%] left-[11%] w-9 h-9 text-green-300 opacity-[0.50] rotate-[5deg]" />
          <Croissant className="absolute top-[1%] left-[22%] w-8 h-8 text-green-300 opacity-[0.45] rotate-[8deg]" />
          <Salad className="absolute top-[4%] left-[33%] w-8 h-8 text-green-300 opacity-[0.40] -rotate-[8deg]" />
          <Wheat className="absolute top-[2%] left-[43%] w-7 h-7 text-green-200 opacity-[0.35] rotate-[12deg]" />
          <Vegan className="absolute top-[5%] left-[52%] w-7 h-7 text-green-200 opacity-[0.30] -rotate-[5deg]" />
          <Pizza className="absolute top-[1%] right-[33%] w-8 h-8 text-green-300 opacity-[0.40] -rotate-[12deg]" />
          <Soup className="absolute top-[3%] right-[22%] w-9 h-9 text-green-300 opacity-[0.45] -rotate-[5deg]" />
          <Beef className="absolute top-[4%] right-[11%] w-8 h-8 text-green-300 opacity-[0.50] -rotate-[10deg]" />
          <CupSoda className="absolute top-[2%] right-[2%] w-8 h-8 text-green-300 opacity-[0.55] rotate-[15deg]" />
          <Carrot className="absolute top-[13%] left-[5%] w-8 h-8 text-green-300 opacity-[0.40] rotate-[10deg]" />
          <Egg className="absolute top-[16%] left-[16%] w-7 h-7 text-green-200 opacity-[0.35] rotate-[20deg]" />
          <Nut className="absolute top-[12%] left-[27%] w-6 h-6 text-green-200 opacity-[0.30] -rotate-[8deg]" />
          <Cherry className="absolute top-[19%] left-[37%] w-7 h-7 text-green-200 opacity-[0.25] rotate-[12deg]" />
          <Banana className="absolute top-[14%] right-[37%] w-7 h-7 text-green-200 opacity-[0.25] rotate-[8deg]" />
          <Bean className="absolute top-[17%] right-[27%] w-6 h-6 text-green-200 opacity-[0.30] rotate-[15deg]" />
          <Sandwich className="absolute top-[12%] right-[16%] w-8 h-8 text-green-200 opacity-[0.35] rotate-[8deg]" />
          <IceCreamCone className="absolute top-[15%] right-[5%] w-7 h-7 text-green-300 opacity-[0.40] -rotate-[20deg]" />
          <Apple className="absolute top-[27%] left-[4%] w-7 h-7 text-green-200 opacity-[0.20] -rotate-[20deg]" />
          <Grape className="absolute top-[32%] left-[18%] w-7 h-7 text-green-200 opacity-[0.16] rotate-[5deg]" />
          <Citrus className="absolute top-[29%] right-[18%] w-7 h-7 text-green-200 opacity-[0.16] rotate-[10deg]" />
          <Croissant className="absolute top-[34%] right-[4%] w-7 h-7 text-green-200 opacity-[0.20] rotate-[8deg]" />
          <Wheat className="absolute top-[48%] left-[6%] w-6 h-6 text-green-200 opacity-[0.12] -rotate-[5deg]" />
          <Carrot className="absolute top-[52%] right-[8%] w-6 h-6 text-green-200 opacity-[0.12] rotate-[15deg]" />
          <Cherry className="absolute top-[68%] left-[10%] w-5 h-5 text-green-200 opacity-[0.08] rotate-[12deg]" />
          <Nut className="absolute top-[72%] right-[12%] w-5 h-5 text-green-200 opacity-[0.08] -rotate-[8deg]" />
        </div>
        <ScrollReveal>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-3">
              Software de nutrición personalizada.
            </h2>
            <p className="text-xl sm:text-2xl text-gray-400">
              Pacientes únicos, planes alimenticios únicos.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── SHOWCASE ─── */}
      <section id="como-funciona">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">
          {SHOWCASE_SECTIONS.map((section, idx) => (
            <ScrollReveal key={idx} direction={idx % 2 === 0 ? "left" : "right"} delay={100}>
              <div className={`flex flex-col lg:flex-row items-center gap-10 lg:gap-16 ${
                  section.imagePosition === "left" ? "lg:flex-row-reverse" : ""
                }`}>
                <div className="flex-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold mb-4 tracking-wide uppercase">
                    {section.tag}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                    {section.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    {section.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {section.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-500">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={section.cta.href}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all shadow-sm shadow-green-600/20 hover:-translate-y-0.5"
                  >
                    {section.cta.text}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex-1 w-full max-w-sm lg:max-w-md">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/60 flex items-center justify-center shadow-sm">
                    <div className="grid grid-cols-2 gap-4 p-8">
                      {section.visualIcons.map((Icon, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white shadow-sm border border-green-100/60">
                          <Icon className="w-7 h-7 text-green-600" />
                          <p className="text-xs font-medium text-gray-500">{section.visualLabels[i]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── WAVE white → green (top of Trust) ─── */}
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block -mb-px">
        <path d="M0 80V50C240 20 480 40 720 60C960 80 1200 70 1440 40V80H0Z" fill="#16a34a" />
      </svg>

      {/* ─── TRUST ─── */}
      <section className="relative bg-green-600 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.06),transparent_60%)]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
                Software diseñado para dietistas-nutricionistas
              </h2>
              <p className="text-green-100 text-lg leading-relaxed">
                Cada funcionalidad ha sido pensada para ahorrar tiempo en tu consulta de nutrición
                y mejorar la experiencia de tus pacientes.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { icon: Shield, title: "Segura", desc: "Datos cifrados, servidores en la UE, cumplimiento RGPD" },
              { icon: Globe, title: "Accesible", desc: "Desde cualquier dispositivo, en cualquier momento" },
              { icon: Zap, title: "Rápida", desc: "Interfaz ligera optimizada para tu día a día" },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 150} direction="up">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-7 text-center border border-white/10 hover:bg-white/15 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-green-100" />
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-1.5">{item.title}</h3>
                  <p className="text-green-200 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WAVE green → white (bottom of Trust) ─── */}
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block -mt-px">
        <path d="M0 0V30C240 60 480 40 720 20C960 0 1200 10 1440 40V0H0Z" fill="#16a34a" />
      </svg>

      {/* ─── FEATURES ─── */}
      <section id="funcionalidades" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Laptop mockup */}
          <ScrollReveal direction="up" delay={100}>
            <div className="max-w-5xl mx-auto">
              {/* Screen bezel */}
              <div className="bg-gray-800 rounded-t-2xl p-2 pt-3">
                {/* Browser dots */}
                <div className="flex items-center gap-1.5 px-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  <div className="flex-1 mx-3 h-5 rounded-md bg-gray-700/80 flex items-center justify-center">
                    <span className="text-[10px] text-gray-400">annonia.com</span>
                  </div>
                </div>
                {/* Screen content */}
                <div className="bg-white rounded-sm p-6 sm:p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                      Todo lo que necesita tu consulta de nutrición
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Desde la primera consulta dietética hasta el seguimiento nutricional a largo plazo.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {FEATURES.map((feature) => (
                      <div
                        key={feature.title}
                        className="group relative p-5 rounded-xl border border-green-100 bg-white hover:border-green-300 hover:shadow-lg hover:shadow-green-50 transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center mb-3 transition-colors">
                          <feature.icon className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Laptop base / keyboard */}
              <div className="relative mx-auto">
                <div className="bg-gray-300 h-4 rounded-b-lg mx-16" />
                <div className="bg-gray-200 h-1.5 rounded-b-xl mx-8" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="precios" className="py-24 sm:py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200/80 text-green-700 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                14 días de prueba gratuita
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Planes simples y transparentes
              </h2>
              <p className="text-gray-400 text-lg">
                Sin compromisos. Cancela cuando quieras.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {PLANES.map((plan, i) => (
              <ScrollReveal key={plan.id} delay={i * 150} direction="up">
                <div
                  className={`relative rounded-2xl border-2 bg-white p-8 flex flex-col h-full ${
                    plan.destacado
                      ? "border-green-600 shadow-xl shadow-green-100/50"
                      : "border-green-100"
                  }`}
                >
                  {plan.destacado && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-green-600 text-white text-xs font-bold uppercase tracking-wide">
                        <Star className="w-3 h-3" /> Más popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{plan.nombre}</h3>
                    <p className="text-sm text-gray-400">{plan.descripcion}</p>
                  </div>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-bold text-gray-900">{plan.precio}€</span>
                    <span className="text-gray-300">/{plan.periodo}</span>
                  </div>
                  <Link
                    href={`/registro?plan=${plan.id}`}
                    className={`w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all mb-8 block ${
                      plan.destacado
                        ? "bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-600/20"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    Empezar 14 días gratis
                  </Link>
                  <div className="space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Preguntas frecuentes
              </h2>
              <p className="text-gray-400">
                ¿Tienes dudas? Aquí resolvemos las más comunes.
              </p>
            </div>
          </ScrollReveal>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 80} direction="up">
                <details className="group bg-white rounded-2xl border border-green-100 overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between p-5 sm:p-6 cursor-pointer list-none font-medium text-gray-900 hover:bg-green-50/50 transition-colors">
                    {faq.q}
                    <ChevronDown className="w-5 h-5 text-green-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-gray-400 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="relative rounded-3xl bg-gradient-to-br from-green-600 to-green-700 overflow-hidden px-8 sm:px-16 py-16 sm:py-20 text-center">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
              </div>
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Empieza a digitalizar tu consulta de nutrición
                </h2>
                <p className="text-green-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                  Únete a los dietistas-nutricionistas que confían en Annonia para ofrecer
                  dietas personalizadas y un seguimiento nutricional excepcional.
                </p>
                <Link
                  href="/registro"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-white text-green-700 hover:bg-green-50 transition-all shadow-lg hover:-translate-y-0.5"
                >
                  Crear cuenta gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="mt-5 text-sm text-green-200/80">
                  14 días gratis · Sin tarjeta · Cancela cuando quieras
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-green-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-green-600" />
                <span className="text-lg font-bold">Annonia</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Software de nutrición profesional para dietistas-nutricionistas. Gestión de consulta, dietas personalizadas y seguimiento de pacientes.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-4">Producto</p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="#funcionalidades" className="hover:text-green-600 transition-colors">Funcionalidades</a></li>
                <li><Link href="/precios" className="hover:text-green-600 transition-colors">Precios</Link></li>
                <li><a href="#faq" className="hover:text-green-600 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-4">Acceso</p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link href="/login" className="hover:text-green-600 transition-colors">Iniciar sesión</Link></li>
                <li><Link href="/registro" className="hover:text-green-600 transition-colors">Crear cuenta</Link></li>
                <li><Link href="/paciente/login" className="hover:text-green-600 transition-colors">Portal pacientes</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-4">Legal</p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link href="/legal/terminos" className="hover:text-green-600 transition-colors">Términos y condiciones</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-green-600 transition-colors">Política de privacidad</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-green-600 transition-colors">Política de cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-green-100 pt-8 text-sm text-gray-300 text-center">
            © {new Date().getFullYear()} Annonia. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
