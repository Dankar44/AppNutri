import "server-only";
import { randomUUID } from "crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { estructuraEfectiva } from "@/lib/anamnesis-plantillas";
import { sanitizeCamposAnamnesis } from "@/lib/ficha-informacion-types";

/**
 * #40 — Copiar un paciente entero a otra cuenta.
 *
 * Es lo que pasa cuando un alumno abre un caso: el paciente plantilla que rellenó el profesor con
 * la ficha de siempre se copia a la cuenta del alumno, tal cual — datos, anamnesis, mediciones,
 * consultas, horario, recomendaciones — para que se lo encuentre "exactamente igual que un
 * paciente normal" (Guillermo, 2 sep 2026).
 *
 * La planificación y los planes viajan solo si se pide (`conPlanes`): por defecto lo que el
 * profesor hace en Planificación y Plan de alimentación es SU solución, para comparar con lo que
 * entreguen, y no se les manda (Guillermo, 2 sep 2026: "que se pueda hacer el plan y no
 * compartirlo"). Si enciende «compartir» en el caso, se les copian con el resto de la ficha.
 * Lo que no viaja nunca son las cosas de una consulta real (citas, pagos, mensajes, acceso al
 * portal, tokens de preconsulta, enlaces compartidos).
 *
 * La anamnesis va **resuelta**: si el profesor usaba una plantilla suya, el alumno no puede verla,
 * así que se copia la estructura efectiva dentro del paciente.
 */
type Tx = Prisma.TransactionClient | typeof prisma;

/**
 * La plantilla leída de una vez, separada en lo que se copia tal cual (`campos`), la anamnesis ya
 * resuelta, los JSON opcionales y las mediciones y consultas. Copiar y actualizar usan ESTA misma
 * lectura: la lista de lo que viaja está en un solo sitio.
 */
async function leerPlantilla(tx: Tx, origenId: string) {
  const origen = await tx.paciente.findUnique({
    where: { id: origenId },
    include: {
      medidas: { orderBy: { fecha: "asc" } },
      consultas: { orderBy: { fecha: "asc" } },
      plantillaAnamnesis: { select: { estructura: true } },
      dietista: { select: { camposAnamnesis: true } },
    },
  });
  if (!origen) throw new Error("paciente origen no encontrado");

  const {
    // Lo que NO se copia tal cual:
    id: _id, dietistaId: _d, createdAt: _c, updatedAt: _u, lastAccessAt: _l,
    esDemo: _demo, esDeClase: _clase, esCasoDocente: _plantilla,
    preconsultaToken: _pt, preconsultaEnviadaAt: _pe, preconsultaCompletadaAt: _pc,
    plantillaAnamnesisId: _pa, estructuraAnamnesis: _ea,
    // relaciones
    medidas, consultas, plantillaAnamnesis, dietista: dietistaOrigen,
    // JSON opcionales, que Prisma quiere como undefined y no null
    fichaInformacion, horario, fichaSidebar,
    ...campos
  } = origen;
  void _id; void _d; void _c; void _u; void _l; void _demo; void _clase; void _plantilla;
  void _pt; void _pe; void _pc; void _pa; void _ea;

  const estructura = estructuraEfectiva(
    origen.estructuraAnamnesis ?? null,
    plantillaAnamnesis?.estructura ?? null,
    sanitizeCamposAnamnesis(dietistaOrigen.camposAnamnesis),
  ) as unknown as Prisma.InputJsonValue;

  return { campos, estructura, fichaInformacion, horario, fichaSidebar, medidas, consultas };
}

/** Un JSON opcional: al crear se omite si es null; al actualizar se pone a NULL de verdad. */
const json = (v: Prisma.JsonValue | null) => (v === null ? Prisma.DbNull : (v as Prisma.InputJsonValue));

export async function copiarPaciente(
  tx: Tx,
  origenId: string,
  destino: { dietistaId: string; esDeClase: boolean; conPlanes: boolean },
): Promise<string> {
  const { campos, estructura, fichaInformacion, horario, fichaSidebar, medidas, consultas } = await leerPlantilla(tx, origenId);

  const nuevo = await tx.paciente.create({
    data: {
      ...campos,
      dietistaId: destino.dietistaId,
      esDeClase: destino.esDeClase,
      esCasoDocente: false,
      esDemo: false,
      ...(fichaInformacion === null ? {} : { fichaInformacion }),
      ...(horario === null ? {} : { horario }),
      ...(fichaSidebar === null ? {} : { fichaSidebar }),
      estructuraAnamnesis: estructura,
    },
  });

  // Las mediciones y las consultas, con sus fechas: una analítica con la ferritina baja es parte
  // del caso. Cada una recuerda de cuál de la plantilla viene (origenId), para poder actualizarla
  // después sin tocar las que añada el alumno. Dos pasos porque la consulta apunta a su medición.
  const idsMedidas = new Map<string, string>();
  for (const m of medidas) {
    const { id: mid, pacienteId: _p, origenId: _o, ...datos } = m;
    void _p; void _o;
    const creada = await tx.medidaAntropometrica.create({ data: { ...datos, pacienteId: nuevo.id, origenId: mid } });
    idsMedidas.set(mid, creada.id);
  }
  for (const c of consultas) {
    const { id: cid, pacienteId: _p, dietistaId: _dd, createdAt: _cc, updatedAt: _cu, medidaId, origenId: _o, ...datos } = c;
    void _p; void _dd; void _cc; void _cu; void _o;
    await tx.consulta.create({
      data: {
        ...datos,
        pacienteId: nuevo.id,
        dietistaId: destino.dietistaId,
        medidaId: medidaId ? idsMedidas.get(medidaId) ?? null : null,
        origenId: cid,
      },
    });
  }

  if (!destino.conPlanes) return nuevo.id;
  await copiarPlanesYPlanificaciones(tx, origenId, nuevo.id, destino.dietistaId, { primeraVez: true });
  return nuevo.id;
}

// ─── Planes y planificaciones compartidos por el profesor ───

type PlanConArbol = Prisma.PlanAlimenticioGetPayload<{ include: typeof ARBOL_DEL_PLAN }>;

const ARBOL_DEL_PLAN = {
  dias: {
    include: {
      comidas: {
        orderBy: { orden: "asc" as const },
        include: { alimentos: { orderBy: { orden: "asc" as const }, include: { alternativas: { orderBy: { orden: "asc" as const } } } } },
      },
    },
  },
};

/** Cómo está un plan, para saber después si alguien lo ha tocado. Sin ids ni referencias a planificaciones. */
export function huellaDePlan(plan: PlanConArbol): string {
  const orden = [...plan.dias].sort((a, b) => a.dia.localeCompare(b.dia));
  return JSON.stringify({
    nombre: plan.nombre,
    kcal: plan.caloriasObjetivo, prot: plan.proteinasObjetivo, carb: plan.carbohidratosObjetivo, grasa: plan.grasasObjetivo,
    dias: orden.map((d) => ({
      dia: d.dia,
      comidas: d.comidas.map((c) => ({
        tipo: c.tipo, orden: c.orden, nombre: c.nombre, hora: c.hora, descripcion: c.descripcion,
        alimentos: c.alimentos.map((a) => ({
          a: a.alimentoId, r: a.recetaId, q: a.cantidad, u: a.unidad, o: a.orden, n: a.nombrePersonalizado,
          alt: a.alternativas.map((x) => ({ a: x.alimentoId, r: x.recetaId, q: x.cantidad, u: x.unidad, o: x.orden, n: x.nombrePersonalizado })),
        })),
      })),
    })),
  });
}

export function huellaDePlanificacion(p: { nombre: string; datos: Prisma.JsonValue }): string {
  return JSON.stringify({ nombre: p.nombre, datos: p.datos });
}

/** Crea los días, comidas, alimentos y alternativas de un plan a partir de los de otro. */
async function crearArbolDelPlan(tx: Tx, planId: string, dias: PlanConArbol["dias"], idsPlani: Map<string, string>) {
  // Los días que "comen igual" comparten un grupoId: se conserva la agrupación con ids nuevos.
  const grupos = new Map<string, string>();
  for (const dia of dias) {
    let grupoId: string | null = null;
    if (dia.grupoId) {
      grupoId = grupos.get(dia.grupoId) ?? randomUUID();
      grupos.set(dia.grupoId, grupoId);
    }
    await tx.diaDelPlan.create({
      data: {
        planId,
        dia: dia.dia,
        grupoId,
        planificacionId: dia.planificacionId ? idsPlani.get(dia.planificacionId) ?? null : null,
        comidas: {
          create: dia.comidas.map((c) => ({
            tipo: c.tipo, orden: c.orden, descripcion: c.descripcion, nombre: c.nombre, hora: c.hora,
            alimentos: {
              create: c.alimentos.map((a) => ({
                alimentoId: a.alimentoId, recetaId: a.recetaId, cantidad: a.cantidad, unidad: a.unidad,
                orden: a.orden, nombrePersonalizado: a.nombrePersonalizado,
                alternativas: {
                  create: a.alternativas.map((alt) => ({
                    alimentoId: alt.alimentoId, recetaId: alt.recetaId, cantidad: alt.cantidad,
                    unidad: alt.unidad, orden: alt.orden, nombrePersonalizado: alt.nombrePersonalizado,
                  })),
                },
              })),
            },
          })),
        },
      },
      select: { id: true },
    });
  }
}

/**
 * Los planes y planificaciones de la plantilla, al paciente del alumno, marcados como
 * «Del profesor» (origenId + huella).
 *
 * - `primeraVez` (al empezar el caso, con «compartir» encendido): se copian tal cual, con sus
 *   marcas de activo / por defecto — el alumno aún no tiene nada.
 * - Después («Actualizar el caso» con «compartir» encendido): lo que no tenga lo recibe APARTE de
 *   lo suyo — el plan no se marca como actual ni la planificación como la de por defecto si ya
 *   tiene las suyas—; lo que ya tenía del profesor se sustituye solo si no lo ha tocado (la huella
 *   coincide), y si lo ha tocado se respeta. Lo del alumno no se toca nunca.
 *
 * Las planificaciones cambian de id al copiarse, y los planes las referencian en tres sitios
 * (planificacionIds, objetivosPorPlani y repartoPorComida.porPlani) más cada día: se reescribe.
 */
export async function copiarPlanesYPlanificaciones(
  tx: Tx,
  origenId: string,
  copiaId: string,
  dietistaId: string,
  opciones: { primeraVez: boolean },
): Promise<{ nuevos: number; actualizados: number; respetados: number }> {
  const cuenta = { nuevos: 0, actualizados: 0, respetados: 0 };

  // ── Planificaciones ──
  const plantilla = await tx.planificacion.findMany({ where: { pacienteId: origenId }, orderBy: { createdAt: "asc" } });
  const existentes = await tx.planificacion.findMany({
    where: { pacienteId: copiaId },
    select: { id: true, nombre: true, datos: true, origenId: true, origenHuella: true, esDefecto: true },
  });
  const yaTienePlanificacion = existentes.length > 0;
  const porOrigen = new Map(existentes.filter((e) => e.origenId).map((e) => [e.origenId as string, e]));
  const idsPlani = new Map<string, string>();
  for (const p of plantilla) {
    const { id: pid, pacienteId: _pp, dietistaId: _pd, createdAt: _c, updatedAt: _u, origenId: _o, origenHuella: _h, esDefecto, estado, datos, ...resto } = p;
    void _pp; void _pd; void _c; void _u; void _o; void _h;
    const huella = huellaDePlanificacion({ nombre: p.nombre, datos });
    const existente = porOrigen.get(pid);
    if (existente) {
      idsPlani.set(pid, existente.id);
      const sinTocar = huellaDePlanificacion({ nombre: existente.nombre, datos: existente.datos }) === existente.origenHuella;
      if (sinTocar) {
        await tx.planificacion.update({
          where: { id: existente.id },
          data: { ...resto, datos: datos as Prisma.InputJsonValue, origenHuella: huella },
          select: { id: true },
        });
        cuenta.actualizados++;
      } else cuenta.respetados++;
      continue;
    }
    const creada = await tx.planificacion.create({
      data: {
        ...resto,
        datos: datos as Prisma.InputJsonValue,
        pacienteId: copiaId,
        dietistaId,
        // Aparte de las suyas: ni por defecto ni activa si ya tiene planificación.
        esDefecto: opciones.primeraVez || !yaTienePlanificacion ? esDefecto : false,
        estado: opciones.primeraVez || !yaTienePlanificacion ? estado : "guardada",
        origenId: pid,
        origenHuella: huella,
      },
      select: { id: true },
    });
    idsPlani.set(pid, creada.id);
    cuenta.nuevos++;
  }
  // Las planificaciones del alumno que ya venían de la plantilla y no se han recorrido (plantilla
  // sin cambios en ellas) siguen valiendo para reescribir los planes.
  for (const e of existentes) if (e.origenId && !idsPlani.has(e.origenId)) idsPlani.set(e.origenId, e.id);

  // ── Planes ──
  const planes = await tx.planAlimenticio.findMany({ where: { pacienteId: origenId }, orderBy: { createdAt: "asc" }, include: ARBOL_DEL_PLAN });
  const copiasPlanes = await tx.planAlimenticio.findMany({
    where: { pacienteId: copiaId },
    include: ARBOL_DEL_PLAN,
  });
  const yaTieneActivo = copiasPlanes.some((p) => p.activo);
  const planPorOrigen = new Map(copiasPlanes.filter((p) => p.origenId).map((p) => [p.origenId as string, p]));
  for (const plan of planes) {
    const {
      id: plid, pacienteId: _plp, dietistaId: _pld, createdAt: _plc, updatedAt: _plu, origenId: _po, origenHuella: _ph,
      dias, planificacionIds, objetivosPorPlani, repartoPorComida, activo,
      ...datosPlan
    } = plan;
    void _plp; void _pld; void _plc; void _plu; void _po; void _ph;
    const huella = huellaDePlan(plan);
    const datosComunes = {
      ...datosPlan,
      planificacionIds: planificacionIds.map((pid) => idsPlani.get(pid)).filter((x): x is string => !!x),
      objetivosPorPlani: objetivosPorPlani === null ? Prisma.DbNull : reclavar(objetivosPorPlani, idsPlani),
      repartoPorComida: repartoPorComida === null ? Prisma.DbNull : reclavarReparto(repartoPorComida, idsPlani),
      origenId: plid,
      origenHuella: huella,
    };
    const existente = planPorOrigen.get(plid);
    if (existente) {
      const sinTocar = huellaDePlan(existente) === existente.origenHuella;
      if (!sinTocar) { cuenta.respetados++; continue; }
      await tx.planAlimenticio.update({ where: { id: existente.id }, data: datosComunes, select: { id: true } });
      await tx.diaDelPlan.deleteMany({ where: { planId: existente.id } });
      await crearArbolDelPlan(tx, existente.id, dias, idsPlani);
      cuenta.actualizados++;
      continue;
    }
    const nuevoPlan = await tx.planAlimenticio.create({
      data: {
        ...datosComunes,
        pacienteId: copiaId,
        dietistaId,
        // Aparte de los suyos: no se le cambia cuál es su plan actual.
        activo: opciones.primeraVez || !yaTieneActivo ? activo : false,
      },
      select: { id: true },
    });
    await crearArbolDelPlan(tx, nuevoPlan.id, dias, idsPlani);
    cuenta.nuevos++;
  }
  return cuenta;
}

/**
 * «Actualizar el caso en los alumnos» (Guillermo, 3 sep 2026): volcar la ficha ACTUAL de la
 * plantilla sobre una copia que ya tiene un alumno, sin quitar y poner el caso.
 *
 * - Los campos de la ficha (datos, anamnesis, alergias, horario, recomendaciones, notas…) se
 *   sobrescriben con los de la plantilla, también si el alumno los había tocado: es lo que pide
 *   el profesor al pulsar, y se le avisa antes.
 * - Las mediciones y consultas que vinieron de la plantilla (`origenId`) se actualizan con ella,
 *   se añaden las nuevas y se quitan las que la plantilla ya no tiene. Las que añadió el alumno
 *   (sin origen) no se tocan.
 * - Los planes y la planificación del alumno NO se tocan nunca, ni lo que ya haya entregado.
 */
export async function actualizarCopia(tx: Tx, origenId: string, copiaId: string): Promise<void> {
  const { campos, estructura, fichaInformacion, horario, fichaSidebar, medidas, consultas } = await leerPlantilla(tx, origenId);

  await tx.paciente.update({
    where: { id: copiaId },
    data: {
      ...campos,
      fichaInformacion: json(fichaInformacion),
      horario: json(horario),
      fichaSidebar: json(fichaSidebar),
      estructuraAnamnesis: estructura,
    },
    select: { id: true },
  });

  // Mediciones: las que vienen de la plantilla, por su origen.
  const copiadas = await tx.medidaAntropometrica.findMany({
    where: { pacienteId: copiaId, origenId: { not: null } },
    select: { id: true, origenId: true },
  });
  const porOrigen = new Map(copiadas.map((m) => [m.origenId as string, m.id]));
  const idsMedidas = new Map<string, string>();
  for (const m of medidas) {
    const { id: mid, pacienteId: _p, origenId: _o, ...datos } = m;
    void _p; void _o;
    const existente = porOrigen.get(mid);
    if (existente) {
      await tx.medidaAntropometrica.update({ where: { id: existente }, data: datos, select: { id: true } });
      idsMedidas.set(mid, existente);
    } else {
      const creada = await tx.medidaAntropometrica.create({ data: { ...datos, pacienteId: copiaId, origenId: mid }, select: { id: true } });
      idsMedidas.set(mid, creada.id);
    }
  }
  const vivas = new Set(medidas.map((m) => m.id));
  const sobrantes = copiadas.filter((m) => !vivas.has(m.origenId as string)).map((m) => m.id);
  if (sobrantes.length > 0) await tx.medidaAntropometrica.deleteMany({ where: { id: { in: sobrantes } } });

  // Consultas: igual.
  const consultasCopiadas = await tx.consulta.findMany({
    where: { pacienteId: copiaId, origenId: { not: null } },
    select: { id: true, origenId: true },
  });
  const consultaPorOrigen = new Map(consultasCopiadas.map((c) => [c.origenId as string, c.id]));
  const copia = await tx.paciente.findUniqueOrThrow({ where: { id: copiaId }, select: { dietistaId: true } });
  for (const c of consultas) {
    const { id: cid, pacienteId: _p, dietistaId: _dd, createdAt: _cc, updatedAt: _cu, medidaId, origenId: _o, ...datos } = c;
    void _p; void _dd; void _cc; void _cu; void _o;
    const data = { ...datos, medidaId: medidaId ? idsMedidas.get(medidaId) ?? null : null };
    const existente = consultaPorOrigen.get(cid);
    if (existente) {
      await tx.consulta.update({ where: { id: existente }, data, select: { id: true } });
    } else {
      await tx.consulta.create({ data: { ...data, pacienteId: copiaId, dietistaId: copia.dietistaId, origenId: cid }, select: { id: true } });
    }
  }
  const consultasVivas = new Set(consultas.map((c) => c.id));
  const consultasSobrantes = consultasCopiadas.filter((c) => !consultasVivas.has(c.origenId as string)).map((c) => c.id);
  if (consultasSobrantes.length > 0) await tx.consulta.deleteMany({ where: { id: { in: consultasSobrantes } } });
}

/** Un objeto indexado por id de planificación, con las claves cambiadas a los ids nuevos. */
function reclavar(valor: Prisma.JsonValue, ids: Map<string, string>): Prisma.InputJsonValue {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return valor as Prisma.InputJsonValue;
  const salida: Record<string, Prisma.JsonValue> = {};
  for (const [clave, v] of Object.entries(valor)) {
    const nueva = ids.get(clave);
    if (nueva && v !== undefined) salida[nueva] = v;
  }
  return salida as Prisma.InputJsonValue;
}

/** El reparto por comida: si lleva `porPlani`, se le cambian las claves; lo demás va tal cual. */
function reclavarReparto(valor: Prisma.JsonValue, ids: Map<string, string>): Prisma.InputJsonValue {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return valor as Prisma.InputJsonValue;
  const porPlani = valor.porPlani;
  if (porPlani === undefined || porPlani === null) return valor as Prisma.InputJsonValue;
  return { ...valor, porPlani: reclavar(porPlani, ids) } as Prisma.InputJsonValue;
}
