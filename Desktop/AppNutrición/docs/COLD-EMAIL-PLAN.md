# Plan de Cold Email — Annonia

## 1. Viabilidad: resumen rápido

**Sí es viable**, pero con matices importantes. Cold email B2B a nutricionistas (profesionales, no consumidores) es una práctica habitual en SaaS. Con 4 cuentas bien gestionadas puedes llegar a **120-200 emails/día** tras el periodo de calentamiento (unas 3-4 semanas). Eso son **2.400-4.000 contactos/mes**.

Tasa de respuesta realista en cold email B2B en España: **2-5%**. Eso significa **50-200 respuestas/mes**, de las cuales quizás un 20-30% muestren interés real → **10-60 leads cualificados/mes**.

**Coste estimado:** ~50-100€/mes (dominios + herramienta de envío). Muy bajo para el volumen que genera.

---

## 2. Riesgos y cómo mitigarlos

### El riesgo principal: que te baneen las cuentas

**Regla de oro: NUNCA uses el dominio annonia.com para cold email.** Si el dominio principal se quema (marcado como spam), afecta a TODOS tus correos: transaccionales, soporte, notificaciones, etc.

### Solución: dominios secundarios

Compra 4 dominios alternativos (~10€/año cada uno). Ejemplos:

| Cuenta | Dominio sugerido | Email |
|--------|-----------------|-------|
| 1 | annonia-nutricion.com | guillermo@annonia-nutricion.com |
| 2 | app-annonia.es | info@app-annonia.es |
| 3 | plataforma-annonia.com | hola@plataforma-annonia.com |
| 4 | annonia-salud.com | guillermo@annonia-salud.com |

Coste total: ~40-50€/año por los 4 dominios.

### Configuración técnica obligatoria (por cada dominio)

Sin esto, tus correos van directo a spam:

- **SPF** — Registro DNS que autoriza a tu servidor a enviar desde ese dominio
- **DKIM** — Firma criptográfica que verifica que el email no ha sido alterado
- **DMARC** — Política que dice qué hacer con emails que fallan SPF/DKIM

Si usas Google Workspace, se configuran en los DNS del dominio. Cualquier proveedor de dominios (Namecheap, Cloudflare, GoDaddy) permite configurarlo.

### Consideración legal (LSSI / GDPR)

En España, la LSSI (art. 21) requiere consentimiento previo para comunicaciones comerciales. Sin embargo, la excepción B2B permite contactar a profesionales en su email profesional cuando:
- El contenido es relevante para su actividad profesional
- Incluyes forma clara de darse de baja
- Te identificas correctamente

**Recomendaciones para cumplir:**
- Siempre incluir "Si no te interesa, responde y te elimino de inmediato" (o similar)
- No enviar más de 2-3 emails al mismo contacto si no responde
- Usar email profesional del nutricionista (no personal)
- Incluir tu nombre real, empresa y forma de contacto

---

## 3. Límites de envío por cuenta

### Gmail gratuito
- Máximo oficial: 500 emails/día
- **Para cold email: NUNCA enviar más de 30-50/día** (o te banean)

### Google Workspace
- Máximo oficial: 2.000 emails/día
- **Para cold email: 50-80/día máximo** tras calentamiento

### Outlook/Microsoft 365
- Máximo oficial: 10.000 emails/día
- **Para cold email: 50-80/día máximo** tras calentamiento

### Estrategia con 4 cuentas

| Semana | Emails/día por cuenta | Total diario | Total semanal |
|--------|----------------------|-------------|---------------|
| 1-2 (calentamiento) | 5-10 | 20-40 | 100-200 |
| 3-4 | 15-25 | 60-100 | 300-500 |
| 5-6 | 30-40 | 120-160 | 600-800 |
| 7+ (crucero) | 40-50 | 160-200 | 800-1.000 |

**Total mensual en velocidad crucero: ~3.200-4.000 emails/mes**

---

## 4. Calentamiento de cuentas (warm-up)

Las cuentas nuevas que empiezan a enviar muchos emails de golpe son baneadas inmediatamente. Hay que "calentarlas":

### Semanas 1-2: solo warm-up
1. Envía emails reales a contactos conocidos (amigos, familia, colegas) pidiendo que respondan
2. Suscríbete a newsletters con esas cuentas para que reciban correo
3. Envía y recibe 10-20 emails/día de forma natural
4. Abre y responde los emails (esto mejora la reputación del sender)

### Herramientas de warm-up automático
Estas herramientas envían emails entre una red de cuentas y se responden automáticamente, simulando actividad real:

- **Instantly.ai** (~$30/mes) — Incluye warm-up + envío automatizado. Muy buena opción todo-en-uno
- **Lemwarm** (de Lemlist, ~$29/mes)
- **Warmbox.ai** (~$15/mes) — Solo warm-up

**Recomendación:** Instantly.ai es la mejor relación calidad/precio. Por ~$30/mes puedes conectar las 4 cuentas, hacer warm-up, y enviar campañas automatizadas con secuencias.

### Semanas 3-4: empezar a enviar cold email
- Empieza con 10-15 emails/día por cuenta
- Sube 5 emails/día cada semana
- Monitoriza la tasa de rebote (debe ser <3%) y la de spam reports

---

## 5. Estructura de las campañas

### Secuencia recomendada (por contacto)

No envíes solo 1 email. La mayoría de respuestas vienen en el email 2 o 3:

1. **Email 1** (día 0) — Primer contacto, valor, curiosidad
2. **Email 2** (día 3-4) — Follow-up corto, ángulo diferente
3. **Email 3** (día 7-8) — Último intento, break-up email

Si no responde a los 3: se acabó. No enviar más.

### Horarios de envío

- **Mejor horario:** Martes a jueves, 9:00-11:00 AM
- **Segundo mejor:** Lunes 10:00-12:00
- **Evitar:** Viernes tarde, fines de semana, festivos
- **Espaciar envíos:** No enviar todos de golpe. 1 email cada 2-3 minutos (las herramientas como Instantly lo hacen automáticamente)

---

## 6. Palabras y prácticas a EVITAR

### Palabras que activan filtros de spam
- "Gratis", "gratuito", "oferta", "descuento", "promoción"
- "Gana dinero", "sin coste", "100%", "garantizado"
- "Haz clic aquí", "actúa ahora", "urgente", "última oportunidad"
- "€€€", uso excesivo de mayúsculas, exclamaciones múltiples (!!!)

### Prácticas que te mandan a spam
- Incluir imágenes (ni logo, ni banner, ni nada)
- Incluir más de 1 enlace (idealmente 0 enlaces en el primer email)
- HTML complejo o con estilos — solo texto plano
- Adjuntos en el primer email
- Enviar emails idénticos a muchos destinatarios (por eso necesitas variaciones)
- No incluir forma de baja/opt-out
- Asunto en mayúsculas o con emojis
- Emails largos (más de 150 palabras)

### Buenas prácticas
- Texto plano, como si escribieras a un colega
- Corto: 80-120 palabras ideal
- Personalización real (nombre, ciudad, especialidad)
- Máximo 1 link (mejor ninguno en el primer email)
- Asunto corto (4-7 palabras)
- Pregunta o CTA claro al final
- Firma simple: nombre, cargo, teléfono

---

## 7. Dónde encontrar emails de nutricionistas

### Fuentes principales

1. **Google Maps** — Buscar "nutricionista" + ciudad. Muchas fichas tienen email y web
2. **Instagram** — Muchos nutricionistas ponen su email en la bio o en el linktree
3. **LinkedIn** — Buscar "dietista-nutricionista" en España. Con Sales Navigator (~$80/mes) puedes filtrar por ubicación y obtener emails
4. **Colegios profesionales** — Algunas comunidades autónomas publican listas:
   - CODNIB (Baleares), CODINCA (Canarias), CODINCAT (Cataluña), etc.
   - Algunos tienen directorio público con contacto
5. **Directorios profesionales** — doctoralia.es, topdoctors.es, mundopsicologos.com (tiene sección nutrición)
6. **Webs de clínicas** — Buscar "clínica nutrición [ciudad]", muchas tienen el email del equipo
7. **Apollo.io** — Herramienta de prospección B2B. Plan gratuito da 100 emails/mes. Buscar por cargo "nutricionista" + ubicación "Spain"

### Herramientas de extracción de email
- **Hunter.io** — Encuentra emails a partir de un dominio web. 25 búsquedas/mes gratis
- **Snov.io** — Similar, 50 créditos/mes gratis
- **Apollo.io** — Base de datos B2B con filtros por cargo/industria/ubicación

### Estimación de mercado
Hay ~4.000-5.000 dietistas-nutricionistas colegiados en España ejerciendo de forma privada. No todos tienen email público, pero podrías recopilar 1.500-2.500 contactos con esfuerzo.

---

## 8. Plantillas de cold email

### Firma estándar (usar en todos)

```
Guillermo
Annonia — plataforma para nutricionistas
[teléfono]

PD: Si esto no te interesa, dime y no te vuelvo a escribir.
```

---

### CATEGORÍA A: Dolor / problema conocido

**A1 — El tiempo en consulta**

Asunto: Pregunta rápida sobre tu consulta

Hola [nombre],

He visto que tienes consulta de nutrición en [ciudad] y quería hacerte una pregunta rápida.

¿Cuánto tiempo dedicas a la semana a montar planes alimenticios, calcular macros y pasar todo a PDF para tus pacientes?

He creado Annonia, una plataforma que permite crear planes personalizados en minutos (con editor visual, cálculo automático de macros y PDF profesional con tu logo).

¿Te interesaría verla en una demo de 10 minutos?

---

**A2 — Excel y Word**

Asunto: ¿Sigues haciendo dietas en Excel?

Hola [nombre],

Muchos nutricionistas que conozco siguen montando planes alimenticios en Excel o Word. Funciona, pero lleva mucho tiempo y es fácil que se cuelen errores en los cálculos.

He creado una herramienta que sustituye esas hojas: arrastras alimentos, se calculan macros solos, y generas un PDF profesional personalizado con tu marca.

¿Te suena interesante? Te la enseño en 10 minutos por videollamada.

---

**A3 — Seguimiento de pacientes**

Asunto: Seguimiento entre consultas

Hola [nombre],

Una de las cosas que más me comentan los nutricionistas es que entre consulta y consulta pierden el hilo de lo que hace el paciente: si sigue la dieta, si hace ejercicio, si bebe suficiente agua.

He montado Annonia, una plataforma donde tus pacientes registran su seguimiento diario desde el móvil y tú lo ves todo en tu panel: evolución de peso, adherencia, ejercicio.

¿Tienes 10 minutos esta semana para que te la enseñe?

---

**A4 — Pacientes que no vuelven**

Asunto: Retención de pacientes

Hola [nombre],

¿Te ha pasado que un paciente viene 2-3 consultas y después desaparece?

Muchas veces no es porque no le funcione la dieta, sino porque pierde el vínculo entre sesiones. Con Annonia, tus pacientes tienen un portal propio donde ven su dieta, registran su seguimiento y te escriben directamente. Eso hace que se sientan acompañados y vuelvan.

¿Quieres verlo? Son 10 minutos de demo.

---

**A5 — Cobrar consultas**

Asunto: Cobrar consultas online

Hola [nombre],

¿Aceptas pagos online de tus pacientes o sigues con Bizum y transferencias?

Annonia tiene un sistema de cobro integrado: generas un link de pago, el paciente paga con tarjeta, y tú recibes el dinero directamente en tu cuenta. Sin comisiones ocultas, sin perseguir a nadie.

¿Te interesa verlo? Te hago una demo rápida.

---

### CATEGORÍA B: Valor / educativo

**B1 — Dato del sector**

Asunto: Dato sobre nutricionistas y tecnología

Hola [nombre],

El 78% de los nutricionistas en España aún crean planes alimenticios a mano (según una encuesta reciente del CGCODN). Los que usan herramientas digitales reportan ahorrar 5-8 horas semanales.

He creado Annonia pensando en esto: una plataforma donde crear planes personalizados, gestionar pacientes y generar PDFs profesionales. Sin curva de aprendizaje.

¿Tienes curiosidad? Te la muestro en una videollamada de 10 minutos.

---

**B2 — Profesionalización**

Asunto: Imagen profesional con tus pacientes

Hola [nombre],

¿Alguna vez has pensado en cómo percibe tu paciente el plan que le entregas? Un PDF con tu logo, colores corporativos y un diseño limpio genera mucha más confianza que un Word o un papel escrito a mano.

Annonia genera PDFs profesionales personalizados con tu marca. Puedes elegir colores, añadir tu logo, e incluso la lista de la compra. El paciente lo recibe y piensa "esta persona es seria".

¿Te interesaría verlo? Son 10 minutos.

---

**B3 — Portal del paciente**

Asunto: Que tus pacientes te vean como referente

Hola [nombre],

Imagina que tus pacientes entran en una app con tu nombre, ven su dieta actualizada, registran lo que comen, y te escriben si tienen dudas. Todo en un mismo sitio.

Eso es lo que hace Annonia: le das a cada paciente un acceso a su portal personal. Tú ves su seguimiento en tiempo real. Ellos se sienten acompañados.

¿Quieres que te lo enseñe? 10 minutos por videollamada.

---

### CATEGORÍA C: Curiosidad / pregunta

**C1 — Pregunta directa**

Asunto: Pregunta sobre tu consulta

Hola [nombre],

Soy Guillermo, fundador de Annonia. Estoy hablando con nutricionistas de [ciudad] para entender cómo gestionáis el día a día.

¿Qué herramienta usas ahora para crear planes alimenticios y hacer seguimiento de tus pacientes?

No es un email de venta, me interesa saberlo de verdad. Si me contestas, te cuento lo que estoy construyendo por si te puede ser útil.

---

**C2 — Encuesta rápida**

Asunto: 30 segundos — tu opinión

Hola [nombre],

Estoy investigando cómo trabajan los nutricionistas en España y me gustaría tu opinión sobre una cosa:

Si pudieras mejorar UNA sola cosa de tu flujo de trabajo con pacientes, ¿cuál sería?
a) Crear planes alimenticios más rápido
b) Mejor seguimiento entre consultas
c) Cobros y facturación
d) Otra cosa

Solo responde con la letra. Me ayuda mucho.

---

**C3 — Específica por especialidad**

Asunto: Nutrición [deportiva/clínica/infantil] en [ciudad]

Hola [nombre],

He visto que te especializas en nutrición [deportiva/clínica/infantil] en [ciudad]. Estoy desarrollando una plataforma para nutricionistas y me gustaría saber:

¿Usas alguna herramienta digital para crear planes y hacer seguimiento, o lo gestionas a mano?

Pregunto porque estoy añadiendo funcionalidades específicas para [la especialidad] y me vendría bien la perspectiva de alguien que trabaja en ello a diario.

---

### CATEGORÍA D: Social proof / resultados

**D1 — Caso de uso real**

Asunto: Cómo [nombre nutri real] ahorra 6h/semana

Hola [nombre],

[Nombre de nutricionista real] tenía 30 pacientes y dedicaba medio día a montar dietas en Excel. Desde que usa Annonia, crea un plan personalizado en 15 minutos y sus pacientes lo ven directamente en su portal.

Le he preguntado qué es lo que más le gusta y me ha dicho: "que el paciente puede ver su dieta desde el móvil y yo veo si la está siguiendo sin tener que preguntarle".

¿Quieres ver cómo funciona? Te hago una demo de 10 minutos adaptada a tu consulta.

---

**D2 — Número de profesionales**

Asunto: Lo que usan otros nutricionistas

Hola [nombre],

Cada vez más nutricionistas en España están dejando Excel y Word para gestionar sus planes alimenticios con herramientas digitales.

He creado Annonia, una plataforma pensada específicamente para el nutricionista: planes personalizados con cálculo automático de macros, seguimiento del paciente en tiempo real, agenda de citas, y PDFs con tu marca.

¿Te suena interesante? 10 minutos de demo y decides si te encaja.

---

### CATEGORÍA E: Directo / corto

**E1 — Ultra corto**

Asunto: Para [nombre]

Hola [nombre],

Plataforma para nutricionistas: planes alimenticios, seguimiento de pacientes, agenda y PDFs profesionales. Todo en uno.

¿Te interesa verla en 10 minutos?

---

**E2 — Sin rodeos**

Asunto: Annonia para tu consulta

Hola [nombre],

He creado una plataforma para nutricionistas que permite:
- Crear planes alimenticios con cálculo automático de macros
- Que tus pacientes vean su dieta y registren su seguimiento desde el móvil
- Generar PDFs profesionales con tu logo
- Gestionar citas y cobros

¿Tienes 10 minutos para una demo esta semana?

---

**E3 — Propuesta directa**

Asunto: Demo de 10 minutos

Hola [nombre],

Soy Guillermo. He montado Annonia, una herramienta para nutricionistas que te ahorra horas de trabajo a la semana creando planes, gestionando pacientes y generando PDFs.

¿Te viene bien el jueves o viernes para una demo rápida de 10 minutos?

---

### CATEGORÍA F: Estacional / contextual

**F1 — Septiembre (vuelta)**

Asunto: Preparar la vuelta de septiembre

Hola [nombre],

Septiembre es el mes fuerte para los nutricionistas: todo el mundo vuelve de vacaciones queriendo "empezar bien". Es el momento perfecto para tener tus herramientas listas.

Annonia te permite crear planes personalizados en minutos, con seguimiento del paciente entre consultas. Para que este septiembre no te pille desbordada.

¿Quieres verla antes de que empiece la temporada?

---

**F2 — Enero (propósitos)**

Asunto: Enero y la avalancha de pacientes nuevos

Hola [nombre],

Enero es el mes en que más pacientes nuevos llegan a consulta de nutrición. ¿Tienes un sistema para gestionar el volumen sin que se te acumule el trabajo administrativo?

Annonia te permite onboardear pacientes rápido: creas su ficha, montas el plan, y el paciente ya tiene acceso a su portal con la dieta y el seguimiento.

¿Te interesa? Te lo enseño en 10 minutos.

---

### CATEGORÍA G: Follow-ups (email 2 y 3 de la secuencia)

**G1 — Follow-up suave (email 2, día 3-4)**

Asunto: Re: [asunto del email 1]

Hola [nombre],

Te escribí hace unos días sobre Annonia. Entiendo que estarás liada con consultas.

Solo quería saber si te interesa ver cómo funciona. Si no es el momento, sin problema.

---

**G2 — Follow-up con valor (email 2, día 3-4)**

Asunto: Re: [asunto del email 1]

Hola [nombre],

Te escribí el otro día y no sé si lo viste. Por si te sirve de contexto: Annonia es una plataforma donde puedes crear un plan alimenticio personalizado en 15 minutos (con macros calculados automáticamente) y que tu paciente lo vea desde su móvil.

¿Merece 10 minutos de tu tiempo?

---

**G3 — Break-up email (email 3, día 7-8)**

Asunto: Re: [asunto del email 1]

Hola [nombre],

Este es mi último email. Si no te interesa, lo entiendo perfectamente y no vuelvo a escribir.

Solo quería que supieras que Annonia existe por si en algún momento necesitas una herramienta para gestionar planes y pacientes. Puedes buscarla cuando quieras.

Un saludo y mucha suerte con la consulta.

---

**G4 — Follow-up pregunta (email 2)**

Asunto: Re: [asunto del email 1]

Hola [nombre],

Solo una pregunta rápida: ¿es porque no te interesa, o simplemente no has tenido tiempo de verlo?

Si me dices, no te vuelvo a molestar.

---

### CATEGORÍA H: Por especialidad

**H1 — Nutrición deportiva**

Asunto: Herramienta para nutrición deportiva

Hola [nombre],

He visto que trabajas en nutrición deportiva. Annonia tiene cálculo automático de gasto energético (Harris-Benedict, Mifflin-St Jeor, Katch-McArdle y más), seguimiento de ejercicio del paciente, y planes con múltiples objetivos (alto en proteínas, superávit, déficit...).

¿Te interesa verlo? 10 minutos de demo.

---

**H2 — Nutrición clínica**

Asunto: Gestión de pacientes clínicos

Hola [nombre],

He visto que trabajas en nutrición clínica. Annonia permite crear anamnesis detalladas, planes alimenticios adaptados a patologías, y ocultar calorías a pacientes que no deben verlas (TCA, por ejemplo).

¿Quieres ver cómo funciona? Te hago una demo adaptada a tu perfil.

---

**H3 — Consulta online**

Asunto: Tu consulta online

Hola [nombre],

He visto que ofreces consultas online de nutrición. Annonia tiene todo lo que necesitas para gestionar pacientes a distancia: planes alimenticios digitales, portal del paciente, seguimiento en tiempo real, videoconsulta, y cobro online integrado.

¿Te interesa verlo?

---

### CATEGORÍA I: Ángulo de marca personal

**I1 — Diferenciarte**

Asunto: Diferenciarte de otros nutricionistas

Hola [nombre],

En un mercado con cada vez más nutricionistas, la imagen profesional marca la diferencia. Los pacientes comparan, y el que entrega un plan con diseño profesional, portal propio y seguimiento digital transmite otra cosa.

Annonia te permite tener todo eso sin necesidad de diseñador ni programador.

¿Quieres verlo?

---

**I2 — Escalar sin contratar**

Asunto: Más pacientes sin más horas

Hola [nombre],

El techo de un nutricionista suele ser el tiempo: hay un límite de pacientes que puedes atender si haces todo manual.

Annonia automatiza la parte más lenta (crear planes, calcular macros, hacer seguimiento) para que puedas atender más pacientes en las mismas horas. Sin contratar a nadie.

¿Te interesa? 10 minutos de demo.

---

## 9. Banco de asuntos alternativos

Usa estos para rotar los asuntos y evitar repeticiones:

| # | Asunto |
|---|--------|
| 1 | Pregunta rápida sobre tu consulta |
| 2 | ¿Cómo gestionas tus planes alimenticios? |
| 3 | Para nutricionistas de [ciudad] |
| 4 | Idea para tu consulta |
| 5 | Una herramienta que quizá te interese |
| 6 | 10 minutos que te ahorran 5 horas/semana |
| 7 | Seguimiento de pacientes entre consultas |
| 8 | Tu opinión — 30 segundos |
| 9 | Pregunta sobre tu consulta en [ciudad] |
| 10 | Algo que me comentó otra nutricionista |
| 11 | ¿Usas Excel para las dietas? |
| 12 | Para [nombre] |
| 13 | Planes alimenticios profesionales |
| 14 | Tu consulta de nutrición |
| 15 | Propuesta rápida |
| 16 | ¿Conoces Annonia? |
| 17 | Automatizar tu consulta |
| 18 | Pregunta rápida |
| 19 | Nutrición + tecnología |
| 20 | Demo de 10 minutos |

---

## 10. Variables de personalización

Cada email debe usar variables para no ser idéntico:

- **[nombre]** — Nombre de pila del nutricionista
- **[ciudad]** — Ciudad donde tiene consulta
- **[especialidad]** — Deportiva, clínica, infantil, materno-infantil, oncológica, vegetariana...
- **[centro]** — Nombre de su clínica/consulta si lo tiene
- **[canal]** — Dónde lo encontraste (Instagram, web, directorio)

Combinando 25 plantillas base × 20 asuntos × personalización = cientos de emails únicos.

---

## 11. Plan de ejecución semanal

### Preparación (semana 0) — 1-2 días

1. Comprar 4 dominios secundarios
2. Crear cuenta de email en cada dominio (Google Workspace ~6€/mes por cuenta, o Zoho Mail gratis)
3. Configurar SPF, DKIM y DMARC en cada dominio
4. Contratar Instantly.ai (~$30/mes) y conectar las 4 cuentas
5. Activar warm-up en las 4 cuentas

### Calentamiento (semanas 1-3) — En paralelo

- Las cuentas se calientan solas con Instantly
- Mientras, recopilar emails de nutricionistas:
  - Objetivo: 500-1.000 contactos para empezar
  - Fuentes: Google Maps + Instagram + LinkedIn + directorios
  - Guardar en CSV: nombre, email, ciudad, especialidad (si se sabe), fuente

### Lanzamiento (semana 4) — Empezar a enviar

- Configurar 3-4 campañas en Instantly con plantillas diferentes
- Cada campaña usa secuencia de 3 emails (email 1 → follow-up → break-up)
- 10-15 emails/día por cuenta (subir gradualmente)
- Monitorizar: tasa de apertura (>50% es buena), respuestas, rebotes, spam reports

### Velocidad crucero (semana 7+)

- 40-50 emails/día por cuenta
- Rotar plantillas cada 2 semanas
- Añadir nuevos contactos continuamente
- Responder a todos los que contesten (positivos Y negativos)
- Reunir los leads interesados → demo → onboarding

---

## 12. Métricas a seguir

| Métrica | Objetivo | Señal de alarma |
|---------|----------|-----------------|
| Tasa de apertura | >50% | <30% (asuntos malos o vas a spam) |
| Tasa de respuesta | 2-5% | <1% (emails no conectan) |
| Tasa de rebote | <3% | >5% (emails inválidos, limpiar lista) |
| Spam reports | <0.1% | >0.3% (parar y revisar contenido) |
| Demos agendadas/mes | 10-20 | <5 (revisar propuesta de valor) |

---

## 13. Presupuesto estimado

| Concepto | Coste mensual | Coste anual |
|----------|--------------|-------------|
| 4 dominios secundarios | ~3€/mes | ~40€/año |
| Google Workspace × 4 (o Zoho gratis) | 0-24€/mes | 0-288€/año |
| Instantly.ai (Growth plan) | ~$30/mes (~28€) | ~336€/año |
| Apollo.io (plan gratuito) | 0€ | 0€ |
| Hunter.io (plan gratuito) | 0€ | 0€ |
| **Total** | **~30-55€/mes** | **~376-664€/año** |

Con tu presupuesto de 4.000€, tienes para 5+ años de cold email. Es el canal de adquisición más barato que puedes tener.

---

## 14. Resumen: ¿Es viable?

**Sí.** Con 4 cuentas en dominios secundarios, bien calentadas, puedes enviar 160-200 emails/día (3.200-4.000/mes) con un coste de ~30-55€/mes. Esperando un 2-5% de respuesta, eso son 60-200 respuestas/mes y 10-40 demos.

**Puntos clave:**
- Nunca usar annonia.com para cold email
- Calentar las cuentas 3 semanas antes de enviar
- Máximo 50 emails/día por cuenta
- Rotar plantillas y asuntos
- Secuencia de 3 emails por contacto, no más
- Siempre incluir opt-out
- Solo texto plano, sin imágenes ni links excesivos
- Responder rápido a quien conteste

**Lo que NO hacer:**
- Enviar 500 emails el primer día (te banean)
- Usar el dominio principal
- Enviar el mismo email a todos
- Ignorar las respuestas negativas (siempre confirmar la baja)
- Seguir escribiendo a alguien que pidió que pares
