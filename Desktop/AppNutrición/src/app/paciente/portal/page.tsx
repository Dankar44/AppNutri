import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { capitalizarNombre } from "@/lib/utils";
import {
  calcularAguaObjetivo,
  tipoComidaPorHora,
  TIPOS_ORDEN,
} from "@/lib/seguimiento";
import { HoyCard } from "@/components/paciente/dashboard/hoy-card";
import { ComidaActualCard } from "@/components/paciente/dashboard/comida-actual-card";
import { ProgresoCard, type SparkPoint } from "@/components/paciente/dashboard/progreso-card";
import { MensajesPreviewCard } from "@/components/paciente/dashboard/mensajes-preview-card";
import { HitoRecienteCard, type HitoIconName } from "@/components/paciente/dashboard/hito-reciente-card";

const DIAS_SEMANA_MAP: Record<number, string> = {
  0: "DOMINGO",
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
};

const INTL_LOCALE_MAP: Record<string, string> = { es: "es-ES", pt: "pt-PT" };

function getSaludoMadrid(intlLocale: string): { saludoKey: string; fechaLarga: string; ahoraHHMM: string } {
  const ahora = new Date();
  const hh = ahora.toLocaleString(intlLocale, {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const horaMadrid = parseInt(hh.split(":")[0], 10);
  let saludoKey = "portal.saludos.buenosDias";
  if (horaMadrid >= 13 && horaMadrid < 21) saludoKey = "portal.saludos.buenasTardes";
  else if (horaMadrid >= 21 || horaMadrid < 6) saludoKey = "portal.saludos.buenasNoches";
  const fechaLarga = ahora.toLocaleDateString(intlLocale, {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return {
    saludoKey,
    fechaLarga: fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1),
    ahoraHHMM: hh,
  };
}

export default async function PatientPortalPage() {
  const t = await getTranslations("patient-portal");
  const locale = await getLocale();
  const intlLocale = INTL_LOCALE_MAP[locale] ?? "es-ES";
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const hoyIso = new Date().toISOString().split("T")[0];
  // Día de la semana del paciente en zona Europe/Madrid (no en el TZ del
  // servidor, que en prod es UTC y cerca de medianoche daría el día equivocado).
  const WEEKDAY_TO_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekdayMadrid = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", weekday: "short" }).format(new Date());
  const diaSemana = DIAS_SEMANA_MAP[WEEKDAY_TO_NUM[weekdayMadrid] ?? 0];
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const [paciente, planActivo, proximaCita, medidas, conversacion, ultimoMensaje] =
    await Promise.all([
      prisma.paciente.findUnique({
        where: { id: session.pacienteId },
        select: {
          nombre: true,
          apellidos: true,
          peso: true,
        },
      }),
      prisma.planAlimenticio.findFirst({
        where: { pacienteId: session.pacienteId, activo: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nombre: true,
          dias: {
            where: { dia: diaSemana as never },
            include: {
              comidas: {
                orderBy: { orden: "asc" },
                include: {
                  alimentos: {
                    orderBy: { orden: "asc" },
                    include: {
                      alimento: { select: { nombre: true } },
                      receta: { select: { nombre: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.cita.findFirst({
        where: {
          pacienteId: session.pacienteId,
          fechaHora: { gte: new Date() },
          estado: { in: ["PENDIENTE", "CONFIRMADA"] },
        },
        orderBy: { fechaHora: "asc" },
        select: {
          id: true,
          fechaHora: true,
          duracion: true,
          motivo: true,
          estado: true,
          isOnline: true,
          googleMeetLink: true,
        },
      }),
      prisma.medidaAntropometrica.findMany({
        where: { pacienteId: session.pacienteId },
        orderBy: { fecha: "asc" },
        select: {
          fecha: true,
          peso: true,
          imc: true,
          grasaCorporal: true,
        },
      }),
      prisma.conversacion.findFirst({
        where: { pacienteId: session.pacienteId },
        select: {
          id: true,
          noLeidosPaciente: true,
        },
      }),
      prisma.mensaje.findFirst({
        where: {
          conversacion: { pacienteId: session.pacienteId },
          autor: "DIETISTA",
        },
        orderBy: { createdAt: "desc" },
        select: {
          texto: true,
          createdAt: true,
          dietista: {
            select: { nombre: true, apellidos: true, logoUrl: true },
          },
        },
      }),
    ]);

  const { saludoKey, fechaLarga, ahoraHHMM } = getSaludoMadrid(intlLocale);

  // Seguimiento de HOY (raw query para comidasData)
  const seguimientoHoyRows = await prisma.$queryRawUnsafe<
    Array<{
      aguaML: number;
      ejercicio: boolean;
      ejercicioMinutos: number;
      comidasData: unknown;
    }>
  >(
    `SELECT "aguaML", ejercicio, "ejercicioMinutos", "comidasData"
     FROM seguimiento_diario
     WHERE "pacienteId" = $1 AND fecha = $2::date`,
    session.pacienteId,
    hoyIso
  );
  const seguHoy = seguimientoHoyRows[0] ?? null;
  const rawComidas = seguHoy?.comidasData;
  const comidasDataHoy = (Array.isArray(rawComidas) ? rawComidas : []) as Array<{
    alimentos?: Array<{ cumplido: boolean }>;
  }>;
  const comidasTotal = comidasDataHoy.reduce((s, c) => s + (c.alimentos?.length ?? 0), 0);
  const comidasCumplidas = comidasDataHoy.reduce(
    (s, c) => s + (c.alimentos?.filter((a) => a.cumplido).length ?? 0),
    0
  );
  const haRegistrado =
    seguHoy !== null &&
    ((seguHoy.aguaML ?? 0) > 0 ||
      seguHoy.ejercicio ||
      comidasCumplidas > 0);

  const aguaObjetivo = calcularAguaObjetivo(paciente?.peso ?? null);

  // Racha: días consecutivos con cumplido=true hasta hoy
  const rachaRows = await prisma.$queryRawUnsafe<Array<{ fecha: Date; cumplido: boolean }>>(
    `SELECT fecha, cumplido FROM seguimiento_diario
     WHERE "pacienteId" = $1 AND fecha <= $2::date
     ORDER BY fecha DESC
     LIMIT 30`,
    session.pacienteId,
    hoyIso
  );
  let racha = 0;
  const hoy = new Date(hoyIso + "T00:00:00");
  for (let i = 0; i < rachaRows.length; i++) {
    const f = new Date(rachaRows[i].fecha);
    const diasDiff = Math.round(
      (hoy.getTime() - f.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (diasDiff !== i) break;
    if (!rachaRows[i].cumplido) break;
    racha++;
  }

  // Comida actual según hora
  const tipoActual = tipoComidaPorHora(ahoraHHMM);
  const comidaPlan =
    planActivo && planActivo.dias[0]
      ? planActivo.dias[0].comidas.find((c) => c.tipo === tipoActual)
      : null;
  const alimentosActual = comidaPlan
    ? comidaPlan.alimentos.map((a) => ({
        nombre: a.nombrePersonalizado || a.alimento?.nombre || a.receta?.nombre || t("dashboard.alimentoFallback"),
        cantidad: a.cantidad,
        unidad: a.unidad ?? "GRAMOS",
        // Las recetas se guardan con unidad GRAMOS pero su cantidad son porciones.
        esReceta: !!a.receta,
      }))
    : [];

  // KPIs progreso
  const pesoVals = medidas
    .map((m) => ({ fecha: m.fecha, v: m.peso }))
    .filter((x) => x.v !== null) as { fecha: Date; v: number }[];
  const imcVals = medidas
    .map((m) => ({ fecha: m.fecha, v: m.imc }))
    .filter((x) => x.v !== null) as { fecha: Date; v: number }[];
  const grasaVals = medidas
    .map((m) => ({ fecha: m.fecha, v: m.grasaCorporal }))
    .filter((x) => x.v !== null) as { fecha: Date; v: number }[];

  function deltaSemana(vals: { fecha: Date; v: number }[]): number | null {
    if (vals.length < 2) return null;
    const actual = vals[vals.length - 1].v;
    const ref = vals.find((x) => Date.now() - x.fecha.getTime() >= 6 * 24 * 60 * 60 * 1000);
    const prev = ref?.v ?? vals[0].v;
    return actual - prev;
  }

  const sparkData: SparkPoint[] = medidas
    .filter((m) => m.fecha >= hace30Dias && m.peso !== null)
    .map((m) => ({
      fechaISO: new Date(m.fecha).toISOString().split("T")[0],
      peso: m.peso,
    }));

  // Hito reciente (último conseguido)
  const hitoReciente = calcularHitoReciente(pesoVals, imcVals, t, intlLocale);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hero */}
      <section className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary shrink-0" strokeWidth={1.75} />
            {t(saludoKey as never)}, {capitalizarNombre(paciente?.nombre || "")}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{fechaLarga}</p>
        </div>
      </section>

      {/* Próxima cita compacta */}
      {proximaCita && <ProximaCitaBanner cita={proximaCita} t={t} intlLocale={intlLocale} />}

      {/* Matriz 2x2: (Hoy | Progreso) / (Te toca | [Mensajes + Hito stack]) */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <HoyCard
          comidasCumplidas={comidasCumplidas}
          comidasTotal={comidasTotal}
          aguaML={seguHoy?.aguaML ?? 0}
          aguaObjetivo={aguaObjetivo}
          ejercicio={seguHoy?.ejercicio ?? false}
          ejercicioMinutos={seguHoy?.ejercicioMinutos ?? 0}
          haRegistrado={haRegistrado}
          racha={racha}
          className="h-full"
        />

        <ProgresoCard
          className="h-full"
          peso={{
            label: t("dashboard.progresoCard.peso"),
            unit: "kg",
            actual: pesoVals[pesoVals.length - 1]?.v ?? null,
            delta: deltaSemana(pesoVals),
            periodoLabel: t("dashboard.progresoCard.periodoLabel"),
            color: "#3b82f6",
            downIsGood: true,
          }}
          imc={{
            label: t("dashboard.progresoCard.imc"),
            unit: "",
            actual: imcVals[imcVals.length - 1]?.v ?? null,
            delta: deltaSemana(imcVals),
            periodoLabel: t("dashboard.progresoCard.periodoLabel"),
            color: "#f59e0b",
            downIsGood: true,
          }}
          grasa={{
            label: t("dashboard.progresoCard.grasa"),
            unit: "%",
            actual: grasaVals[grasaVals.length - 1]?.v ?? null,
            delta: deltaSemana(grasaVals),
            periodoLabel: t("dashboard.progresoCard.periodoLabel"),
            color: "#ef4444",
            downIsGood: true,
          }}
          sparkData={sparkData}
        />

        <ComidaActualCard
          tipoActual={tipoActual}
          alimentos={alimentosActual}
          ahoraHHMM={ahoraHHMM}
          hayPlan={!!planActivo}
          className="h-full"
        />

        {/* Sub-grid de 2 celdas: Mensajes arriba, Hito abajo */}
        <div
          className="grid gap-5 h-full"
          style={{ gridTemplateRows: hitoReciente ? "1fr 1fr" : "1fr" }}
        >
          <MensajesPreviewCard
            className="h-full"
            noLeidos={conversacion?.noLeidosPaciente ?? 0}
            ultimo={
              ultimoMensaje
                ? {
                    texto: ultimoMensaje.texto,
                    createdAt: ultimoMensaje.createdAt,
                    remitenteNombre: ultimoMensaje.dietista
                      ? `${ultimoMensaje.dietista.nombre} ${ultimoMensaje.dietista.apellidos}`
                      : t("dashboard.mensajesCard.fallbackNutri"),
                    fotoUrl: ultimoMensaje.dietista?.logoUrl ?? null,
                  }
                : null
            }
          />

          {hitoReciente && (
            <HitoRecienteCard
              titulo={hitoReciente.titulo}
              descripcion={hitoReciente.descripcion}
              fecha={hitoReciente.fecha}
              iconName={hitoReciente.iconName}
              color={hitoReciente.color}
              className="h-full"
            />
          )}
        </div>
      </div>

    </div>
  );
}

void TIPOS_ORDEN;

function ProximaCitaBanner({
  cita,
  t,
  intlLocale,
}: {
  cita: {
    id: string;
    fechaHora: Date;
    motivo: string | null;
    estado: string;
    isOnline: boolean;
    googleMeetLink: string | null;
  };
  t: Awaited<ReturnType<typeof getTranslations<"patient-portal">>>;
  intlLocale: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex items-start justify-between gap-3 flex-wrap">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground shrink-0">
          <Calendar className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {t("portal.proximaCita.label")}
          </p>
          <p className="font-semibold capitalize leading-tight">
            {new Date(cita.fechaHora).toLocaleDateString(intlLocale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "Europe/Madrid",
            })}
            {" · "}
            <span className="tabular-nums">
              {new Date(cita.fechaHora).toLocaleTimeString(intlLocale, {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Madrid",
              })}
            </span>
          </p>
          {cita.motivo && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{cita.motivo}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                cita.estado === "CONFIRMADA"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              }`}
            >
              {cita.estado === "CONFIRMADA" ? t("portal.proximaCita.confirmada") : t("portal.proximaCita.pendiente")}
            </span>
            {cita.isOnline && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-400">
                {t("portal.proximaCita.online")}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {cita.googleMeetLink && (
          <a
            href={cita.googleMeetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors"
          >
            {t("portal.proximaCita.unirse")}
          </a>
        )}
        <Link
          href="/paciente/portal/citas"
          className="inline-flex items-center gap-1 px-3 h-9 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          {t("portal.proximaCita.verCitas")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

function calcularHitoReciente(
  pesos: { fecha: Date; v: number }[],
  imcs: { fecha: Date; v: number }[],
  t: Awaited<ReturnType<typeof getTranslations<"patient-portal">>>,
  intlLocale: string,
): { titulo: string; descripcion: string; fecha: string; iconName: HitoIconName; color: string } | null {
  const candidatos: {
    titulo: string;
    descripcion: string;
    fecha: Date;
    iconName: HitoIconName;
    color: string;
  }[] = [];

  if (pesos.length >= 2) {
    const inicial = pesos[0].v;
    for (const u of [
      { kg: 1, tituloKey: "portal.hitos.primerKilo" as const, iconName: "TrendingDown" as const, color: "#10b981" },
      { kg: 5, tituloKey: "portal.hitos.cincoKilosMenos" as const, iconName: "Trophy" as const, color: "#f59e0b" },
      { kg: 10, tituloKey: "portal.hitos.diezKilosMenos" as const, iconName: "Trophy" as const, color: "#ef4444" },
    ]) {
      const punto = pesos.find((m) => inicial - m.v >= u.kg);
      if (punto)
        candidatos.push({
          titulo: t(u.tituloKey),
          descripcion: t("portal.hitos.hasBajado", { kg: u.kg }),
          fecha: punto.fecha,
          iconName: u.iconName,
          color: u.color,
        });
    }
  }

  if (imcs.length >= 1 && imcs[0].v >= 25) {
    const saludable = imcs.find((m) => m.v < 25);
    if (saludable)
      candidatos.push({
        titulo: t("portal.hitos.imcSaludable"),
        descripcion: t("portal.hitos.imcBajoDe25"),
        fecha: saludable.fecha,
        iconName: "Heart",
        color: "#ec4899",
      });
  }

  if (pesos.length >= 3) {
    let racha = 1;
    let fecha: Date | null = null;
    for (let i = 1; i < pesos.length; i++) {
      if (pesos[i].v < pesos[i - 1].v) {
        racha++;
        if (racha === 3) fecha = pesos[i].fecha;
      } else {
        racha = 1;
      }
    }
    if (fecha)
      candidatos.push({
        titulo: t("portal.hitos.enRacha"),
        descripcion: t("portal.hitos.tresMedicionesBajando"),
        fecha,
        iconName: "Flame",
        color: "#f97316",
      });
  }

  if (candidatos.length === 0) return null;
  candidatos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  const c = candidatos[0];
  return {
    ...c,
    fecha: new Date(c.fecha).toLocaleDateString(intlLocale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
}
