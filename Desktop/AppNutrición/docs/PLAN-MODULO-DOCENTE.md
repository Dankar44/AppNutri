# Módulo docente — plan de trabajo

Aportación **#39** (issue #31) + **#40** (issue #32) + **#79** (issue #69).
Rama: `feature/cuenta-profesor`. Arrancado el 27 ago 2026.

Para **este** trabajo se usa la base de **DESARROLLO** (`npm run dev:desarrollo`, puerto 3001), que
es donde programa también el colaborador. No es la norma del proyecto: lo habitual es trabajar
contra producción. Producción solo se toca cuando Guillermo pida el despliegue.

---

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Arquitectura de cuenta | **Una cuenta con dos espacios**: docente (principal) y profesional. Mismo login. |
| Alta del rol | **Solo desde `/admin`.** No hay registro de profesor ni forma de pedirlo. |
| Profesor sin cuenta previa | Se le crea desde admin y nace con las dos cosas (espacio docente + cuenta profesional completa). |
| Profesor con cuenta | Se le añade el rol; la siguiente vez que entre aterriza en el espacio docente. |
| Licencias | Bolsa por institución: "3 profesores y 300 alumnos", de septiembre a agosto. |
| Consumo | **Un alumno = una licencia**, aunque esté en clases de dos profesores distintos. |
| Máximos por clase | **Ninguno.** El único techo es la bolsa. |
| Fin de curso | Al alumno se le retira el acceso; al profesor **no** (conserva cuenta y casos, pero no da altas). |
| Devolver acceso | Dos vías: metiendo su correo otra vez (lo reconoce) y botón de renovar. Conserva todos sus datos. |
| Alta de alumnos | **Las dos vías**: a mano metiendo correos (la principal) y link de invitación de clase. |
| Cuenta ya existente | Si el correo ya tiene cuenta en Annonia **no se crea otra**: se vincula y conserva lo suyo (incluida su suscripción). |
| Datos del caso | El alumno puede editarlos, con un aviso de que los puso su profesor. |
| Corrección | Nota **0-10 con decimales** + comentarios, con interruptor de compartir o no con el alumno. |
| Aula del alumno | Sección propia donde ve enunciado, fecha límite, entrega, y nota/comentarios si se comparten. |
| Fecha límite | Una por caso asignado a la clase; ajustable a un alumno suelto. |
| Pacientes propios del alumno | Puede crearlos. **El profesor no los ve nunca.** |
| Cuenta de alumno | Nace marcada como cuenta de clase y **no se convierte en cuenta normal**: al quitarle el acceso no puede seguir usando Annonia gratis registrándose otra vez con ese correo. Sale de ahí pagando (con su descuento de recién graduado) o volviendo a tener acceso de clase. |
| Dominio de correo | Campo guardado en la licencia; de momento **solo avisa, nunca bloquea** (ver abajo). |

### Por qué el dominio no bloquea (todavía)

En producción hay profesores de universidad registrados **con Gmail** (Arrate Lasa, Alba Rodríguez,
y los cuatro que marcaron "soy profesor" en colaboradores). Y los dominios de profesor y de alumno
son distintos en la misma universidad (`urjc.es` frente a `alumnos.urjc.es`). Un bloqueo por dominio
dejaría fuera a gente que ya tenemos, así que:

- El campo admite **varios dominios separados por comas** y se guarda desde ya.
- En el alta a mano: **nunca bloquea**, solo avisa de que ese correo no es de la institución.
- Lo que protege el link de invitación es el **tope de la bolsa** (vendidas 300, entran 300) y poder
  **cerrar el link** cuando ya se han apuntado todos.
- **Sin aprobación manual**: quien entra por el link entra directo. Descartado a propósito el
  27 ago 2026 — obligaría al profesor a hacer el trabajo dos veces (el alumno se apunta y él además
  tiene que aceptarlo), y eso es justo lo que se le quiere ahorrar.
- El bloqueo duro por dominio se activará cuando haya cobros y alguna universidad lo pida.

---

## Fases

1. **El rol existe y se entra por él** — licencia, rol, admin, espacio docente, cambio de espacio.
2. **Clases, alumnos y ciclo del curso** — altas por correo y por link, bolsa, cierre y renovación.
3. **Casos clínicos y asignación** — el caso es un paciente; copia independiente por alumno.
4. **Corrección** — panel del profesor, nota y comentarios, aula del alumno, sección del entregable (#40).
5. **Remates** — avisos, exportar resultados, comparativa, nota legal (#79).

### Estado de la fase 5 (8 sep 2026): hecha

| | Qué | Dónde |
|---|---|---|
| ✅ | **Descargar las notas** de una clase en CSV para el acta | `api/asignaciones/[id]/notas` · `probar-exportar-notas` (10) |
| ✅ | **Avisos** al profesor cuando le entregan, dentro de la app | `avisarAlProfesor` en `actions/aula.ts` |
| ✅ | **Separación de espacios**: en docencia solo avisos de docencia | `filtroDelEspacio` en `actions/notificaciones.ts` · `probar-avisos-espacios` (7) |
| ✅ | **Comparativa entre alumnos** con desvío y mediana de la clase | `lib/comparativa-clase.ts` · en el guion (pasos 28b2) |
| ✅ | **Nota legal para universidades** (#79) | `docs/LEGAL-UNIVERSIDADES.md` |

Nada de correos: el plan gratuito de Resend son 3.000 al mes y 100 al día, y una facultad de 300
alumnos se los come sola (decidido con Guillermo el 8 sep 2026).

**Los avisos al profesor son por PLAZO, no por entrega** (rectificado el mismo día: *"con cada
entrega puede ser un poco petada… prefiero que sea como ya ha acabado el período de esta clase,
revisa las entregas"*). Un solo aviso por asignación cuando pasa la fecha límite, diciendo cuántas
quedan por revisar. Una asignación sin fecha límite no tiene final que anunciar y no avisa.

**Pendiente de Guillermo, no de programación:** el nombre real de la base de datos de aminoácidos
que pidió la universidad (#121). Lo apuntado como "GEPCAT" es una transcripción dudosa y **no
corresponde a ninguna base real**. Las que sí tienen perfil completo de aminoácidos son **USDA
FoodData Central** (gratis), **FAO/INFOODS** y **Souci-Fachmann-Kraut** (de pago); BEDCA y CESNID
solo lo tienen parcial. Cuando se confirme, es una mejora del catálogo para TODA la aplicación, no
solo para docencia.

### Cómo se cuentan las plazas (decidido el 8 sep 2026)

**Alumnos: por CURSO.** Una plaza se gasta al entrar y no vuelve hasta el 31 de agosto, aunque al
alumno se le retire o se archive su clase. El 1 de septiembre la facultad recupera las suyas
enteras. El mismo alumno en dos clases gasta UNA, y volver tras irse no gasta otra. Con eso el
contador solo sube dentro del curso, que es lo que se vende y lo que se entiende sin explicaciones.
Además cada clase puede poner su tope propio («somos 60»), y manda el que se agote antes.

**Profesores: por USOS del enlace.** Un enlace de 10 admite 10 altas y se agota; si después un
profesor se va, ese hueco no lo coge nadie por ahí. Para vender tres más se crea otro enlace de
tres y la universidad pasa a 13. La diferencia con los alumnos está justificada: el alumno es
temporal por diseño —dura un curso— y el profesor es permanente.

**Nada de filtro por dominio de correo**: alumnos y profesores se registran a veces con su cuenta
personal. Lo que protege es el contador y el freno por IP.

### Para más adelante: política de borrado de cuentas paradas (8 sep 2026)

Idea de Guillermo, **para un issue aparte, no para ahora**: borrar automáticamente lo que lleve
mucho tiempo muerto — una universidad que lleve **dos años sin renovar**, o un profesor que lleve
**dieciocho meses sin entrar** en su espacio. Hoy no se borra nada nunca, así que las cuentas de
facultades que probaron y no siguieron se quedan para siempre.

Cuando se haga, hay que decidir qué se borra y qué se conserva (el trabajo del alumno es suyo, no
de la universidad) y avisar antes por correo. Enlaza con la limpieza automática que ya existe en
`lib/limpieza-docente.ts`.

### Lo que NO entra en la fase 5 (decidido el 8 sep 2026)

- **#40, la sección comparativa dentro del PDF.** La idea acordada, para cuando se haga: que al
  descargar el entregable se pueda elegir **«normal» o «con la comparativa»**, no que salga
  siempre. Se queda fuera de la primera versión a propósito: *"cuanto menos contaminemos sus cosas
  la primera versión, menos se pueden quejar y más pueden pedir"* (Guillermo). En pantalla el
  profesor ya ve la planificación del alumno al corregir, que es el 80% del valor. Lo difícil de
  verdad no es la tabla de kcal y macros, sino **comprobar que los alimentos respetan las
  patologías**, y eso depende de un issue aparte (restricciones por patología) que no existe aún.
- **#121, aminoácidos y desglose de grasas.** Es una mejora del catálogo de alimentos de toda la
  aplicación, no del módulo docente: se hará "para todos" cuando toque, no aquí. Sigue pendiente
  confirmar con la universidad el nombre de la base de datos que pidieron (¿GEPCAT?).

Cada fase lleva su plan de 100+ pasos, verificación cada pocos pasos y **auditoría completa** al final.

---

# FASE 2 — Clases, alumnos y ciclo del curso

Por arrancar. El plan detallado de 100+ pasos se escribe al empezarla; aquí queda lo decidido y lo
que no se puede olvidar.

## Los alumnos NO son nutricionistas (decidido el 28 ago 2026)

Un alumno vive en la tabla `dietistas` porque usa la misma aplicación, pero **no es un cliente**.
Hoy el panel de administración no los distingue, y el día que la Pablo de Olavide dé de alta a sus
200 alumnos eso rompe cosas que importan:

| Dónde | Qué pasaría con 200 alumnos |
|---|---|
| `getAdminStats` (`admin.ts:78`) | «Total de nutricionistas» pasaría de ~400 a ~600, y el crecimiento del mes se dispararía. **Las cifras que se usan para vender dejarían de ser ciertas.** |
| `getRegistrosMensuales` (`admin.ts:132`) | La gráfica de registros contaría los alumnos como altas. |
| `getDietistasAdmin` (`admin.ts:223`) | El listado mezclaría 200 alumnos con los nutricionistas de verdad. |
| `getSuscripcionesAdmin`, `getDietistasPendientes`, `/admin/seguimiento` | Lo mismo: recorren todos los dietistas. |
| `notificaciones.ts` | Genera avisos recorriendo dietistas: 200 alumnos = ruido y trabajo de más. |

**Qué hay que hacer, antes de crear el primer alumno:**

- Excluir `rolDocente = 'ALUMNO'` de las métricas, del listado y de los procesos que recorren
  nutricionistas — igual que ya se excluye la cuenta demo (`excluirDemo`), que es el patrón a seguir.
- **Sección propia de alumnos en administración** (petición de Guillermo, 28 ago 2026), no una
  pestaña dentro de nutricionistas. Con lo que de verdad se quiere mirar de un alumno:
  - a qué institución y a qué clase pertenece, y con qué profesor;
  - **estado del acceso**: activo, retirado, y desde cuándo;
  - **fecha de alta y fecha de renovación** — cuáles se han renovado este curso y cuáles no;
  - último acceso, para ver quién no ha entrado nunca;
  - de un vistazo, cuántas licencias de la bolsa están consumidas de verdad.
- Y decidir si un alumno cuenta como «usuario» en cualquier otro sitio donde se enseñen cifras.

Esto no es un adorno: es lo que evita que el panel de administración deje de servir el día que
entre la primera universidad de verdad.

## El espacio docente es OTRO sitio, no el panel con una sección más (Guillermo, 28 ago 2026)

Al probar la Fase 1 quedó claro que lo entregado se queda corto: es el menú de nutricionista con
"Espacio docente" añadido. Lo que se quiere es que el botón «Acceder a mi cuenta profesional`»
**cambie el dashboard entero**, y que mientras esté en el espacio docente no vea lo que no le sirve.

**Fuera del espacio docente:** el Dashboard de nutricionista, **Pacientes**, **Agenda** y **Pagos**.
**Se queda:** **Alimentos** y **Recetas** — material que el profesor comparte con sus alumnos.
**Entra:** clases, alumnos, casos clínicos y **entregas** (qué caso tiene cada clase, su fecha
límite, quién ha entregado y qué falta por corregir).
**Reportes:** se quita del espacio docente. Son informes de pacientes reales; lo que un profesor
mira ahí son las entregas y las notas.

**Requisito de fondo, y es el más importante:** los **casos de clase no se mezclan nunca con los
pacientes reales del profesor**. Los casos viven solo en el espacio docente; su lista de "Pacientes"
de la cuenta profesional sigue siendo la suya. Encaja con el modelo (el caso es un `Paciente`
marcado), pero obliga a **filtrarlo** en `getPacientes` y en todo lo que liste pacientes.

**El dashboard docente** deja de ser un cartel y pasa a mostrar lo que mira un profesor: sus clases
con cuántos alumnos, los casos abiertos con su fecha límite y cuántos han entregado, y lo que le
queda por corregir. La bolsa de licencias baja a un rincón: es un dato administrativo.

**Decidido el 30 ago 2026:**

- **Mensajería, fuera.** Ni para profesores ni para alumnos dentro del espacio docente. Los avisos
  sí se quedan (caso asignado, nota puesta): un aviso no es una conversación.
- **Ajustes, en los dos espacios.** Es una sola cuenta, y su nombre, su logo y su tema de PDF se
  usan también en lo docente.
- **Dietas, sí.** El profesor puede dejar hecha su propia solución del caso.
- **Alimentos y recetas como en el centro**: los comparte con su clase **o no**, para poder tener
  los suyos y hacerse la dieta de ejemplo sin enseñarla. **El alumno puede usarlos, copiarlos y
  modificarlos** (cada uno acaba con su versión; no es solo lectura).
- **Al quitar el rol a un profesor no se borra nada**: sus clases y casos quedan **archivados**
  esperando a que vuelva o a que pasen a otro profesor. Para liberar espacio, borrado explícito
  desde administración, nunca automático.

**El menú del espacio docente (aprobado el 30 ago 2026):**

> **Docencia** — Inicio · Clases · Alumnos · Casos clínicos · Entregas
> **Material** — Dietas · Alimentos · Recetas
> **Cuenta** — Ajustes · Novedades
> y el botón «Acceder a mi cuenta profesional»

Fuera: el Dashboard de nutricionista, Pacientes, Agenda, Pagos, Mensajes y Reportes. Los apartados
que todavía no existen (Casos clínicos, Entregas) se añaden cuando se construyan, no antes: un
menú lleno de sitios vacíos es peor que un menú corto.

## Lo demás de la fase 2

- `Clase` y `AlumnoClase` (la matrícula), con su estado y su curso.
- Alta de alumnos por las dos vías: a mano metiendo correos (la principal) y link de invitación.
- Si el correo ya tiene cuenta, se vincula: no se crea otra.
- Consumo de la bolsa y su contador, con el tope como única protección del link.
- Pantalla de «no tienes acceso» para el alumno, respetando su suscripción propia si la tiene.
- Cerrar y renovar curso conservando todos sus datos.

## Al integrar la rama, tener esto en cuenta (1 sep 2026)

`main` local iba **4 commits por detrás de `origin/main`** cuando se creó esta rama, y dos arreglos
de IA (`78470ab` reintentar con JSON inválido, `27d39ec` refrescar la ficha al aceptar el plan)
están **aplicados dos veces**: en `origin/main` con esos hashes y en esta rama con otros
(`25ff0d0`, `09f9531`). El contenido es idéntico, comprobado con `diff`, así que al mezclar deberían
resolverse solos; se dejan como están a propósito para no reescribir historial (Guillermo, 1 sep).

Los dos están **desplegados en producción** (el servidor tiene `78470ab`), así que no hay nada
pendiente de subir por ese lado.

Antes de integrar: actualizar `main` desde `origin`, mezclar sobre él y comprobar que esos dos
cambios no aparecen duplicados en el resultado.

## Plan de la Fase 2 — 152 pasos

Arrancado el 30 ago 2026. Verificación cada bloque y auditoría al final, como en la Fase 1.

### Bloque A · Que un alumno no cuente como nutricionista (1-16)
*Condición de entrada: esto va ANTES de crear el primer alumno.*

1. [x] Repasar los tres contadores de `getAdminStats` (`admin.ts:78`) y excluir `rolDocente = 'ALUMNO'`.
2. [x] `getRegistrosMensuales`: excluir alumnos de la gráfica de altas.
3. [x] `getDietistasAdmin`: fuera del listado de nutricionistas.
4. [x] `getSuscripcionesAdmin`: fuera.
5. [x] `getDietistasPendientes` y `/admin/verificaciones`: fuera.
6. [x] `/admin/seguimiento`: fuera.
7. [x] `getActividadGlobal`: comprobar si los cuenta y decidir.
8. [x] `notificaciones.ts`: que el generador no recorra alumnos.
9. [x] Buscar cualquier otro `dietista.count` o `findMany` que sirva para enseñar cifras.
10. [x] Un solo sitio con el filtro (`soloNutricionistas`) en vez de repetirlo en nueve consultas.
11. [x] Comprobar que el filtro no se cuela donde SÍ hay que contarlos (la bolsa de la licencia).
12. [x] Sembrar 30 alumnos de prueba en desarrollo y mirar el panel antes y después.
13. [x] Comprobar que el total de nutricionistas no se mueve al crearlos.
14. [x] Comprobar que la gráfica de altas tampoco.
15. [x] Comprobar que el listado sigue teniendo los mismos.
16. [x] ✅ `tsc` + las tres baterías de la Fase 1 siguen en verde.

### Bloque B · El espacio docente es otro sitio (17-34)

17. [x] `getNavSections`: secciones distintas según el espacio (docente o profesional).
18. [x] Espacio docente: Docencia (Inicio, Clases, Alumnos) + Material (Dietas, Alimentos, Recetas) + Cuenta (Ajustes, Novedades).
19. [x] Quitar de ahí Dashboard, Pacientes, Agenda, Pagos, Mensajes y Reportes.
20. [x] El botón «Acceder a mi cuenta profesional», visible y fijo.
21. [x] Y en la cuenta profesional, la vuelta al espacio docente.
22. [x] Que un nutricionista normal no note ningún cambio en su menú.
23. [x] Que el menú móvil (drawer) muestre lo mismo.
24. [x] Que el menú plegado también.
25. [ ] Rehacer el panel de `/profesor` con lo que mira un profesor, no con un cartel. *(va al bloque D: sin clases todavía no hay nada que pintar)*
26. [ ] Tarjeta de clases: cuántas y cuántos alumnos en cada una.
27. [ ] Tarjeta de lo que falta por corregir (vacía hasta la fase 4, pero con su sitio).
28. [ ] La bolsa de licencias baja a un rincón: es un dato administrativo.
29. [ ] Estado vacío del panel: sin clases todavía, con el botón de crear la primera.
30. [x] Comprobar que las rutas del espacio profesional siguen accesibles desde el docente por URL.
31. [x] Decidir y documentar qué pasa si un profesor entra a `/pacientes` desde el espacio docente.
32. [x] Traducciones nuevas en es y pt.
33. [x] Capturas de escritorio, móvil y modo oscuro; mirarlas.
34. [x] ✅ `tsc`, `next build` y las baterías.

### Bloque C · Modelo de clases y matrículas (35-50)

35. [x] Migración: tabla `clases` (profesor, licencia, nombre, curso, token, estado, archivada).
36. [x] `ALTER TABLE public.clases ENABLE ROW LEVEL SECURITY` en la misma migración.
37. [x] Migración: tabla `alumnos_clase` (matrícula) con estado, alta y baja.
38. [x] RLS también en ella.
39. [x] Índices por profesor, por licencia y por alumno.
40. [x] Clave ajena de la clase a la licencia, con su comportamiento al borrar.
41. [x] `Dietista.origenCuenta` para distinguir la cuenta que nació de una clase.
42. [x] Idempotencia: ejecutar la migración dos veces.
43. [x] Comprobar RLS con `scripts/comprobar-rls.ts`.
44. [x] Modelos en `schema.prisma` con sus comentarios.
45. [x] `prisma generate` con Node 22 y reiniciar el servidor (el cliente viejo se queda en memoria).
46. [x] `npm run db:comparar`: el desajuste esperado y nada más.
47. [x] Un alumno = una licencia aunque esté en dos clases: escribir la consulta que lo cuenta.
48. [x] Decidir qué pasa con las clases cuando se archiva un profesor.
49. [x] Documentar el modelo en el plan.
50. [x] ✅ `tsc` y comparación de esquemas.

### Bloque D · Clases (51-68)

51. [x] `crearClase`, `editarClase`, `archivarClase` en una acción nueva.
52. [x] Cada una con `requireProfesor` y comprobando que la clase es suya.
53. [x] Que un profesor no pueda tocar la clase de otro (aunque sea de la misma licencia).
54. [x] Listado de clases en el espacio docente.
55. [x] Ficha de una clase: alumnos, casos y su estado.
56. [x] Crear clase: nombre y curso, con el curso por defecto.
57. [x] Editar y archivar, con confirmación.
58. [x] Estado vacío: sin clases.
59. [x] Contador de alumnos por clase.
60. [x] `revalidatePath` en todas las mutaciones.
61. [x] Traducciones es y pt.
62. [x] Comprobar en el navegador: crear, editar y archivar de verdad.
63. [x] Comprobar que archivar no borra nada.
64. [x] Comprobar los límites de longitud de los campos.
65. [x] Comprobar el móvil.
66. [ ] Comprobar el modo oscuro.
67. [ ] Capturas y mirarlas.
68. [x] ✅ `tsc` + baterías.

### Bloques E a I — hechos (1 sep 2026)

**Bloque E · Alta de alumnos (69-92).** Las dos vías: pegar correos (uno por línea) y el enlace de
clase. Nadie pone la contraseña de nadie. Si el correo ya tiene cuenta se le matricula sin tocar
nada de lo suyo; un alumno nuevo se crea SIN suscripción. Retirar el acceso no borra nada y
devuelve la plaza. La invitación por correo le habla al alumno como alumno.
*76 comprobaciones nuevas.*

**Bloque F · Ciclo del curso (93-112).** El curso se cierra solo, al entrar, sin tarea programada.
Pantalla `/curso-terminado` que empieza diciendo que no se ha borrado nada. No se echa: al
profesor, ni a quien ya era nutricionista, ni a quien tiene suscripción propia. «Cerrar el curso»
retira a todos de una vez. Aviso 30 días antes. Una cuenta de clase no se borra a sí misma ni
estrena suscripción al abrir Ajustes. *30 comprobaciones.*

**Bloque G · Alumnos en administración (113-124).** `/admin/alumnos` con institución, clase,
profesor, alta, último acceso y estado; filtros y buscador en la dirección; consumo real de la
bolsa por institución; aviso de los que nunca han entrado. *19 comprobaciones.*

**Bloque H · Compartir material (125-136).** Misma mecánica que el centro (`compartido`), añadida a
`recetas`. El alumno lo ve etiquetado, lo abre y lo copia a lo suyo; lo no compartido no se ve ni
por la dirección. Al acabar el curso pierde el material del profesor pero conserva sus copias.
*36 comprobaciones, cinco de ellas sobre el centro, que no es de este módulo pero comparte
mecanismo.*

**Bloque I · Auditoría (137-152).** Cinco revisiones adversarias en paralelo (bolsa, aislamiento
entre cuentas, cierre de curso, altas, producto/interfaz) → **27 arreglos**, todos con prueba que
los cubre. Lo gordo:

| Qué | Dónde | Qué pasaba |
|---|---|---|
| Las acciones no pasan por el layout | `auth.ts` | El alumno con el curso cerrado seguía creando planes, mandando correos y gastando IA |
| Borrado antes de comprobar el dueño | `recetas.ts` | Cualquiera vaciaba de ingredientes la receta de cualquiera |
| Comprobar-y-escribir sin transacción | `docencia-bolsa.ts` | Cinco altas a la vez entraban en la última plaza |
| Desarchivar no miraba el cupo | `clases.ts` | Archivar + llenar otra + desarchivar = doble de alumnos que los vendidos |
| Vincular una cuenta ajena sin permiso | `clase-publica.ts` | Con el enlace se metía en el aula la cuenta de otro nutricionista |
| Rollback incompleto | `invitaciones-docentes.ts` | Un fallo a medias dejaba el correo inservible para siempre |
| Dos contadores del mismo número | `docencia.ts` | El panel decía 300/300 y la clase «300 libres» |
| El menú se caía en el material | `sidebar.tsx` | Al pulsar Alimentos desaparecía «Clases» |

Rendimiento medido con 200 alumnos, 8 clases y 4 profesores: la cuenta de la bolsa, 38 ms; la
pantalla más lenta, 2,3 s (`scripts/probar-carga-docente.ts`).

**Estado: FASE 2 TERMINADA.** 361 comprobaciones automáticas en 13 baterías, `tsc` y `next build`
limpios, RLS en las 38 tablas.

### Fase 2.1 — lo que salió al probarlo (1-2 sep 2026)

Guillermo probó la fase 2 en el navegador y de ahí salieron **tres decisiones de producto** y una
tanda de arreglos.

**Decisión 1 — al alumno no se le echa nunca.** Lo que pierde al salir de una clase es la clase:
el material del profesor, sus casos y sus entregas. Su cuenta, sus dietas y sus pacientes de
prácticas son suyos y sigue entrando. Cuando se queda sin ninguna clase viva deja de ser alumno y
pasa a cuenta normal, con un aviso que ve una sola vez.

> ⚠️ **Lo de "gratis de por vida" es de esta época.** Cuando haya pasarela de pago hay que volver
> a `/curso-terminado` y decidir qué pasa con el alumno que termina la carrera. Está también en la
> memoria del proyecto (`project_alumnos_gratis_de_por_vida`).

Esto **anula** la regla anterior de que una cuenta nacida en clase nunca se convierte en cuenta
normal. Mientras todo sea gratis no hay agujero; en cuanto se cobre, vuelve a serlo.

**Decisión 2 — una clase puede tener varios profesores.** En una facultad la misma asignatura la
llevan dos o tres. `clases.profesorId` se queda como quien la creó (a quien el alumno ve como su
profesor) y `profesores_clase` dice quién más la lleva, el creador incluido, para que el permiso
se compruebe en un solo sitio.

**Decisión 3 — el alumno tiene su aula**, con las mismas dos puertas que el profesor: su aula y su
cuenta profesional. Durante la carrera muchos ya empiezan a ver gente de verdad.

**Arreglos de lo que probó:** el menú encendía dos sitios a la vez; Ajustes y Novedades sacaban
del espacio docente; al alumno le ponía «Nutricionista»; abrir el enlace de invitación en el
navegador del profesor creaba la cuenta y le devolvía a SU espacio; y los alumnos retirados se
quedaban mezclados sin forma de sacarlos de la lista.

**Dos fallos que salieron al escribir las pruebas:**

- Una clase con el curso ya pasado seguía ocupando plazas de la bolsa: la facultad se quedaba con
  la bolsa llena de los alumnos del año anterior hasta que alguien archivara las clases a mano.
- Las fechas de día se comparaban con la hora del servidor, así que el resultado cambiaba según
  dónde corriese la aplicación: en España, entre medianoche y las dos, una licencia que acababa
  hoy salía caducada. Ahora se comparan en UTC, que es como están guardadas.

**Estado: 14 baterías, 406 comprobaciones.** `tsc` y `next build` limpios, RLS en las 39 tablas.

### Pendiente de la fase 2

- Las migraciones **no** están aplicadas en producción (esperan a que Guillermo pida el despliegue):
  `add-modulo-docente`, `add-licencia-persona-contacto`, `add-invitaciones-docentes`,
  `add-invitacion-reenvios`, `add-clases-docentes`, `add-recetas-compartido`, `add-exalumno` y
  `add-profesores-clase`. Se comprueba con `DB=prod npx tsx scripts/comprobar-migraciones-docentes.ts`,
  que solo lee.
- `/api/pdf` no pide sesión: **preexistente y ajeno a este módulo**, pero cualquiera en internet
  puede hacer trabajar a nuestro Chrome. Contado a Guillermo aparte.
- El portal del paciente del alumno expulsado sigue en pie (sus pacientes de prácticas pueden
  entrar con su PIN). Es coherente con "no se borra nada", pero conviene decidirlo en la fase 3.

---

# FASE 3 — Casos clínicos y entregas

Estado: **EN MARCHA** (2 sep 2026).

## La decisión que lo ordena todo: el caso ES un paciente del profesor, rellenado con la ficha de siempre

Guillermo, 2 sep 2026, tumbando la primera versión (que creaba el caso con un formulario aparte,
recortado):

> "la gracia es que el profesor cree un caso EXACTAMENTE igual que cuando un nutricionista se lo da
> a un paciente que rellena todos sus datos exactamente igual, la anamnesis, mediciones, altura,
> peso, alergias… tiene que aparecer exactamente igual que un paciente normal, solo que lo único
> que no aparece es la planificación y el plan de alimentación (…) El profesor rellena sus datos,
> las alergias, el horario, lo que sea, y luego tiene que funcionar. Y luego esto se le comparte a
> los alumnos, pero esto se ve como un paciente normal."

De ahí sale el modelo definitivo (el que está en código):

- Crear un **caso** pide solo tres cosas: el nombre del caso, la consigna (qué les pides) y el
  nombre del paciente. Y lleva **directo a la ficha de siempre de ese paciente**, con un aviso
  encima. Todo lo demás —anamnesis, mediciones, alergias, horario, recomendaciones— se rellena ahí,
  igual que con un paciente de verdad. **La ficha del paciente ES el formulario del caso.**
- El paciente del caso es un `Paciente` de verdad del profesor, marcado `esCasoDocente`. **No se
  mezcla nunca** con los suyos: fuera de la lista, de la agenda y de todas las cifras
  (`PACIENTES_REALES`).
- En la ficha de la plantilla se quita **solo el portal del paciente** (es para una persona real
  que entra con su PIN). Planificación y plan de alimentación **se quedan**, pero lo que el profesor
  haga ahí es **su solución** y NO se comparte por defecto (Guillermo, 2 sep 2026: "que se pueda
  hacer el plan y no compartirlo, para tener el suyo y compararlo con lo que le entregan"). Un
  interruptor por caso, `compartirPlanes` («Darles hecha la planificación y el plan»), hace que se
  les copie al empezar el caso, si quiere dárselo hecho. Tampoco se le ofrece citar ni borrar.
- Al asignarlo a una clase (con fecha límite) y **empezarlo el alumno**, se le copia el paciente
  **entero** a su cuenta: datos, anamnesis resuelta, mediciones, consultas, horario,
  recomendaciones — y **planificaciones y planes solo si `compartirPlanes`** (con los ids
  reescritos). Lo ve "exactamente igual que un paciente normal", marcado `esDeClase`. Al corregir,
  el profesor tiene un enlace «Comparar con tu plan del caso» que abre su solución en otra pestaña.
- Los casos del alumno viven **dentro de la clase**, no sueltos en el aula: el aula lista las clases
  con "N casos · M por entregar" y, dentro, están los casos. También le salen en **Pacientes**,
  etiquetados con su clase.
- Al entregar puede dejar una **nota** para el profesor, que la ve al corregir.
- **La entrega es una FOTO FIJA con su PDF** (Guillermo, 2 sep 2026: "lo que se envíe se envíe;
  por mucho que modifique el alumno después, si no le da a enviar otra vez no se refleja", y "lo
  importante es el entregable final"). Al entregar se congela el trabajo (`entregaSnapshot`:
  paciente, planificaciones y planes tal y como se pintan) y se genera y guarda el **PDF del
  entregable** (`entregablePdf`, el mismo que le daría al paciente, con las secciones que el alumno
  tenga en Entregables si entrega desde ahí). El profesor ve la foto con fecha y hora, abre el PDF
  y ve **también la planificación** del alumno (resumen en solo lectura). El alumno puede seguir
  tocando su paciente; «Volver a entregar» sustituye la foto. Esto cierra la duda "¿entregar
  congela?": sí, congela la entrega, no el paciente.

## Estado: bloques A a E hechos, auditoría incluida (2 sep 2026)

**A · Modelo.** `casos_clinicos` (la plantilla del profesor), `asignaciones_caso` (ese caso puesto
a una clase, con fecha límite) y `entregas_caso` (lo de cada alumno: su paciente, su estado y su
nota). El paciente se crea la primera vez que el alumno abre el caso, no al asignarlo: una clase
de 300 generaría 300 pacientes que quizá nadie llegue a abrir. Y `PACIENTES_REALES`, un solo
filtro donde antes había 53 `esDemo: false` repetidos a mano en ocho ficheros.

**B · El profesor crea y asigna.** Crear un caso pide nombre, consigna y nombre del paciente, y
lleva a la ficha de siempre a rellenarlo (`copiarPaciente` es lo que luego lo clona). Se duplican y
se archivan. Asignación a una o varias clases con fecha límite, que se puede cambiar después.
**Se asigna desde dos sitios**: la ficha del caso y el aviso de encima de la ficha del paciente
(que es donde el profesor pasa el rato). Retirar no borra nada.

**C · El alumno trabaja.** El caso le sale **dentro de su clase** (el aula lista las clases con su
recuento); al empezarlo se le copia el paciente entero y aterriza en su ficha, que lleva arriba la
consigna, el plazo y el botón de entregar (con una nota opcional para el profesor). En su lista de
pacientes sale etiquetado con su clase, con un selector para separarlos de los suyos.

**D · El profesor corrige.** En la ficha del caso, cada clase se despliega con sus alumnos y su
progreso (el plazo se cambia ahí mismo, junto a la clase). Abre el trabajo en solo lectura
(la nota del alumno + el paciente + los planes) y pone nota de 0 a 10 con comentario, con un
interruptor para publicarla cuando termine con toda la clase. Los casos también se ven desde la
ficha de la clase, y desde ahí el nombre abre el paciente (volviendo luego a la clase).

**E · Menú del alumno.** Pacientes se queda: es donde practica. Fuera del aula, la gestión de una
consulta (Agenda, Pagos) sigue en su cuenta profesional, a un clic.

### La auditoría (bloque F)

Tres revisiones adversarias. **Cuatro de los hallazgos no eran del módulo docente sino de la
aplicación entera**, y los cuatro estaban desde antes:

| Qué | Quién podía |
|---|---|
| `crearEnlace(planId)` sin comprobar el dueño | Cualquiera con cuenta: publicar en internet la dieta de un paciente ajeno |
| `crearPlan`, `crearConsulta`, `crearPlanDesdePlantilla` con `pacienteId` ajeno | Colgar planes y consultas de la ficha de otro |

Del módulo, catorce: borrar la cuenta del profesor arrasaba con las entregas de sus alumnos; el
alumno podía borrar el paciente del caso y reabrir una entrega corregida; dos pestañas creaban dos
pacientes; entregar no repetía las comprobaciones de abrir; un caso archivado se seguía viendo;
retirar a un alumno escondía su trabajo de los dos lados; se podía corregir a quien no había
entregado; el paciente inventado salía en el selector de citas; y el día de la fecha límite
contaba distinto para el profesor que para el alumno.

**Estado: 16 baterías, ~480 comprobaciones.** `tsc` y `next build` limpios, RLS en las 42 tablas.
Con 200 alumnos, 20 casos y ~2.500 entregas, la pantalla más lenta son 2,1 s.

### El rediseño del 2 sep (lo que salió al probarlo Guillermo)

La primera versión creaba el caso con un formulario propio recortado y los casos salían sueltos en
el aula. Al probarlo, Guillermo pidió el modelo de arriba. Cambios hechos:

- **El caso se rellena con la ficha de siempre.** Se tiró el formulario largo; `crearCaso` crea el
  paciente `esCasoDocente` y redirige a `/pacientes/[id]`. `copiarPaciente` ahora copia también
  **planificaciones y planes** (con `planificacionIds`, `objetivosPorPlani`, `repartoPorComida` y
  los `grupoId` de "comen igual" reescritos a los ids nuevos).
- **Los casos, dentro de la clase.** Nueva ruta `/aula/[claseId]`; el aula solo lista clases.
- **Nota del alumno al entregar** (`entregas_caso.notaAlumno`); el profesor la ve al corregir.
- **Migración `add-casos-como-pacientes`**: `pacientes.esCasoDocente`, `casos_clinicos.pacienteId`
  (FK única, SetNull) y `entregas_caso.notaAlumno`; se caen las 17 columnas de la copia recortada
  del paciente que tenía `casos_clinicos` (producción nunca las tuvo).
- **La ficha del caso** reúne consigna + clases + entregas en una pantalla (se fue la página de
  entregas aparte, que confundía; su dirección antigua redirige). El plazo se edita junto a la
  clase, no en un "cambiar la fecha límite" suelto que no se sabía a quién afectaba.
- **El relleno de las tarjetas**: `lg:py-0 lg:p-5` dejaba el padding vertical a cero en escritorio
  (la propiedad concreta gana al atajo) → todo pegado. Corregido en todas las tarjetas nuevas.
- **El espacio es un modo, no una marca** (`espacioQueDicta`, cookie `annonia-espacio`). Al crear
  una dieta desde la ficha del paciente del caso se pasa por `/dietas/nuevo` y el editor, que no
  llevan `?espacio=docente`, y el menú se cambiaba al de nutricionista a mitad de faena. Ahora el
  menú recuerda el último espacio que dictó una dirección (lo escribe él mismo en la cookie al
  pintarse, nunca un enlace con efectos) y solo cambia cuando otra dirección dicta otra cosa
  («Mi cuenta profesional» → /dashboard). Las rutas compartidas sin marca no cambian nada. Esto
  también arregla Material → Dietas → una dieta, que perdía el menú desde la fase 2.
- **El selector de paciente de «Nueva dieta»** no lista la plantilla de un caso salvo que se venga
  de su ficha con su id: no se mezcla con los pacientes de verdad del profesor.
- **Prueba de recorrido** `probar-recorrido-casos.ts`: el flujo entero con clics (43 comprobaciones
  y una captura por pantalla en /tmp/annonia-recorrido).
- **`compartirPlanes`** (migración `add-caso-compartir-planes`, la 12ª): la planificación y el plan
  del profesor no viajan salvo que lo encienda. Interruptor en la ficha del caso y en el aviso de
  la ficha del paciente; enlace «Comparar con tu plan del caso» al corregir.
- **Calendario de la app** (`DatePicker`) en vez del del navegador para el plazo, la asignación, el
  fin de curso y la fecha de la licencia.
- **Recetas** abre en «Recetas de la app» cuando la cuenta aún no tiene propias: un profesor/alumno
  nuevo aterrizaba en «Mis recetas» vacío y parecía que el catálogo (315) no existía.
- **Entrega congelada con PDF** (migración `add-entrega-congelada`, la 13ª): `entregaSnapshot`
  (JSONB), `entregablePdf` (bytea, ~230 KB por entrega; si pesa, a Storage), `entregablePlanId`,
  `entregableNombre`, `entregableBytes`. Cuadro de entrega compartido (`components/docencia/
  entregar-caso.tsx`) en el aula, el aviso de la ficha y la pestaña Entregables («Entregar al
  profesor», con las secciones puestas ahí). Ruta `GET /api/entregas/[id]/pdf` (alumno o profesor
  del caso / de la clase). El profesor ve fecha y hora de la entrega, el PDF, el paciente, la
  **planificación** (`planificacion-resumen.tsx`) y los planes de la foto; en vivo solo si aún no
  ha entregado. `deshacerEntrega` borra la foto y el PDF. Todas las consultas a `entregas_caso`
  llevan `select` para no arrastrar el bytea.

- **La copia del alumno se pone al día SOLA** (3 sep 2026, Guillermo: "todo se actualiza, el
  peso, el horario… aunque lo tengan empezado; lo único que va por compartir es la planificación y
  el plan"). Primero se hizo un aviso con ✕ y un botón «Actualizar el caso en los alumnos»; el
  mismo día se quitaron (sus columnas se eliminan en `add-sincronizacion-copia`, la 17ª; las
  migraciones 14 y 15 quedan sin efecto para esas columnas y producción nunca las tendrá). Lo que
  hay: `pacientes.origenHuella` guarda la huella de la plantilla la última vez que la copia se
  puso al día; al abrir la ficha del paciente del caso (`sincronizarCopiaSiHaceFalta`, en
  `pacientes/[id]/page.tsx`) se compara y, si la plantilla ha cambiado, se vuelca ahí mismo con
  `actualizarCopia` (+ planes/planificación como «Del profesor» si «compartir» está encendido). Las
  mediciones y consultas copiadas recuerdan de cuál vienen (`origenId`) y se actualizan o quitan
  con la plantilla; las que añadió el alumno no se tocan. Sin botón: el alumno lo ve al recargar.
  La ficha del profesor solo dice cuántos alumnos ya lo han empezado.
- **La planificación del alumno, tal cual** (3 sep 2026, Guillermo: "ningún resumen, tiene que
  verlo tal cual"): la corrección pinta la MISMA pestaña de planificación del paciente
  (`PlanificacionPorDefectoTab`) con los datos de la foto (paciente con sexo/fecha, medidas y
  anamnesis van ahora en el snapshot), dentro de un `<div inert>` para que nada se pueda pulsar ni
  guardar. La pestaña no llama al servidor sola, solo al pulsar, así que bloqueada es segura.

- **Planes y planificación compartidos, «Del profesor»** (3 sep 2026, Guillermo: "sale como
  compartido por profesor, como si fuera una parte, y no como la planificación por defecto o ya
  activada"). `planes_alimenticios` y `planificaciones` llevan `origenId` + `origenHuella`
  (migración `add-origen-planes`, la 16ª). Al copiarlos se marcan; la ficha del alumno los etiqueta
  «Del profesor» (cabecera y lista del plan, tarjeta de planes, pestañas de planificación) y el
  profesor ve «compartido por ti» al corregir. Con «compartir» encendido, la sincronización al abrir la
  ficha los manda también a quien ya tiene su copia: lo nuevo llega APARTE (sin robarle el plan actual ni la
  planificación por defecto). `copiarPlanesYPlanificaciones` es la única función que lo hace, tanto
  al empezar el caso como al sincronizar; con `marcarOrigen: false` (duplicar un caso el propio
  profesor) no marca nada.
- **Lo compartido es de SOLO LECTURA para el alumno** (3 sep 2026, Guillermo: "no se puede
  editar ni la planificación ni el plan del profesor; lo tienen como base a partir del cual se
  crean lo suyo"). Así lo del profesor se puede actualizar siempre sin pisar nada. En la interfaz:
  la pestaña del plan y `/dietas/[id]` pintan `PlanVisual` en `readOnly` con un aviso que dice cómo
  trabajar sobre él («Nuevo plan» + «Traer de otro plan»); `/dietas/[id]/editar` devuelve a la
  vista; la pestaña de planificación va `inert` por secciones, sin menú ⋮, con aviso («Crear
  planificación» crea la suya a partir de esta). En el servidor: las 29 mutaciones de `planes.ts`
  pasan por `asegurar*Editable` (plan / día / comida / ítem / alternativa → `plan.origenId`), y los
  UPDATE/DELETE de `planificaciones.ts` exigen `"origenId" IS NULL`.
- **Aviso de cambios sin guardar** en el horario del paciente (`useCambiosSinGuardar`, sacado de
  la planificación), para todos los usuarios: al irse a otra pestaña o al menú pregunta guardar /
  salir sin guardar / seguir. Y el botón Guardar del horario ya desaparece tras guardar.

- **La nota es de 0 a 10** (Guillermo, 3 sep 2026, confirmado): con decimales, y se puede corregir
  solo con comentario. No hay «apto / no apto». Cerrada la última duda de producto de la fase.

- **El alumno lo es hasta su 31 de agosto** (4 sep 2026, Guillermo): archivar o cerrar la clase a
  mitad de curso, o que caduque la licencia, NO le echa del aula: entra normal y el aula le dice
  que ahora mismo no está en ninguna clase (la ve entre las anteriores). Si se desarchiva, la vuelve
  a tener y las plazas se vuelven a usar (`archivarClase(false)` además devuelve el rol a quien
  hubiera pasado a cuenta normal). Solo pasado el 31 de agosto que le toca (`finDeAnioEscolar`
  desde su alta más reciente, o desde que se creó la cuenta si no tiene matrículas) y sin clase
  viva, deja de ser alumno y ve el aviso una vez (`revisarCursoDelAlumno.sigueSiendoAlumno`).
  Cuando haya pago, ahí es donde el alumno pasaría a pagar por la parte profesional.
- **«Eliminar» la clase** (junto a Archivar, en rojo, con confirmación): borra la clase con sus
  matrículas, asignaciones, entregas e invitaciones (cascada); las plazas vuelven a la bolsa; los
  alumnos conservan cuenta y pacientes. No se puede deshacer.
- **Enlace de clase con sesión abierta**: en vez del formulario de crear cuenta, «Ya estás dentro
  con la cuenta X» + un botón «Apuntarme a la clase con esta cuenta» (`apuntarmeConMiCuenta`:
  mismas condiciones que el alta normal; un profesor no puede apuntarse) y «No soy yo: cerrar
  sesión». Los dominios de la licencia siguen siendo solo un aviso, nunca bloquean (confirmado).

### Lo que salió al repasarlo entero en el navegador (6 sep 2026)

Un recorrido nuevo a clics del ciclo de vida de la clase
(`probar-ciclo-clase-navegador.ts`, 33 comprobaciones: crearla con sus dos fechas, abrir su
enlace, archivar, desarchivar, apuntarse con la sesión abierta y eliminarla) sacó tres cosas:

- **Al profesor se le ofrecía apuntarse a su propia clase.** `apuntarmeConMiCuenta` lo rechaza en
  el servidor, pero la página le enseñaba el botón igual: habría pulsado y le habría saltado un
  error. Ahora `/clase/[token]` mira `rolDocente` y, si es profesor, le dice «Estás dentro como
  profesor · este enlace es para que se apunten tus alumnos» con «Ir a mis clases» y la salida de
  cerrar sesión (`CerrarSesionParaOtraCuenta`, sacado del componente del alumno para reutilizarlo).
- **Confirmar el borrado iba con el botón verde de siempre**, como cualquier otra confirmación;
  para algo irreversible invita a pulsarlo. Ahora el `ConfirmModal` de Eliminar va `destructive`.
- **«Se borra la clase, su 1 alumno matriculado…»**: el singular del plural ICU llevaba el número.
  Arreglado en es y pt.

`probar-material-clase` daba por hecho el ciclo viejo (retirar el acceso echaba al alumno del
tirón). Adaptada: su alta pasa a ser del curso anterior para llegar al fin del ciclo. El
comprobador de migraciones no listaba la 18ª: ahora comprueba `add-fechas-curso` y además que la
columna `curso` haya desaparecido de `clases` y `licencias_docentes`.

### Las tres salidas de un profesor (Guillermo, 6 sep 2026)

Al preguntar si un profesor podía estar en dos universidades salió lo de al lado: **cómo se sale**.
Son tres cosas distintas y conviene no mezclarlas.

| Qué | Quién | Qué pasa |
|---|---|---|
| **Salir de una clase** | él mismo | Deja esa asignatura. Sigue siendo profesor de su facultad. |
| **Salir de la universidad** | él mismo o administración | Libera la plaza de profesor y pierde el acceso a las clases de esa facultad, pero **sigue siendo docente**: se le puede asignar a otra. |
| **Dejar de ser docente** | él mismo o administración | Vuelve a su cuenta de nutricionista, con sus pacientes intactos. |

Lo que lo sostiene:

- **Una clase es de una universidad**, así que solo la lleva quien está en ELLA ahora mismo:
  `claseQueLleva(profesorId, licenciaId)` (`src/lib/docencia.ts`) lleva el filtro dentro, y sin
  universidad devuelve un `IN ()` vacío — ninguna clase. Los doce sitios que la usaban pasan ahora
  la licencia, y TypeScript obliga: no se puede olvidar en uno y abrir un agujero.
- **Nada se borra.** `sacarDeLaUniversidad` (`src/lib/docencia-salida.ts`) es el único camino, lo
  use el profesor o administración: las clases que llevan otros **pasan a ellos**, las que se
  quedan sin nadie se **archivan** con él todavía como creador — que es lo que permite
  recuperarlas tal cual si vuelve a esa universidad. `quitarRolDocente` pasa por ahí también, así
  que ya no archiva de golpe clases que otro profesor sigue dando.
- **Entre compañeros nadie echa a nadie** («no lo veo tanto»): sacar a otro es cosa de quien creó
  la clase; cada uno se va por su cuenta con «Salir de esta clase». Al **único** profesor de una
  clase no se le ofrece salir —se quedaría sin nadie, con los alumnos dentro—: se le dice que meta
  antes a otro o que la archive.
- **Un docente sin universidad se puede meter en otra**, que es lo que hace útil todo lo anterior:
  `buscarDietistasParaDocencia` ya no filtra solo `rolDocente: null`, también acepta
  `PROFESOR` con `licenciaDocenteId: null`, y la lista lo dice («Ya es profesor, sin universidad»).
  Sin esto, quien salía de una facultad se quedaba en un limbo del que no había forma de sacarle.

Sin migración: todo sale de columnas que ya existían.

Mirando las capturas de la prueba (`probar-salidas-profesor.ts`, 33 comprobaciones, deja las
pantallas en `/tmp/annonia-salidas`) salieron dos cosas más:

- **Cualquier profesor de la clase podía eliminarla**, aunque no la hubiese creado — y eliminar se
  lleva matrículas, casos asignados y entregas, sin vuelta atrás. Ahora `eliminarClase` exige ser
  el creador y el botón solo se le enseña a él; a los demás les queda archivar, que no borra nada.
- **El panel sin universidad ofrecía «Crear mi primera clase»**, que `crearClase` rechaza por no
  haber licencia: otro botón que fallaba al pulsarlo. Fuera, con un texto que explica que sus casos
  sí puede seguir preparándolos.

Pendiente, aparcado por Guillermo: **borrar solas las clases archivadas que nadie use** desde hace
mucho. Hasta entonces se quedan, que es justo lo que permite recuperarlas.

### El guion entero, recorrido a clics (6 sep 2026)

`probar-guion-completo.ts` hace los **32 pasos** del guion que va a seguir Guillermo, en su orden y
con su numeración, con cuentas nuevas creadas para la ocasión (una universidad, dos profesoras y
dos alumnas: una que se apunta desde el enlace sin tener cuenta y otra que ya la tenía).
**116 comprobaciones**, mirando en cada paso lo que se ve Y lo que queda en la base; capturas en
`/tmp/annonia-guion`. Cubre: la licencia en administración, crear y editar la clase con sus fechas,
el alta por correo con dominios que solo avisan, el enlace en sus tres situaciones (sin sesión, con
la del alumno y con la del profesor), el caso con su paciente plantilla, compartir o no la
solución, la copia del alumno y su puesta al día sola, el aviso de cambios sin guardar, la entrega
congelada con su PDF, deshacerla y reentregar, la corrección con nota decimal, y archivar,
desarchivar, cerrar curso y eliminar.

Lo que salió al recorrerlo:

- **El aula no avisaba de que ya te habían corregido**: el alumno leía «1 caso» y solo se enteraba
  entrando en la clase. Ahora dice «1 caso · 1 corregido», igual que ya decía «1 por entregar».
- **La nota no se le enseña al alumno hasta que el profesor enciende «Que el alumno vea la nota y
  el comentario»** (lo decidido el 27 ago 2026). Funciona bien; lo que estaba mal era el guion, que
  daba por hecho que la vería al momento.
- Tres sustos que **no** eran bugs y conviene no volver a investigar: la fecha de fin de curso
  parecía quedar en 30 de agosto (es que `pg` lee la columna `timestamp` como hora local y Prisma
  —lo que usa la aplicación— en UTC: en la app está bien); el segundo profesor parecía no ver la
  clase (era el nombre editado en la prueba); y el plan del profesor parecía desaparecer al crear
  el alumno el suyo (están los dos, en el desplegable de planes).

### Que la base no reviente: qué se guarda y qué se borra (6 sep 2026)

Los números, medidos, no estimados: **un PDF de entregable pesa ~165 KB**. Una facultad de 300
alumnos con 4 casos deja unas 1.200 entregas → **~240 MB solo en PDFs**. La base de **producción
entera ocupa hoy 120 MB** (de los 500 del plan), y su tabla más gorda, `alimentos_en_comida`, son
46 MB. O sea: **una sola universidad la duplicaría**. Guillermo, el 6 sep 2026: «no se va a poder
mantener siempre todos los archivos ahí».

`scripts/limpiar-docencia.ts` (**simula por defecto**; borra con `--ejecutar`):

| Qué se borra | Cuándo |
|---|---|
| El **PDF** del entregable | 30 días después de corregir (`--dias=N` lo cambia) |
| El **PDF y la foto del trabajo** | Cuando el curso de la clase ha terminado — en la práctica, cada 31 de agosto |
| Invitaciones **sin usar** | 90 días después de caducar |

No se toca nunca: **la nota, el comentario, las fechas y el nombre de lo que entregó**. El
expediente se queda entero; lo que se va es el peso. Y para que borrar no deje botones rotos, la
pantalla mira `entregableBytes`: si es NULL, dice «el PDF ya no se guarda» en vez de ofrecer una
descarga que daría 404 — en la vista del profesor, en el aula del alumno y en el panel de su caso.

Comprobado con `probar-limpieza-docencia.ts` (14 comprobaciones): monta cuatro entregas de 200 KB,
las envejece y verifica una por una qué se fue y qué se quedó.

**Lo que NO se limpia, y hay que tener en el radar**: los **pacientes de prácticas de los alumnos**.
Cada alumno que empieza un caso se crea un paciente con su plan, y eso alimenta
`alimentos_en_comida`, que ya es la tabla más grande. 300 alumnos × 4 casos = 1.200 planes por
curso. No se tocan porque son *su* trabajo y su cuenta se queda gratis de por vida
([[project_alumnos_gratis_de_por_vida]]), pero es lo que más va a crecer y está sin decidir.

Las **notificaciones** están controladas: 986 filas y 792 KB en producción, con su propia limpieza.

### La revisión del código (7 sep 2026)

Repasando el módulo entero salieron tres cosas, todas del mismo sitio: **la app prometía que «todos
los que estén aquí ven los mismos alumnos y el mismo trabajo» y no era verdad**.

- El **adjunto no podía corregir**: `corregirEntrega` y `getTrabajoDeEntrega` exigían ser el autor
  del caso, no llevar la clase. Veía las entregas listadas en su clase y, al abrir una, «no
  encontrado».
- **Ni siquiera tenía puerta**: `getCaso` y `getAsignacionesDeCaso` filtraban por autor, así que su
  ficha decía «Sin asignar todavía». Los dos enlaces del caso desde la clase le llevaban a sitios
  que no podía abrir.
- `contarAlumnosQueEmpezaron` era un **export de un fichero `"use server"` sin comprobar sesión**:
  cualquiera con un id podía preguntar cuántos alumnos habían empezado ese caso.

Cómo queda: quien lleva la clase **ve el caso en solo lectura y corrige a sus alumnos**; el caso, su
consigna y su paciente plantilla siguen siendo de quien los hizo, y la ficha se lo dice («Este caso
lo ha hecho X»). Solo ve **sus** clases, no las de otros profesores del mismo caso. Y el permiso
sale de llevar la clase: en cuanto se le saca, deja de abrirse — comprobado en los dos sentidos
(`probar-guion-completo`, 126 comprobaciones).

### El entregable no se guarda: entregar cierra el caso (7 sep 2026)

Idea de Guillermo, y resuelve el problema de espacio de raíz: **en vez de guardar el PDF, se genera
cuando alguien lo pide**. Para que salga idéntico al que entregó el alumno, **entregar cierra el
caso**: mientras la entrega esté viva, no puede tocar nada de ese paciente.

| Antes | Ahora |
|---|---|
| 165 KB de PDF guardados por entrega | **0 bytes** |
| ~240 MB por facultad y curso | ~1,2 MB (solo la foto del trabajo, 1 KB por entrega) |

Las piezas:

- **`bloqueoPorEntrega`** (`planes.ts`), al lado del que ya había para lo del profesor: un plan de
  un paciente con entrega viva no se toca. Los cinco `asegurar*Editable` pasan por él, así que
  cubre las 29 mutaciones de una vez.
- **`generarPdfDeEntrega`** monta el PDF con los ajustes del ALUMNO (su tema, su logo): por eso
  `getPlanPDFData` se partió en `montarDatosPdf` + `planCompleto(planId, dietistaId)`, sin cambiar
  nada de lo que ya usaba la pestaña Entregables. Las secciones que eligió al entregar viajan
  dentro de la foto.
- **`/api/entregas/[id]/pdf`** lo genera al vuelo. El permiso sigue igual: el alumno y los
  profesores del caso o de la clase.
- **Se quitó `deshacerEntrega` entera**, no solo su botón: era un export de un fichero
  `"use server"`, o sea un endpoint, y dejándolo el candado se saltaba desde el navegador.
  Reabrir es ahora del profesor (**`reabrirEntrega`**), avisa al alumno y se lleva la corrección.
- El alumno lo sabe **antes** de pulsar: aviso en ámbar en el cuadro de entregar.

Y lo que pidió del mismo tirón:

- **Un botón para enseñar las notas de toda la clase de golpe** (`publicarNotasDeLaClase`): se
  corrige a ritmo y, cuando están todas, un clic y cada alumno ve la suya con su aviso.
- **Los pacientes de prácticas se van con el alumno** (regla 4 de `limpiar-docencia`): cuando deja
  de ser alumno —pasado su 31 de agosto— se borran los pacientes nacidos de un caso. Nunca los
  suyos propios, y su cuenta no se toca. Es lo que más iba a crecer después de los PDF.

### Lo que queda de la fase 3

- Repasar el menú del alumno cuando se vea el flujo con gente de verdad (Mensajes, Pagos).
- **Un profesor en dos universidades a la vez** (Guillermo, 6 sep 2026: «apúntalo para más
  adelante»). Hoy no se puede: `Dietista.licenciaDocenteId` es un campo, no una lista, y el
  buscador de administración solo enseña a quien no tiene rol docente (`buscarDietistasParaDocencia`
  filtra `rolDocente: null`, y `asignarProfesorLicencia` lo rechaza además con `yaTieneRolDocente`).
  Moverlo de facultad sí se puede: «Quitar el rol» en la suya —sus clases se archivan, no se
  borran— y asignarlo en la nueva. Estar en las dos pide una tabla profesor–licencia (como
  `profesores_clase` para las clases) y repasar el conteo de plazas de cada licencia, el selector
  de espacio y la pantalla de administración. Caso real: el asociado que da clase en dos sitios.
- Producción: aplicar las 18 migraciones en orden cuando Guillermo pida el deploy, y comprobar con
  `comprobar-migraciones-docentes` (DB=prod), que ya incluye `add-fechas-curso` y verifica además
  que la columna `curso` ha desaparecido de `clases` y `licencias_docentes`.

---

# FASE 1 — El rol existe y se entra por él

Estado: **FASE 1 TERMINADA** (27 ago 2026), auditoría incluida.

Verificación: `npx tsc --noEmit` limpio, `npx next build` con Node 22 limpio, y **43 comprobaciones
automáticas** que cargan las páginas por HTTP contra la base de desarrollo
(`DB=dev npx tsx scripts/probar-modulo-docente.ts`, con `npm run dev:desarrollo` levantado).

## Bloque A · Base de datos y esquema (1-14)

1. [x] Crear rama `feature/cuenta-profesor` desde `main`.
2. [x] Escribir `scripts/add-modulo-docente.ts` con `import "./_guard"` como primera línea.
3. [x] Crear el tipo enum `RolDocente` con los **dos** valores (`PROFESOR`, `ALUMNO`) de una vez.
4. [x] Envolver el `CREATE TYPE` en un `DO $$ ... IF NOT EXISTS` para que se pueda repetir.
5. [x] `CREATE TABLE IF NOT EXISTS licencias_docentes` con institución, dominio, cupos, curso, fechas, activa y notas.
6. [x] `ALTER TABLE public.licencias_docentes ENABLE ROW LEVEL SECURITY` en la misma migración.
7. [x] `ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "rolDocente"` (nullable).
8. [x] `ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "licenciaDocenteId"` (nullable).
9. [x] Clave ajena `dietistas → licencias_docentes` con `ON DELETE SET NULL`, creada solo si no existe.
10. [x] Índice en `dietistas("licenciaDocenteId")`.
11. [x] Resumen al final del script (licencias, dietistas con rol) para saber que ha hecho algo.
12. [x] Ejecutar `DB=dev npx tsx scripts/add-modulo-docente.ts`.
13. [x] Volver a ejecutarlo en dev para comprobar que es **idempotente** (no falla la segunda vez).
14. [x] Comprobar en la base que RLS está activo: `SELECT relrowsecurity FROM pg_class WHERE relname='licencias_docentes'`.

## Bloque B · Prisma (15-22)

15. [x] Añadir `enum RolDocente` a `schema.prisma`.
16. [x] Añadir `model LicenciaDocente` con `@@map("licencias_docentes")`.
17. [x] Añadir `rolDocente`, `licenciaDocenteId` y la relación a `model Dietista`.
18. [x] Añadir `@@index([licenciaDocenteId])` en `Dietista`.
19. [x] Comentar en el esquema por qué el enum nace con los dos valores.
20. [x] `npx prisma generate` con **Node 22** (con Node 20 falla con `ERR_REQUIRE_ESM`).
21. [x] Comprobar que el cliente generado expone `prisma.licenciaDocente`.
22. [x] Comprobar que los nombres de columna del esquema y de la migración coinciden **exactamente** (comillas y mayúsculas).

### ✅ Verificación V1 (23-26)
23. [x] `npx tsc --noEmit` limpio hasta aquí.
24. [x] `npm run db:comparar` para ver el desajuste esperado dev/prod (prod aún sin migrar).
25. [x] Confirmar que ninguna tabla existente ha cambiado (solo columnas nuevas nullables).
26. [x] Confirmar que un dietista normal sigue teniendo `rolDocente = NULL`.

## Bloque C · Acciones de administración (27-46)

27. [x] Crear `src/app/actions/admin-docencia.ts` con `"use server"`.
28. [x] `requireAdmin()` + `redirect("/admin-login")` en **todas** las funciones exportadas.
29. [x] Comprobar además `admin.role !== "admin"` (el rol `creator` solo puede crear cuentas).
30. [x] `normalizarDominio()`: quita la arroba, el protocolo y la ruta; minúsculas.
31. [x] Ampliar `normalizarDominio()` para admitir **lista separada por comas**.
32. [x] `getLicenciasDocentes(busqueda?)` con conteo de profesores y alumnos.
33. [x] Revisar el N+1 de `contarMiembros` por licencia (con pocas licencias es asumible; dejarlo anotado).
34. [x] `getLicenciaDocenteDetalle(id)` con sus miembros.
35. [x] `crearLicenciaDocente()` con validación de institución y cupos.
36. [x] `editarLicenciaDocente()` que **impide bajar el cupo por debajo de lo ya repartido**.
37. [x] `buscarDietistasParaDocencia()` filtrando por `rolDocente: null`.
38. [x] `asignarProfesorLicencia()` con los modos "existente" y "nuevo".
39. [x] Comprobar el cupo de profesores antes de asignar.
40. [x] Reutilizar `crearCuentaNutricionista()` para el modo "nuevo" (trae suscripción, paciente de ejemplo y email).
41. [x] Marcar `fuenteContacto` con la institución para saber de dónde salió la cuenta.
42. [x] `quitarRolDocente()` que deja la cuenta intacta como nutricionista normal.
43. [x] `revalidarDocencia()` tocando `/admin/universidades`, `/admin/dietistas` y `/admin`.
44. [x] Revisar que **todas** las mutaciones llaman a `revalidarDocencia()`.
45. [x] `isNextNavigation(e)` en todos los `catch` (nunca el patrón viejo de `"digest" in error`).
46. [x] Devolver `{ ok, error }` en vez de lanzar excepciones de validación.

### ✅ Verificación V2 (47-52)
47. [x] `npx tsc --noEmit` limpio.
48. [x] Repasar que ninguna acción devuelve objetos de Prisma con tipos no serializables al cliente.
49. [x] Repasar que las fechas que cruzan al cliente se manejan como `Date` en server components.
50. [x] Comprobar que no hay ninguna clave de traducción inventada sin escribir (se verifica en el bloque G).
51. [x] Comprobar el caso "asignar profesor a licencia inexistente".
52. [x] Comprobar el caso "asignar a alguien que ya tiene rol docente".

## Bloque D · Acciones del profesor y cambio de espacio (53-66)

53. [x] Crear `src/lib/docencia.ts` con constantes y funciones puras (sin `"use server"`).
54. [x] `ESPACIO_COOKIE` y el tipo `EspacioActivo`.
55. [x] `cursoActual()` con el corte en septiembre.
56. [x] Comprobar `cursoActual()` con fechas de agosto y de septiembre (el corte es el que se equivoca).
57. [x] `licenciaVigente()`: caducada o desactivada ⇒ no da altas, pero no echa al profesor.
58. [x] `emailDelDominio()` para el aviso (no para bloquear).
59. [x] Adaptar `emailDelDominio()` a la lista de dominios separados por comas.
60. [x] Crear `src/app/actions/docencia.ts` con `getDatosProfesor()`, `esProfesor()`, `requireProfesor()`.
61. [x] `getEspacioActivo()` leyendo la cookie, con "docente" por defecto.
62. [x] `entrarEspacioProfesional()` con cookie **de sesión** (para que al día siguiente aterrice en docente).
63. [x] Crear `src/app/api/espacio/route.ts` para el camino de vuelta al espacio docente.
64. [x] Comprobar que `/api/espacio` no queda excluido por el `matcher` de `src/proxy.ts`.
65. [x] Comprobar que la cookie es `httpOnly` y `sameSite: lax`.
66. [x] Comprobar que quien no es profesor no puede colarse en `/profesor` (lo echa `requireProfesor`).

### ✅ Verificación V3 (67-70)
67. [x] `npx tsc --noEmit` limpio.
68. [x] Revisar que `esProfesor()` no dispara una consulta pesada (se llama en cada carga del panel).
69. [x] Revisar el coste añadido al layout del panel (una consulta más por carga).
70. [x] Comprobar que la cuenta demo (`isDemo`) no rompe nada de esto.

## Bloque E · Interfaz de administración (71-88)

71. [x] `/admin/universidades/page.tsx` — listado con contadores.
72. [x] `/admin/universidades/crear/page.tsx` + formulario.
73. [x] Formulario de alta con institución, dominio, cupos, curso, fecha fin y notas.
74. [x] `/admin/universidades/[id]/page.tsx` — detalle de la licencia.
75. [x] Formulario de edición de la licencia (cupos, fechas, activa).
76. [x] Formulario de asignar profesor con los modos "existente" y "nuevo".
77. [x] Buscador de nutricionistas con resultados y selección.
78. [x] Botón de quitar el rol docente, con confirmación.
79. [x] Lista de miembros separando profesores y alumnos.
80. [x] Aviso visible cuando la licencia está caducada o desactivada.
81. [x] Añadir "Universidades" al menú lateral de admin (`src/components/admin-sidebar.tsx`).
82. [x] Icono coherente con el resto (`GraduationCap`).
83. [x] Comprobar que el rol `creator` no ve la sección nueva.
84. [x] Mostrar el rol docente en la ficha del nutricionista en `/admin/dietistas/[id]`.
85. [x] Comprobar que la contraseña del modo "nuevo" se puede ver (patrón de crear centro).
86. [x] Estados vacíos escritos (sin licencias, sin profesores).
87. [x] Comprobar el comportamiento en móvil (sin cajas: `lg:` para bordes y fondos).
88. [x] Comprobar el modo oscuro en todo lo nuevo.

### ✅ Verificación V4 (89-92)
89. [x] `npx tsc --noEmit` limpio.
90. [x] Repasar que ningún componente cliente importa cosas de servidor.
91. [x] Repasar los `"use client"` de los formularios.
92. [x] Comprobar que los `toast` usan `sonner` como el resto del proyecto.

## Bloque F · Espacio del profesor (93-104)

93. [x] `(dashboard)/profesor/page.tsx` con cabecera, contadores y bolsa.
94. [x] Barra de progreso de la bolsa de alumnos.
95. [x] Aviso ámbar cuando la licencia ha cerrado el curso.
96. [x] Bloque honesto de "en preparación" para no fingir botones que no existen.
97. [x] Botón «Acceder a mi cuenta profesional».
98. [x] Comprobar el caso "profesor sin licencia asignada" (no debe reventar).
99. [x] Comprobar el caso "licencia con `maxAlumnos = 0`" (división por cero en el porcentaje).
100. [x] Formatear la fecha con el locale activo, no con `"es-ES"` fijo.
101. [x] Comprobar el texto en portugués.
102. [x] Revisar el título de la pestaña (`metadata`).
103. [x] Comprobar que se ve bien en móvil.
104. [x] Comprobar que el enlace de vuelta es visible desde el espacio profesional.

## Bloque G · Menú y aterrizaje (105-114)

105. [x] Sección "Docencia" en el menú lateral solo para profesores.
106. [x] El enlace cambia según el espacio activo (`/profesor` o `/api/espacio?a=docente`).
107. [x] Pasar `esProfesor` y `espacioActivo` desde el layout al menú.
108. [x] Aterrizaje en `dashboard/page.tsx`: profesor + espacio docente ⇒ `/profesor`.
109. [x] Comprobar que el aterrizaje **no** afecta a los nutricionistas normales.
110. [x] Comprobar que no se crea un bucle de redirecciones entre `/dashboard` y `/profesor`.
111. [x] Comprobar que el enlace del menú no se marca activo cuando no toca.
112. [x] Comprobar el menú plegado y el menú móvil.
113. [x] Comprobar que el tour del panel no se rompe con la sección nueva.
114. [x] Comprobar que la cuenta demo no ve la sección.

### ✅ Verificación V5 (115-118)
115. [x] `npx tsc --noEmit` limpio.
116. [x] Revisar que no se ha tocado nada del reparto por comidas (#78) ni de la pestaña Resumen.
117. [x] `git status` con rutas explícitas: nada fuera de lo previsto.
118. [x] Revisar que no se ha modificado ningún fichero del colaborador.

## Bloque H · Traducciones (119-128)

119. [x] Crear `src/messages/es/docencia.json`.
120. [x] Crear `src/messages/pt/docencia.json` con **las mismas claves**.
121. [x] Registrar `docencia` en `src/i18n/request.ts` (import y lista de namespaces).
122. [x] Añadir el bloque `universidades` a `admin.json` en es y pt.
123. [x] Añadir `sidebar.nav.universidades` en es y pt.
124. [x] Añadir `nav.docencia` y `navItems.espacioDocente` a `dashboard.json` en es y pt.
125. [x] Añadir el bloque `docencia` a `validation.json` en es y pt.
126. [x] Script de comprobación: todas las claves usadas existen en **los dos** idiomas.
127. [x] Reiniciar el servidor de desarrollo (las traducciones no recargan en caliente).
128. [x] Cargar cada pantalla nueva en portugués.

### ✅ Verificación V6 (129-131)
129. [x] `npx tsc --noEmit` limpio.
130. [x] Ninguna clave huérfana (definida y no usada) ni inventada (usada y no definida).
131. [x] Los textos en portugués no son español copiado.

## Bloque I · Pruebas a mano en desarrollo (132-146)

132. [x] Arrancar `npm run dev:desarrollo` (puerto 3001, base de desarrollo).
133. [x] Entrar en `/admin` y ver la sección "Universidades".
134. [x] Crear la licencia "Universidad Pablo de Olavide, 3 profesores, 300 alumnos".
135. [x] Comprobar que aparece en el listado con `0/3` y `0/300`.
136. [x] Asignar como profesor a un nutricionista **existente** de desarrollo.
137. [x] Comprobar que ya no aparece en el buscador (tiene rol).
138. [x] Crear un profesor **nuevo** desde cero y comprobar que se crea la cuenta completa.
139. [x] Comprobar que llega el correo de bienvenida (o que se registra el intento en el log).
140. [x] Intentar asignar un cuarto profesor y ver que lo impide por cupo.
141. [x] Intentar bajar el cupo a 1 y ver que lo impide.
142. [x] Entrar con la cuenta del profesor y comprobar que aterriza en `/profesor`.
143. [x] Pulsar «Acceder a mi cuenta profesional» y comprobar que llega al panel normal.
144. [x] Volver con el enlace del menú y comprobar que vuelve al espacio docente.
145. [x] Cerrar sesión, volver a entrar y comprobar que aterriza otra vez en el espacio docente.
146. [x] Entrar con un nutricionista normal y comprobar que **no ve nada** de esto.

## Bloque J · Auditoría completa de la Fase 1 (147-166)

147. [x] Releer entero cada fichero nuevo, de arriba abajo.
148. [x] Releer cada `diff` de los ficheros modificados.
149. [x] Seguridad: ninguna acción de admin sin `requireAdmin`.
150. [x] Seguridad: ninguna acción de profesor sin comprobar `rolDocente`.
151. [x] Seguridad: la cookie de espacio **no** concede permisos.
152. [x] Seguridad: RLS activo en la tabla nueva.
153. [x] Datos: ¿qué pasa si se borra una licencia con profesores dentro? (`SET NULL`, verificarlo).
154. [x] Datos: ¿qué pasa si se borra un dietista que es profesor?
155. [x] Datos: coherencia entre `rolDocente` y `licenciaDocenteId` (¿puede haber rol sin licencia?).
156. [x] Casos límite: licencia sin fecha de fin, con fecha pasada, desactivada.
157. [x] Casos límite: cupos a 0, cupos enormes, texto larguísimo en institución.
158. [x] Casos límite: dominio escrito como `@ua.es`, `UA.ES`, `https://ua.es/`.
159. [x] Repaso de la guía de bugs recurrentes, punto por punto.
160. [x] Repaso de los patrones de fallo de flujo y UX (¿queda algo escondido?).
161. [x] Descubribilidad: ¿un profesor entiende dónde está y cómo se cambia de espacio?
162. [x] Implicaciones cruzadas: ¿qué otras pantallas deberían enterarse del rol?
163. [x] Rendimiento: consultas añadidas al layout del panel.
164. [x] `npx tsc --noEmit` final.
165. [x] `npx next build` con Node 22 (el error de compilación no aparece en `tsc`).
166. [x] Commits pequeños con rutas explícitas (`git add <ruta>`, nunca `-A` ni `.`).

## Pendiente al cerrar la fase

- Migración **sin aplicar en producción** (se aplica al desplegar, con `npm run db:comparar` antes).
- Anotar en `aportaciones.md` lo que quede decidido durante la fase.

## Lo que apareció por el camino (Fase 1)

Cosas que no estaban previstas y se han resuelto o descubierto durante la fase:

- **El aterrizaje llegaba tarde.** Redirigir desde `/dashboard` funciona, pero cuando la respuesta ya
  ha empezado a enviarse Next no puede devolver una redirección de verdad y la resuelve con un
  `<meta http-equiv="refresh" content="1;url=/profesor">`: el profesor veía el panel de nutricionista
  durante un segundo. Arreglado decidiendo el destino **en el login** (contraseña y Google), antes de
  renderizar nada. La comprobación de `/dashboard` se queda como red de seguridad.
- **Dos claves de traducción que faltaban y reventaban la pantalla**, ambas anteriores a este trabajo:
  `validation.admin.camposObligatorios` (la usa también `crearCentroAdmin`) y `common.demo.cta` en
  portugués (el banner del modo demo). Corregidas.
- **`npm run dev:desarrollo` no limpiaba `.next-dev`** (el `predev` solo limpia `.next`), y la caché
  vieja de Turbopack llegaba a servir CSS corrupto y tumbar las páginas con un 500. Ahora lo limpia.
- **`.next-dev` no estaba en `.gitignore`.**
- Las carpetas que empiezan por `_` no generan ruta en el App Router (útil saberlo para diagnósticos).
- La contraseña de `dev@annonia.dev` que teníamos anotada ya no vale; el script de pruebas crea y
  borra su propia cuenta desechable en vez de depender de ella.

## Auditoría de la Fase 1 (bloque J)

Seis revisores en paralelo con lentes distintas (seguridad, integridad de datos, traducciones,
convenciones, experiencia de uso y regresiones), y **cada hallazgo verificado por otro agente cuyo
trabajo era refutarlo**. De 33 hallazgos en bruto, 4 defectos reales; los dos descartados lo fueron
con argumentos comprobados en el código. Los cuatro, arreglados:

| | Qué era | Gravedad |
|---|---|---|
| D1 | El enlace del menú al espacio docente era un GET, y **el prefetch de Next lo disparaba solo**: la cuenta profesional se cerraba sola. Solo se manifestaba en producción. | Alto |
| D2 | «Dashboard» era un botón muerto para el profesor: enseñaba el panel un instante y le expulsaba. | Alto |
| D3 | **Redirección abierta** en `/auth/callback`: `?next=@evil.com` sacaba al usuario del dominio. Anterior a esta rama. | Medio |
| D4 | El profesor creado desde una licencia desaparecía del filtro «Universidad» de `/admin/dietistas`. | Medio |

D1 llevó a **quitar la cookie de espacio y el endpoint entero**: el aterrizaje lo decide el login, así
que la cookie sobraba, y ahora ninguna dirección del menú tiene efectos secundarios. Los patrones de
D1 y D3 están anotados en la guía de bugs recurrentes.

## Fase 1 — pendiente al cerrar

- La migración está aplicada **solo en desarrollo**. En producción se aplica al desplegar, comprobando
  antes con `npm run db:comparar`.
- Anotar en `aportaciones.md` las decisiones cerradas durante esta fase (dominio que solo avisa, sin
  aprobación manual en el link, la cuenta de alumno no se recicla en cuenta normal).
