import type { Metadata } from "next";
import {
  FileText, Building2, ShoppingCart, Scale, UserCheck, ShieldAlert,
  Copyright, Stethoscope, AlertTriangle, Lock, RefreshCcw, Gavel, Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y condiciones — Annonia",
  description: "Términos y condiciones de uso de la plataforma Annonia.",
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

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm space-y-1.5">
      {children}
    </div>
  );
}

const TOC = [
  { id: "identificacion", label: "Identificación del prestador" },
  { id: "objeto", label: "Objeto del servicio" },
  { id: "acceso", label: "Condiciones de acceso" },
  { id: "pagos", label: "Planes y pagos" },
  { id: "desistimiento", label: "Derecho de desistimiento" },
  { id: "uso", label: "Uso aceptable" },
  { id: "propiedad", label: "Propiedad intelectual" },
  { id: "responsabilidad-sanitaria", label: "Responsabilidad sanitaria" },
  { id: "limitacion", label: "Limitación de responsabilidad" },
  { id: "datos", label: "Protección de datos" },
  { id: "modificaciones", label: "Modificaciones" },
  { id: "jurisdiccion", label: "Legislación y jurisdicción" },
  { id: "contacto", label: "Contacto" },
];

export default function TerminosPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium mb-4">
          <FileText className="w-4 h-4" />
          Documento legal
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Términos y condiciones de uso</h1>
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
              Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma web <strong className="text-gray-900">Annonia</strong>, accesible
              desde <strong className="text-gray-900">annonia.com</strong>, titularidad de Annonia Software S.L.
            </p>
            <p>
              Al registrarse o utilizar la Plataforma, el usuario acepta íntegramente estos Términos. Si no está de acuerdo con alguno
              de ellos, le rogamos que no utilice el servicio.
            </p>
          </div>

          <Section icon={Building2} title="1. Identificación del prestador" id="identificacion">
            <InfoCard>
              <p><strong className="text-gray-900">Denominación social:</strong> Annonia Software S.L.</p>
              <p><strong className="text-gray-900">Domicilio social:</strong> [Pendiente de completar]</p>
              <p><strong className="text-gray-900">CIF:</strong> [Pendiente de completar]</p>
              <p><strong className="text-gray-900">Email:</strong> legal@annonia.com</p>
              <p><strong className="text-gray-900">Registro Mercantil:</strong> [Pendiente de completar]</p>
            </InfoCard>
            <p>
              De conformidad con la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio
              Electrónico (LSSI-CE).
            </p>
          </Section>

          <Section icon={ShoppingCart} title="2. Objeto del servicio" id="objeto">
            <p>
              Annonia es una plataforma de gestión de consultas de nutrición y dietética dirigida a profesionales colegiados y a sus
              pacientes. Permite, entre otras funcionalidades:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Fichas de pacientes con datos clínicos y antropométricos",
                "Planes alimenticios personalizados con o sin IA",
                "Gestión de citas, mensajería y notificaciones",
                "Portal de acceso para pacientes",
                "Informes clínicos en formato PDF",
                "Base de datos de +2.600 alimentos",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={UserCheck} title="3. Condiciones de acceso y registro" id="acceso">
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <p className="font-semibold text-green-800 text-sm mb-1">Dietistas-nutricionistas</p>
                <p className="text-sm text-green-700">
                  Deberán estar en posesión de la titulación habilitante y colegiados. Annonia se reserva el derecho de verificar el
                  número de colegiado y denegar el acceso en caso de datos incorrectos.
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <p className="font-semibold text-blue-800 text-sm mb-1">Pacientes</p>
                <p className="text-sm text-blue-700">
                  Acceden al portal mediante credenciales proporcionadas por su dietista. No se requiere registro independiente.
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <p className="font-semibold text-amber-800 text-sm mb-1">Edad mínima: 16 años</p>
                <p className="text-sm text-amber-700">
                  Conforme al artículo 7 de la LOPDGDD. Los menores de 16 años necesitarán consentimiento de padres o tutores legales.
                </p>
              </div>
            </div>
          </Section>

          <Section icon={Scale} title="4. Planes de suscripción y pagos" id="pagos">
            <p>
              Annonia ofrece planes de suscripción mensual. Los precios se muestran en euros (€) e incluyen IVA cuando sea aplicable.
              El pago se realiza a través de Stripe.
            </p>
            <ul className="list-disc list-inside space-y-1.5 marker:text-green-400">
              <li>Los planes se renuevan automáticamente al final de cada periodo.</li>
              <li>Puedes cancelar en cualquier momento desde Ajustes. Seguirás con acceso hasta el final del periodo pagado.</li>
              <li>14 días de prueba gratuita sin tarjeta de crédito.</li>
              <li>Los precios pueden modificarse con preaviso mínimo de 30 días.</li>
            </ul>
          </Section>

          <Section icon={RefreshCcw} title="5. Derecho de desistimiento" id="desistimiento">
            <p>
              Conforme al artículo 103 del Real Decreto Legislativo 1/2007, podrás ejercer tu derecho de desistimiento en los 14 días
              naturales siguientes a la contratación, salvo que hayas comenzado a utilizar el servicio con tu consentimiento expreso.
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm">
              <p>Para ejercer este derecho: <strong className="text-gray-900">legal@annonia.com</strong></p>
            </div>
          </Section>

          <Section icon={ShieldAlert} title="6. Uso aceptable" id="uso">
            <p>El usuario se compromete a:</p>
            <ul className="list-disc list-inside space-y-1.5 marker:text-green-400">
              <li>Proporcionar información veraz y mantenerla actualizada.</li>
              <li>No utilizar la Plataforma para fines ilícitos.</li>
              <li>No intentar acceder a cuentas o datos de otros usuarios.</li>
              <li>No usar sistemas automatizados de extracción de datos.</li>
              <li>Cumplir la normativa de protección de datos al tratar información de pacientes.</li>
            </ul>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-sm text-red-700">
              Annonia se reserva el derecho de suspender o cancelar cuentas que incumplan estos Términos, previo aviso cuando sea posible.
            </div>
          </Section>

          <Section icon={Copyright} title="7. Propiedad intelectual e industrial" id="propiedad">
            <p>
              Todos los contenidos de la Plataforma (diseño, código, textos, gráficos, logos, marcas) son propiedad de Annonia o de
              sus licenciantes y están protegidos por la legislación española e internacional.
            </p>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-sm text-blue-700">
              <strong>Tus contenidos son tuyos:</strong> los datos clínicos, planes alimenticios y contenidos creados por los usuarios
              dentro de la Plataforma son propiedad del usuario que los ha generado.
            </div>
          </Section>

          <Section icon={Stethoscope} title="8. Responsabilidad del profesional sanitario" id="responsabilidad-sanitaria">
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-sm text-amber-800 space-y-2">
              <p>
                <strong>Annonia es una herramienta de gestión</strong> y no sustituye el criterio profesional del dietista-nutricionista.
              </p>
              <p>
                Las recomendaciones de IA son orientativas y deben ser revisadas y validadas por el profesional antes de su aplicación.
              </p>
              <p>
                El dietista es el único responsable de las decisiones clínicas tomadas con respecto a sus pacientes.
              </p>
            </div>
          </Section>

          <Section icon={AlertTriangle} title="9. Limitación de responsabilidad" id="limitacion">
            <p>
              Annonia se esfuerza por mantener la Plataforma disponible y actualizada, pero no garantiza la ausencia de interrupciones
              o errores. En la medida permitida por la ley:
            </p>
            <ul className="list-disc list-inside space-y-1.5 marker:text-gray-400">
              <li>No seremos responsables de daños indirectos, incidentales o consecuentes.</li>
              <li>La responsabilidad total estará limitada al importe pagado en los 12 meses anteriores al evento.</li>
            </ul>
          </Section>

          <Section icon={Lock} title="10. Protección de datos" id="datos">
            <p>
              El tratamiento de datos personales se rige por nuestra{" "}
              <a href="/legal/privacidad" className="text-green-600 font-medium hover:underline">Política de Privacidad</a>, que forma
              parte integrante de estos Términos.
            </p>
          </Section>

          <Section icon={RefreshCcw} title="11. Modificaciones" id="modificaciones">
            <p>
              Annonia se reserva el derecho de modificar estos Términos. Los cambios sustanciales se notificarán con al menos 30 días
              de antelación por email. El uso continuado del servicio tras la notificación implica aceptación.
            </p>
          </Section>

          <Section icon={Gavel} title="12. Legislación aplicable y jurisdicción" id="jurisdiccion">
            <p>
              Estos Términos se rigen por la legislación española. Para la resolución de controversias, las partes se someten a los
              Juzgados y Tribunales del domicilio social de Annonia, sin perjuicio de fueros imperativos del consumidor.
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm">
              <p>
                Plataforma de resolución de litigios en línea de la UE:{" "}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  ec.europa.eu/consumers/odr
                </a>
              </p>
            </div>
          </Section>

          <Section icon={Mail} title="13. Contacto" id="contacto">
            <div className="bg-green-50 rounded-xl border border-green-200 p-5 text-center">
              <p className="text-sm text-green-800">
                Para cualquier consulta: <strong>legal@annonia.com</strong>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
