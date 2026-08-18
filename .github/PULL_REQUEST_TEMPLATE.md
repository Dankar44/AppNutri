<!--
Rellena esta plantilla. No es burocracia: quien revisa y despliega necesita esta información
para publicar el cambio sin romper producción. Un PR sin esto se queda parado.
Borra las secciones que no apliquen.
-->

## Qué hace este cambio

Closes #

<!-- Explica en 2-3 frases QUÉ cambia de cara al nutricionista, no cómo está programado.
     Ejemplo: "Los nombres largos de los ingredientes ya no se cortan en la ficha de la receta:
     ahora pasan a la línea siguiente." -->

## Dónde se ve

<!-- Pantallas y rutas exactas donde se nota el cambio. Esto se usa para verificarlo después
     de desplegar, así que sé concreto.
     Ejemplo:
     - /recetas/[id] (ficha de la receta)
     - buscador de alimentos dentro del editor de dieta -->

## Cómo probarlo

<!-- Pasos numerados para reproducir el resultado. Como si se lo explicaras a alguien que no
     ha tocado esta parte.
     1. Entra en Recetas y abre una con ingredientes de nombre largo
     2. ... -->

## ¿Toca la base de datos?

- [ ] **No**, no toca el esquema
- [ ] **Sí** → he incluido el script de migración en `scripts/` y lo indico aquí: `scripts/____.ts`

> ⚠️ Si toca el esquema: la migración se ejecuta **ANTES** de desplegar el código. Dilo bien
> claro, porque el orden inverso rompe la aplicación.

## ¿Necesita alguna variable de entorno nueva?

- [ ] No
- [ ] Sí → cuáles y para qué: ____

> ⚠️ Si es que sí, hay que añadirla en el servidor antes de desplegar. Si no se dice, la
> funcionalidad falla en silencio en producción.

## Qué he dejado fuera a propósito

<!-- Si el issue pedía más cosas y has hecho solo una parte, dilo. También si has visto algo
     roto de paso y no lo has tocado. -->

## Capturas

<!-- Obligatorio si el cambio es visual: antes y después. Y en pantalla estrecha (móvil) si
     afecta a algo que se pueda cortar. -->

---

## Antes de pedir revisión

- [ ] `npx tsc --noEmit` en verde
- [ ] Probado a mano en el navegador
- [ ] Si es visual: probado también en pantalla estrecha
- [ ] Los textos nuevos están en **es y pt** (`src/messages/es/*.json` y `pt/*.json`)
- [ ] No he tocado `prisma/schema.prisma` (o lo digo arriba)
- [ ] No he tocado las zonas calientes listadas en `docs/COLABORADOR.md` (o lo aviso)
- [ ] El PR es de **una sola tarea**
