import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users, UserCog, AlertTriangle, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { getLicenciaDocenteDetalle } from "@/app/actions/admin-docencia";
import { dominiosDeLicencia, licenciaVigente } from "@/lib/docencia";
import { formatDate } from "@/lib/utils";
import { EditarLicenciaForm } from "./editar-licencia-form";
import { AsignarProfesorForm } from "./asignar-profesor-form";
import { EnlacesProfesorado } from "./enlaces-profesorado";
import { RenovarLicencia } from "./renovar-licencia";
import { getEnlacesProfesores } from "@/app/actions/enlaces-profesores";
import { QuitarRolButton } from "./quitar-rol-button";
import { AccionesInvitacion } from "./acciones-invitacion";

export default async function UniversidadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const { id } = await params;
  const licencia = await getLicenciaDocenteDetalle(id);
  const enlaces = await getEnlacesProfesores(id);
  if (!licencia) notFound();

  // La persona de contacto suele ser un correo; si lo es, se usa como destinatario por defecto del
  // enlace de profesorado. Si escribieron un nombre, se deja vacío en vez de mandar a "Marta".
  const correoDelContacto = licencia.personaContacto?.includes("@") ? licencia.personaContacto : null;

  const t = await getTranslations("admin.universidades");
  const vigente = licenciaVigente(licencia);
  const dominios = dominiosDeLicencia(licencia.dominioEmail);

  const profesores = licencia.miembros.filter((m) => m.rolDocente === "PROFESOR");
  const alumnos = licencia.miembros.filter((m) => m.rolDocente === "ALUMNO");

  return (
    <div>
      <Link
        href="/admin/universidades"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("volver")}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{licencia.institucion}</h1>
        <p className="text-muted-foreground mt-1">
          {licencia.fechaFin
            ? t("cursoEtiqueta", { inicio: formatDate(licencia.fechaInicio), fin: formatDate(licencia.fechaFin) })
            : t("sinCurso")}
          {dominios.length > 0 && <> · {dominios.map((d) => `@${d}`).join(" · ")}</>}
        </p>
        {licencia.personaContacto && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("contactoEtiqueta", { persona: licencia.personaContacto })}
          </p>
        )}
      </div>

      {!vigente && (
        <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">{t("cerradaTitulo")}</p>
            <p className="text-amber-800/80 dark:text-amber-200/70 mt-0.5">{t("cerradaTexto")}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <UserCog className="w-4 h-4" />
            {t("profesores")}
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {licencia.profesores}
            <span className="text-base font-normal text-muted-foreground"> / {licencia.maxProfesores}</span>
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Users className="w-4 h-4" />
            {t("alumnos")}
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {licencia.alumnos}
            <span className="text-base font-normal text-muted-foreground"> / {licencia.maxAlumnos}</span>
          </p>
          {/* La ficha solo lista quién es; el detalle (clase, profesor, último acceso) está allí. */}
          <Link
            href={`/admin/alumnos?licencia=${licencia.id}`}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block"
          >
            {t("verAlumnos")}
          </Link>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t("profesoresTitulo")}</h2>
        {profesores.length === 0 && licencia.invitaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">{t("sinProfesores")}</p>
        ) : (
          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden mb-4">
            {profesores.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {p.nombre} {p.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.email}
                    {" · "}
                    {p.lastAccessAt
                      ? t("ultimoAcceso", { fecha: formatDate(p.lastAccessAt) })
                      : t("nuncaHaEntrado")}
                  </p>
                </div>
                <QuitarRolButton dietistaId={p.id} nombre={`${p.nombre} ${p.apellidos}`} />
              </div>
            ))}
          </div>
        )}

        {licencia.invitaciones.length > 0 && (
          <div className="border border-dashed border-border rounded-xl divide-y divide-border overflow-hidden mb-4">
            {licencia.invitaciones.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("invitacionCaduca", { fecha: formatDate(inv.expiraAt) })}
                    {inv.envios > 1 && <> · {t("invitacionEnviosVeces", { veces: inv.envios })}</>}
                    {inv.ultimoEnvioAt && <> · {t("invitacionUltimoEnvio", { fecha: formatDate(inv.ultimoEnvioAt) })}</>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <AccionesInvitacion id={inv.id} email={inv.email} />
                </div>
              </div>
            ))}
          </div>
        )}

        <AsignarProfesorForm
          licenciaId={licencia.id}
          sinCupo={licencia.profesores + licencia.invitaciones.length >= licencia.maxProfesores}
          dominios={dominios}
        />

        {/* Y la vía de repartir: un enlace para que se den de alta ellos, sin pedirle a la
            universidad los correos de su profesorado. */}
        <EnlacesProfesorado licenciaId={licencia.id} enlaces={enlaces} contacto={correoDelContacto} />
      </section>

      {/* Renovar: lo de cada verano, sin tener que crear otra universidad. */}
      <section className="mb-8">
        <RenovarLicencia
          licenciaId={licencia.id}
          fechaFin={licencia.fechaFin ? new Date(licencia.fechaFin).toISOString() : null}
          maxProfesores={licencia.maxProfesores}
          maxAlumnos={licencia.maxAlumnos}
        />
      </section>

      {alumnos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">{t("alumnosTitulo")}</h2>
          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
            {alumnos.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <p className="text-sm font-medium truncate">
                  {a.nombre} {a.apellidos}
                </p>
                <p className="text-xs text-muted-foreground truncate">{a.email}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("editarTitulo")}</h2>
        <EditarLicenciaForm
          licencia={{
            id: licencia.id,
            institucion: licencia.institucion,
            personaContacto: licencia.personaContacto,
            dominioEmail: licencia.dominioEmail,
            maxProfesores: licencia.maxProfesores,
            maxAlumnos: licencia.maxAlumnos,
            fechaInicio: licencia.fechaInicio.toISOString().slice(0, 10),
            fechaFin: licencia.fechaFin ? licencia.fechaFin.toISOString().slice(0, 10) : null,
            activa: licencia.activa,
            notas: licencia.notas,
          }}
        />
      </section>
    </div>
  );
}
