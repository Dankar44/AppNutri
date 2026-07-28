/**
 * Recetas de TANDA: las que no se pueden cocinar para una sola persona.
 *
 * El resto del catálogo sigue la convención "1 porción = 1 persona" (los ingredientes
 * están escritos para una ración). Estas no: un bizcocho necesita un molde y un huevo
 * entero, un alioli un huevo entero, un caldo una olla. Dividirlas daría cantidades
 * incocinables y una lista de la compra sin sentido, así que conservan las porciones
 * que rinden — en el plan el paciente sigue viendo su ración ya escalada.
 *
 * Lo usan `normalizar-porciones-recetas.ts` (migración) y `seed-recetas-app.ts`
 * (para que un entorno nuevo no reintroduzca el catálogo antiguo).
 */
export const RECETAS_TANDA = new Set([
  // Salsas, aliños y untables que se hacen en tarro y se gastan a cucharadas
  "Alioli",
  "Mayonesa casera",
  "Pesto de albahaca",
  "Salsa romesco",
  "Salsa rosa ligera",
  "Salsa tzatziki",
  "Salsa vinagreta",
  "Salsa barbacoa casera",
  "Tapenade de aceitunas",
  "Hummus casero",
  // Horno y repostería: molde entero
  "Bizcocho de yogur",
  "Brownie de aguacate",
  "Tarta de queso ligera",
  "Tarta de calabacín",
  "Quiche de verduras",
  "Galletas de avena y plátano",
  "Croquetas de espinacas",
  // Otras tandas que se guardan y duran varios días
  "Caldo de pollo casero",
  "Nueces especiadas",
  "Bolitas energéticas de dátil",
  "Boquerones en vinagre",
]);
