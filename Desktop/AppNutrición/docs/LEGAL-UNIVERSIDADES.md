# Presentar Annonia a una universidad: lo que preguntará su departamento legal

Preparación de la conversación con el DPO o el servicio jurídico de una facultad (#79). **Esto no
es un dictamen jurídico**: es el inventario técnico veraz de lo que hace la aplicación, para que
un abogado lo convierta en contrato y para poder responder en una reunión sin improvisar.

Todo lo que aparece marcado como **verificado** se ha comprobado en el código o en la base de
producción el 8 de septiembre de 2026, y se dice dónde, para poder repetirlo cuando cambie.

---

## 1. La respuesta corta, si solo hay tiempo para una

En un uso docente, **los casos clínicos no son personas reales**. El profesor inventa el caso y
cada alumno trabaja sobre una copia suya. Si la facultad se compromete a usar casos ficticios —y
es como está pensado—, el tratamiento de datos de salud reales desaparece del problema, y lo que
queda son los datos de los alumnos: nombre, apellidos y correo. Eso es lo primero que hay que
decir, porque cambia por completo la conversación.

Lo segundo: **los servidores están en la Unión Europea** (Irlanda). La única salida de datos fuera
de la UE es la generación de dietas con IA, y ahí **no viaja ningún dato identificativo**: ni
nombre, ni apellidos, ni correo, ni fecha de nacimiento.

---

## 2. Quién es quién

| | Papel | Qué significa |
|---|---|---|
| La universidad / el profesor | **Responsable del tratamiento** | Decide qué datos se meten y para qué |
| Annonia | **Encargado del tratamiento** | Solo trata los datos para prestar el servicio |
| El alumno | Interesado y, a la vez, usuario | Sus datos de cuenta los trata Annonia |
| El paciente del caso | No existe como persona real | Es un caso inventado por el profesor |

**Falta:** un contrato de encargo de tratamiento (DPA) redactado y listo para firmar. Es el
documento que pedirán y hoy no existe. Es trabajo de abogado, no de programación.

## 3. Qué datos hay realmente

**De los alumnos:** nombre, apellidos, correo electrónico, contraseña (nunca en claro), y su
actividad en la plataforma. La cuenta la crea el propio alumno desde la invitación; la universidad
solo aporta el correo.

**De los casos clínicos:** los que el profesor invente — sexo, peso, altura, patologías, alergias.
Formalmente son datos de salud, pero **de una persona que no existe**.

**De los pacientes de prácticas de cada alumno:** copias del caso del profesor. Mismo argumento.

> **Recomendación de uso que conviene dejar por escrito en el contrato:** en clase se usan casos
> ficticios. Si un profesor quisiera usar un caso real anonimizado, es él —no Annonia— quien
> responde de esa anonimización.

## 4. Dónde están los datos

| Dónde | Qué | Región |
|---|---|---|
| Supabase (PostgreSQL + autenticación) | Toda la base de datos | **eu-west-1, Irlanda (UE)** — verificado en la configuración |
| Oracle Cloud | El servidor de la aplicación | **Pendiente de confirmar la región** en la consola de Oracle |

**Tarea pendiente:** confirmar y documentar la región del servidor de Oracle. Si no estuviera en
la UE, hay que decirlo o moverlo antes de la reunión.

## 5. Proveedores que intervienen (subencargados)

| Proveedor | Para qué | Datos que ve | Dónde |
|---|---|---|---|
| Supabase | Base de datos y cuentas | Todos | UE (Irlanda) |
| Oracle Cloud | Servidor de la aplicación | Todos, en tránsito | Por confirmar |
| Resend | Correos (invitaciones, avisos) | Correo y nombre | EE. UU. |
| Groq | Generación de dietas con IA | Ver el punto 6 | EE. UU. |
| Stripe | Pagos | Datos de facturación | EE. UU. / UE |
| Google | Calendario y acceso con Google | Cuenta y citas, si se activa | EE. UU. |

**Hueco detectado:** la política de privacidad publicada menciona Supabase, Google y Stripe, pero
**no menciona Groq, Resend ni Oracle** (verificado en `src/messages/es/legal.json`). Hay que
añadirlos antes de presentarse a una universidad: es de las primeras cosas que un DPO comprueba, y
se ve en dos minutos.

## 6. El punto crítico: la IA

Es lo primero que preguntará un DPO, así que conviene llevar la respuesta exacta.

La generación de dietas usa **Groq, con servidores en Estados Unidos**. Lo que se le envía está
en `src/lib/ai/prompts.ts`, y es literalmente esto (**verificado**):

- Sexo y peso
- El objetivo (perder peso, mantenimiento…) y su detalle, si lo hay
- Alergias, intolerancias y preferencias
- Las instrucciones que escriba el nutricionista
- La tabla de alimentos, que no es un dato personal

**Lo que NO se envía**, y conviene decirlo así de claro: **ni nombre, ni apellidos, ni correo, ni
fecha de nacimiento, ni identificador del paciente**. Tampoco las patologías: están en la ficha,
pero no llegan al prompt. Es decir, lo que sale del país **no permite identificar a nadie por sí
mismo**.

**Los dos cabos sueltos, dichos honestamente:**

1. El detalle del objetivo y las instrucciones del nutricionista son **texto libre**: si alguien
   escribe ahí un nombre, ese nombre viaja. Se puede resolver avisando en la pantalla, o filtrando.
2. **No existe todavía un consentimiento específico de uso de IA** (verificado: no hay ningún
   texto de consentimiento en la aplicación). En un uso docente con casos ficticios el problema es
   menor, pero para la consulta real hace falta (#51).

## 7. Seguridad

- **Row-Level Security en las 34 tablas** de producción, y los roles públicos no tienen ningún
  permiso sobre ninguna tabla. **Verificado** el 8 sep 2026 con `DB=prod npx tsx scripts/comprobar-rls.ts`.
  Conviene repetir esa comprobación antes de la reunión y enseñar la salida: es una prueba, no una
  promesa.
- **HTTPS** en todo el sitio, con certificado de Let's Encrypt renovado automáticamente.
- **Contraseñas**: las gestiona Supabase Auth con hash bcrypt. Annonia nunca las ve ni las guarda.
- **Portal del paciente**: sesión propia con token firmado, separada de la del profesional.
- **Copias de seguridad**: las de Supabase. **Pendiente** documentar cada cuánto y cuánto se
  conservan, que es un dato concreto que preguntarán.

## 8. Derechos de los alumnos y borrado

- Un alumno puede **borrar su cuenta** desde sus ajustes (`eliminarCuenta`, verificado), y con ella
  se van sus datos por borrado en cascada.
- **Al acabar el curso el alumno no pierde su cuenta**: pasa a una cuenta normal y conserva su
  trabajo. Sus **pacientes de prácticas sí se borran** cuando deja de ser alumno, por la limpieza
  automática.
- La limpieza automática también retira las fotos de las entregas de cursos terminados hace más de
  60 días y las invitaciones sin usar de más de 90 días (`src/lib/limpieza-docente.ts`).

**Falta:** un procedimiento escrito para acceso, rectificación, oposición y portabilidad. Hoy se
resolvería a mano, y eso hay que poder contarlo como procedimiento, no como improvisación.

## 9. Lo que falta antes de firmar con una universidad

Por orden de lo que más bloquea:

1. **Contrato de encargo de tratamiento (DPA)** redactado por un abogado. Sin esto no se firma nada.
2. **Añadir Groq, Resend y Oracle a la política de privacidad.** Rápido y visible.
3. **Confirmar la región del servidor de Oracle** y ponerlo por escrito.
4. **Consentimiento específico de uso de IA** (#51), aunque en docencia sea menos crítico.
5. **Registro de actividades de tratamiento** y **base legal** de cada uno.
6. **Procedimiento de brechas de seguridad**: quién avisa, a quién y en cuánto tiempo (72 horas).
7. **Política de menores**: qué pasa si un alumno es menor de edad.
8. **Términos de uso para centros** y modelo de licencia.
9. **Backups**: frecuencia y retención, por escrito.

Los puntos 2, 3 y 9 son de hoy para mañana. El 1, el 5 y el 6 necesitan abogado.
