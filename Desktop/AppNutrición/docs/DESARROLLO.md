# Cómo trabajamos: entornos, base de datos, despliegue y errores que ya nos han costado caro

Este documento recoge el conocimiento acumulado del proyecto: lo que no se ve leyendo el código,
pero que explica por qué las cosas están como están y qué rompe la aplicación en producción.

**Léelo aunque no vayas a desplegar.** Casi todo lo de aquí condiciona *cómo hay que programar*,
no solo cómo se publica.

---

## 1. Entornos y base de datos

### El histórico (por qué hay tanto cuidado con esto)
Durante meses **local y producción compartieron la MISMA base de datos**. No había entorno de
pruebas: trabajar en local tocaba datos reales de nutricionistas y de sus pacientes. De ahí
vienen varias de las cicatrices de este documento.

### Cómo debe ser
- **Desarrollo**: cada persona (o el equipo) usa una base de datos propia, con datos de ejemplo.
  Ahí se puede romper, borrar y migrar sin miedo.
- **Producción**: solo la toca quien despliega. Nunca se apunta a ella desde el entorno de
  trabajo diario.

Si tienes que mirar producción puntualmente, ten un fichero de entorno aparte
(`.env.prod.local`) y cárgalo **solo** para eso, nunca por defecto.

### Migraciones: no hay Prisma Migrate
El esquema se cambia de dos formas, y **las dos hay que hacerlas**:
1. Editar `prisma/schema.prisma` (es la fuente de verdad para el código).
2. Escribir un script en `scripts/` con SQL **no destructivo**
   (`ALTER TABLE … ADD COLUMN IF NOT EXISTS …`) y ejecutarlo con `npx tsx scripts/<nombre>.ts`.

En **desarrollo** basta con `npx prisma db push`, que aplica el esquema entero de golpe.
En **producción** se ejecuta el script, y lo hace quien despliega.

### La regla de oro del orden (esto rompe la app si se hace al revés)
> **Primero la migración, después el código.**

La columna nueva se añade primero (es opcional y no destructiva, así que el código antiguo la
ignora y sigue funcionando). Solo cuando la columna existe se despliega el código que la usa.

Al revés —código nuevo contra base antigua— la aplicación revienta o devuelve datos vacíos.

**Y aunque migres solo en desarrollo, tenlo en cuenta:** ese cambio tendrá que aplicarse también
en producción cuando tu trabajo se publique. Por eso el script de migración **va en el PR**, no
en tu máquina: si no está, quien despliegue no sabrá que hacía falta.

### Toda migración se aplica en LOS DOS entornos

Cuando ejecutes una migración en producción, **ejecútala también en desarrollo**. Es una línea
más:

```bash
DB=prod npx tsx scripts/mi-migracion.ts     # producción
DB=dev  npx tsx scripts/mi-migracion.ts     # desarrollo
```

Si se olvida, pasa esto: el colaborador hace `git pull` y `npx prisma generate`, su cliente
Prisma espera la columna nueva, su base no la tiene, y le salta un `column ... does not exist`
que **parece un fallo suyo y no lo es**. Puede perder una tarde antes de sospechar del entorno.

Para comprobar en cualquier momento si los dos esquemas coinciden:

```bash
npm run db:comparar
```

Solo lee metadatos, no escribe nada. Si hay diferencias, dice cuáles y en qué lado faltan.
Merece la pena pasarlo después de cada migración y antes de pedirle al colaborador que pruebe
algo.

### Cambios de enum: el error silencioso más traicionero
Si añades un valor a un enum de Prisma (por ejemplo una unidad de medida nueva), cualquier
entorno que no haya regenerado su cliente Prisma **reventará** al leer una fila con ese valor:

```
Value 'X' not found in enum 'UnidadMedida'
```

Tras hacer `pull` de cambios que tocan `schema.prisma`: **`npx prisma generate`** (Node 22).

---

### 1.5 Los scripts de `scripts/`: cómo se usan sin destrozar nada

En `scripts/` hay migraciones y semillas. **Ninguno tiene destino por defecto**: hay que decir
siempre a qué base de datos van, y el propio script lo imprime antes de hacer nada.

```bash
DB=dev  npx tsx scripts/<script>.ts     # desarrollo (datos de prueba, se puede romper)
DB=prod npx tsx scripts/<script>.ts     # PRODUCCIÓN (datos reales)
```

Si te olvidas del `DB=`, el script **aborta** y te lo explica. Si pides `dev` pero la
configuración apunta a producción (o al revés), **también aborta**. Y los que borran datos exigen
además una confirmación explícita cuando el destino es producción:

```bash
CONFIRMO=BORRAR-EN-PRODUCCION DB=prod npx tsx scripts/<script>.ts
```

Esto existe por un incidente real (18 ago 2026): un comando que se creía apuntando a desarrollo
fue a producción. No hubo daño de milagro. La protección vive en `scripts/_guard.ts` y
`scripts/_guard-destructivo.ts`; se activa con una línea al principio del script
(`import "./_guard-destructivo";`).

**`scripts/archivo/` — no ejecutar nada de ahí.** Son scripts que ya cumplieron su función una
vez y hoy solo pueden destruir. El peor, `seed-alimentos-completo.ts`, borraba el catálogo entero
de alimentos y dejaba ~180.000 líneas de dieta apuntando al vacío, de forma **irrecuperable**, y
terminaba imprimiendo «Seed completado». Están ahí solo por historial (ver su `LEEME.md`).

**Si tu tarea parece necesitar un script**, párate y dilo en el issue. Casi nunca hace falta.

## 2. Cómo se despliega (contexto, aunque no lo hagas tú)

No hay integración continua: **lo que entra en `main` es lo que acaba en producción**. Por eso
`main` está protegida y solo el dueño del repo despliega.

El despliegue lo hace `scripts/deploy.sh` en el servidor, y su orden importa:

```
git pull → npm install → npx prisma generate → build aislado → swap → reiniciar → verificar
```

Dos cosas de ese guion son cicatrices de incidentes reales:

- **El build va a una carpeta aparte y luego se intercambia.** Antes se construía encima de la
  carpeta que estaba sirviendo la web, y durante el par de minutos del build los usuarios veían
  errores de recursos que ya no existían (`ChunkLoadError`, estilos rotos, "Algo ha fallado").
- **`prisma generate` va después del `pull`**, para que el cliente conozca el esquema nuevo.

**Verificación después de desplegar** (no basta con que cargue el login):
- La home debe devolver 307 y `/login` 200. Los fallos de recursos aparecen primero en la home.
- Si el cambio tocó el esquema o un enum: comprobar que no hay `not found in enum` en los logs.
- Avisar de recargar con Ctrl+Shift+R si el cambio es visual: los navegadores cachean.

**Qué significa esto para ti si no despliegas:** que un PR tuyo puede tumbar la web de gente que
está trabajando. De ahí que se pida `tsc --noEmit` en verde y prueba manual antes de abrir el PR.

---

## 3. Errores que ya nos han costado caro

### 3.1 Fallos silenciosos (el patrón número uno)
Media docena de bugs reales han sido lo mismo: **algo falla y nadie se entera**. Una acción que
no se guarda, una promesa sin `catch`, un `try/catch` vacío. El usuario cree que ha guardado y no
es así.

- Siempre `await` + manejo de error + aviso visible (`toast.error`).
- Nunca `.catch(() => {})`.
- Si una operación puede fallar a medias, decide qué pasa con lo ya hecho (¿se revierte?).

### 3.2 Funcionalidad que necesita un paso manual en producción
Una funcionalidad que depende de un dato en la base de datos o de una variable de entorno nueva
funciona en tu máquina y **falla en silencio en producción** porque nadie ejecutó el paso extra.

- Si añades una variable de entorno, dilo en el PR: hay que ponerla en el servidor.
- Si depende de datos, incluye el script y dilo.

### 3.3 Caché obsoleta en desarrollo
Cambias algo y "no se aplica". No busques el bug: es la caché de Turbopack.

```bash
pkill -f "next dev" ; rm -rf .next ; npm run dev
```
Y recarga forzada en el navegador. Pasa sobre todo al tocar `src/lib/*.ts` y los JSON de textos
(síntoma: las claves nuevas se ven crudas y las viejas van bien).

### 3.4 Cuentas "fantasma" al crear o borrar usuarios
Hay **dos sitios** donde vive un usuario: las tablas de autenticación y la tabla de la
aplicación. Si se borra solo una, quedan cuentas que pueden entrar pero no existen, o correos
que dan "ya registrado" sin poder recuperarse.

- Al borrar: primero autenticación, después la ficha de la aplicación.
- Al crear: si falla el segundo paso, **deshacer el primero**.
- Al buscar a alguien: recuerda que puede existir en autenticación y **no** tener ficha todavía
  (la ficha se crea en el primer acceso verificado). Varios bugs han salido de olvidar ese caso.

### 3.5 La frontera servidor → cliente
Nunca pases funciones ni componentes como props de un componente de servidor a uno de cliente
(`"use client"`). Usa claves de texto y resuélvelas en el cliente.

### 3.6 Errores en server actions
- En los `catch`, usar `isNextNavigation(error)`. El patrón viejo `"digest" in error` se traga
  los errores reales.
- Errores de validación: **devolver** `{ error }`, no lanzar excepciones (provocan la pantalla
  roja en producción).

### 3.7 Textos e idiomas
Toda clave nueva va en **es y pt**. Y ojo con el namespace: pedir `getTranslations("emails.x")`
y luego `t("y")` no funciona; hay que pedir el namespace de primer nivel y usar la ruta
completa. Síntoma: se ve la clave literal en pantalla o en un PDF.

### 3.8 Datos derivados que se quedan congelados
Si guardas una copia de algo (un resumen, un JSON con el estado de un día), decide **cuándo se
regenera**. Ya pasó: el checklist del paciente guardaba una copia del plan, el nutricionista
cambiaba el plan y el paciente seguía viendo el anterior.

Regla: distingue "histórico congelado" (lo que pasó) de "vivo" (lo que toca ahora).

### 3.9 Guardar mientras se teclea, si eso arrastra otros datos
Un input con guardado automático está bien para un valor suelto. Pero si al guardar **recalcula
otros datos**, guardar en cada pulsación los corrompe: al escribir "150" se guarda también el
"1" intermedio. Ya destruyó las equivalencias de una nutricionista.

Si tu input dispara cálculos derivados: guarda **al confirmar** (al salir del campo o con Enter).

### 3.10 Identificadores temporales
Cuando pintas algo antes de que el servidor confirme (interfaz optimista), **sustituye el
identificador temporal por el real** en cuanto llegue. Si no, las ediciones posteriores intentan
guardar contra algo que no existe… y fallan en silencio (ver 3.1).

### 3.11 Consumo de recursos externos
- **La IA (Groq) tiene límites de uso ajustados** y cada plan generado consume bastante. No
  amplíes a lo loco el catálogo de alimentos que se le envía: cuesta dinero y rompe el límite.
- Las imágenes se guardaron durante mucho tiempo **dentro de la base de datos** (en base64). Eso
  disparó el tráfico de salida hasta tumbar la aplicación entera un día de junio. **Las imágenes
  nuevas van a almacenamiento de archivos, no a la base de datos.**

---

## 4. Cómo pensar cada cambio (esto es lo que más se nota)

Antes de dar algo por terminado, pásale estas cuatro preguntas:

1. **¿Se ve?** Si el usuario no encuentra el botón, la funcionalidad no existe. Nos ha pasado
   seis veces: nutricionistas pidiendo cosas que ya estaban hechas. Pon el acceso donde ya está
   mirando y explica de dónde sale cada número.

2. **¿Dónde más tiene que aparecer esto?** Es el fallo más caro. El mismo dato suele vivir en
   varias pantallas, y si falta en una, parece roto:
   - editor de dietas (`dietas/[id]`)
   - la ficha del paciente (`pacientes/[id]?pestana=plan-alimentacion`) — **es donde te deja la
     app justo después de crear una dieta**, la que más se olvida
   - portal del paciente
   - enlace público compartido
   - los PDF y la pestaña de entregables
   - plantillas (no tienen paciente: que no reviente)
   - generación con IA

   La lógica compartida va en `src/lib/`, para que dos pantallas no puedan divergir.

3. **¿Qué ve el paciente?** Si es un dato interno, no debe llegarle. Y si hay un interruptor de
   "ocultar X al paciente", revisa **todos** los sitios: ya hubo un caso donde se ocultaban las
   calorías pero seguían viéndose los gramos, que revelan lo mismo.

4. **¿Se rompe en una pantalla pequeña?** Varios "bugs" han sido datos escondidos por
   responsive: se veían en la pantalla del programador y no en la del cliente.

Y dos normas de la casa:
- **Interfaz optimista**: al guardar, refleja el cambio al instante y revierte con aviso si
  falla.
- **Nada de enums crudos en pantalla**: `PERDER_PESO` no; "Perder peso" sí.

---

## 5. Antes de abrir el PR

- [ ] `npx tsc --noEmit` en verde
- [ ] Probado a mano en el navegador (y en pantalla estrecha si es visual)
- [ ] Textos nuevos en **es y pt**
- [ ] Si tocaste el esquema: el script de migración va incluido en el PR
- [ ] Si añadiste una variable de entorno: dicho en la descripción
- [ ] Repasadas las cuatro preguntas del apartado 4
- [ ] El PR explica **qué**, **dónde se ve** y **qué has dejado fuera**
