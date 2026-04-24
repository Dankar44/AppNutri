import type { Metadata } from "next";
import {
  Shield, Building2, Database, Target, Users2, Clock, UserCheck,
  Lock, Baby, RefreshCcw, Mail, Server, Eye,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Política de privacidad — Annonia",
  description: "Política de privacidad y protección de datos de Annonia.",
};

function Section({
  icon: Icon, title, id, children,
}: {
  icon: React.ElementType; title: string; id: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 pt-1">{title}</h2>
      </div>
      <div className="pl-12 space-y-3 text-gray-600 text-[15px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((h) => (
              <th key={h} className="text-left p-3 font-semibold text-gray-900 border-b border-gray-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="p-3 text-gray-600">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOC = [
  { id: "responsable", label: "Responsable del tratamiento" },
  { id: "datos-recogemos", label: "Datos que recogemos" },
  { id: "finalidades", label: "Finalidades y bases legales" },
  { id: "destinatarios", label: "Destinatarios" },
  { id: "conservacion", label: "Plazos de conservación" },
  { id: "derechos", label: "Tus derechos" },
  { id: "seguridad", label: "Medidas de seguridad" },
  { id: "menores", label: "Datos de menores" },
  { id: "modificaciones", label: "Modificaciones" },
  { id: "contacto", label: "Contacto" },
];

export default function PrivacidadPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium mb-4">
          <Shield className="w-4 h-4" />
          Privacidad
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Política de privacidad</h1>
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
                  className="block text-sm text-gray-500 hover:text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-10">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 text-[15px] text-gray-600 leading-relaxed space-y-3">
            <p>
              En <strong className="text-gray-900">Annonia Software S.L.</strong> nos comprometemos a proteger la privacidad de nuestros
              usuarios. Esta Política explica cómo recogemos, utilizamos, almacenamos y protegemos sus datos personales de conformidad con:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
              {[
                { name: "RGPD", desc: "Reglamento (UE) 2016/679" },
                { name: "LOPDGDD", desc: "Ley Orgánica 3/2018" },
                { name: "LSSI-CE", desc: "Ley 34/2002" },
              ].map((law) => (
                <div key={law.name} className="bg-green-50 rounded-lg px-3 py-2 text-center">
                  <p className="text-sm font-semibold text-green-800">{law.name}</p>
                  <p className="text-xs text-green-600">{law.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <Section icon={Building2} title="1. Responsable del tratamiento" id="responsable">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm space-y-1.5">
              <p><strong className="text-gray-900">Identidad:</strong> Annonia Software S.L.</p>
              <p><strong className="text-gray-900">Domicilio:</strong> [Pendiente de completar]</p>
              <p><strong className="text-gray-900">CIF:</strong> [Pendiente de completar]</p>
              <p><strong className="text-gray-900">Email:</strong> privacidad@annonia.com</p>
              <p><strong className="text-gray-900">DPD:</strong> privacidad@annonia.com</p>
            </div>
          </Section>

          <Section icon={Database} title="2. Datos que recogemos" id="datos-recogemos">
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl border border-green-200 p-5">
                <p className="font-semibold text-green-800 text-sm mb-2">Dietistas-nutricionistas</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <strong>Identificativos:</strong> nombre, apellidos, email, nº colegiado</li>
                  <li>• <strong>Acceso:</strong> credenciales gestionadas por Supabase Auth (email/contraseña o Google OAuth)</li>
                  <li>• <strong>Facturación:</strong> procesados por Stripe — Annonia no almacena datos de tarjetas</li>
                  <li>• <strong>Uso:</strong> registros de actividad, preferencias, integraciones</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                <p className="font-semibold text-blue-800 text-sm mb-2">Pacientes</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Identificativos:</strong> nombre, apellidos, email, teléfono, fecha de nacimiento, foto</li>
                  <li>• <strong>Datos de salud (art. 9 RGPD):</strong> peso, altura, medidas, patologías, alergias, intolerancias, medicación, antecedentes, hábitos, seguimiento diario, planes alimenticios</li>
                  <li>• <strong>Portal:</strong> email y PIN cifrado</li>
                </ul>
              </div>

              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-sm text-amber-800">
                <strong>Importante:</strong> el dietista actúa como responsable del tratamiento de los datos de salud. Annonia actúa como
                encargado del tratamiento (art. 28 RGPD).
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 text-sm mb-1">Datos recogidos automáticamente</p>
                <p className="text-sm text-gray-500">
                  Dirección IP, datos de navegación, tipo de dispositivo/navegador, y cookies técnicas
                  (ver <a href="/legal/cookies" className="text-green-600 hover:underline">Política de Cookies</a>).
                </p>
              </div>
            </div>
          </Section>

          <Section icon={Target} title="3. Finalidades y bases legales" id="finalidades">
            <DataTable
              headers={["Finalidad", "Base legal"]}
              rows={[
                ["Gestión del registro y autenticación", "Ejecución del contrato (art. 6.1.b)"],
                ["Prestación del servicio contratado", "Ejecución del contrato (art. 6.1.b)"],
                ["Facturación y suscripciones", "Contrato + obligación legal (art. 6.1.b y 6.1.c)"],
                ["Tratamiento de datos de salud", "Interés vital + medicina preventiva (art. 9.2.c y 9.2.h)"],
                ["Notificaciones del servicio", "Ejecución del contrato (art. 6.1.b)"],
                ["Comunicaciones comerciales propias", "Interés legítimo (art. 6.1.f) — con derecho de oposición"],
                ["Mejora del servicio y análisis", "Interés legítimo (art. 6.1.f)"],
                ["Cumplimiento de obligaciones legales", "Obligación legal (art. 6.1.c)"],
              ]}
            />
          </Section>

          <Section icon={Users2} title="4. Destinatarios de los datos" id="destinatarios">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "Supabase", desc: "Autenticación y base de datos", flag: "🇪🇺 Servidores en la UE" },
                { name: "Stripe", desc: "Procesamiento de pagos", flag: "🛡️ Data Privacy Framework" },
                { name: "Google", desc: "Google Calendar (si se activa)", flag: "🛡️ Data Privacy Framework" },
                { name: "OpenAI", desc: "Generación con IA (datos mínimos)", flag: "🛡️ Data Privacy Framework" },
              ].map((item) => (
                <div key={item.name} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  <p className="text-xs text-green-600 mt-1">{item.flag}</p>
                </div>
              ))}
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-sm text-green-800">
              No vendemos ni cedemos datos a terceros con fines comerciales. Las transferencias internacionales están amparadas por
              decisiones de adecuación de la Comisión Europea o el DPF UE-EE.UU.
            </div>
          </Section>

          <Section icon={Clock} title="5. Plazos de conservación" id="conservacion">
            <DataTable
              headers={["Tipo de datos", "Plazo"]}
              rows={[
                ["Datos de cuenta", "Mientras esté activa + 30 días tras baja"],
                ["Facturación", "5 años (Ley General Tributaria)"],
                ["Datos de pacientes", "Mientras el dietista tenga cuenta activa; máx. 90 días tras baja"],
                ["Adjuntos de mensajes", "30 días (limpieza automática)"],
                ["Mensajes de texto", "60 días (limpieza automática)"],
                ["Logs de actividad", "Máximo 12 meses"],
              ]}
            />
          </Section>

          <Section icon={UserCheck} title="6. Tus derechos" id="derechos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { right: "Acceso", desc: "Confirmar si tratamos tus datos y acceder a ellos" },
                { right: "Rectificación", desc: "Corregir datos inexactos" },
                { right: "Supresión", desc: "Solicitar eliminación (derecho al olvido)" },
                { right: "Limitación", desc: "Restringir el tratamiento" },
                { right: "Portabilidad", desc: "Recibir datos en formato estructurado" },
                { right: "Oposición", desc: "Oponerse al tratamiento por interés legítimo" },
              ].map((item) => (
                <div key={item.right} className="flex items-start gap-3 bg-gray-50 rounded-lg px-4 py-3">
                  <span className="text-green-500 mt-0.5 font-bold text-sm">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.right}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm space-y-2">
              <p>Envía un email a <strong className="text-gray-900">privacidad@annonia.com</strong> con tu nombre, email y el derecho que deseas ejercer. Responderemos en máximo 30 días.</p>
              <p>
                Si no estás satisfecho, puedes reclamar ante la <strong className="text-gray-900">Agencia Española de Protección de Datos (AEPD)</strong>:{" "}
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">www.aepd.es</a>
              </p>
            </div>
          </Section>

          <Section icon={Lock} title="7. Medidas de seguridad" id="seguridad">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Cifrado en tránsito (HTTPS/TLS) y en reposo",
                "Hashing de contraseñas/PINs con PBKDF2 + sal única",
                "Autenticación JWT con tokens de corta duración",
                "Control de acceso basado en roles",
                "Copias de seguridad automáticas",
                "Revisión periódica de vulnerabilidades",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 bg-green-50 rounded-lg px-3 py-2 text-sm text-green-800">
                  <span className="text-green-500 mt-0.5">🔒</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Baby} title="8. Datos de menores" id="menores">
            <p>
              La Plataforma no está dirigida a menores de 16 años como usuarios directos. Los datos de menores solo podrán tratarse
              cuando el paciente sea atendido por un dietista con consentimiento de padres o tutores (art. 7 LOPDGDD).
            </p>
          </Section>

          <Section icon={RefreshCcw} title="9. Modificaciones" id="modificaciones">
            <p>
              Annonia puede actualizar esta Política para adaptarla a cambios normativos o de servicio. Se notificará de cualquier
              cambio sustancial con al menos 30 días de antelación.
            </p>
          </Section>

          <Section icon={Mail} title="10. Contacto" id="contacto">
            <div className="bg-green-50 rounded-xl border border-green-200 p-5 text-center">
              <p className="text-sm text-green-800">
                Para cualquier consulta sobre privacidad: <strong>privacidad@annonia.com</strong>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
