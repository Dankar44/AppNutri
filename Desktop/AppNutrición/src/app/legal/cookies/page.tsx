import type { Metadata } from "next";
import {
  Cookie, HelpCircle, ShieldCheck, Settings, Globe, RefreshCcw, Mail, Monitor,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Política de cookies — Annonia",
  description: "Política de cookies de la plataforma Annonia.",
  alternates: { canonical: "/legal/cookies" },
};

function Section({
  icon: Icon, title, id, children,
}: {
  icon: React.ElementType; title: string; id: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 pt-1">{title}</h2>
      </div>
      <div className="pl-12 space-y-3 text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function CookieCard({
  name, purpose, duration, type,
}: {
  name: string; purpose: string; duration: string; type: "necesaria" | "preferencia" | "tercero";
}) {
  const colors = {
    necesaria: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
    preferencia: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
    tercero: "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50",
  };
  const badges = {
    necesaria: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    preferencia: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    tercero: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };
  const labels = {
    necesaria: "Necesaria",
    preferencia: "Preferencia",
    tercero: "Tercero",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[type]}`}>
      <div className="flex items-center justify-between mb-2">
        <code className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</code>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badges[type]}`}>
          {labels[type]}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{purpose}</p>
      <p className="text-xs text-gray-400">Duración: {duration}</p>
    </div>
  );
}

const TOC = [
  { id: "que-son", label: "¿Qué son las cookies?" },
  { id: "necesarias", label: "Cookies necesarias" },
  { id: "preferencias", label: "Cookies de preferencias" },
  { id: "terceros", label: "Cookies de terceros" },
  { id: "gestion", label: "Gestión de cookies" },
  { id: "actualizaciones", label: "Actualizaciones" },
  { id: "contacto", label: "Contacto" },
];

export default function CookiesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
          <Cookie className="w-4 h-4" />
          Cookies
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Política de cookies</h1>
        <p className="text-gray-400 text-sm">Última actualización: 24 de abril de 2026</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* TOC sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contenido</p>
            <nav className="space-y-0.5">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Quick summary card */}
            <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
              <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">Resumen rápido</p>
              <ul className="text-xs text-green-700 dark:text-green-400 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5">✓</span>
                  <span>Solo cookies necesarias y de preferencias</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5">✓</span>
                  <span>Sin tracking publicitario</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5">✓</span>
                  <span>Google Analytics solo con consentimiento</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5">✓</span>
                  <span>Puedes gestionar tu consentimiento</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-10">
          <div className="bg-white dark:bg-[#17181e] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              Esta Política de Cookies explica qué cookies utiliza <strong className="text-gray-900 dark:text-gray-100">Annonia</strong> y cómo puede el usuario
              gestionarlas. Cumple con la <strong className="text-gray-900 dark:text-gray-100">Ley 34/2002 (LSSI-CE)</strong> y las directrices de la Agencia
              Española de Protección de Datos (AEPD).
            </p>
          </div>

          <Section icon={HelpCircle} title="1. ¿Qué son las cookies?" id="que-son">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten
                recordar preferencias como el idioma, inicio de sesión y configuraciones, facilitando tu experiencia en futuras visitas.
              </p>
            </div>
          </Section>

          <Section icon={ShieldCheck} title="2. Cookies estrictamente necesarias" id="necesarias">
            <p>
              Imprescindibles para el funcionamiento de la Plataforma. Sin ellas, no podríamos prestar el servicio.{" "}
              <strong className="text-gray-900 dark:text-gray-100">No requieren consentimiento</strong> (art. 22.2 LSSI-CE).
            </p>
            <div className="space-y-3">
              <CookieCard
                name="sb-*-auth-token"
                purpose="Sesión de autenticación del dietista (Supabase Auth). Mantiene tu sesión iniciada."
                duration="Sesión / 30 días"
                type="necesaria"
              />
              <CookieCard
                name="annonia-admin-session"
                purpose="Sesión del panel de administración. JWT cifrado con HS256."
                duration="7 días"
                type="necesaria"
              />
              <CookieCard
                name="annonia-paciente-session"
                purpose="Sesión del portal del paciente. JWT cifrado con HS256."
                duration="30 días"
                type="necesaria"
              />
            </div>
          </Section>

          <Section icon={Settings} title="3. Cookies de preferencias" id="preferencias">
            <p>
              Recuerdan tus preferencias para personalizar la experiencia. Se almacenan en el <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">localStorage</code> del navegador.
            </p>
            <div className="space-y-3">
              <CookieCard
                name="annonia-theme"
                purpose="Tu preferencia de tema visual (claro u oscuro)."
                duration="Persistente"
                type="preferencia"
              />
              <CookieCard
                name="annonia-tours-*"
                purpose="Registro de qué tours guiados has completado, para no volver a mostrarlos."
                duration="Persistente"
                type="preferencia"
              />
              <CookieCard
                name="annonia-welcome-*"
                purpose="Marca de que ya se ha mostrado la pantalla de bienvenida."
                duration="Persistente"
                type="preferencia"
              />
              <CookieCard
                name="annonia-cookie-consent"
                purpose="Registro de tu elección sobre cookies (aceptar/rechazar)."
                duration="365 días"
                type="preferencia"
              />
            </div>
          </Section>

          <Section icon={Globe} title="4. Cookies de terceros" id="terceros">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5 mb-4">
              <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-1">
                Annonia utiliza Google Analytics 4 para mejorar la experiencia del usuario.
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Solo se activa si aceptas las cookies. No usamos Facebook Pixel ni ningún servicio de tracking publicitario.
              </p>
            </div>
            <p>Los únicos servicios de terceros que pueden establecer cookies son:</p>
            <div className="space-y-3">
              <CookieCard
                name="Supabase"
                purpose="Cookies de autenticación necesarias para el funcionamiento del servicio de login."
                duration="Variable"
                type="tercero"
              />
              <CookieCard
                name="Stripe"
                purpose="Cookies de prevención de fraude durante el proceso de pago. Solo cuando accedes a la pasarela."
                duration="Variable"
                type="tercero"
              />
              <CookieCard
                name="Google (Calendar)"
                purpose="Cuando conectas voluntariamente tu Google Calendar, Google puede establecer cookies de sesión propias."
                duration="Variable"
                type="tercero"
              />
              <CookieCard
                name="_ga, _ga_* (Google Analytics 4)"
                purpose="Cookies de análisis anónimo de uso. Solo se cargan si aceptas las cookies al visitar la web."
                duration="Hasta 2 años"
                type="tercero"
              />
            </div>
          </Section>

          <Section icon={Monitor} title="5. Gestión de cookies" id="gestion">
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#17181e] rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">Banner de consentimiento</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Al visitar Annonia por primera vez, verás un banner donde puedes aceptar o rechazar cookies no esenciales.
                  Puedes cambiar tu elección en cualquier momento desde &quot;Cookies&quot; en el pie de página.
                </p>
              </div>

              <div className="bg-white dark:bg-[#17181e] rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">Configuración del navegador</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  También puedes bloquear o eliminar cookies desde tu navegador:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Chrome", href: "https://support.google.com/chrome/answer/95647" },
                    { name: "Firefox", href: "https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" },
                    { name: "Safari", href: "https://support.apple.com/es-es/guide/safari/sfri11471/mac" },
                    { name: "Edge", href: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
                  ].map((browser) => (
                    <a
                      key={browser.name}
                      href={browser.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 transition-all text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400"
                    >
                      <Globe className="w-4 h-4" />
                      {browser.name}
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-400">
                Desactivar cookies estrictamente necesarias puede impedir el funcionamiento correcto de la Plataforma (por ejemplo, no
                podrás iniciar sesión).
              </div>
            </div>
          </Section>

          <Section icon={RefreshCcw} title="6. Actualizaciones" id="actualizaciones">
            <p>
              Esta Política puede actualizarse para reflejar cambios en los servicios o en la normativa. Se notificará a los usuarios
              de cambios sustanciales.
            </p>
          </Section>

          <Section icon={Mail} title="7. Contacto" id="contacto">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5 text-center">
              <p className="text-sm text-green-800 dark:text-green-300">
                Para cualquier consulta sobre cookies: <strong>privacidad@annonia.com</strong>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
