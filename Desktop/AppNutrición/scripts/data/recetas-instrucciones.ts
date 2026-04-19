/**
 * Instrucciones básicas para las recetas globales.
 * Clave: nombre exacto de la receta (coincide con RECETAS_SEED).
 * Valor: pasos separados por "\n" (numeración se genera al mostrar).
 */

export const RECETAS_INSTRUCCIONES: Record<string, string> = {
  // ─────────────── DESAYUNOS ───────────────
  "Tostada de aguacate con huevo":
    "Tostar el pan integral hasta que quede crujiente.\nCocinar el huevo poché 3 minutos en agua hirviendo con unas gotas de vinagre.\nAplastar el aguacate con sal, pimienta y un chorrito de aceite.\nExtender el aguacate sobre la tostada y colocar el huevo encima.",
  "Avena con plátano y arándanos":
    "Calentar la leche en un cazo a fuego medio.\nAñadir los copos de avena y cocinar 5 minutos removiendo.\nServir en un bol y cubrir con plátano en rodajas y arándanos.\nTerminar con un hilo de miel.",
  "Tortilla francesa":
    "Batir los huevos con una pizca de sal.\nCalentar el aceite en una sartén antiadherente.\nVerter los huevos y mover con una espátula.\nDoblar la tortilla en dos cuando cuaje por fuera pero quede jugosa.",
  "Yogur griego con fresas y granola":
    "Verter el yogur griego en un bol.\nLavar y trocear las fresas.\nAñadir las fresas y la granola por encima.\nTerminar con un hilo de miel.",
  "Tostada de tomate y jamón serrano":
    "Tostar el pan integral.\nFrotar con el ajo partido en dos.\nRallar el tomate y extenderlo sobre el pan.\nAñadir un hilo de aceite, sal y el jamón serrano encima.",
  "Huevos revueltos con espinacas":
    "Saltear las espinacas en la sartén con aceite 2 minutos.\nBatir los huevos con sal y pimienta.\nAñadir a la sartén y remover a fuego suave.\nRetirar cuando estén cremosos pero no secos.",
  "Pan integral con queso fresco y miel":
    "Cortar el pan en rebanadas y tostar.\nExtender el queso fresco.\nRegar con un poco de miel.",
  "Tazón de yogur, nueces y mango":
    "Verter el yogur en un bol.\nTrocear el mango en dados.\nAñadir el mango y las nueces picadas encima.",
  "Porridge de avena con canela y manzana":
    "Calentar la leche con la canela.\nAñadir la avena y cocinar 5-7 minutos.\nTrocear la manzana en dados.\nServir la avena caliente y coronar con la manzana.",
  "Pudding de chía con leche y fresa":
    "Mezclar la chía con la leche en un bote.\nRemover bien y refrigerar mínimo 4 horas.\nAñadir las fresas troceadas antes de servir.",
  "Tortita de avena y plátano":
    "Triturar la avena con el plátano, el huevo y la leche.\nCalentar una sartén antiadherente.\nVerter porciones pequeñas y cocinar 2 minutos por cada lado.",
  "Tostada de salmón ahumado y aguacate":
    "Tostar el pan integral.\nAplastar el aguacate con un chorro de limón.\nExtender sobre el pan y colocar el salmón ahumado encima.",
  "Huevos poché sobre tostada":
    "Llevar agua con vinagre a ebullición suave.\nCascar el huevo y sumergirlo 3 minutos.\nTostar el pan y aliñar con aceite y sal.\nColocar el huevo escurrido sobre la tostada.",
  "Batido verde de espinacas y plátano":
    "Poner todos los ingredientes en la batidora.\nTriturar hasta conseguir textura fina.\nServir inmediatamente.",
  "Bowl de yogur, kiwi y semillas":
    "Pelar y trocear el kiwi.\nVerter el yogur en un bol.\nAñadir el kiwi y las semillas por encima.",
  "Pan integral con hummus y tomate":
    "Tostar el pan.\nExtender el hummus generosamente.\nColocar rodajas de tomate con un poco de sal.",
  "Tortilla de claras con champiñones":
    "Saltear los champiñones laminados con aceite y sal.\nBatir las claras y añadir a la sartén.\nCocinar a fuego medio hasta cuajar.\nDoblar y servir.",
  "Yogur con granola casera y frutos secos":
    "Servir el yogur en un bol.\nCubrir con la granola y las almendras picadas.",
  "Crepes de avena con crema de cacahuete":
    "Batir la avena con el huevo y la leche.\nCocinar crepes finas en una sartén antiadherente.\nRellenar con crema de cacahuete y enrollar.",
  "Desayuno inglés saludable":
    "Hacer los huevos a la plancha.\nSaltear los champiñones y el tomate partido por la mitad.\nDorar el bacon en la misma sartén.\nServir todo junto con el pan tostado.",
  "Muesli con leche y fruta":
    "Verter el muesli en un bol.\nCubrir con leche.\nAñadir la manzana troceada por encima.",
  "Tostada con jamón cocido y aguacate":
    "Tostar el pan integral.\nAplastar el aguacate con sal.\nExtender y colocar el jamón cocido encima.",
  "Huevos al plato con tomate":
    "Pochar la cebolla con aceite.\nAñadir el tomate triturado y cocinar 10 minutos.\nHacer huecos y cascar los huevos.\nTapar y cocinar hasta que cuajen las claras.",
  "Yogur con muesli y plátano":
    "Servir el yogur en un bol.\nAñadir el muesli y el plátano en rodajas.",
  "Smoothie de fresa y yogur":
    "Poner las fresas, el yogur, la leche y la miel en la batidora.\nTriturar hasta que quede homogéneo.",
  "Granola casera con leche":
    "Servir la granola en un bol.\nCubrir con leche y añadir el plátano en rodajas.",
  "Sándwich de pavo, queso y lechuga":
    "Tostar ligeramente el pan.\nMontar con la lechuga, el pavo y el queso.\nCerrar y partir por la mitad.",
  "Tostadas francesas saludables":
    "Batir el huevo con la leche y la canela.\nEmpapar el pan en la mezcla.\nDorar en sartén antiadherente 2 minutos por cada lado.",
  "Tortilla de atún y cebolla":
    "Pochar la cebolla con aceite.\nBatir los huevos con el atún escurrido.\nVerter sobre la cebolla y cuajar por ambos lados.",
  "Bowl de avena nocturna con cacao":
    "Mezclar la avena con la leche y el cacao.\nRefrigerar toda la noche.\nAñadir el plátano en rodajas antes de servir.",

  // ─────────────── ENSALADAS ───────────────
  "Ensalada César":
    "Cocinar la pechuga de pollo a la plancha y cortar en tiras.\nTostar el pan en dados para crutones.\nMezclar la lechuga con el aliño de aceite y limón.\nAñadir el pollo, los crutones y el parmesano rallado.",
  "Ensalada griega":
    "Cortar el tomate, el pepino y la cebolla en dados grandes.\nMezclar en un bol con las aceitunas.\nAñadir el feta en trozos.\nAliñar con aceite, sal y orégano al servir.",
  "Ensalada caprese":
    "Cortar el tomate y la mozzarella en rodajas del mismo grosor.\nAlternar en un plato con hojas de albahaca.\nTerminar con aceite y sal en escamas.",
  "Ensalada de atún con aguacate":
    "Escurrir el atún.\nTrocear el tomate, el aguacate y la cebolla.\nMezclar todo y aliñar con aceite.",
  "Ensalada de lentejas con verduras":
    "Picar el pimiento, la zanahoria y la cebolla en dados finos.\nMezclar con las lentejas cocidas.\nAliñar con aceite y vinagre al gusto.",
  "Ensalada de quinoa con pepino y tomate":
    "Cocer la quinoa en agua con sal 15 minutos y escurrir.\nEnfriar y añadir el tomate, el pepino y la menta picada.\nAliñar con aceite y limón.",
  "Ensalada de pasta fría":
    "Cocer la pasta al dente y enfriar bajo el grifo.\nMezclar con el tomate, el pimiento y las aceitunas.\nAliñar con aceite, sal y orégano.",
  "Ensalada de garbanzos con cebolla":
    "Escurrir los garbanzos cocidos.\nPicar la cebolla, el tomate y el pimiento.\nMezclar todo y aliñar con aceite y vinagre.",
  "Ensalada mixta con huevo":
    "Cocer el huevo 10 minutos, enfriar y pelar.\nLavar la lechuga y cortar el tomate y la zanahoria.\nEmplatar con el atún y el huevo troceado.\nAliñar con aceite y sal.",
  "Ensalada Waldorf":
    "Trocear la manzana y el apio.\nMezclar con las nueces y el yogur.\nServir sobre hojas de lechuga.",
  "Ensalada de espinacas y fresa":
    "Lavar las espinacas baby.\nTrocear las fresas y mezclar con las espinacas.\nAñadir el queso feta desmenuzado y las nueces.\nAliñar con aceite y un toque de vinagre.",
  "Ensalada de pollo al curry":
    "Cocinar el pollo y cortar en dados.\nMezclar con yogur, curry, manzana en dados y sal.\nServir sobre una cama de lechuga.",
  "Ensalada niçoise":
    "Cocer la patata 15 min y las judías 5 min, enfriar.\nCocer el huevo 10 minutos.\nMontar con el atún, las aceitunas y los demás ingredientes.\nAliñar con aceite y sal.",
  "Ensalada de rúcula y parmesano":
    "Disponer la rúcula en el plato.\nLaminar el parmesano con un pelador.\nAliñar con aceite y limón.",
  "Ensalada de col kale y manzana":
    "Masajear el kale con aceite y sal hasta ablandarlo.\nAñadir la manzana en bastones, las nueces y el limón.\nMezclar bien.",
  "Ensalada caprese de sandía":
    "Cortar la sandía y la mozzarella en dados.\nAlternar en el plato con hojas de albahaca.\nAliñar con un hilo de aceite.",
  "Ensalada templada de pollo":
    "Cocinar el pollo a la plancha y cortar en tiras.\nMontar con la lechuga, el tomate y el maíz.\nColocar el pollo caliente encima y aliñar.",
  "Ensalada de remolacha y queso feta":
    "Cortar la remolacha cocida en dados.\nMontar con la rúcula y el feta desmenuzado.\nAñadir las nueces y aliñar con aceite.",
  "Ensalada oriental de pollo":
    "Cocinar el pollo y cortar en tiras.\nRallar la zanahoria y cortar el pepino en bastones.\nMezclar y aliñar con salsa de soja y sésamo.",
  "Ensalada de tabulé":
    "Hidratar el cuscús con agua hirviendo 10 minutos.\nPicar el tomate, el perejil y la menta muy finos.\nMezclar todo y aliñar con aceite y limón.",
  "Ensalada de judías verdes y patata":
    "Cocer las judías 8 minutos y las patatas 15 minutos.\nEscurrir y cortar las patatas en dados.\nAliñar con aceite, cebolla picada y sal.",
  "Ensalada de mango y aguacate":
    "Trocear el mango y el aguacate en dados.\nMezclar con la lechuga troceada.\nAliñar con aceite y limón.",
  "Ensalada Cobb":
    "Cocinar el pollo y el bacon.\nCocer el huevo y cortar en cuartos.\nMontar la ensalada en filas con cada ingrediente.\nAliñar con aceite y limón.",
  "Ensalada de naranja y bacalao":
    "Desalar el bacalao y desmigar.\nPelar y trocear la naranja en rodajas.\nMezclar con la cebolla y las aceitunas.\nAliñar con aceite.",
  "Ensalada de pepino y yogur":
    "Rallar el pepino y escurrir el exceso de agua.\nMezclar con el yogur, el ajo picado y la menta.\nSalar al gusto.",
  "Ensalada de pimientos asados":
    "Asar los pimientos al horno 40 minutos a 200°C.\nPelar y cortar en tiras.\nAliñar con ajo picado, aceite y sal.",
  "Ensalada de brotes con salmón":
    "Disponer los brotes en el plato.\nAñadir el salmón ahumado y el aguacate en láminas.\nAliñar con limón y aceite.",
  "Ensalada de tomate y cebolla":
    "Cortar el tomate en rodajas y la cebolla en juliana.\nMezclar y aliñar con aceite y sal.",
  "Ensalada de zanahoria rallada":
    "Rallar la zanahoria en hebras finas.\nMezclar con las pasas, el limón y el aceite.",
  "Ensalada de maíz, aguacate y tomate":
    "Escurrir el maíz.\nTrocear el aguacate y el tomate.\nMezclar todo con limón y aceite.",

  // ─────────────── SOPAS Y CREMAS ───────────────
  "Gazpacho andaluz":
    "Triturar todos los ingredientes en la batidora.\nColar para eliminar pieles.\nEnfriar al menos 2 horas antes de servir.",
  "Crema de calabaza":
    "Pochar la cebolla en aceite.\nAñadir la calabaza y la patata en dados, cubrir con agua y cocer 20 min.\nTriturar hasta obtener una crema fina y salar.",
  "Crema de calabacín":
    "Pochar la cebolla con aceite.\nAñadir el calabacín y cubrir con agua.\nCocer 15 minutos y triturar con el queso fresco.",
  "Sopa de verduras":
    "Trocear todas las verduras en dados pequeños.\nSaltear en aceite 5 minutos.\nCubrir con agua y cocer 25 minutos.\nSalar al gusto.",
  "Sopa minestrone":
    "Pochar la cebolla, la zanahoria y el apio.\nAñadir el tomate y las alubias, cubrir con agua y cocer 15 min.\nIncorporar la pasta y cocer 10 minutos más.",
  "Crema de zanahoria y jengibre":
    "Pochar la cebolla en aceite.\nAñadir la zanahoria y el jengibre rallado.\nCubrir con agua, cocer 20 minutos y triturar.",
  "Sopa de pollo con fideos":
    "Hervir el pollo con la zanahoria, la cebolla y el apio 30 minutos.\nRetirar el pollo y desmigar la carne.\nAñadir los fideos al caldo y cocer 8 minutos.\nIncorporar el pollo y servir.",
  "Crema de champiñones":
    "Saltear la cebolla y los champiñones laminados.\nCubrir con agua y cocer 15 minutos.\nTriturar con la nata y salar.",
  "Sopa de tomate":
    "Asar los tomates con la cebolla y el ajo 20 min a 200°C.\nTriturar con la albahaca y un chorro de aceite.\nCalentar y servir.",
  "Sopa de lentejas":
    "Pochar la cebolla y la zanahoria.\nAñadir el tomate, las lentejas y agua abundante.\nCocer 40 minutos hasta que las lentejas estén tiernas.",
  "Sopa de miso":
    "Hervir agua y apartar del fuego.\nDisolver el miso sin que hierva.\nAñadir el tofu en dados, el alga y el cebollino.",
  "Sopa juliana":
    "Cortar todas las verduras en juliana fina.\nSaltear en aceite 5 minutos.\nCubrir con agua y cocer 20 minutos.",
  "Sopa de cebolla":
    "Pochar la cebolla en juliana a fuego lento 30 minutos.\nAñadir agua y cocer 15 minutos más.\nServir con pan tostado y queso gratinado.",
  "Crema de brócoli":
    "Pochar la cebolla y la patata.\nAñadir el brócoli y cubrir con agua.\nCocer 15 min y triturar hasta crema fina.",
  "Sopa de pescado":
    "Sofreír la cebolla, el ajo y el tomate.\nAñadir agua y llevar a ebullición.\nIncorporar la merluza y las gambas.\nCocer 8 minutos y servir.",
  "Crema de espárragos":
    "Pochar la cebolla con la patata.\nAñadir los espárragos troceados y cubrir con agua.\nCocer 15 min y triturar.",
  "Sopa de ajo":
    "Dorar los ajos laminados en aceite.\nAñadir el pan y el pimentón, remover.\nCubrir con agua y cocer 10 minutos.\nCascar los huevos encima y cuajar 3 minutos.",
  "Ajoblanco":
    "Remojar el pan con agua.\nTriturar las almendras con el ajo, el pan y el aceite.\nAjustar con agua fría y vinagre.\nEnfriar antes de servir.",
  "Salmorejo":
    "Triturar el tomate con el pan remojado, el ajo y el aceite.\nColar si se quiere textura más fina.\nEnfriar y servir con jamón y huevo duro picado.",
  "Sopa de garbanzos y espinacas":
    "Pochar la cebolla y el ajo.\nAñadir los garbanzos y agua, cocer 10 min.\nIncorporar las espinacas y cocinar 5 minutos más.",
  "Crema de coliflor":
    "Cocer la coliflor con la patata 15 minutos.\nTriturar con el queso y un poco del caldo.\nAjustar la sal.",
  "Sopa de fideos con verduras":
    "Saltear la cebolla, la zanahoria y el puerro.\nCubrir con agua y cocer 10 minutos.\nAñadir los fideos y cocer 8 minutos más.",
  "Caldo de pollo casero":
    "Cubrir el pollo y las verduras con agua fría.\nLlevar a ebullición y retirar la espuma.\nCocer a fuego lento 90 minutos y colar.",
  "Sopa tailandesa tom kha":
    "Hervir la leche de coco con el jengibre.\nAñadir el pollo en tiras y los champiñones.\nCocer 10 min y terminar con zumo de lima.",
  "Crema de puerro y patata":
    "Pochar el puerro con la cebolla.\nAñadir la patata y cubrir con agua.\nCocer 20 minutos y triturar.",

  // ─────────────── ARROCES Y GRANOS ───────────────
  "Arroz blanco hervido":
    "Hervir 2 partes de agua con sal por 1 de arroz.\nAñadir el arroz y cocer 15-18 minutos.\nEscurrir si sobra agua y remover con un poco de aceite.",
  "Arroz tres delicias":
    "Cocer el arroz y enfriar.\nHacer una tortilla fina y cortar en tiras.\nSaltear el jamón con la zanahoria y los guisantes.\nIncorporar el arroz y la tortilla, mezclar bien.",
  "Arroz con pollo":
    "Dorar el pollo troceado en la cazuela.\nAñadir la cebolla, el pimiento y el tomate; sofreír.\nIncorporar el arroz y cubrir con doble de agua.\nCocer 18 minutos y reposar 5.",
  "Paella mixta":
    "Dorar el pollo en la paellera.\nAñadir el pimiento, el tomate y sofreír.\nIncorporar el arroz, el azafrán y el caldo caliente.\nAñadir las gambas y los mejillones y cocer 18 minutos sin remover.",
  "Arroz a la cubana":
    "Cocer el arroz blanco.\nFreír los plátanos en rodajas.\nHacer el huevo frito y preparar salsa de tomate.\nMontar el plato con el arroz, el huevo, el plátano y el tomate.",
  "Arroz caldoso con gambas":
    "Sofreír el ajo, la cebolla y el tomate.\nAñadir el arroz y tostar unos segundos.\nCubrir con caldo abundante y cocer 15 minutos.\nIncorporar las gambas y cocer 3 minutos más.",
  "Arroz al curry con verduras":
    "Pochar la cebolla con el curry.\nAñadir la zanahoria y los guisantes.\nIncorporar el arroz y cubrir con agua.\nCocer 15 minutos hasta absorber el líquido.",
  "Risotto de setas":
    "Sofreír la cebolla picada en mantequilla.\nAñadir los champiñones y el arroz.\nIr añadiendo caldo caliente y remover 18 minutos.\nTerminar con parmesano y una nuez de mantequilla.",
  "Arroz integral con salmón":
    "Cocer el arroz integral 35 minutos.\nCocinar el salmón a la plancha con limón.\nHervir el brócoli al dente 5 minutos.\nMontar el bol con el arroz, el salmón y el brócoli.",
  "Arroz meloso de verduras":
    "Sofreír las verduras en dados.\nAñadir el arroz y cubrir con caldo.\nCocer 17 minutos removiendo a veces.",
  "Arroz con leche":
    "Hervir la leche con canela y limón.\nAñadir el arroz y cocer a fuego lento 40 minutos removiendo.\nAgregar el azúcar al final y enfriar.",
  "Arroz basmati con especias":
    "Derretir la mantequilla con el comino y el cardamomo.\nAñadir el arroz y tostar 1 minuto.\nCubrir con agua y cocer 15 minutos tapado.",
  "Quinoa con pollo y verduras":
    "Cocer la quinoa 15 minutos y escurrir.\nSaltear el pollo en dados con las verduras.\nMezclar con la quinoa y aliñar.",
  "Bowl de quinoa, atún y aguacate":
    "Cocer la quinoa y enfriar.\nMontar el bol con el atún, el aguacate y el tomate.\nAliñar con limón y un hilo de aceite.",
  "Tabulé de quinoa":
    "Cocer la quinoa y enfriar.\nPicar el tomate, el pepino y el perejil finos.\nMezclar todo con limón y aceite.",
  "Cuscús con verduras":
    "Saltear las verduras en dados 8 minutos.\nHidratar el cuscús con agua caliente y sal.\nMezclar con las verduras y los garbanzos.",
  "Cuscús con pollo y cebolla":
    "Pochar la cebolla con el comino.\nAñadir el pollo en dados y dorar.\nHidratar el cuscús y servir con el pollo encima.",
  "Bulgur con verduras":
    "Cocer el bulgur 12 minutos en agua con sal.\nSofreír la cebolla y el tomate.\nMezclar con el bulgur y el perejil.",
  "Arroz frito con huevo":
    "Batir el huevo y cuajarlo en la sartén, retirar.\nSaltear la cebolla y los guisantes.\nAñadir el arroz cocido y la soja.\nIncorporar el huevo al final.",
  "Arroz negro con calamares":
    "Sofreír el ajo, la cebolla y los calamares.\nAñadir la tinta y el arroz.\nCubrir con caldo y cocer 18 minutos.",
  "Arroz jazmín con pollo al curry":
    "Saltear el pollo con la cebolla.\nAñadir el curry y la leche de coco, cocer 10 min.\nCocer el arroz aparte y servir juntos.",
  "Risotto de espárragos":
    "Sofreír la cebolla en mantequilla.\nAñadir el arroz y tostar.\nAñadir caldo caliente poco a poco removiendo 18 min.\nIncorporar los espárragos cocidos y el parmesano.",
  "Quinoa con salmón y brócoli":
    "Cocer la quinoa y el brócoli por separado.\nCocinar el salmón a la plancha.\nMontar el plato y aliñar con aceite.",
  "Arroz con leche y canela":
    "Hervir la leche con canela.\nIncorporar el arroz y cocer a fuego lento 40 min.\nAñadir el azúcar al final.",
  "Arroz salvaje con champiñones":
    "Cocer el arroz salvaje 35 minutos.\nSaltear los champiñones con ajo y perejil.\nMezclar todo y servir.",

  // ─────────────── PASTAS ───────────────
  "Espaguetis a la boloñesa":
    "Sofreír la cebolla, el ajo y la zanahoria picados.\nAñadir la carne picada y dorar.\nIncorporar el tomate y cocer 30 minutos.\nHervir la pasta al dente y mezclar con la salsa.",
  "Macarrones a la carbonara":
    "Hervir la pasta al dente.\nDorar el bacon en dados.\nBatir los huevos con el parmesano y pimienta.\nMezclar la pasta caliente con el bacon y los huevos fuera del fuego.",
  "Penne con tomate y albahaca":
    "Sofreír el ajo con aceite.\nAñadir el tomate y cocer 15 minutos.\nHervir la pasta y mezclar con la salsa.\nTerminar con albahaca fresca.",
  "Espaguetis con gambas y ajo":
    "Saltear el ajo laminado en aceite.\nAñadir las gambas y cocinar 3 minutos.\nMezclar con la pasta hervida al dente.\nTerminar con perejil picado.",
  "Lasaña de carne":
    "Preparar una boloñesa con la carne y el tomate.\nHacer una bechamel básica.\nMontar capas de pasta, carne y bechamel.\nCubrir con queso y hornear 30 min a 180°C.",
  "Pasta pesto":
    "Triturar albahaca, piñones, ajo, parmesano y aceite.\nHervir la pasta.\nMezclar en frío con el pesto.",
  "Macarrones al queso":
    "Hervir la pasta al dente.\nHacer una bechamel y añadir el queso rallado.\nMezclar con la pasta y gratinar 10 minutos.",
  "Espaguetis con atún":
    "Sofreír la cebolla con el tomate.\nAñadir el atún escurrido.\nMezclar con la pasta cocida.",
  "Pasta primavera con verduras":
    "Saltear las verduras en dados 8 minutos.\nHervir la pasta al dente.\nMezclar y aliñar con aceite.",
  "Canelones de espinacas":
    "Saltear las espinacas y mezclar con la ricota.\nRellenar los canelones ya hidratados.\nCubrir con bechamel y queso.\nHornear 25 minutos a 180°C.",
  "Espaguetis a la puttanesca":
    "Sofreír el ajo con aceite y guindilla.\nAñadir el tomate, las aceitunas y las alcaparras.\nCocer 10 min y mezclar con la pasta.",
  "Ñoquis con salsa de tomate":
    "Cocer los ñoquis hasta que floten (2-3 min).\nHacer una salsa con ajo, tomate y albahaca.\nMezclar y servir.",
  "Raviolis con salvia":
    "Cocer los raviolis 3-4 minutos.\nDerretir la mantequilla con las hojas de salvia.\nMezclar la pasta con la mantequilla y el parmesano.",
  "Fettuccine Alfredo":
    "Hervir la pasta al dente.\nCalentar la nata con la mantequilla.\nAñadir el parmesano y mezclar con la pasta.",
  "Pasta con brócoli y ajo":
    "Hervir el brócoli y la pasta juntos.\nSaltear el ajo en aceite.\nMezclar todo con parmesano.",
  "Pasta fría con pollo":
    "Cocer la pasta y enfriar.\nCocinar el pollo y cortar en dados.\nMezclar con el tomate, el pimiento y aliño.",
  "Pasta con salmón y nata":
    "Pochar la cebolla.\nAñadir el salmón en dados y la nata.\nCocer 5 min y mezclar con la pasta y el eneldo.",
  "Tallarines con verduras salteadas":
    "Cocer los tallarines al dente.\nSaltear las verduras en el wok.\nIncorporar los tallarines y la soja.",
  "Pasta con pollo al pesto":
    "Cocinar el pollo en dados.\nTriturar albahaca, piñones, parmesano, ajo y aceite.\nMezclar la pasta con el pesto y el pollo.",
  "Espaguetis con almejas":
    "Abrir las almejas al vapor, reservando el jugo.\nSaltear el ajo con aceite y añadir el jugo.\nMezclar la pasta con las almejas y perejil.",

  // ─────────────── LEGUMBRES ───────────────
  "Lentejas guisadas":
    "Pochar la cebolla, el ajo y la zanahoria.\nAñadir el tomate, el pimentón y las lentejas.\nCubrir con agua y cocer 40 minutos.\nAjustar sal al final.",
  "Garbanzos con espinacas":
    "Dorar el ajo con el pimentón.\nAñadir los garbanzos y un poco de agua.\nIncorporar las espinacas y cocinar 10 minutos.",
  "Cocido madrileño simplificado":
    "Cocer la carne y el pollo con agua 45 min.\nAñadir los garbanzos, la zanahoria y el repollo.\nCocer 30 minutos más.\nSeparar caldo, carne y garbanzos al servir.",
  "Hummus casero":
    "Triturar los garbanzos con tahini, ajo, limón y comino.\nAjustar con aceite y agua hasta la textura deseada.\nServir con aceite encima.",
  "Alubias con chorizo":
    "Pochar la cebolla y el ajo.\nAñadir el chorizo en rodajas y dorar.\nIncorporar las alubias, el tomate y agua.\nCocer 25 minutos.",
  "Lentejas con arroz":
    "Pochar mucha cebolla a fuego lento hasta caramelizar.\nAñadir las lentejas y cocer 20 minutos.\nIncorporar el arroz y el comino, cocer 15 min más.",
  "Curry de garbanzos":
    "Pochar la cebolla con el ajo.\nAñadir el curry, el tomate y la leche de coco.\nIncorporar los garbanzos y cocer 15 minutos.",
  "Chili con carne":
    "Dorar la carne picada con la cebolla y el pimiento.\nAñadir el tomate, las alubias y las especias.\nCocer 40 minutos a fuego lento.",
  "Guiso de alubias pintas":
    "Pochar la cebolla, el ajo y el tomate.\nAñadir las alubias, el chorizo y agua.\nCocer 30 minutos a fuego bajo.",
  "Ensalada tibia de lentejas":
    "Calentar las lentejas con un poco de aceite.\nAñadir el tomate, el pimiento y la cebolla picados.\nAliñar con aceite y vinagre.",
  "Crema de garbanzos":
    "Pochar la cebolla y el ajo.\nAñadir los garbanzos con el comino y agua.\nCocer 10 min y triturar hasta crema.",
  "Falafel al horno":
    "Triturar los garbanzos con el perejil, el ajo y el comino.\nFormar bolas y pincelar con aceite.\nHornear 20 minutos a 200°C dándoles la vuelta.",
  "Judías blancas con verduras":
    "Pochar el puerro y el ajo.\nAñadir el tomate y las alubias.\nCocer 20 minutos a fuego lento.",
  "Potaje de garbanzos y bacalao":
    "Pochar la cebolla y el ajo.\nAñadir los garbanzos y el bacalao desalado.\nIncorporar las espinacas y cocer 15 min.",
  "Guiso de soja texturizada":
    "Hidratar la soja con caldo caliente 10 min.\nSofreír la cebolla, el ajo y el tomate.\nAñadir la soja escurrida y cocer 15 min.",
  "Edamame salteado":
    "Cocer los edamame 5 minutos en agua con sal.\nEscurrir y saltear brevemente con aceite y sal.",
  "Alubias rojas con arroz":
    "Sofreír la cebolla, el ajo y el pimiento.\nAñadir las alubias y cocer 10 min.\nCocer el arroz aparte y servir juntos.",
  "Hamburguesa de lentejas":
    "Triturar las lentejas con la avena, cebolla y ajo.\nFormar hamburguesas.\nDorar en la sartén 4 minutos por cada lado.",
  "Hamburguesa de garbanzos":
    "Triturar los garbanzos con la avena, perejil y especias.\nFormar hamburguesas.\nCocinar en la sartén o al horno 20 min.",
  "Chili vegetariano":
    "Pochar la cebolla y el pimiento.\nAñadir el tomate, las alubias, el maíz y las especias.\nCocer 25 minutos.",
  "Dal de lentejas rojas":
    "Pochar la cebolla con el jengibre y el curry.\nAñadir las lentejas, agua y leche de coco.\nCocer 20 minutos hasta que se deshagan.",
  "Ensalada de alubias blancas":
    "Escurrir las alubias cocidas.\nMezclar con el tomate, la cebolla picada y el vinagre.\nAliñar con aceite.",
  "Lentejas al curry con coco":
    "Pochar la cebolla con el curry.\nAñadir el tomate, las lentejas y la leche de coco.\nCocer 30 minutos.",
  "Cocido de garbanzos":
    "Cocer el pollo con los garbanzos 40 minutos.\nAñadir las verduras y cocer 20 min más.\nSeparar caldo y servir los garbanzos.",
  "Crema de lentejas rojas":
    "Pochar la cebolla con la zanahoria y el jengibre.\nAñadir las lentejas, el curry y agua.\nCocer 25 min y triturar.",

  // ─────────────── PESCADOS ───────────────
  "Salmón al horno con limón":
    "Precalentar el horno a 180°C.\nColocar el salmón en una fuente con ajo laminado y eneldo.\nRociar con aceite y limón.\nHornear 15 minutos.",
  "Merluza a la plancha":
    "Secar bien la merluza.\nCalentar la plancha con aceite.\nCocinar 3-4 minutos por cada lado.\nServir con limón y perejil.",
  "Atún a la parrilla":
    "Marinar el atún con soja y sésamo 10 min.\nCalentar la parrilla bien fuerte.\nSellar 1-2 minutos por cada lado.",
  "Bacalao al pil pil":
    "Confitar los ajos con la guindilla en aceite.\nRetirar y cocinar el bacalao en ese aceite.\nEmulsionar moviendo la cazuela para ligar la salsa.",
  "Lubina a la sal":
    "Cubrir el fondo de una bandeja con sal.\nColocar la lubina y cubrir con más sal humedecida.\nHornear 25 minutos a 200°C.\nRomper la costra y servir.",
  "Dorada a la espalda":
    "Abrir la dorada por la mitad y asar 15 min a 200°C.\nDorar el ajo laminado en aceite con vinagre.\nVerter sobre la dorada al servir.",
  "Boquerones en vinagre":
    "Limpiar los boquerones y retirar la espina.\nCubrirlos de vinagre 2 horas en la nevera.\nEscurrir y aliñar con aceite, ajo y perejil.",
  "Sardinas a la plancha":
    "Limpiar las sardinas.\nCalentar la plancha con aceite y sal.\nCocinar 2-3 minutos por cada lado.\nServir con limón.",
  "Salmón teriyaki":
    "Mezclar soja, miel y jengibre.\nCocinar el salmón en la sartén 3 min por cada lado.\nIncorporar la salsa y glasear 2 minutos.",
  "Tartar de atún":
    "Cortar el atún en daditos pequeños.\nMezclar con salsa de soja, lima y sésamo.\nMontar con aguacate en dados y servir frío.",
  "Ceviche de corvina":
    "Cortar la corvina en dados.\nMarinarla en zumo de lima 10 minutos.\nAñadir cebolla, cilantro y guindilla.",
  "Pescadito frito":
    "Secar los boquerones y enharinar.\nFreír en aceite bien caliente 2 minutos.\nEscurrir sobre papel y salar.\nServir con limón.",
  "Merluza en salsa verde":
    "Sofreír el ajo con la harina.\nAñadir perejil y caldo, remover.\nIncorporar la merluza y las almejas.\nCocer 5-7 minutos.",
  "Marmitako de bonito":
    "Sofreír la cebolla y el pimiento.\nAñadir la patata chascada y el tomate.\nCubrir con caldo y cocer 25 min.\nIncorporar el bonito al final 3 minutos.",
  "Caballa al horno":
    "Colocar la caballa en una fuente.\nAñadir ajo laminado, perejil y limón.\nHornear 15 minutos a 200°C.",
  "Salmón con quinoa y brócoli":
    "Cocer la quinoa y el brócoli.\nCocinar el salmón a la plancha.\nMontar el bol con todo y aliñar.",
  "Atún con cebolla encebollada":
    "Pochar mucha cebolla a fuego lento 20 min.\nAñadir el atún y el vino blanco.\nCocer 10 minutos.",
  "Brocheta de rape y gambas":
    "Ensartar rape, gambas y pimiento alternando.\nPincelar con aceite y ajo.\nCocinar en la plancha 3-4 min por cada lado.",
  "Merluza al vapor con verduras":
    "Cortar las verduras en juliana.\nColocar todo en la vaporera.\nCocer 10 minutos y aliñar con aceite.",
  "Salmón en papillote":
    "Colocar el salmón sobre papel con las verduras en juliana.\nAñadir limón y eneldo.\nCerrar el papillote y hornear 15 min a 200°C.",
  "Trucha a la navarra":
    "Rellenar las truchas con jamón serrano.\nDorar en la sartén con ajo y aceite.\nCocinar 4 minutos por cada lado.",
  "Lomo de atún con sésamo":
    "Pasar el atún por el sésamo apretando.\nSellar en la sartén 1 min por cada lado.\nCortar en rodajas y aliñar con soja.",
  "Tacos de pescado":
    "Cocinar la merluza en dados con sal.\nCalentar las tortillas.\nRellenar con pescado, col y aguacate.\nTerminar con un chorro de lima.",
  "Sopa de pescado y marisco":
    "Sofreír la cebolla, el ajo y el tomate.\nAñadir agua y llevar a ebullición.\nIncorporar merluza, gambas y almejas.\nCocer 8 minutos.",
  "Pulpo a la gallega":
    "Cocer el pulpo 40 minutos (con susto tres veces).\nCocer las patatas en el caldo 20 min.\nServir en rodajas con aceite, pimentón y sal.",
  "Mejillones al vapor":
    "Limpiar bien los mejillones.\nPoner en una olla con vino blanco, ajo y perejil.\nTapar y cocinar 5 minutos hasta que abran.",
  "Gambas al ajillo":
    "Dorar el ajo laminado en aceite.\nAñadir la guindilla y las gambas.\nSaltear 2 minutos y terminar con perejil.",
  "Calamares a la plancha":
    "Limpiar los calamares y hacer cortes.\nCocinar en la plancha bien caliente con aceite.\nServir con ajo, perejil y limón.",
  "Sepia a la plancha":
    "Cortar la sepia y secar bien.\nCocinar en la plancha muy caliente 3 min por cada lado.\nTerminar con ajo y perejil picados.",
  "Arroz con bacalao":
    "Sofreír el ajo, el pimiento y el tomate.\nAñadir el bacalao desmigado y el arroz.\nCubrir con caldo y cocer 18 minutos.",

  // ─────────────── CARNES ───────────────
  "Solomillo de ternera al horno":
    "Sellar el solomillo por todos lados en sartén.\nColocar en bandeja con ajo y romero.\nHornear 12-15 min a 200°C para término medio.\nReposar 5 minutos antes de cortar.",
  "Filete de ternera a la plancha":
    "Salpimentar el filete.\nCalentar la plancha con un poco de aceite.\nCocinar 2-3 minutos por cada lado.",
  "Albóndigas en salsa de tomate":
    "Mezclar la carne con huevo, pan rallado, ajo y perejil.\nFormar bolas y dorar en la sartén.\nSofreír cebolla y tomate, añadir las albóndigas.\nCocer 20 minutos.",
  "Hamburguesa casera":
    "Formar una hamburguesa con la carne picada.\nCocinar en la plancha 3 minutos por cada lado.\nMontar el pan con lechuga, tomate, queso y la hamburguesa.",
  "Entrecot a la plancha":
    "Atemperar la carne 20 min fuera de la nevera.\nCalentar la plancha al máximo con aceite.\nCocinar 2 min por cada lado para término medio.\nReposar con sal en escamas.",
  "Ragú de ternera":
    "Dorar la ternera en dados.\nAñadir la cebolla y la zanahoria, sofreír.\nIncorporar el vino y reducir.\nAñadir tomate y cocer 90 minutos a fuego lento.",
  "Carne guisada con patatas":
    "Dorar la ternera.\nAñadir la cebolla, la zanahoria y el tomate.\nIncorporar la patata chascada y agua.\nCocer 45 min hasta que todo esté tierno.",
  "Cordero asado":
    "Marinar el cordero con ajo, romero y aceite.\nAsar a 180°C durante 60-75 min según peso.\nRociar con vino blanco a mitad de cocción.",
  "Costillas al horno con miel":
    "Mezclar la miel, soja y ajo.\nMarinar las costillas 20 min.\nHornear 45 minutos a 180°C pincelando con la salsa.",
  "Brocheta de ternera y pimientos":
    "Ensartar dados de ternera con pimiento y cebolla.\nAliñar con aceite y sal.\nCocinar en la plancha 3-4 min por cada lado.",
  "Escalope de ternera":
    "Aplanar el filete.\nPasar por huevo y pan rallado.\nFreír en aceite 2-3 min por cada lado.\nServir con limón.",
  "Ropa vieja":
    "Cocer la ternera y deshilachar.\nSofreír la cebolla, el ajo, el pimiento y el tomate.\nAñadir la carne y cocer 10 minutos.",
  "Estofado de ternera":
    "Dorar la ternera en dados.\nAñadir la cebolla y la zanahoria.\nIncorporar el vino y la patata chascada.\nCocer 90 minutos a fuego lento.",
  "Bistec empanado":
    "Aplanar el bistec.\nPasar por huevo y pan rallado.\nFreír en aceite caliente 2 min por cada lado.",
  "Tataki de ternera":
    "Sellar la carne 30 segundos por lado en sartén muy caliente.\nEnfriar y cortar en láminas finas.\nAliñar con soja, jengibre y sésamo.",
  "Salteado de ternera con brócoli":
    "Marinar la ternera en soja 10 minutos.\nSaltear en wok a fuego fuerte 3 minutos.\nAñadir el brócoli, ajo y jengibre.\nCocinar 3 minutos más.",
  "Lomo de cerdo asado":
    "Atar el lomo con hilo.\nMarinar con ajo, romero y aceite.\nAsar 50 min a 180°C rociando con vino.",
  "Solomillo de cerdo con manzana":
    "Sellar el solomillo en la sartén.\nPochar la cebolla con la manzana.\nAñadir la nata y cocer 10 minutos.\nServir el solomillo con la salsa.",
  "Costillas de cerdo a la barbacoa":
    "Untar las costillas con salsa BBQ y ajo.\nHornear 60 min a 160°C tapadas.\nDestapar y hornear 15 min más pincelando con salsa.",
  "Pinchos morunos":
    "Marinar el lomo con comino, pimentón y aceite 30 min.\nEnsartar con pimiento y cebolla.\nCocinar en la plancha 4 minutos por cada lado.",
  "Tacos de carne picada":
    "Sofreír la carne con cebolla y comino.\nCalentar las tortillas.\nRellenar con la carne y añadir tomate picado.",
  "Chuletas de cerdo a la plancha":
    "Salpimentar las chuletas.\nCalentar la plancha y añadir aceite.\nCocinar 3-4 minutos por cada lado.\nTerminar con ajo picado.",
  "Lasaña ligera de carne":
    "Saltear la carne con el calabacín rallado.\nAñadir el tomate y cocer 15 min.\nMontar capas de pasta, carne y queso.\nHornear 25 minutos a 180°C.",
  "Brochetas de cordero":
    "Marinar el cordero con comino y aceite.\nEnsartar con pimiento y cebolla.\nCocinar en la plancha 4 minutos por cada lado.",
  "Wok de ternera con verduras":
    "Saltear la ternera 2 min en wok muy caliente.\nAñadir las verduras en juliana.\nIncorporar la soja y cocinar 3 min más.",
  "Ternera stroganoff":
    "Dorar la ternera en tiras.\nSaltear la cebolla y los champiñones.\nAñadir la nata y cocer 10 minutos.",
  "Carpaccio de ternera":
    "Cortar la ternera en láminas muy finas.\nDisponer sobre el plato con rúcula.\nAliñar con aceite, limón y parmesano.",
  "Hamburguesa de ternera con queso":
    "Formar la hamburguesa con la carne.\nCocinar en la plancha 3 min por cada lado.\nAñadir el queso al final para que funda.\nMontar en el pan con lechuga y tomate.",
  "Secreto ibérico a la plancha":
    "Atemperar el secreto 15 minutos.\nCalentar la plancha con aceite.\nCocinar 3 minutos por cada lado.\nTerminar con sal en escamas.",
  "Chuletón a la brasa":
    "Atemperar la carne.\nCalentar la parrilla al máximo.\nSellar 2-3 minutos por cada lado.\nReposar 5 min antes de cortar.",

  // ─────────────── POLLO Y PAVO ───────────────
  "Pollo al curry":
    "Pochar la cebolla con el ajo.\nAñadir el curry y tostar 1 minuto.\nIncorporar el pollo en dados y sellar.\nAñadir la leche de coco y cocer 20 min.",
  "Pechuga de pollo a la plancha":
    "Aplanar la pechuga y salpimentar.\nCalentar la plancha con aceite.\nCocinar 3-4 minutos por cada lado.\nTerminar con un chorro de limón.",
  "Pollo asado al limón":
    "Rellenar el pollo con limón y ajo.\nPincelar con aceite y romero.\nAsar a 180°C durante 75 minutos.",
  "Pollo al horno con patatas":
    "Trocear el pollo y colocar con las patatas en una bandeja.\nAliñar con ajo, aceite y vino blanco.\nHornear 45-60 min a 180°C.",
  "Alitas de pollo al horno":
    "Adobar las alitas con pimentón, ajo y aceite.\nColocar en bandeja sin encimar.\nHornear 40 min a 200°C dándoles la vuelta.",
  "Pollo teriyaki":
    "Cocinar el pollo en dados a fuego medio.\nMezclar soja, miel y jengibre.\nIncorporar la salsa y glasear 3 minutos.\nTerminar con sésamo.",
  "Pollo cacciatore":
    "Dorar el pollo en cazuela.\nSaltear cebolla, pimiento y champiñones.\nAñadir el tomate y cocer 30 minutos.",
  "Wrap de pollo con lechuga":
    "Cocinar el pollo a la plancha y cortar en tiras.\nExtender la tortilla y poner yogur.\nAñadir lechuga, tomate y pollo.\nEnrollar apretando.",
  "Pollo al champiñón":
    "Sellar el pollo en la sartén.\nPochar la cebolla y los champiñones.\nAñadir nata y cocer 10 minutos.",
  "Pechuga de pavo a la plancha":
    "Aplanar la pechuga de pavo.\nCalentar la plancha con aceite.\nCocinar 3 minutos por cada lado.\nServir con perejil.",
  "Rollitos de pavo con queso":
    "Extender la pechuga y salpimentar.\nColocar queso y espinacas y enrollar.\nCocinar en la sartén sellando por todos lados.\nHornear 15 min a 180°C.",
  "Brocheta de pollo al pincho":
    "Marinar el pollo con comino y aceite.\nEnsartar con pimiento y cebolla.\nCocinar en la plancha 10 minutos dándoles vueltas.",
  "Pollo tikka masala":
    "Marinar el pollo con yogur, curry y jengibre.\nDorar en la sartén.\nAñadir el tomate y cocer 20 minutos.",
  "Pollo al ajillo":
    "Trocear el pollo.\nDorar con los ajos enteros.\nAñadir vino blanco y perejil.\nCocer 20 minutos.",
  "Pollo con verduras al wok":
    "Cortar el pollo en tiras.\nSaltear en wok muy caliente 3 minutos.\nAñadir las verduras y la soja.\nCocinar 4 minutos más.",
  "Pechuga de pavo con verduras":
    "Cortar la pechuga en dados.\nSaltear con el calabacín y el pimiento.\nCocinar 8-10 minutos.",
  "Pollo en pepitoria":
    "Dorar el pollo troceado.\nPochar la cebolla y añadir almendras molidas.\nIncorporar el azafrán, el huevo y cocer 30 min.",
  "Pollo a la cerveza":
    "Dorar el pollo por todos lados.\nPochar la cebolla y el ajo.\nAñadir la cerveza y cocer 40 minutos tapado.",
  "Pollo a la parmesana":
    "Empanar las pechugas aplanadas.\nDorar en la sartén.\nCubrir con tomate, mozzarella y parmesano.\nHornear 15 minutos a 200°C.",
  "Estofado de pollo":
    "Dorar el pollo.\nPochar la cebolla y la zanahoria.\nAñadir la patata, el vino y agua.\nCocer 40 minutos.",

  // ─────────────── VEGETARIANAS ───────────────
  "Tortilla española":
    "Pelar y laminar las patatas y la cebolla.\nConfitar en aceite a fuego bajo 25 minutos.\nBatir los huevos y mezclar con las patatas.\nCuajar en la sartén 3 min por cada lado.",
  "Pisto manchego":
    "Pochar la cebolla con los pimientos.\nAñadir el calabacín en dados.\nIncorporar el tomate y cocer 30 minutos.",
  "Berenjenas rellenas de verduras":
    "Partir las berenjenas y vaciar.\nSaltear la carne con la pulpa, cebolla y tomate.\nRellenar, cubrir con queso y hornear 25 min a 180°C.",
  "Tarta de calabacín":
    "Rallar el calabacín y escurrir.\nMezclar con huevo, harina, queso y cebolla.\nHornear 30 minutos a 180°C en molde.",
  "Tofu salteado con verduras":
    "Cortar el tofu en dados y marinar con soja.\nSaltear en wok hasta dorar.\nAñadir pimiento, brócoli y jengibre.\nCocinar 4 minutos más.",
  "Champiñones rellenos":
    "Quitar los tallos y picarlos.\nSaltear los tallos con ajo y perejil.\nRellenar las cabezas, cubrir con queso.\nHornear 15 min a 200°C.",
  "Verduras a la plancha":
    "Cortar las verduras en rodajas.\nPincelar con aceite y sal.\nCocinar en la plancha muy caliente 3-4 minutos por cada lado.",
  "Patatas al horno con romero":
    "Cortar las patatas en gajos.\nAliñar con ajo, romero, aceite y sal.\nHornear 35 minutos a 200°C dándoles la vuelta.",
  "Ratatouille":
    "Pochar la cebolla con el pimiento.\nAñadir la berenjena y el calabacín en dados.\nIncorporar el tomate y cocer 40 minutos.",
  "Pimientos del piquillo rellenos":
    "Pochar la cebolla con el bacalao desmigado.\nRellenar los pimientos.\nCubrir con nata y gratinar 10 minutos.",
  "Crepes de espinacas":
    "Saltear las espinacas con ajo.\nHacer crepes con harina, huevo y leche.\nRellenar, enrollar y gratinar con queso.",
  "Quiche de verduras":
    "Forrar un molde con la masa quebrada.\nSaltear el calabacín y distribuir.\nBatir huevo, nata y queso; verter.\nHornear 35 minutos a 180°C.",
  "Tortilla de patatas ligera":
    "Hornear las patatas con un poco de aceite 25 min.\nBatir los huevos con sal.\nMezclar con patata y cebolla pochada.\nCuajar en sartén por ambos lados.",
  "Croquetas de espinacas":
    "Saltear las espinacas.\nHacer una bechamel y mezclar con las espinacas.\nEnfriar, formar croquetas, empanar y freír.",
  "Revuelto de setas":
    "Saltear los champiñones con ajo.\nAñadir los huevos batidos.\nRemover a fuego suave hasta cuajar ligeramente.",
  "Berenjenas parmesanas":
    "Cortar la berenjena en rodajas y asar.\nMontar capas con tomate, mozzarella y parmesano.\nHornear 25 min a 180°C.",
  "Calabacines al horno con queso":
    "Cortar los calabacines en rodajas.\nColocar en bandeja con ajo y aceite.\nCubrir con queso y hornear 25 minutos a 200°C.",
  "Salteado de tofu y brócoli":
    "Dorar el tofu marinado con soja.\nAñadir el brócoli, ajo y sésamo.\nCocinar 5 minutos hasta que el brócoli esté tierno.",
  "Curry vegetal":
    "Pochar la cebolla con el curry.\nAñadir la patata y la coliflor en dados.\nIncorporar la leche de coco y los guisantes.\nCocer 25 minutos.",
  "Paella de verduras":
    "Sofreír las verduras en la paellera.\nAñadir el tomate y el azafrán.\nIncorporar el arroz y cubrir con caldo.\nCocer 18 minutos sin remover.",
  "Wok de verduras con soja":
    "Calentar el wok al máximo con un poco de aceite.\nSaltear las verduras 5-6 minutos.\nTerminar con salsa de soja.",
  "Tempura de verduras":
    "Hacer una masa con huevo, harina y agua muy fría.\nRebozar las verduras.\nFreír en aceite caliente 2 minutos.",
  "Espárragos gratinados":
    "Cocer los espárragos al vapor 5 minutos.\nColocar en una fuente con bechamel.\nCubrir con queso y gratinar 10 minutos.",
  "Coliflor al horno con queso":
    "Cocer la coliflor 5 minutos.\nColocar en fuente con nata y ajo.\nCubrir con queso y gratinar 20 min a 200°C.",
  "Hamburguesa vegetal de garbanzo":
    "Triturar los garbanzos con avena, perejil y especias.\nFormar hamburguesas.\nCocinar en sartén 4 minutos por cada lado.",

  // ─────────────── BATIDOS Y SMOOTHIES ───────────────
  "Smoothie verde detox":
    "Poner todos los ingredientes en la batidora.\nTriturar hasta quedar homogéneo.\nServir frío.",
  "Batido de plátano y fresa":
    "Colocar plátano, fresas y leche en la batidora.\nTriturar hasta que quede cremoso.",
  "Smoothie de mango y piña":
    "Trocear el mango y la piña.\nBatir con el yogur hasta quedar suave.",
  "Batido de proteínas y plátano":
    "Poner el plátano, la leche, la proteína y la avena.\nBatir 30 segundos.",
  "Smoothie de frutos rojos":
    "Triturar frambuesa y arándanos con el yogur.\nAñadir miel al gusto.",
  "Batido de chocolate y plátano":
    "Batir el plátano, la leche, la avena y el cacao.\nServir frío.",
  "Smoothie de aguacate y espinacas":
    "Triturar el aguacate, las espinacas, el plátano y la leche.\nBatir hasta quedar cremoso.",
  "Batido de naranja y zanahoria":
    "Licuar el zumo de naranja con la zanahoria y el jengibre.\nBatir hasta integrar.",
  "Smoothie de piña y coco":
    "Triturar la piña con la leche de coco y el yogur.\nServir frío.",
  "Batido de kiwi y manzana":
    "Pelar y trocear el kiwi y la manzana.\nBatir con agua hasta que sea fluido.",
  "Smoothie de remolacha":
    "Batir la remolacha, la manzana, la zanahoria y el limón.\nColar si se quiere más fino.",
  "Batido de melocotón y yogur":
    "Batir el melocotón con el yogur y la miel.",
  "Smoothie de arándanos y avena":
    "Batir los arándanos con la avena, la leche y el plátano.",
  "Batido de mango y cúrcuma":
    "Batir el mango con leche de coco y cúrcuma.\nServir bien frío.",
  "Smoothie de sandía y menta":
    "Quitar pepitas a la sandía.\nTriturar con la menta y el limón.",

  // ─────────────── SNACKS ───────────────
  "Hummus con crudités":
    "Cortar las verduras en bastones.\nServir con el hummus en un bol al centro.",
  "Edamame al vapor":
    "Cocer los edamame 5 minutos en agua con sal.\nEscurrir y añadir sal en escamas.",
  "Guacamole con nachos":
    "Aplastar el aguacate con lima y sal.\nAñadir tomate y cebolla picados muy finos.\nServir con los nachos.",
  "Pinchos de mozzarella y tomate cherry":
    "Ensartar tomate, mozzarella y albahaca en palillos.\nAliñar con aceite.",
  "Tostaditas integrales con paté vegetal":
    "Tostar las tostaditas.\nExtender el paté vegetal por encima.",
  "Dátiles rellenos de mantequilla de almendra":
    "Abrir los dátiles y quitar el hueso.\nRellenar con mantequilla de almendra.\nEspolvorear sésamo por encima.",
  "Palomitas caseras":
    "Calentar el aceite en una olla.\nAñadir los granos de maíz y tapar.\nAgitar hasta que dejen de explotar.\nSalar al gusto.",
  "Manzana con crema de cacahuete":
    "Cortar la manzana en gajos.\nMojar cada gajo en la crema de cacahuete.",
  "Yogur con frutos secos":
    "Verter el yogur en un bol.\nAñadir almendras y nueces picadas.",
  "Queso cottage con fruta":
    "Servir el cottage en un bol.\nAñadir el melocotón troceado y la miel.",
  "Chips de kale":
    "Trocear el kale y eliminar el tallo.\nAliñar con aceite y sal.\nHornear 15 minutos a 150°C.",
  "Chips de manzana al horno":
    "Cortar la manzana en láminas muy finas.\nEspolvorear canela.\nHornear 90 minutos a 90°C.",
  "Nueces especiadas":
    "Mezclar las nueces con miel, canela y sal.\nHornear 10 min a 180°C dándoles vueltas.",
  "Bocaditos de atún y pepino":
    "Cortar el pepino en rodajas gruesas.\nMezclar el atún con el queso fresco.\nPoner una cucharada sobre cada rodaja.",
  "Rollos de pavo y queso":
    "Colocar la lonche de pavo extendida.\nPoner queso y lechuga.\nEnrollar apretando.",

  // ─────────────── POSTRES SALUDABLES ───────────────
  "Mousse de yogur y fresa":
    "Triturar las fresas con la miel.\nMezclar con el yogur con movimientos envolventes.\nEnfriar 1 hora antes de servir.",
  "Manzana al horno con canela":
    "Descorazonar las manzanas.\nRellenar con miel y canela.\nHornear 30 minutos a 180°C.",
  "Flan de huevo casero":
    "Hacer caramelo en los moldes.\nBatir huevos, leche y azúcar.\nHornear al baño maría 40 min a 180°C.\nEnfriar antes de desmoldar.",
  "Crema de cacao y aguacate":
    "Triturar el aguacate con el cacao, miel y leche.\nEnfriar 1 hora.",
  "Bizcocho de yogur":
    "Batir huevos con azúcar.\nAñadir yogur, aceite y limón.\nIncorporar la harina tamizada.\nHornear 35 min a 180°C.",
  "Bolitas energéticas de dátil":
    "Triturar los dátiles con la avena, las almendras y el cacao.\nFormar bolas con las manos.\nRefrigerar 30 minutos.",
  "Pudding de chía con frutos rojos":
    "Mezclar chía con leche y miel.\nRefrigerar al menos 4 horas.\nAñadir las frambuesas por encima.",
  "Fresas con chocolate negro":
    "Derretir el chocolate al baño maría.\nBañar las fresas y dejar solidificar sobre papel.",
  "Helado de plátano":
    "Congelar los plátanos en rodajas 3 horas.\nTriturar con el cacao y la miel hasta conseguir textura de helado.",
  "Arroz con leche bajo en azúcar":
    "Hervir la leche con canela.\nAñadir el arroz y cocer 40 min a fuego lento.\nEndulzar al final con poco azúcar.",
  "Tarta de queso ligera":
    "Triturar las galletas y cubrir el molde.\nBatir queso, yogur, azúcar y huevos.\nHornear 50 minutos a 160°C.\nEnfriar antes de servir.",
  "Brownie de aguacate":
    "Triturar el aguacate.\nMezclar con el cacao, la miel, el huevo y la harina.\nHornear 25 minutos a 180°C.",
  "Galletas de avena y plátano":
    "Aplastar el plátano.\nMezclar con la avena y las pasas.\nFormar galletas y hornear 15 min a 180°C.",
  "Crepes con plátano y cacao":
    "Hacer crepes con harina, huevo y leche.\nRellenar con plátano y cacao.\nEnrollar y servir.",
  "Pera al vino":
    "Pelar las peras enteras.\nCocer en el vino con azúcar y canela 30 min.\nEnfriar en el almíbar antes de servir.",

  // ─────────────── SALSAS Y UNTABLES ───────────────
  "Salsa tzatziki":
    "Rallar el pepino y escurrir el agua.\nMezclar con el yogur, ajo, menta y aceite.\nRefrigerar antes de servir.",
  "Pesto de albahaca":
    "Triturar albahaca, piñones, ajo y parmesano.\nAñadir el aceite a chorrito mientras se bate.",
  "Salsa romesco":
    "Asar los pimientos y pelarlos.\nTriturar con almendras, tomate, ajo, aceite y vinagre.",
  "Mayonesa casera":
    "Poner el huevo, limón y sal en vaso alto.\nAñadir el aceite y batir con túrmix sin mover.\nSubir la batidora lentamente para emulsionar.",
  "Alioli":
    "Majar el ajo con sal en mortero.\nAñadir el huevo y emulsionar con aceite lentamente.\nTerminar con un chorro de limón.",
  "Salsa vinagreta":
    "Mezclar aceite, vinagre, mostaza y sal.\nBatir enérgicamente hasta emulsionar.",
  "Tapenade de aceitunas":
    "Triturar aceitunas, alcaparras, ajo y aceite.\nAjustar con limón al gusto.",
  "Crema de aguacate":
    "Triturar el aguacate con limón, ajo y sal.\nServir inmediatamente.",
  "Salsa barbacoa casera":
    "Cocer el tomate con miel, vinagre, soja y pimentón.\nReducir 15 min a fuego lento.",
  "Salsa rosa ligera":
    "Mezclar el yogur con el ketchup y limón.\nRemover hasta que quede uniforme.",
};
