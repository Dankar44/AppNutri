import Link from "next/link";
import { Leaf, ArrowRight, ChevronRight } from "lucide-react";

// Piezas compartidas de las páginas SEO públicas (/faq, /software-para-nutricionistas-gratis,
// /alternativa-a-*). Replican la estética de la landing (eyebrows, resaltado verde, olas,
// footer oscuro) en server components puros, sin JS de cliente.

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-green-800 dark:text-green-300 text-xs font-bold tracking-[0.18em] uppercase mb-4">
      {children}
    </span>
  );
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[#bdd9c5] dark:bg-[#2a5e3a] dark:text-green-100 px-2 -mx-0.5">
      {children}
    </span>
  );
}

export function SeoHeader() {
  return (
    <header className="bg-white/90 dark:bg-[#101117]/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-2">
          <Leaf className="w-7 h-7 text-green-600 dark:text-green-400" />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Annonia</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm font-semibold text-gray-600 dark:text-gray-300">
          <Link href="/landing" className="hover:text-green-700 dark:hover:text-green-400 transition-colors">Inicio</Link>
          <Link href="/precios" className="hover:text-green-700 dark:hover:text-green-400 transition-colors">Precios</Link>
          <Link href="/faq" className="hover:text-green-700 dark:hover:text-green-400 transition-colors">FAQ</Link>
          <Link href="/login" className="hover:text-green-700 dark:hover:text-green-400 transition-colors">Iniciar sesión</Link>
        </nav>
        <Link
          href="/registro"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-md shadow-green-600/20"
        >
          Empezar gratis
        </Link>
      </div>
    </header>
  );
}

export function SeoHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-gradient-to-b from-green-50/60 to-white dark:from-green-950/20 dark:to-[#101117] pt-16 pb-12 sm:pt-24 sm:pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-5 leading-[1.15]">
          {title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}

export function CtaButtons() {
  return (
    <div className="mt-9 flex flex-wrap justify-center gap-3.5">
      <Link
        href="/registro"
        className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold rounded-2xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 hover:-translate-y-0.5"
      >
        Crear mi cuenta gratis
        <ArrowRight className="w-5 h-5" />
      </Link>
      <Link
        href="/demo"
        className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17181e] text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1d1e26] transition-all hover:-translate-y-0.5"
      >
        Ver la demo
      </Link>
    </div>
  );
}

export function SeoFaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700 border-l-2 border-[#bdd9c5] dark:border-[#2a5e3a] pl-6 sm:pl-8">
      {items.map((faq) => (
        <details key={faq.q} className="group py-5 first:pt-0 last:pb-0">
          <summary className="flex items-center justify-between cursor-pointer text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-green-700 dark:hover:text-green-400 transition-colors [&::-webkit-details-marker]:hidden list-none">
            <span>{faq.q}</span>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform duration-200 group-open:rotate-90" />
          </summary>
          <p className="pt-3 text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  children,
  sub,
}: {
  eyebrow?: string;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
        {children}
      </h2>
      {sub && (
        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed">{sub}</p>
      )}
    </div>
  );
}

// Interlinking entre las páginas SEO: ayuda al rastreo y reparte autoridad.
const EXPLORAR = [
  { href: "/software-para-nutricionistas-gratis", titulo: "Software para nutricionistas gratis", texto: "Qué incluye Annonia y por qué es gratuito." },
  { href: "/alternativa-a-dietowin", titulo: "Alternativa a Dietowin", texto: "Gratis y 100% online, sin licencia ni instalación." },
  { href: "/alternativa-a-nutrium", titulo: "Alternativa a Nutrium", texto: "Las mismas funciones clave, sin suscripción mensual." },
  { href: "/faq", titulo: "Preguntas frecuentes", texto: "Dudas comunes sobre software de nutrición y Annonia." },
  { href: "/precios", titulo: "Precios", texto: "Todo incluido y gratis durante el lanzamiento." },
  { href: "/demo", titulo: "Demo interactiva", texto: "Explora la herramienta sin registrarte." },
];

export function SeoExplorar({ actual }: { actual: string }) {
  const enlaces = EXPLORAR.filter((e) => e.href !== actual).slice(0, 3);
  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-white to-green-50/50 dark:from-[#101117] dark:to-green-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Sigue explorando">
          También te puede <Highlight>interesar</Highlight>
        </SectionTitle>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group bg-white dark:bg-[#17181e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6"
            >
              <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                {e.titulo}
              </h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{e.texto}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-green-700 dark:text-green-400">
                Ver más
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SeoCtaFinal({
  titulo,
  highlight,
  resto,
  descripcion,
}: {
  titulo: string;
  highlight: string;
  resto?: string;
  descripcion: string;
}) {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-5">
            {titulo} <Highlight>{highlight}</Highlight>
            {resto ? ` ${resto}` : ""}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            {descripcion}
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 hover:-translate-y-0.5"
          >
            Crear mi cuenta gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-5 text-sm text-gray-400 dark:text-gray-500">
            Sin tarjeta, sin instalación y con todas las funciones.
          </p>
        </div>
      </div>
    </section>
  );
}

export function SeoFooter() {
  return (
    <>
      {/* Ola white → dark, igual que en la landing */}
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block -mb-px" aria-hidden="true">
        <path d="M0 80V50C240 20 480 40 720 60C960 80 1200 70 1440 40V80H0Z" className="fill-[#2d3748] dark:fill-[#0a0b0e]" />
      </svg>
      <footer className="bg-[#2d3748] dark:bg-[#0a0b0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-green-400" />
                <span className="text-lg font-bold text-white">Annonia</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                El software gratuito y online para nutricionistas: pacientes, dietas con IA,
                seguimiento y portal del paciente, todo en un solo lugar.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-semibold text-white mb-4">Producto</p>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link href="/landing" className="hover:text-green-300 transition-colors">Inicio</Link></li>
                  <li><Link href="/precios" className="hover:text-green-300 transition-colors">Precios</Link></li>
                  <li><Link href="/demo" className="hover:text-green-300 transition-colors">Demo</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-4">Recursos</p>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link href="/software-para-nutricionistas-gratis" className="hover:text-green-300 transition-colors">Software gratis</Link></li>
                  <li><Link href="/alternativa-a-dietowin" className="hover:text-green-300 transition-colors">Alternativa a Dietowin</Link></li>
                  <li><Link href="/alternativa-a-nutrium" className="hover:text-green-300 transition-colors">Alternativa a Nutrium</Link></li>
                  <li><Link href="/faq" className="hover:text-green-300 transition-colors">Preguntas frecuentes</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-4">Acceso</p>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link href="/login" className="hover:text-green-300 transition-colors">Iniciar sesión</Link></li>
                  <li><Link href="/registro" className="hover:text-green-300 transition-colors">Crear cuenta</Link></li>
                  <li><Link href="/paciente/login" className="hover:text-green-300 transition-colors">Portal de pacientes</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-4">Legal</p>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link href="/legal/terminos" className="hover:text-green-300 transition-colors">Términos y condiciones</Link></li>
                  <li><Link href="/legal/privacidad" className="hover:text-green-300 transition-colors">Política de privacidad</Link></li>
                  <li><Link href="/legal/cookies" className="hover:text-green-300 transition-colors">Política de cookies</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} Annonia. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}

export function getBreadcrumbJsonLd(nombre: string, ruta: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://annonia.com/landing" },
      { "@type": "ListItem", position: 2, name: nombre, item: `https://annonia.com${ruta}` },
    ],
  };
}
