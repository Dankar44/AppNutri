import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { estructuraEfectiva } from "@/lib/anamnesis-plantillas";
import { sanitizeCamposAnamnesis } from "@/lib/ficha-informacion-types";

/**
 * #40 — Copiar un paciente entero a otra cuenta.
 *
 * Es lo que pasa cuando un alumno abre un caso: el paciente plantilla que rellenó el profesor con
 * la ficha de siempre se copia a la cuenta del alumno, tal cual — datos, anamnesis, mediciones,
 * consultas, horario, recomendaciones — para que se lo encuentre "exactamente igual que un
 * paciente normal" (Guillermo, 2 sep 2026). Lo único que no viaja es lo que tiene que hacer él:
 * los planes y la planificación. Tampoco viajan las cosas de una consulta real (citas, pagos,
 * mensajes, acceso al portal, tokens de preconsulta).
 *
 * La anamnesis va **resuelta**: si el profesor usaba una plantilla suya, el alumno no puede verla,
 * así que se copia la estructura efectiva dentro del paciente.
 */
type Tx = Prisma.TransactionClient | typeof prisma;

export async function copiarPaciente(
  tx: Tx,
  origenId: string,
  destino: { dietistaId: string; esDeClase: boolean },
): Promise<string> {
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
  );

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
      estructuraAnamnesis: estructura as unknown as Prisma.InputJsonValue,
    },
  });

  // Las mediciones y las consultas, con sus fechas: una analítica con la ferritina baja es parte
  // del caso. Se hace en dos pasos porque la consulta puede apuntar a su medición.
  const idsMedidas = new Map<string, string>();
  for (const m of medidas) {
    const { id: mid, pacienteId: _p, ...datos } = m;
    void _p;
    const creada = await tx.medidaAntropometrica.create({ data: { ...datos, pacienteId: nuevo.id } });
    idsMedidas.set(mid, creada.id);
  }
  for (const c of consultas) {
    const { id: _cid, pacienteId: _p, dietistaId: _dd, createdAt: _cc, updatedAt: _cu, medidaId, ...datos } = c;
    void _cid; void _p; void _dd; void _cc; void _cu;
    await tx.consulta.create({
      data: {
        ...datos,
        pacienteId: nuevo.id,
        dietistaId: destino.dietistaId,
        medidaId: medidaId ? idsMedidas.get(medidaId) ?? null : null,
      },
    });
  }

  return nuevo.id;
}
