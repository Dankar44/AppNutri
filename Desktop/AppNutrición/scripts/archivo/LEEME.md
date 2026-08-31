# Scripts archivados — NO EJECUTAR

Estos scripts **ya cumplieron su función una sola vez** y hoy solo pueden destruir datos.
Se guardan aquí por historial; están fuera de `scripts/` para que no aparezcan al autocompletar.

| Script | Qué hacía | Por qué no se debe volver a ejecutar |
|---|---|---|
| `seed-alimentos-completo.ts` | Cargó el catálogo inicial de ~3.000 alimentos cuando la base estaba vacía | **Borra TODOS los alimentos y anula sus referencias.** Contra producción dejaría ~180.000 líneas de dieta apuntando al vacío en más de 2.000 planes de pacientes reales, de forma **irrecuperable** (la tabla no guarda copia del nombre ni de los macros)… y terminaría imprimiendo «Seed completado». Además el catálogo actual tiene trabajo posterior encima: micronutrientes, medidas caseras y alimentos añadidos a mano. |
| `fix-planificaciones-schema.ts` | Recreó la tabla de planificaciones en abril de 2026, cuando estaba vacía | Hace `DROP TABLE planificaciones CASCADE`. Su premisa («está vacía de todas formas») ya no es cierta: hoy hay cientos de planificaciones en uso. |
| `add-alternativas-alimento.ts` | Creó la tabla de alternativas y limpió el enfoque descartado | Pese al prefijo `add-`, **borra** una columna y un tipo (`DROP COLUMN modalidad`, `DROP TYPE ModalidadPlan`). Ya está aplicado. |

Si algún día hiciera falta rehacer el catálogo de alimentos, hay que **reescribir el script** para que
actualice en lugar de borrar y recrear (upsert por nombre normalizado), de modo que los
identificadores sobrevivan y las dietas existentes no se rompan.
