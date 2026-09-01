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

### Bloque E · Alta de alumnos (69-92)

69. [ ] Reutilizar `invitaciones_docentes` con `rol = 'ALUMNO'` y la clase a la que entra.
70. [ ] Añadir `claseId` a la invitación (hoy solo guarda la licencia).
71. [ ] `invitarAlumnos(claseId, correos[])`: varios de golpe, uno por línea.
72. [ ] Si el correo ya tiene cuenta: se vincula, **no se crea otra** ni se pisa su suscripción.
73. [ ] Si ya está en la clase: no duplicar, avisar.
74. [ ] Consumo de la bolsa: comprobar cupo contando alumnos distintos + invitaciones vivas.
75. [ ] Mensaje claro cuando la bolsa se agota, con cuántas quedan.
76. [ ] Correo de invitación al alumno, con el nombre de la clase y del profesor.
77. [ ] Reenviar y anular, como en profesores.
78. [ ] La página `/invitacion/[token]` ya sirve: comprobar el texto cuando el rol es ALUMNO.
79. [ ] Al aceptar: cuenta creada con `origenCuenta` de clase y matrícula activa.
80. [ ] Link de invitación por clase: `/clase/[token]`.
81. [ ] Abrir y cerrar el link desde la ficha de la clase.
82. [ ] El link respeta el tope de la bolsa.
83. [ ] Aviso (no bloqueo) si el correo no es del dominio de la institución.
84. [ ] Qué ve alguien que abre un link cerrado o de una clase archivada.
85. [ ] Listado de alumnos de la clase, con su estado y su último acceso.
86. [ ] Sacar a un alumno de una clase (sin borrarle la cuenta).
87. [ ] Traducciones es y pt de todo lo anterior.
88. [ ] Probar en el navegador el alta por correo, de principio a fin.
89. [ ] Probar el alta por link, de principio a fin.
90. [ ] Probar el caso "ya tenía cuenta propia" y que conserva lo suyo.
91. [ ] Probar el caso "ya está en la clase".
92. [ ] ✅ `tsc` + baterías + capturas.

### Bloque F · Ciclo del curso (93-112)

93. [ ] `fechaFinCurso` en la clase, con el 31 de agosto por defecto.
94. [ ] Comprobación perezosa: sin cron, se mira al entrar.
95. [ ] Estado de la matrícula: activa o retirada, con sus fechas.
96. [ ] «Cerrar curso» en la clase: retira el acceso a todos.
97. [ ] «Renovar curso»: devuelve el acceso a los que elija el profesor.
98. [ ] Al renovar, el alumno conserva TODO su trabajo.
99. [ ] Devolver el acceso metiendo el correo otra vez (segunda vía, ya acordada).
100. [ ] Pantalla del alumno sin acceso, con su explicación.
101. [ ] Un alumno con suscripción propia NO se bloquea.
102. [ ] Una cuenta nacida de clase no se recicla en cuenta normal.
103. [ ] Al profesor no se le retira nada cuando cierra el curso.
104. [ ] Con la licencia caducada, el profesor no puede dar altas pero sí entrar.
105. [ ] Aviso al profesor de que el curso se cierra pronto.
106. [ ] Traducciones es y pt.
107. [ ] Probar: cerrar curso, entrar como alumno, ver el mensaje.
108. [ ] Probar: renovar y comprobar que vuelve con sus datos.
109. [ ] Probar el caso del alumno con suscripción propia.
110. [ ] Probar el borde de la fecha (el último día cuenta entero).
111. [ ] Capturas de la pantalla de sin acceso.
112. [ ] ✅ `tsc` + baterías.

### Bloque G · Alumnos en administración (113-124)

113. [ ] Sección propia `/admin/alumnos`, no una pestaña de nutricionistas.
114. [ ] Institución, clase y profesor de cada alumno.
115. [ ] Estado del acceso y desde cuándo.
116. [ ] Fecha de alta y de renovación: quién ha renovado este curso y quién no.
117. [ ] Último acceso, para ver quién no ha entrado nunca.
118. [ ] Licencias de la bolsa consumidas de verdad.
119. [ ] Filtros por institución y por estado.
120. [ ] Buscador por correo.
121. [ ] Enlace desde la ficha de la licencia.
122. [ ] Traducciones es y pt.
123. [ ] Capturas y mirarlas.
124. [ ] ✅ `tsc` + baterías.

### Bloque H · Compartir material con la clase (125-136)

125. [ ] Decidir el modelo mirando cómo lo hace el centro (`Empresa`) y reutilizarlo.
126. [ ] Marcar un alimento o receta como compartido con una clase.
127. [ ] El alumno los ve, los usa, **los copia y los modifica** (cada uno con su versión).
128. [ ] Que compartir no sea obligatorio: por defecto, privados.
129. [ ] Deshacer el compartir sin romper lo que el alumno ya copió.
130. [ ] Que el material del profesor no se mezcle con el catálogo global.
131. [ ] Rendimiento: que la lista del alumno no se vuelva lenta.
132. [ ] Traducciones es y pt.
133. [ ] Probar como profesor: compartir y dejar de compartir.
134. [ ] Probar como alumno: ver, usar, copiar y modificar.
135. [ ] Capturas.
136. [ ] ✅ `tsc` + baterías.

### Bloque I · Auditoría de la Fase 2 (137-152)

137. [ ] Releer entero cada fichero nuevo.
138. [ ] Releer cada diff de los modificados.
139. [ ] Seguridad: ningún profesor ve datos de otra clase ni de otra licencia.
140. [ ] Seguridad: ningún alumno ve el trabajo de otro alumno.
141. [ ] Seguridad: los tokens de invitación y de clase, y qué pasa si se filtran.
142. [ ] Datos: qué ocurre al borrar una clase, una licencia o un profesor.
143. [ ] Datos: un alumno en dos clases consume una licencia, no dos.
144. [ ] Casos límite de la bolsa: agotada, ampliada, reducida.
145. [ ] Casos límite del curso: el último día, curso ya cerrado, licencia caducada.
146. [ ] Repaso de la guía de bugs recurrentes, punto por punto.
147. [ ] Descubribilidad: ¿un profesor sabe cómo meter a sus alumnos sin que se lo expliquen?
148. [ ] Implicaciones cruzadas: dónde más tiene que verse cada cosa.
149. [ ] Rendimiento con 200 alumnos de verdad en la base.
150. [ ] `next build` con Node 22.
151. [ ] Auditoría multiagente con verificación adversarial.
152. [ ] Arreglar lo que salga y volver a pasar las baterías.

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
