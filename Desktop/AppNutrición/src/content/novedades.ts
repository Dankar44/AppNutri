import type { Locale } from "@/i18n/config";

/**
 * Novedades del producto (página pública /novedades).
 *
 * El contenido vive aquí, versionado con el código: cada vez que se entrega
 * algo que el nutricionista nota, se añade una entrada arriba. No hay BD ni
 * panel de admin (fase 2).
 *
 * Reglas de redacción:
 * - Lenguaje de nutricionista, sin tecnicismos ni nombres de archivos.
 * - `donde` describe la ubicación con palabras (los nombres reales de las
 *   pestañas y botones de la app), NO enlaces al dashboard: la página es
 *   pública y un visitante sin cuenta acabaría en el login.
 * - `fecha` en ISO (YYYY-MM-DD) y coincidiendo con la entrega real.
 */

export type TextoBilingue = Record<Locale, string>;

export type Novedad = {
  /**
   * Slug estable. Lo usa el ancla de la entrada (#id) y lo necesitará la
   * fase 2 (banner/avisos) para saber hasta dónde ha leído cada nutri.
   */
  id: string;
  /** Fecha de la entrega, ISO YYYY-MM-DD. */
  fecha: string;
  titulo: TextoBilingue;
  descripcion: TextoBilingue;
  /** Dónde está en la app, descrito en texto. */
  donde: TextoBilingue;
  /**
   * Novedad de peso. Todavía no cambia nada visualmente: preparado para la
   * fase 2 (banner "hay novedades" / aviso destacado en el dashboard).
   */
  destacada?: boolean;
};

const NOVEDADES: Novedad[] = [
  {
    id: "reparto-por-comidas",
    fecha: "2026-08-27",
    destacada: true,
    titulo: {
      es: "Reparto por comidas: un objetivo de calorías y macros para cada toma",
      pt: "Distribuição por refeição: um objetivo de calorias e macros para cada refeição",
    },
    descripcion: {
      es: "Ahora puedes decidir qué parte del día va en cada comida, y el plan te dice a cada momento cuánto llevas y cuánto le toca a esa toma. Se configura en la planificación (con distribuciones con nombre como 40/30/30 o cetogénica, o poniendo tú los porcentajes, las calorías o los gramos) y también se puede ajustar dentro de una dieta concreta, sin tocar la pauta del paciente. La planificación pasa a definir además qué comidas tiene el día: puedes quitar las que no uses, añadir las tuyas (pre-entreno, batido, recena…) con su hora y decidir en qué días van, y las dietas nuevas nacen ya con esa estructura. Si un paciente tiene varias planificaciones (día de entreno, día de descanso), cada día usa el reparto de la suya. Y esas comidas propias las ve el paciente con su nombre y a su hora en su portal, en su seguimiento diario y en el PDF.",
      pt: "Agora podes decidir que parte do dia vai em cada refeição, e o plano diz-te a cada momento quanto já tens e quanto corresponde a essa refeição. Configura-se no planejamento (com distribuições com nome como 40/30/30 ou cetogénica, ou definindo tu as percentagens, as calorias ou os gramas) e também se pode ajustar dentro de uma dieta concreta, sem mexer na pauta do paciente. O planejamento passa a definir também que refeições tem o dia: podes remover as que não uses, adicionar as tuas (pré-treino, batido, ceia…) com a sua hora e decidir em que dias vão, e as dietas novas já nascem com essa estrutura. Se um paciente tem vários planejamentos (dia de treino, dia de descanso), cada dia usa a distribuição do seu. E essas refeições próprias o paciente vê-as com o seu nome e à sua hora no portal, no seu acompanhamento diário e no PDF.",
    },
    donde: {
      es: "En la ficha del paciente, pestaña Planificación → sección «Reparto por comida». Y dentro de una dieta, con el botón «Reparto» que hay sobre las comidas del día.",
      pt: "Na ficha do paciente, aba Planejamento → secção «Distribuição por refeição». E dentro de uma dieta, com o botão «Distribuição» que está acima das refeições do dia.",
    },
  },
  {
    id: "recetas-por-raciones",
    fecha: "2026-07-29",
    destacada: true,
    titulo: {
      es: "Las recetas se miden en raciones: 1 ración = 1 persona",
      pt: "As receitas medem-se em porções: 1 porção = 1 pessoa",
    },
    descripcion: {
      es: "Una ración es lo que come una persona. Al poner una receta en el plan indicas cuántas raciones le tocan al paciente (0,5 · 1 · 2…) y las cantidades de todos los ingredientes se recalculan solas. Ese mismo cálculo llega al PDF, al portal del paciente y a la lista de la compra, así que la compra cuadra con lo que va a cocinar de verdad. Si una receta rinde varias raciones (un bizcocho, un tarro de salsa), se trata como una tanda y sale con la nota «salen X raciones» en vez de partirse en fracciones.",
      pt: "Uma porção é o que come uma pessoa. Ao colocar uma receita no plano indicas quantas porções cabem ao paciente (0,5 · 1 · 2…) e as quantidades de todos os ingredientes são recalculadas automaticamente. Esse mesmo cálculo chega ao PDF, ao portal do paciente e à lista de compras, por isso a compra corresponde ao que ele vai realmente cozinhar. Se uma receita rende várias porções (um bolo, um pote de molho), é tratada como uma fornada e aparece com a nota «rende X porções» em vez de ser dividida em frações.",
    },
    donde: {
      es: "Recetas → campo «Raciones que rinde» al crear o editar una receta. Y en el editor del plan, en el panel de cantidad al añadir la receta a una comida.",
      pt: "Receitas → campo «Porções que rende» ao criar ou editar uma receita. E no editor do plano, no painel de quantidade ao adicionar a receita a uma refeição.",
    },
  },
  {
    id: "horario-paciente-editable",
    fecha: "2026-07-21",
    titulo: {
      es: "El horario del paciente se edita desde su ficha",
      pt: "O horário do paciente edita-se na sua ficha",
    },
    descripcion: {
      es: "Ya no hace falta esperar a que el paciente rellene su horario: puedes montarlo tú mientras te lo cuenta en consulta, con el mismo panel que ve él. Al hacer clic en una franja se abre «Nueva actividad»: categoría, desde/hasta, repetir en varios días y, en las comidas, qué suele comer.",
      pt: "Já não é preciso esperar que o paciente preencha o horário: podes montá-lo enquanto ele te conta na consulta, com o mesmo painel que ele vê. Ao clicar numa faixa abre «Nova atividade»: categoria, das/às, repetir em vários dias e, nas refeições, o que costuma comer.",
    },
    donde: {
      es: "Ficha del paciente → pestaña General, cuadro del horario semanal.",
      pt: "Ficha do paciente → aba Geral, quadro do horário semanal.",
    },
  },
  {
    id: "equivalencias-no-aplastan",
    fecha: "2026-07-10",
    titulo: {
      es: "Cambiar los gramos del alimento principal ya no aplasta sus alternativas",
      pt: "Alterar os gramas do alimento principal já não achata as suas alternativas",
    },
    descripcion: {
      es: "Antes, al ajustar la cantidad del alimento principal todas sus alternativas acababan con el mismo gramaje. Ahora cada alternativa se recalcula a la cantidad que iguala las calorías del principal, y puedes seguir ajustándolas a mano una por una.",
      pt: "Antes, ao ajustar a quantidade do alimento principal todas as alternativas acabavam com a mesma gramagem. Agora cada alternativa é recalculada para a quantidade que iguala as calorias do principal, e podes continuar a ajustá-las à mão uma a uma.",
    },
    donde: {
      es: "Editor del plan → en un alimento con alternativas, «Revisar equivalencias».",
      pt: "Editor do plano → num alimento com alternativas, «Revisar equivalências».",
    },
  },
  {
    id: "comidas-configurables",
    fecha: "2026-07-03",
    titulo: {
      es: "Comidas a tu manera: nombre propio, hora y añadir o quitar comidas",
      pt: "Refeições à tua maneira: nome próprio, hora e adicionar ou remover refeições",
    },
    descripcion: {
      es: "Cada comida del día puede llevar su nombre («Media mañana en el trabajo», «Post-entreno») y su hora. El plan se ordena por hora en el editor, en el PDF, en el portal del paciente y en el enlace compartido, y puedes añadir o eliminar comidas de un día para que el plan encaje con la vida real del paciente en vez de con seis huecos fijos.",
      pt: "Cada refeição do dia pode ter o seu nome («Meio da manhã no trabalho», «Pós-treino») e a sua hora. O plano é ordenado por hora no editor, no PDF, no portal do paciente e no link partilhado, e podes adicionar ou eliminar refeições de um dia para que o plano encaixe na vida real do paciente em vez de seis espaços fixos.",
    },
    donde: {
      es: "Editor del plan → cabecera de cada comida (para renombrarla y ponerle hora) y «Añadir comida al día».",
      pt: "Editor do plano → cabeçalho de cada refeição (para a renomear e definir a hora) e «Adicionar refeição ao dia».",
    },
  },
  {
    id: "planificacion-g-kg",
    fecha: "2026-07-02",
    titulo: {
      es: "Planificación: los g/kg de peso se pueden escribir directamente",
      pt: "Planeamento: os g/kg de peso podem escrever-se diretamente",
    },
    descripcion: {
      es: "En el reparto de macronutrientes puedes prescribir por g/kg (por ejemplo 1,8 g/kg de proteína) y la app calcula los gramos y el porcentaje. Funciona en los dos sentidos: toques g/kg, gramos o porcentaje, lo demás se ajusta. Necesita el peso del paciente y el objetivo calórico.",
      pt: "Na distribuição de macronutrientes podes prescrever por g/kg (por exemplo 1,8 g/kg de proteína) e a app calcula os gramas e a percentagem. Funciona nos dois sentidos: mexas em g/kg, gramas ou percentagem, o resto ajusta-se. Precisa do peso do paciente e do objetivo calórico.",
    },
    donde: {
      es: "Ficha del paciente → pestaña Planificación, columna g/kg de la distribución de macronutrientes.",
      pt: "Ficha do paciente → aba Planeamento, coluna g/kg da distribuição de macronutrientes.",
    },
  },
  {
    id: "pdf-anamnesis-respuestas-largas",
    fecha: "2026-07-01",
    titulo: {
      es: "El PDF de la anamnesis muestra las respuestas largas completas",
      pt: "O PDF da anamnese mostra as respostas longas completas",
    },
    descripcion: {
      es: "Las respuestas de texto libre iban en una columna estrecha que cortaba la pregunta y apilaba el texto. Ahora la pregunta va arriba y la respuesta debajo, a todo el ancho de la hoja: se lee entero y se puede archivar o entregar sin recortes.",
      pt: "As respostas de texto livre iam numa coluna estreita que cortava a pergunta e empilhava o texto. Agora a pergunta fica em cima e a resposta abaixo, em toda a largura da folha: lê-se por inteiro e pode arquivar-se ou entregar-se sem cortes.",
    },
    donde: {
      es: "Ficha del paciente → pestaña Anamnesis, descarga del PDF de la anamnesis.",
      pt: "Ficha do paciente → aba Anamnese, descarga do PDF da anamnese.",
    },
  },
  {
    id: "dietas-por-planificaciones",
    fecha: "2026-06-26",
    destacada: true,
    titulo: {
      es: "Una dieta con varias planificaciones (y días agrupados)",
      pt: "Uma dieta com vários planeamentos (e dias agrupados)",
    },
    descripcion: {
      es: "Una misma dieta puede llevar dos o más planificaciones: por ejemplo días de entreno y días de descanso, cada uno con sus calorías y macros. Cada día toma el objetivo de su planificación, la barra de objetivos se agrupa por planificación y, al juntar días que comen igual, el día de origen impone su planificación a todo el grupo. Los objetivos que ajustes valen solo para esa dieta, sin tocar la planificación general del paciente.",
      pt: "Uma mesma dieta pode ter dois ou mais planeamentos: por exemplo dias de treino e dias de descanso, cada um com as suas calorias e macros. Cada dia assume o objetivo do seu planeamento, a barra de objetivos agrupa-se por planeamento e, ao juntar dias que comem igual, o dia de origem impõe o seu planeamento a todo o grupo. Os objetivos que ajustares valem apenas para essa dieta, sem tocar no planeamento geral do paciente.",
    },
    donde: {
      es: "Al crear una dieta, casilla «Varias» para elegir dos o más planificaciones. Después, en el editor del plan: barra de objetivos y menú del día para juntar o separar días.",
      pt: "Ao criar uma dieta, caixa «Vários» para escolher dois ou mais planeamentos. Depois, no editor do plano: barra de objetivos e menu do dia para juntar ou separar dias.",
    },
  },
  {
    id: "anamnesis-plantillas-especialidad",
    fecha: "2026-06-26",
    titulo: {
      es: "Plantillas de anamnesis por especialidad, editables desde la ficha",
      pt: "Modelos de anamnese por especialidade, editáveis na ficha",
    },
    descripcion: {
      es: "Puedes tener una anamnesis por especialidad (deportiva, digestivo, embarazo…) y editarla sin salir de la ficha del paciente. Admite texto, texto largo, desplegable, casillas y escala 1-5, y preguntas condicionales: una pregunta puede abrir otra según la respuesta. Tú las ves siempre; el paciente solo cuando se cumple la condición. Las secciones y preguntas se reordenan arrastrando, y el PDF sale según la plantilla.",
      pt: "Podes ter uma anamnese por especialidade (desportiva, digestivo, gravidez…) e editá-la sem sair da ficha do paciente. Aceita texto, texto longo, lista, caixas de seleção e escala 1-5, e perguntas condicionais: uma pergunta pode abrir outra conforme a resposta. Tu vês sempre todas; o paciente só quando a condição se cumpre. As secções e perguntas reordenam-se arrastando, e o PDF sai conforme o modelo.",
    },
    donde: {
      es: "Ficha del paciente → pestaña Anamnesis, selector de plantilla (ya no hay que pasar por Ajustes).",
      pt: "Ficha do paciente → aba Anamnese, seletor de modelo (já não é preciso ir a Configurações).",
    },
  },
  {
    id: "formulario-preconsulta",
    fecha: "2026-06-23",
    titulo: {
      es: "El paciente rellena su anamnesis antes de la primera cita",
      pt: "O paciente preenche a sua anamnese antes da primeira consulta",
    },
    descripcion: {
      es: "Le envías un enlace y el paciente rellena sus datos, su objetivo, su historial médico y la anamnesis desde el móvil, sin necesidad de cuenta. Todo se vuelca a su ficha marcado como «rellenado por el paciente» y te llega un aviso cuando termina, así que llegas a la primera consulta con la ficha hecha. Para dar de alta a alguien solo hacen falta los datos esenciales; el resto puede esperar o llegar por aquí.",
      pt: "Envias-lhe um link e o paciente preenche os seus dados, o objetivo, o histórico médico e a anamnese pelo telemóvel, sem precisar de conta. Tudo passa para a ficha marcado como «preenchido pelo paciente» e recebes um aviso quando termina, por isso chegas à primeira consulta com a ficha feita. Para criar um paciente bastam os dados essenciais; o resto pode esperar ou chegar por aqui.",
    },
    donde: {
      es: "Ficha del paciente → «Enviar anamnesis al paciente»: copiar el enlace, o enviarlo por email o WhatsApp.",
      pt: "Ficha do paciente → «Enviar anamnese ao paciente»: copiar o link, ou enviá-lo por email ou WhatsApp.",
    },
  },
  {
    id: "citas-hora-correcta",
    fecha: "2026-06-22",
    titulo: {
      es: "Las citas se ven a la hora que las pusiste, y +20% en el ajuste calórico",
      pt: "As consultas aparecem à hora em que as marcaste, e +20% no ajuste calórico",
    },
    descripcion: {
      es: "Una cita creada a las 18:00 se veía a las 20:00 en algunos sitios. La hora es ahora la misma de punta a punta: agenda, ficha, panel, emails, avisos y portal del paciente. Además, el ajuste calórico del objetivo tiene un botón rápido de +20% para trabajar con superávit, por ejemplo en realimentación de pacientes desnutridos.",
      pt: "Uma consulta criada às 18:00 aparecia às 20:00 em alguns sítios. A hora é agora a mesma de ponta a ponta: agenda, ficha, painel, emails, avisos e portal do paciente. Além disso, o ajuste calórico do objetivo tem um botão rápido de +20% para trabalhar com superávit, por exemplo na realimentação de pacientes desnutridos.",
    },
    donde: {
      es: "Agenda y avisos de cita (no hay nada que configurar). El +20% está en Ficha del paciente → pestaña Planificación, ajuste del objetivo calórico.",
      pt: "Agenda e avisos de consulta (não há nada a configurar). O +20% está em Ficha do paciente → aba Planeamento, ajuste do objetivo calórico.",
    },
  },
  {
    id: "cantidades-medio-en-medio",
    fecha: "2026-06-15",
    titulo: {
      es: "Cantidades de media en media, y campos que se pueden vaciar",
      pt: "Quantidades de meia em meia, e campos que se podem esvaziar",
    },
    descripcion: {
      es: "Las raciones de receta y las medidas caseras suben y bajan de 0,5 en 0,5, así que media tostada o media ración es un clic. Los campos de cantidad se pueden dejar vacíos para escribir de cero sin pelearse con el 0, aceptan coma o punto como decimal, y si intentas añadir algo sin cantidad te avisa en vez de guardar un cero.",
      pt: "As porções de receita e as medidas caseiras sobem e descem de 0,5 em 0,5, por isso meia torrada ou meia porção é um clique. Os campos de quantidade podem ficar vazios para escrever de novo sem lutar com o 0, aceitam vírgula ou ponto como decimal e, se tentares adicionar algo sem quantidade, avisa em vez de guardar um zero.",
    },
    donde: {
      es: "En cualquier campo de cantidad: selector de alimentos, editor del plan, recetas, equivalencias, calculadoras y lista de la compra.",
      pt: "Em qualquer campo de quantidade: seletor de alimentos, editor do plano, receitas, equivalências, calculadoras e lista de compras.",
    },
  },
  {
    id: "paciente-ve-alternativas",
    fecha: "2026-06-14",
    titulo: {
      es: "El paciente ve las alternativas de cada alimento",
      pt: "O paciente vê as alternativas de cada alimento",
    },
    descripcion: {
      es: "Las alternativas que le pones a un alimento ya no se quedan en tu editor: el paciente las ve como «o…» debajo del alimento principal en su portal, en el enlace compartido y en el PDF. Sabe qué puede cambiar por qué y en qué cantidad, sin escribirte para preguntarlo.",
      pt: "As alternativas que colocas num alimento já não ficam só no teu editor: o paciente vê-as como «ou…» abaixo do alimento principal no portal, no link partilhado e no PDF. Sabe o que pode trocar por o quê e em que quantidade, sem te escrever a perguntar.",
    },
    donde: {
      es: "Portal del paciente, enlace compartido del plan y PDF (el tuyo, el que envías por email y el que exporta el paciente).",
      pt: "Portal do paciente, link partilhado do plano e PDF (o teu, o que envias por email e o que o paciente exporta).",
    },
  },
  {
    id: "medidas-caseras-unidad-natural",
    fecha: "2026-06-12",
    titulo: {
      es: "Medidas caseras: cada alimento con la unidad en la que se come",
      pt: "Medidas caseiras: cada alimento com a unidade em que se come",
    },
    descripcion: {
      es: "807 alimentos traen ya su unidad natural (unidad, ml, cucharada, cucharadita, rebanada, lata, loncha), así que prescribes «2 rebanadas» o «1 lata» en vez de traducir a gramos a mano. Al elegir un alimento, el panel de cantidad muestra la equivalencia (2 ud × 120 g = 240 g) y puedes pasar a gramos cuando lo necesites.",
      pt: "807 alimentos já trazem a sua unidade natural (unidade, ml, colher de sopa, colher de chá, fatia, lata, fatia fina), por isso prescreves «2 fatias» ou «1 lata» em vez de traduzir para gramas à mão. Ao escolher um alimento, o painel de quantidade mostra a equivalência (2 un × 120 g = 240 g) e podes passar a gramas quando precisares.",
    },
    donde: {
      es: "Selector de alimentos: al hacer clic en un resultado se abre el panel de cantidad con su unidad y la equivalencia en gramos.",
      pt: "Seletor de alimentos: ao clicar num resultado abre o painel de quantidade com a sua unidade e a equivalência em gramas.",
    },
  },
  {
    id: "alternativas-en-el-plan",
    fecha: "2026-06-09",
    destacada: true,
    titulo: {
      es: "Alternativas de alimentos en el plan, con panel de equivalencias",
      pt: "Alternativas de alimentos no plano, com painel de equivalências",
    },
    descripcion: {
      es: "Cada alimento del plan puede llevar alternativas con la cantidad que iguala sus calorías, para que el paciente tenga opciones sin salirse del objetivo. Puedes sustituir el alimento o añadir la opción como alternativa, ajustar la cantidad a mano y poner un alias con el nombre que use el paciente. Al copiar y pegar una comida, un día o un alimento, las alternativas van con él.",
      pt: "Cada alimento do plano pode ter alternativas com a quantidade que iguala as suas calorias, para que o paciente tenha opções sem sair do objetivo. Podes substituir o alimento ou adicionar a opção como alternativa, ajustar a quantidade à mão e definir um alias com o nome que o paciente usa. Ao copiar e colar uma refeição, um dia ou um alimento, as alternativas vão com ele.",
    },
    donde: {
      es: "Editor del plan → en un alimento, «Equivalencias y alternativas»: «Sustituir» lo cambia, «Alternativa» lo añade como opción.",
      pt: "Editor do plano → num alimento, «Equivalências e alternativas»: «Substituir» troca-o, «Alternativa» adiciona-o como opção.",
    },
  },
  {
    id: "ocultar-calorias-paciente",
    fecha: "2026-06-01",
    titulo: {
      es: "Ocultar las calorías a un paciente concreto",
      pt: "Ocultar as calorias a um paciente específico",
    },
    descripcion: {
      es: "Se activa paciente a paciente: cuando está puesto, deja de ver calorías y macros en su portal, en su PDF y en el seguimiento diario. Tú sigues viéndolo todo. Pensado para trastornos de la conducta alimentaria o para quien se obsesiona con el número. Al preparar los entregables, los valores nutricionales por comida quedan desmarcados y te avisa, para que no envíes por error un PDF con las calorías.",
      pt: "Ativa-se paciente a paciente: quando está ligado, ele deixa de ver calorias e macros no portal, no PDF e no acompanhamento diário. Tu continuas a ver tudo. Pensado para transtornos do comportamento alimentar ou para quem se obceca com o número. Ao preparar os entregáveis, os valores nutricionais por refeição ficam desmarcados e recebes um aviso, para não enviares por erro um PDF com as calorias.",
    },
    donde: {
      es: "Ficha del paciente → pestaña Portal del paciente, interruptor para ocultar calorías y macros.",
      pt: "Ficha do paciente → aba Portal do paciente, interruptor para ocultar calorias e macros.",
    },
  },
];

/** Novedades de la más reciente a la más antigua. */
export function getNovedades(): Novedad[] {
  return [...NOVEDADES].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** Fecha (ISO) de la última novedad publicada. */
export function getUltimaFechaNovedad(): string | null {
  return getNovedades()[0]?.fecha ?? null;
}
