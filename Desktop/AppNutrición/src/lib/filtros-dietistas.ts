import type { Prisma } from "@/generated/prisma/client";

/**
 * #39 — Filtro para las consultas del panel de administración que enseñan "nutricionistas".
 *
 * Un alumno vive en la tabla `dietistas` porque usa la misma aplicación, pero **no es un cliente**:
 * si se cuenta, el día que una universidad dé de alta a sus 200 alumnos el panel diría 600
 * nutricionistas y la gráfica de altas contaría alumnos. Las cifras que se usan para vender
 * dejarían de ser ciertas.
 *
 * La cuenta demo se excluía ya de tres sitios repitiendo el mismo `where`; aquí van juntas las dos
 * exclusiones para no tener que acordarse en cada consulta nueva.
 *
 * Ojo con el NULL: casi todas las cuentas tienen `rolDocente = NULL`, y en SQL
 * `NOT (rolDocente = 'ALUMNO')` es NULL para ellas, o sea que **las dejaría fuera**. Por eso el
 * filtro es explícito: o no tiene rol, o lo tiene y no es de alumno.
 */
export function soloNutricionistas(): Prisma.DietistaWhereInput {
  const demoId = process.env.DEMO_DIETISTA_ID;
  return {
    ...(demoId ? { id: { not: demoId } } : {}),
    // Se descuentan solo las cuentas NACIDAS en una clase. Un nutricionista que ya tenía su cuenta
    // y al que su profesor mete en el aula sigue siendo un cliente de verdad: descontarlo por
    // llevar el rol de alumno lo borraba de las cifras con las que se vende (auditoría 1 sep 2026).
    OR: [{ rolDocente: null }, { rolDocente: { not: "ALUMNO" } }, { cuentaDeClase: false }],
  };
}

/**
 * Igual que el anterior, para combinar con otras condiciones sin pisar el `OR`: devuelve el filtro
 * dentro de un `AND`, que es lo que hay que usar cuando la consulta ya tiene su propio `OR`
 * (por ejemplo, un buscador por nombre o correo).
 */
export function soloNutricionistasAND(): Prisma.DietistaWhereInput {
  return { AND: [soloNutricionistas()] };
}
