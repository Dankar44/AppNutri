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

# FASE 1 — El rol existe y se entra por él

Estado: **bloques A a I terminados y verificados** (27 ago 2026). Queda el bloque J, la auditoría.

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

147. [ ] Releer entero cada fichero nuevo, de arriba abajo.
148. [ ] Releer cada `diff` de los ficheros modificados.
149. [ ] Seguridad: ninguna acción de admin sin `requireAdmin`.
150. [ ] Seguridad: ninguna acción de profesor sin comprobar `rolDocente`.
151. [ ] Seguridad: la cookie de espacio **no** concede permisos.
152. [ ] Seguridad: RLS activo en la tabla nueva.
153. [ ] Datos: ¿qué pasa si se borra una licencia con profesores dentro? (`SET NULL`, verificarlo).
154. [ ] Datos: ¿qué pasa si se borra un dietista que es profesor?
155. [ ] Datos: coherencia entre `rolDocente` y `licenciaDocenteId` (¿puede haber rol sin licencia?).
156. [ ] Casos límite: licencia sin fecha de fin, con fecha pasada, desactivada.
157. [ ] Casos límite: cupos a 0, cupos enormes, texto larguísimo en institución.
158. [ ] Casos límite: dominio escrito como `@ua.es`, `UA.ES`, `https://ua.es/`.
159. [ ] Repaso de la guía de bugs recurrentes, punto por punto.
160. [ ] Repaso de los patrones de fallo de flujo y UX (¿queda algo escondido?).
161. [ ] Descubribilidad: ¿un profesor entiende dónde está y cómo se cambia de espacio?
162. [ ] Implicaciones cruzadas: ¿qué otras pantallas deberían enterarse del rol?
163. [ ] Rendimiento: consultas añadidas al layout del panel.
164. [ ] `npx tsc --noEmit` final.
165. [ ] `npx next build` con Node 22 (el error de compilación no aparece en `tsc`).
166. [ ] Commits pequeños con rutas explícitas (`git add <ruta>`, nunca `-A` ni `.`).

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

## Fase 1 — pendiente al cerrar

- La migración está aplicada **solo en desarrollo**. En producción se aplica al desplegar, comprobando
  antes con `npm run db:comparar`.
- Anotar en `aportaciones.md` las decisiones cerradas durante esta fase (dominio que solo avisa, sin
  aprobación manual en el link, la cuenta de alumno no se recicla en cuenta normal).
