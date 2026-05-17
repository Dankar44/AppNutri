import type { Metadata } from "next";
import {
  Shield, Building2, Database, Target, Users2, Clock, UserCheck,
  Lock, Baby, RefreshCcw, Mail,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("privacidad.metadata.title"),
    description: t("privacidad.metadata.description"),
    alternates: { canonical: "/legal/privacidad" },
  };
}

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

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            {headers.map((h) => (
              <th key={h} className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="p-3 text-gray-600 dark:text-gray-400">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PrivacidadPage() {
  const t = await getTranslations("legal");

  const TOC = [
    { id: "responsable", label: t("privacidad.toc.responsable") },
    { id: "datos-recogemos", label: t("privacidad.toc.datosRecogemos") },
    { id: "finalidades", label: t("privacidad.toc.finalidades") },
    { id: "destinatarios", label: t("privacidad.toc.destinatarios") },
    { id: "conservacion", label: t("privacidad.toc.conservacion") },
    { id: "derechos", label: t("privacidad.toc.derechos") },
    { id: "seguridad", label: t("privacidad.toc.seguridad") },
    { id: "menores", label: t("privacidad.toc.menores") },
    { id: "modificaciones", label: t("privacidad.toc.modificaciones") },
    { id: "contacto", label: t("privacidad.toc.contacto") },
  ];

  const FINALIDADES_ROWS = [
    [t("privacidad.finalidades.filas.registro.finalidad"), t("privacidad.finalidades.filas.registro.base")],
    [t("privacidad.finalidades.filas.servicio.finalidad"), t("privacidad.finalidades.filas.servicio.base")],
    [t("privacidad.finalidades.filas.facturacion.finalidad"), t("privacidad.finalidades.filas.facturacion.base")],
    [t("privacidad.finalidades.filas.datosSalud.finalidad"), t("privacidad.finalidades.filas.datosSalud.base")],
    [t("privacidad.finalidades.filas.notificaciones.finalidad"), t("privacidad.finalidades.filas.notificaciones.base")],
    [t("privacidad.finalidades.filas.comunicaciones.finalidad"), t("privacidad.finalidades.filas.comunicaciones.base")],
    [t("privacidad.finalidades.filas.mejora.finalidad"), t("privacidad.finalidades.filas.mejora.base")],
    [t("privacidad.finalidades.filas.obligaciones.finalidad"), t("privacidad.finalidades.filas.obligaciones.base")],
  ];

  const CONSERVACION_ROWS = [
    [t("privacidad.conservacion.filas.cuenta.tipo"), t("privacidad.conservacion.filas.cuenta.plazo")],
    [t("privacidad.conservacion.filas.facturacion.tipo"), t("privacidad.conservacion.filas.facturacion.plazo")],
    [t("privacidad.conservacion.filas.pacientes.tipo"), t("privacidad.conservacion.filas.pacientes.plazo")],
    [t("privacidad.conservacion.filas.adjuntos.tipo"), t("privacidad.conservacion.filas.adjuntos.plazo")],
    [t("privacidad.conservacion.filas.mensajes.tipo"), t("privacidad.conservacion.filas.mensajes.plazo")],
    [t("privacidad.conservacion.filas.logs.tipo"), t("privacidad.conservacion.filas.logs.plazo")],
  ];

  const DESTINATARIOS = [
    { name: t("privacidad.destinatarios.servicios.supabase.nombre"), desc: t("privacidad.destinatarios.servicios.supabase.desc"), flag: t("privacidad.destinatarios.servicios.supabase.ubicacion") },
    { name: t("privacidad.destinatarios.servicios.stripe.nombre"), desc: t("privacidad.destinatarios.servicios.stripe.desc"), flag: t("privacidad.destinatarios.servicios.stripe.ubicacion") },
    { name: t("privacidad.destinatarios.servicios.google.nombre"), desc: t("privacidad.destinatarios.servicios.google.desc"), flag: t("privacidad.destinatarios.servicios.google.ubicacion") },
    { name: t("privacidad.destinatarios.servicios.openai.nombre"), desc: t("privacidad.destinatarios.servicios.openai.desc"), flag: t("privacidad.destinatarios.servicios.openai.ubicacion") },
  ];

  const DERECHOS = [
    { right: t("privacidad.derechos.lista.acceso.derecho"), desc: t("privacidad.derechos.lista.acceso.desc") },
    { right: t("privacidad.derechos.lista.rectificacion.derecho"), desc: t("privacidad.derechos.lista.rectificacion.desc") },
    { right: t("privacidad.derechos.lista.supresion.derecho"), desc: t("privacidad.derechos.lista.supresion.desc") },
    { right: t("privacidad.derechos.lista.limitacion.derecho"), desc: t("privacidad.derechos.lista.limitacion.desc") },
    { right: t("privacidad.derechos.lista.portabilidad.derecho"), desc: t("privacidad.derechos.lista.portabilidad.desc") },
    { right: t("privacidad.derechos.lista.oposicion.derecho"), desc: t("privacidad.derechos.lista.oposicion.desc") },
  ];

  const SEGURIDAD_ITEMS: string[] = t.raw("privacidad.seguridad.medidas") as string[];

  const LEYES = [
    { name: "RGPD", desc: t("privacidad.leyes.rgpd") },
    { name: "LOPDGDD", desc: t("privacidad.leyes.lopdgdd") },
    { name: "LSSI-CE", desc: t("privacidad.leyes.lssice") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
          <Shield className="w-4 h-4" />
          {t("privacidad.badge")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t("privacidad.titulo")}</h1>
        <p className="text-gray-400 text-sm">{t("privacidad.ultimaActualizacion")}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* TOC sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{t("layout.tocLabel")}</p>
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
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-10">
          <div className="bg-white dark:bg-[#17181e] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
            <p>
              {t.rich("privacidad.intro", {
                strong: (chunks) => <strong className="text-gray-900 dark:text-gray-100">{chunks}</strong>,
              })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
              {LEYES.map((law) => (
                <div key={law.name} className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 text-center">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">{law.name}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">{law.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <Section icon={Building2} title={t("privacidad.responsable.titulo")} id="responsable">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-1.5">
              <p><strong className="text-gray-900 dark:text-gray-100">{t("privacidad.responsable.identidad")}</strong> {t("privacidad.responsable.identidadValor")}</p>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("privacidad.responsable.domicilio")}</strong> {t("privacidad.responsable.domicilioValor")}</p>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("privacidad.responsable.cif")}</strong> {t("privacidad.responsable.cifValor")}</p>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("privacidad.responsable.email")}</strong> {t("privacidad.responsable.emailValor")}</p>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("privacidad.responsable.dpd")}</strong> {t("privacidad.responsable.dpdValor")}</p>
            </div>
          </Section>

          <Section icon={Database} title={t("privacidad.datosRecogemos.titulo")} id="datos-recogemos">
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5">
                <p className="font-semibold text-green-800 dark:text-green-300 text-sm mb-2">{t("privacidad.datosRecogemos.dietistas.subtitulo")}</p>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li>{t("privacidad.datosRecogemos.dietistas.identificativos")}</li>
                  <li>{t("privacidad.datosRecogemos.dietistas.acceso")}</li>
                  <li>{t("privacidad.datosRecogemos.dietistas.facturacion")}</li>
                  <li>{t("privacidad.datosRecogemos.dietistas.uso")}</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
                <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-2">{t("privacidad.datosRecogemos.pacientes.subtitulo")}</p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>{t("privacidad.datosRecogemos.pacientes.identificativos")}</li>
                  <li>{t("privacidad.datosRecogemos.pacientes.datosSalud")}</li>
                  <li>{t("privacidad.datosRecogemos.pacientes.portal")}</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-400">
                {t("privacidad.datosRecogemos.importante")}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{t("privacidad.datosRecogemos.datosAutomaticos.subtitulo")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("privacidad.datosRecogemos.datosAutomaticos.descripcion")}
                </p>
              </div>
            </div>
          </Section>

          <Section icon={Target} title={t("privacidad.finalidades.titulo")} id="finalidades">
            <DataTable
              headers={[t("privacidad.finalidades.headerFinalidad"), t("privacidad.finalidades.headerBaseLegal")]}
              rows={FINALIDADES_ROWS}
            />
          </Section>

          <Section icon={Users2} title={t("privacidad.destinatarios.titulo")} id="destinatarios">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DESTINATARIOS.map((item) => (
                <div key={item.name} className="bg-white dark:bg-[#17181e] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">{item.flag}</p>
                </div>
              ))}
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-300">
              {t("privacidad.destinatarios.noVendemos")}
            </div>
          </Section>

          <Section icon={Clock} title={t("privacidad.conservacion.titulo")} id="conservacion">
            <DataTable
              headers={[t("privacidad.conservacion.headerTipo"), t("privacidad.conservacion.headerPlazo")]}
              rows={CONSERVACION_ROWS}
            />
          </Section>

          <Section icon={UserCheck} title={t("privacidad.derechos.titulo")} id="derechos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DERECHOS.map((item) => (
                <div key={item.right} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
                  <span className="text-green-500 mt-0.5 font-bold text-sm">&#10003;</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.right}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-2">
              <p>{t("privacidad.derechos.instrucciones")}</p>
              <p>
                {t("privacidad.derechos.reclamacion")}
              </p>
            </div>
          </Section>

          <Section icon={Lock} title={t("privacidad.seguridad.titulo")} id="seguridad">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SEGURIDAD_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 text-sm text-green-800 dark:text-green-300">
                  <span className="text-green-500 mt-0.5">&#128274;</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Baby} title={t("privacidad.menores.titulo")} id="menores">
            <p>
              {t("privacidad.menores.contenido")}
            </p>
          </Section>

          <Section icon={RefreshCcw} title={t("privacidad.modificaciones.titulo")} id="modificaciones">
            <p>
              {t("privacidad.modificaciones.contenido")}
            </p>
          </Section>

          <Section icon={Mail} title={t("privacidad.contacto.titulo")} id="contacto">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5 text-center">
              <p className="text-sm text-green-800 dark:text-green-300">
                {t("privacidad.contacto.contenido")}
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
