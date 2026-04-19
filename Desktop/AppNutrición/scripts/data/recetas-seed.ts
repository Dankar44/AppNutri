/**
 * Dataset de recetas globales para la app.
 * Cantidades en gramos por receta completa (la app divide entre `porciones`).
 * `nombre` del ingrediente se busca en `alimentos` por ILIKE (fuzzy).
 */

export interface IngredienteSeed {
  nombre: string;
  cantidad: number;
  unidad?: "GRAMOS" | "MILILITROS" | "UNIDAD";
}
export interface RecetaSeed {
  nombre: string;
  descripcion?: string;
  instrucciones?: string;
  porciones: number;
  tiempoPreparacion: number;
  ingredientes: IngredienteSeed[];
}

// Helpers de composición
const ACEITE = (g: number): IngredienteSeed => ({ nombre: "Aceite de oliva", cantidad: g });
const SAL = (g = 2): IngredienteSeed => ({ nombre: "Sal", cantidad: g });
const PIMIENTA = (g = 1): IngredienteSeed => ({ nombre: "Pimienta", cantidad: g });
const AJO = (g: number): IngredienteSeed => ({ nombre: "Ajo", cantidad: g });
const CEBOLLA = (g: number): IngredienteSeed => ({ nombre: "Cebolla", cantidad: g });
const TOMATE = (g: number): IngredienteSeed => ({ nombre: "Tomate", cantidad: g });
const HUEVO = (g: number): IngredienteSeed => ({ nombre: "Huevo", cantidad: g });
const LIMON = (g: number): IngredienteSeed => ({ nombre: "Limón", cantidad: g });

const DESAYUNOS: RecetaSeed[] = [
  { nombre: "Tostada de aguacate con huevo", descripcion: "Clásica tostada con aguacate y huevo poché.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Pan integral", cantidad: 60 }, { nombre: "Aguacate", cantidad: 80 }, HUEVO(60), ACEITE(5), SAL(1), PIMIENTA(1),
  ]},
  { nombre: "Avena con plátano y arándanos", descripcion: "Avena cocida con fruta fresca y semillas.", porciones: 1, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Avena (copos)", cantidad: 50 }, { nombre: "Leche", cantidad: 200 }, { nombre: "Plátano", cantidad: 100 }, { nombre: "Arándanos", cantidad: 60 }, { nombre: "Miel", cantidad: 10 },
  ]},
  { nombre: "Tortilla francesa", descripcion: "Rápida y clásica tortilla de dos huevos.", porciones: 1, tiempoPreparacion: 6, ingredientes: [ HUEVO(120), ACEITE(5), SAL(1) ]},
  { nombre: "Yogur griego con fresas y granola", descripcion: "Bowl equilibrado para empezar el día.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Yogur griego", cantidad: 200 }, { nombre: "Fresa", cantidad: 100 }, { nombre: "Granola", cantidad: 40 }, { nombre: "Miel", cantidad: 10 },
  ]},
  { nombre: "Tostada de tomate y jamón serrano", descripcion: "Desayuno tradicional mediterráneo.", porciones: 1, tiempoPreparacion: 7, ingredientes: [
    { nombre: "Pan integral", cantidad: 60 }, TOMATE(80), { nombre: "Jamón serrano", cantidad: 40 }, ACEITE(5), AJO(2), SAL(1),
  ]},
  { nombre: "Huevos revueltos con espinacas", descripcion: "Huevos ligeros con espinacas salteadas.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    HUEVO(120), { nombre: "Espinacas", cantidad: 80 }, ACEITE(5), SAL(1), PIMIENTA(1),
  ]},
  { nombre: "Pan integral con queso fresco y miel", descripcion: "Dulce y sencillo.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Pan integral", cantidad: 60 }, { nombre: "Queso fresco", cantidad: 50 }, { nombre: "Miel", cantidad: 10 },
  ]},
  { nombre: "Tazón de yogur, nueces y mango", descripcion: "Proteína y fruta tropical.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Yogur natural", cantidad: 200 }, { nombre: "Nueces", cantidad: 20 }, { nombre: "Mango", cantidad: 100 },
  ]},
  { nombre: "Porridge de avena con canela y manzana", descripcion: "Reconfortante para días fríos.", porciones: 1, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Avena (copos)", cantidad: 50 }, { nombre: "Leche", cantidad: 250 }, { nombre: "Manzana", cantidad: 100 }, { nombre: "Canela", cantidad: 2 },
  ]},
  { nombre: "Pudding de chía con leche y fresa", descripcion: "Preparar la noche anterior.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Semillas de chía", cantidad: 20 }, { nombre: "Leche", cantidad: 200 }, { nombre: "Fresa", cantidad: 80 },
  ]},
  { nombre: "Tortita de avena y plátano", descripcion: "Tortitas saludables sin azúcar.", porciones: 1, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Avena (copos)", cantidad: 50 }, { nombre: "Plátano", cantidad: 100 }, HUEVO(60), { nombre: "Leche", cantidad: 50 },
  ]},
  { nombre: "Tostada de salmón ahumado y aguacate", descripcion: "Desayuno proteico y saciante.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Pan integral", cantidad: 60 }, { nombre: "Salmón ahumado", cantidad: 60 }, { nombre: "Aguacate", cantidad: 60 }, LIMON(10),
  ]},
  { nombre: "Huevos poché sobre tostada", descripcion: "Huevos escalfados con tostada crujiente.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    HUEVO(120), { nombre: "Pan integral", cantidad: 60 }, ACEITE(5), SAL(1),
  ]},
  { nombre: "Batido verde de espinacas y plátano", descripcion: "Smoothie verde energético.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Espinacas", cantidad: 50 }, { nombre: "Plátano", cantidad: 120 }, { nombre: "Leche", cantidad: 200 }, { nombre: "Semillas de chía", cantidad: 10 },
  ]},
  { nombre: "Bowl de yogur, kiwi y semillas", descripcion: "Ligero y refrescante.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Yogur natural", cantidad: 200 }, { nombre: "Kiwi", cantidad: 100 }, { nombre: "Semillas de girasol", cantidad: 10 },
  ]},
  { nombre: "Pan integral con hummus y tomate", descripcion: "Untado de hummus con tomate fresco.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Pan integral", cantidad: 60 }, { nombre: "Hummus", cantidad: 50 }, TOMATE(80),
  ]},
  { nombre: "Tortilla de claras con champiñones", descripcion: "Tortilla ligera alta en proteína.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Clara de huevo", cantidad: 150 }, { nombre: "Champiñón", cantidad: 100 }, ACEITE(5), SAL(1),
  ]},
  { nombre: "Yogur con granola casera y frutos secos", descripcion: "Crujiente y nutritivo.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Yogur griego", cantidad: 200 }, { nombre: "Granola", cantidad: 40 }, { nombre: "Almendras", cantidad: 15 },
  ]},
  { nombre: "Crepes de avena con crema de cacahuete", descripcion: "Crepes sin gluten con mantequilla de cacahuete.", porciones: 1, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Avena (copos)", cantidad: 40 }, HUEVO(60), { nombre: "Leche", cantidad: 100 }, { nombre: "Crema de cacahuete", cantidad: 20 },
  ]},
  { nombre: "Desayuno inglés saludable", descripcion: "Versión ligera del clásico inglés.", porciones: 1, tiempoPreparacion: 15, ingredientes: [
    HUEVO(120), { nombre: "Tomate", cantidad: 100 }, { nombre: "Champiñón", cantidad: 60 }, { nombre: "Bacon", cantidad: 30 }, { nombre: "Pan integral", cantidad: 60 },
  ]},
  { nombre: "Muesli con leche y fruta", descripcion: "Muesli casero con leche y manzana.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Muesli", cantidad: 60 }, { nombre: "Leche", cantidad: 200 }, { nombre: "Manzana", cantidad: 100 },
  ]},
  { nombre: "Tostada con jamón cocido y aguacate", descripcion: "Tostada cremosa con pavo o jamón.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Pan integral", cantidad: 60 }, { nombre: "Jamón cocido", cantidad: 50 }, { nombre: "Aguacate", cantidad: 60 },
  ]},
  { nombre: "Huevos al plato con tomate", descripcion: "Huevos horneados sobre salsa de tomate.", porciones: 1, tiempoPreparacion: 12, ingredientes: [
    HUEVO(120), TOMATE(150), CEBOLLA(50), ACEITE(8), SAL(1),
  ]},
  { nombre: "Yogur con muesli y plátano", descripcion: "Rápido y completo.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Yogur natural", cantidad: 200 }, { nombre: "Muesli", cantidad: 40 }, { nombre: "Plátano", cantidad: 100 },
  ]},
  { nombre: "Smoothie de fresa y yogur", descripcion: "Batido cremoso de fresa.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Fresa", cantidad: 150 }, { nombre: "Yogur natural", cantidad: 150 }, { nombre: "Leche", cantidad: 100 }, { nombre: "Miel", cantidad: 10 },
  ]},
  { nombre: "Granola casera con leche", descripcion: "Granola con avena y frutos secos.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Granola", cantidad: 60 }, { nombre: "Leche", cantidad: 200 }, { nombre: "Plátano", cantidad: 80 },
  ]},
  { nombre: "Sándwich de pavo, queso y lechuga", descripcion: "Sándwich ligero para llevar.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Pan integral", cantidad: 80 }, { nombre: "Pavo", cantidad: 60 }, { nombre: "Queso", cantidad: 30 }, { nombre: "Lechuga", cantidad: 30 },
  ]},
  { nombre: "Tostadas francesas saludables", descripcion: "French toast con pan integral.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Pan integral", cantidad: 60 }, HUEVO(60), { nombre: "Leche", cantidad: 100 }, { nombre: "Canela", cantidad: 2 },
  ]},
  { nombre: "Tortilla de atún y cebolla", descripcion: "Tortilla rellena de atún.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    HUEVO(120), { nombre: "Atún claro", cantidad: 60 }, CEBOLLA(40), ACEITE(5),
  ]},
  { nombre: "Bowl de avena nocturna con cacao", descripcion: "Overnight oats de cacao.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Avena (copos)", cantidad: 50 }, { nombre: "Leche", cantidad: 200 }, { nombre: "Cacao", cantidad: 10 }, { nombre: "Plátano", cantidad: 80 },
  ]},
];

const ENSALADAS: RecetaSeed[] = [
  { nombre: "Ensalada César", descripcion: "Lechuga romana, pollo, parmesano y crutones.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Lechuga romana", cantidad: 200 }, { nombre: "Pechuga de pollo", cantidad: 200 }, { nombre: "Queso parmesano", cantidad: 40 }, { nombre: "Pan integral", cantidad: 60 }, ACEITE(15), LIMON(20),
  ]},
  { nombre: "Ensalada griega", descripcion: "Tomate, pepino, feta y aceitunas.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    TOMATE(300), { nombre: "Pepino", cantidad: 200 }, { nombre: "Queso feta", cantidad: 100 }, { nombre: "Aceitunas", cantidad: 60 }, CEBOLLA(50), ACEITE(20),
  ]},
  { nombre: "Ensalada caprese", descripcion: "Mozzarella, tomate y albahaca.", porciones: 2, tiempoPreparacion: 8, ingredientes: [
    TOMATE(300), { nombre: "Mozzarella", cantidad: 150 }, { nombre: "Albahaca", cantidad: 10 }, ACEITE(15), SAL(2),
  ]},
  { nombre: "Ensalada de atún con aguacate", descripcion: "Atún con aguacate y tomate.", porciones: 1, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Atún claro", cantidad: 100 }, { nombre: "Aguacate", cantidad: 100 }, TOMATE(100), CEBOLLA(30), ACEITE(10),
  ]},
  { nombre: "Ensalada de lentejas con verduras", descripcion: "Lentejas frías con pimiento y zanahoria.", porciones: 2, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Lentejas (cocidas)", cantidad: 300 }, { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Zanahoria", cantidad: 80 }, CEBOLLA(50), ACEITE(15),
  ]},
  { nombre: "Ensalada de quinoa con pepino y tomate", descripcion: "Quinoa fresca mediterránea.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Quinoa", cantidad: 150 }, { nombre: "Pepino", cantidad: 150 }, TOMATE(200), { nombre: "Menta", cantidad: 10 }, ACEITE(15), LIMON(20),
  ]},
  { nombre: "Ensalada de pasta fría", descripcion: "Pasta con vegetales y vinagreta.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Pasta (cocida)", cantidad: 300 }, TOMATE(150), { nombre: "Pimiento verde", cantidad: 80 }, { nombre: "Aceitunas", cantidad: 40 }, ACEITE(15),
  ]},
  { nombre: "Ensalada de garbanzos con cebolla", descripcion: "Ensalada fría de garbanzos.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 300 }, CEBOLLA(80), TOMATE(150), { nombre: "Pimiento verde", cantidad: 80 }, ACEITE(15),
  ]},
  { nombre: "Ensalada mixta con huevo", descripcion: "Ensalada completa con huevo duro.", porciones: 1, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Lechuga", cantidad: 150 }, TOMATE(100), { nombre: "Zanahoria", cantidad: 50 }, HUEVO(60), { nombre: "Atún claro", cantidad: 60 }, ACEITE(10),
  ]},
  { nombre: "Ensalada Waldorf", descripcion: "Manzana, apio, nueces y yogur.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Manzana", cantidad: 200 }, { nombre: "Apio", cantidad: 100 }, { nombre: "Nueces", cantidad: 40 }, { nombre: "Yogur natural", cantidad: 100 }, { nombre: "Lechuga", cantidad: 80 },
  ]},
  { nombre: "Ensalada de espinacas y fresa", descripcion: "Combinación dulce-salada.", porciones: 2, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Espinacas", cantidad: 200 }, { nombre: "Fresa", cantidad: 200 }, { nombre: "Queso feta", cantidad: 60 }, { nombre: "Nueces", cantidad: 30 }, ACEITE(15),
  ]},
  { nombre: "Ensalada de pollo al curry", descripcion: "Pollo con yogur y curry.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 300 }, { nombre: "Yogur natural", cantidad: 100 }, { nombre: "Curry", cantidad: 5 }, { nombre: "Manzana", cantidad: 100 }, { nombre: "Lechuga", cantidad: 150 },
  ]},
  { nombre: "Ensalada niçoise", descripcion: "Ensalada francesa con atún y huevo.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Atún claro", cantidad: 150 }, HUEVO(120), { nombre: "Patata", cantidad: 200 }, { nombre: "Judías verdes", cantidad: 150 }, { nombre: "Aceitunas", cantidad: 60 }, ACEITE(15),
  ]},
  { nombre: "Ensalada de rúcula y parmesano", descripcion: "Rúcula con láminas de parmesano.", porciones: 2, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Rúcula", cantidad: 150 }, { nombre: "Queso parmesano", cantidad: 50 }, ACEITE(15), LIMON(15),
  ]},
  { nombre: "Ensalada de col kale y manzana", descripcion: "Kale masajeado con manzana.", porciones: 2, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Kale", cantidad: 200 }, { nombre: "Manzana", cantidad: 150 }, { nombre: "Nueces", cantidad: 30 }, LIMON(15), ACEITE(15),
  ]},
  { nombre: "Ensalada caprese de sandía", descripcion: "Refrescante versión veraniega.", porciones: 2, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Sandía", cantidad: 400 }, { nombre: "Mozzarella", cantidad: 120 }, { nombre: "Albahaca", cantidad: 10 }, ACEITE(10),
  ]},
  { nombre: "Ensalada templada de pollo", descripcion: "Pollo caliente sobre ensalada.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 300 }, { nombre: "Lechuga", cantidad: 200 }, TOMATE(150), { nombre: "Maíz", cantidad: 80 }, ACEITE(15),
  ]},
  { nombre: "Ensalada de remolacha y queso feta", descripcion: "Remolacha dulce con feta.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Remolacha", cantidad: 300 }, { nombre: "Queso feta", cantidad: 80 }, { nombre: "Nueces", cantidad: 30 }, { nombre: "Rúcula", cantidad: 80 }, ACEITE(15),
  ]},
  { nombre: "Ensalada oriental de pollo", descripcion: "Pollo con soja, sésamo y zanahoria.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 300 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Pepino", cantidad: 100 }, { nombre: "Salsa de soja", cantidad: 15 }, { nombre: "Sésamo", cantidad: 10 },
  ]},
  { nombre: "Ensalada de tabulé", descripcion: "Cuscús con perejil, tomate y menta.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Cuscús", cantidad: 150 }, { nombre: "Perejil", cantidad: 40 }, TOMATE(150), { nombre: "Menta", cantidad: 10 }, ACEITE(15), LIMON(20),
  ]},
  { nombre: "Ensalada de judías verdes y patata", descripcion: "Judías y patata aliñadas.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Judías verdes", cantidad: 300 }, { nombre: "Patata", cantidad: 300 }, CEBOLLA(60), ACEITE(15), SAL(2),
  ]},
  { nombre: "Ensalada de mango y aguacate", descripcion: "Dulce y cremosa.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Mango", cantidad: 200 }, { nombre: "Aguacate", cantidad: 150 }, { nombre: "Lechuga", cantidad: 100 }, LIMON(15), ACEITE(10),
  ]},
  { nombre: "Ensalada Cobb", descripcion: "Pollo, bacon, aguacate y huevo.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 250 }, { nombre: "Bacon", cantidad: 50 }, { nombre: "Aguacate", cantidad: 100 }, HUEVO(120), { nombre: "Lechuga", cantidad: 150 }, { nombre: "Queso azul", cantidad: 40 },
  ]},
  { nombre: "Ensalada de naranja y bacalao", descripcion: "Remojón andaluz.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Naranja", cantidad: 300 }, { nombre: "Bacalao", cantidad: 150 }, CEBOLLA(60), { nombre: "Aceitunas", cantidad: 40 }, ACEITE(15),
  ]},
  { nombre: "Ensalada de pepino y yogur", descripcion: "Fresca estilo raita.", porciones: 2, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Pepino", cantidad: 300 }, { nombre: "Yogur natural", cantidad: 200 }, { nombre: "Menta", cantidad: 10 }, AJO(2),
  ]},
  { nombre: "Ensalada de pimientos asados", descripcion: "Pimientos rojos con ajo y aceite.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Pimiento rojo", cantidad: 400 }, AJO(5), ACEITE(20), SAL(2),
  ]},
  { nombre: "Ensalada de brotes con salmón", descripcion: "Brotes con salmón ahumado.", porciones: 2, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Brotes verdes", cantidad: 150 }, { nombre: "Salmón ahumado", cantidad: 150 }, { nombre: "Aguacate", cantidad: 100 }, LIMON(15), ACEITE(10),
  ]},
  { nombre: "Ensalada de tomate y cebolla", descripcion: "Simple y clásica.", porciones: 2, tiempoPreparacion: 5, ingredientes: [
    TOMATE(400), CEBOLLA(100), ACEITE(15), SAL(2),
  ]},
  { nombre: "Ensalada de zanahoria rallada", descripcion: "Zanahoria con pasas y limón.", porciones: 2, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Zanahoria", cantidad: 300 }, { nombre: "Pasas", cantidad: 40 }, LIMON(20), ACEITE(10),
  ]},
  { nombre: "Ensalada de maíz, aguacate y tomate", descripcion: "Colorida y sabrosa.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Maíz", cantidad: 200 }, { nombre: "Aguacate", cantidad: 150 }, TOMATE(200), LIMON(15), ACEITE(10),
  ]},
];

const SOPAS: RecetaSeed[] = [
  { nombre: "Gazpacho andaluz", descripcion: "Sopa fría clásica.", porciones: 4, tiempoPreparacion: 15, ingredientes: [
    TOMATE(800), { nombre: "Pepino", cantidad: 150 }, { nombre: "Pimiento verde", cantidad: 80 }, AJO(5), { nombre: "Pan integral", cantidad: 50 }, ACEITE(40), { nombre: "Vinagre", cantidad: 20 },
  ]},
  { nombre: "Crema de calabaza", descripcion: "Crema suave y reconfortante.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Calabaza", cantidad: 800 }, CEBOLLA(150), { nombre: "Patata", cantidad: 200 }, ACEITE(20), SAL(3),
  ]},
  { nombre: "Crema de calabacín", descripcion: "Crema ligera con queso.", porciones: 4, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Calabacín", cantidad: 800 }, CEBOLLA(150), { nombre: "Queso fresco", cantidad: 80 }, ACEITE(20),
  ]},
  { nombre: "Sopa de verduras", descripcion: "Caldo con verduras variadas.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Zanahoria", cantidad: 200 }, { nombre: "Puerro", cantidad: 150 }, CEBOLLA(100), { nombre: "Apio", cantidad: 100 }, { nombre: "Patata", cantidad: 200 }, ACEITE(15),
  ]},
  { nombre: "Sopa minestrone", descripcion: "Sopa italiana con pasta y verduras.", porciones: 4, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Alubias blancas (cocidas)", cantidad: 200 }, { nombre: "Pasta (cruda)", cantidad: 100 }, TOMATE(300), { nombre: "Zanahoria", cantidad: 150 }, { nombre: "Apio", cantidad: 100 }, CEBOLLA(100), ACEITE(15),
  ]},
  { nombre: "Crema de zanahoria y jengibre", descripcion: "Crema con toque oriental.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Zanahoria", cantidad: 700 }, { nombre: "Jengibre", cantidad: 15 }, CEBOLLA(100), ACEITE(15),
  ]},
  { nombre: "Sopa de pollo con fideos", descripcion: "Sopa casera reconfortante.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 400 }, { nombre: "Fideos", cantidad: 120 }, { nombre: "Zanahoria", cantidad: 150 }, CEBOLLA(100), { nombre: "Apio", cantidad: 100 },
  ]},
  { nombre: "Crema de champiñones", descripcion: "Crema suave de champiñón.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Champiñón", cantidad: 600 }, CEBOLLA(150), { nombre: "Nata", cantidad: 100 }, ACEITE(15),
  ]},
  { nombre: "Sopa de tomate", descripcion: "Crema de tomate asado.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    TOMATE(1000), CEBOLLA(150), AJO(10), ACEITE(20), { nombre: "Albahaca", cantidad: 10 },
  ]},
  { nombre: "Sopa de lentejas", descripcion: "Sopa sustanciosa.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Lentejas (crudas)", cantidad: 250 }, { nombre: "Zanahoria", cantidad: 150 }, CEBOLLA(100), TOMATE(200), ACEITE(15),
  ]},
  { nombre: "Sopa de miso", descripcion: "Sopa japonesa con tofu.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Pasta de miso", cantidad: 40 }, { nombre: "Tofu", cantidad: 150 }, { nombre: "Alga wakame", cantidad: 10 }, { nombre: "Cebollino", cantidad: 10 },
  ]},
  { nombre: "Sopa juliana", descripcion: "Sopa de verduras cortadas finas.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Repollo", cantidad: 200 }, { nombre: "Zanahoria", cantidad: 150 }, { nombre: "Puerro", cantidad: 100 }, { nombre: "Patata", cantidad: 200 }, ACEITE(15),
  ]},
  { nombre: "Sopa de cebolla", descripcion: "Sopa francesa gratinada.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    CEBOLLA(800), { nombre: "Queso", cantidad: 100 }, { nombre: "Pan integral", cantidad: 120 }, ACEITE(20),
  ]},
  { nombre: "Crema de brócoli", descripcion: "Crema verde y cremosa.", porciones: 4, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Brócoli", cantidad: 700 }, CEBOLLA(100), { nombre: "Patata", cantidad: 150 }, ACEITE(15),
  ]},
  { nombre: "Sopa de pescado", descripcion: "Sopa marinera.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Merluza", cantidad: 400 }, { nombre: "Gamba", cantidad: 150 }, TOMATE(200), CEBOLLA(100), AJO(5),
  ]},
  { nombre: "Crema de espárragos", descripcion: "Elegante crema verde.", porciones: 4, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Espárrago verde", cantidad: 500 }, CEBOLLA(100), { nombre: "Patata", cantidad: 150 }, ACEITE(15),
  ]},
  { nombre: "Sopa de ajo", descripcion: "Sopa castellana tradicional.", porciones: 4, tiempoPreparacion: 25, ingredientes: [
    AJO(30), { nombre: "Pan integral", cantidad: 150 }, { nombre: "Pimentón", cantidad: 5 }, HUEVO(120), ACEITE(20),
  ]},
  { nombre: "Ajoblanco", descripcion: "Sopa fría de almendra y ajo.", porciones: 4, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Almendras", cantidad: 150 }, { nombre: "Pan integral", cantidad: 100 }, AJO(5), ACEITE(50), { nombre: "Vinagre", cantidad: 15 },
  ]},
  { nombre: "Salmorejo", descripcion: "Crema fría cordobesa.", porciones: 4, tiempoPreparacion: 15, ingredientes: [
    TOMATE(1000), { nombre: "Pan integral", cantidad: 150 }, AJO(5), ACEITE(60), { nombre: "Jamón serrano", cantidad: 50 }, HUEVO(60),
  ]},
  { nombre: "Sopa de garbanzos y espinacas", descripcion: "Guiso ligero de cuchara.", porciones: 4, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 400 }, { nombre: "Espinacas", cantidad: 200 }, CEBOLLA(100), AJO(5), ACEITE(15),
  ]},
  { nombre: "Crema de coliflor", descripcion: "Crema suave con queso.", porciones: 4, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Coliflor", cantidad: 700 }, { nombre: "Patata", cantidad: 150 }, { nombre: "Queso", cantidad: 60 }, ACEITE(15),
  ]},
  { nombre: "Sopa de fideos con verduras", descripcion: "Sopa sencilla con fideos.", porciones: 4, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Fideos", cantidad: 150 }, { nombre: "Zanahoria", cantidad: 150 }, CEBOLLA(100), { nombre: "Puerro", cantidad: 100 }, ACEITE(15),
  ]},
  { nombre: "Caldo de pollo casero", descripcion: "Caldo base reconfortante.", porciones: 4, tiempoPreparacion: 90, ingredientes: [
    { nombre: "Pollo", cantidad: 500 }, { nombre: "Zanahoria", cantidad: 150 }, { nombre: "Puerro", cantidad: 100 }, { nombre: "Apio", cantidad: 100 },
  ]},
  { nombre: "Sopa tailandesa tom kha", descripcion: "Sopa de coco y pollo.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 250 }, { nombre: "Leche de coco", cantidad: 300 }, { nombre: "Jengibre", cantidad: 10 }, { nombre: "Champiñón", cantidad: 100 }, LIMON(20),
  ]},
  { nombre: "Crema de puerro y patata", descripcion: "Vichyssoise casera.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Puerro", cantidad: 400 }, { nombre: "Patata", cantidad: 400 }, CEBOLLA(100), ACEITE(15),
  ]},
];

const ARROCES: RecetaSeed[] = [
  { nombre: "Arroz blanco hervido", descripcion: "Guarnición básica.", porciones: 2, tiempoPreparacion: 20, ingredientes: [ { nombre: "Arroz (crudo)", cantidad: 160 }, SAL(2), ACEITE(5) ]},
  { nombre: "Arroz tres delicias", descripcion: "Arroz salteado con jamón, huevo y guisantes.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Arroz (cocido)", cantidad: 300 }, { nombre: "Jamón cocido", cantidad: 80 }, HUEVO(120), { nombre: "Guisantes", cantidad: 100 }, { nombre: "Zanahoria", cantidad: 80 },
  ]},
  { nombre: "Arroz con pollo", descripcion: "Clásico arroz con pollo y verduras.", porciones: 2, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 200 }, { nombre: "Pechuga de pollo", cantidad: 300 }, CEBOLLA(100), TOMATE(150), { nombre: "Pimiento rojo", cantidad: 100 }, ACEITE(15),
  ]},
  { nombre: "Paella mixta", descripcion: "Paella con pollo y marisco.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 400 }, { nombre: "Pollo", cantidad: 400 }, { nombre: "Gamba", cantidad: 200 }, { nombre: "Mejillón", cantidad: 200 }, TOMATE(200), { nombre: "Pimiento rojo", cantidad: 150 }, { nombre: "Azafrán", cantidad: 1 }, ACEITE(30),
  ]},
  { nombre: "Arroz a la cubana", descripcion: "Arroz con huevo, plátano y tomate.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Arroz (cocido)", cantidad: 300 }, HUEVO(120), { nombre: "Plátano", cantidad: 200 }, TOMATE(150), ACEITE(20),
  ]},
  { nombre: "Arroz caldoso con gambas", descripcion: "Arroz meloso con gambas.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 200 }, { nombre: "Gamba", cantidad: 200 }, TOMATE(150), CEBOLLA(100), AJO(5), ACEITE(15),
  ]},
  { nombre: "Arroz al curry con verduras", descripcion: "Arroz aromático con verduras.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Arroz basmati", cantidad: 200 }, { nombre: "Curry", cantidad: 10 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Guisantes", cantidad: 100 }, CEBOLLA(100), ACEITE(15),
  ]},
  { nombre: "Risotto de setas", descripcion: "Risotto cremoso con setas.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Arroz arborio", cantidad: 200 }, { nombre: "Champiñón", cantidad: 250 }, CEBOLLA(100), { nombre: "Queso parmesano", cantidad: 60 }, { nombre: "Mantequilla", cantidad: 20 },
  ]},
  { nombre: "Arroz integral con salmón", descripcion: "Plato completo y saludable.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Arroz integral", cantidad: 200 }, { nombre: "Salmón fresco", cantidad: 300 }, { nombre: "Brócoli", cantidad: 200 }, ACEITE(15), LIMON(15),
  ]},
  { nombre: "Arroz meloso de verduras", descripcion: "Arroz vegetal cremoso.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 200 }, { nombre: "Calabacín", cantidad: 150 }, { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Zanahoria", cantidad: 100 }, ACEITE(15),
  ]},
  { nombre: "Arroz con leche", descripcion: "Postre tradicional.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 150 }, { nombre: "Leche", cantidad: 1000 }, { nombre: "Azúcar", cantidad: 100 }, { nombre: "Canela", cantidad: 3 }, LIMON(10),
  ]},
  { nombre: "Arroz basmati con especias", descripcion: "Basmati aromático.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Arroz basmati", cantidad: 200 }, { nombre: "Comino", cantidad: 2 }, { nombre: "Cardamomo", cantidad: 1 }, { nombre: "Mantequilla", cantidad: 15 },
  ]},
  { nombre: "Quinoa con pollo y verduras", descripcion: "Bowl saludable y completo.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Quinoa", cantidad: 150 }, { nombre: "Pechuga de pollo", cantidad: 300 }, { nombre: "Calabacín", cantidad: 150 }, { nombre: "Pimiento rojo", cantidad: 100 }, ACEITE(15),
  ]},
  { nombre: "Bowl de quinoa, atún y aguacate", descripcion: "Bowl frío para llevar.", porciones: 1, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Quinoa", cantidad: 80 }, { nombre: "Atún claro", cantidad: 100 }, { nombre: "Aguacate", cantidad: 100 }, TOMATE(100), LIMON(15),
  ]},
  { nombre: "Tabulé de quinoa", descripcion: "Quinoa con perejil y tomate.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Quinoa", cantidad: 150 }, { nombre: "Perejil", cantidad: 30 }, TOMATE(200), { nombre: "Pepino", cantidad: 150 }, LIMON(20), ACEITE(15),
  ]},
  { nombre: "Cuscús con verduras", descripcion: "Cuscús vegetal marroquí.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Cuscús", cantidad: 150 }, { nombre: "Calabacín", cantidad: 150 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Garbanzos (cocidos)", cantidad: 150 }, ACEITE(15),
  ]},
  { nombre: "Cuscús con pollo y cebolla", descripcion: "Cuscús con pollo guisado.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Cuscús", cantidad: 150 }, { nombre: "Pechuga de pollo", cantidad: 300 }, CEBOLLA(150), { nombre: "Comino", cantidad: 2 }, ACEITE(15),
  ]},
  { nombre: "Bulgur con verduras", descripcion: "Bulgur con tomate y cebolla.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Bulgur", cantidad: 150 }, TOMATE(200), CEBOLLA(100), ACEITE(15), { nombre: "Perejil", cantidad: 20 },
  ]},
  { nombre: "Arroz frito con huevo", descripcion: "Arroz salteado asiático.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Arroz (cocido)", cantidad: 300 }, HUEVO(120), { nombre: "Salsa de soja", cantidad: 20 }, { nombre: "Guisantes", cantidad: 100 }, CEBOLLA(80),
  ]},
  { nombre: "Arroz negro con calamares", descripcion: "Arroz con tinta y calamar.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 200 }, { nombre: "Calamar", cantidad: 250 }, AJO(5), CEBOLLA(100), ACEITE(15),
  ]},
  { nombre: "Arroz jazmín con pollo al curry", descripcion: "Arroz suave con pollo al curry.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 180 }, { nombre: "Pechuga de pollo", cantidad: 300 }, { nombre: "Leche de coco", cantidad: 200 }, { nombre: "Curry", cantidad: 10 }, CEBOLLA(100),
  ]},
  { nombre: "Risotto de espárragos", descripcion: "Risotto cremoso de espárrago verde.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Arroz arborio", cantidad: 200 }, { nombre: "Espárrago verde", cantidad: 300 }, CEBOLLA(80), { nombre: "Queso parmesano", cantidad: 50 }, { nombre: "Mantequilla", cantidad: 15 },
  ]},
  { nombre: "Quinoa con salmón y brócoli", descripcion: "Plato nutritivo equilibrado.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Quinoa", cantidad: 150 }, { nombre: "Salmón fresco", cantidad: 300 }, { nombre: "Brócoli", cantidad: 200 }, ACEITE(15),
  ]},
  { nombre: "Arroz con leche y canela", descripcion: "Versión exprés del arroz con leche.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 150 }, { nombre: "Leche", cantidad: 900 }, { nombre: "Canela", cantidad: 4 }, { nombre: "Azúcar", cantidad: 80 },
  ]},
  { nombre: "Arroz salvaje con champiñones", descripcion: "Arroz salvaje con setas al ajillo.", porciones: 2, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Arroz salvaje", cantidad: 160 }, { nombre: "Champiñón", cantidad: 250 }, AJO(5), ACEITE(15), { nombre: "Perejil", cantidad: 10 },
  ]},
];

const PASTAS: RecetaSeed[] = [
  { nombre: "Espaguetis a la boloñesa", descripcion: "Pasta con salsa de carne.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 400 }, { nombre: "Ternera picada", cantidad: 400 }, TOMATE(400), CEBOLLA(150), { nombre: "Zanahoria", cantidad: 100 }, ACEITE(20),
  ]},
  { nombre: "Macarrones a la carbonara", descripcion: "Carbonara italiana tradicional.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Bacon", cantidad: 120 }, HUEVO(120), { nombre: "Queso parmesano", cantidad: 60 }, PIMIENTA(2),
  ]},
  { nombre: "Penne con tomate y albahaca", descripcion: "Plato sencillo estilo napolitano.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, TOMATE(400), AJO(5), { nombre: "Albahaca", cantidad: 15 }, ACEITE(20),
  ]},
  { nombre: "Espaguetis con gambas y ajo", descripcion: "Pasta con gambas al ajillo.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Gamba", cantidad: 250 }, AJO(10), ACEITE(25), { nombre: "Perejil", cantidad: 10 },
  ]},
  { nombre: "Lasaña de carne", descripcion: "Lasaña al horno con bechamel.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Lasaña", cantidad: 250 }, { nombre: "Ternera picada", cantidad: 500 }, TOMATE(400), { nombre: "Bechamel", cantidad: 400 }, { nombre: "Queso", cantidad: 120 },
  ]},
  { nombre: "Pasta pesto", descripcion: "Pasta con pesto de albahaca.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Albahaca", cantidad: 40 }, { nombre: "Piñones", cantidad: 30 }, { nombre: "Queso parmesano", cantidad: 50 }, ACEITE(40), AJO(3),
  ]},
  { nombre: "Macarrones al queso", descripcion: "Pasta cremosa con queso gratinado.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Queso cheddar", cantidad: 120 }, { nombre: "Leche", cantidad: 300 }, { nombre: "Mantequilla", cantidad: 20 },
  ]},
  { nombre: "Espaguetis con atún", descripcion: "Pasta sencilla con atún y tomate.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Atún claro", cantidad: 150 }, TOMATE(300), CEBOLLA(80), ACEITE(15),
  ]},
  { nombre: "Pasta primavera con verduras", descripcion: "Pasta salteada con verduras.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Calabacín", cantidad: 150 }, { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Brócoli", cantidad: 150 }, ACEITE(15),
  ]},
  { nombre: "Canelones de espinacas", descripcion: "Canelones vegetales gratinados.", porciones: 4, tiempoPreparacion: 50, ingredientes: [
    { nombre: "Canelones", cantidad: 200 }, { nombre: "Espinacas", cantidad: 400 }, { nombre: "Ricota", cantidad: 250 }, { nombre: "Bechamel", cantidad: 400 }, { nombre: "Queso", cantidad: 100 },
  ]},
  { nombre: "Espaguetis a la puttanesca", descripcion: "Pasta con aceitunas y alcaparras.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, TOMATE(350), { nombre: "Aceitunas", cantidad: 80 }, { nombre: "Alcaparras", cantidad: 20 }, AJO(5), ACEITE(15),
  ]},
  { nombre: "Ñoquis con salsa de tomate", descripcion: "Ñoquis de patata con tomate.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Ñoquis", cantidad: 400 }, TOMATE(300), AJO(5), { nombre: "Albahaca", cantidad: 10 }, ACEITE(15),
  ]},
  { nombre: "Raviolis con salvia", descripcion: "Raviolis con mantequilla y salvia.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Raviolis", cantidad: 300 }, { nombre: "Mantequilla", cantidad: 40 }, { nombre: "Salvia", cantidad: 5 }, { nombre: "Queso parmesano", cantidad: 40 },
  ]},
  { nombre: "Fettuccine Alfredo", descripcion: "Pasta cremosa italo-americana.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Nata", cantidad: 200 }, { nombre: "Queso parmesano", cantidad: 80 }, { nombre: "Mantequilla", cantidad: 30 },
  ]},
  { nombre: "Pasta con brócoli y ajo", descripcion: "Pasta ligera con verdura.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Brócoli", cantidad: 300 }, AJO(10), ACEITE(25), { nombre: "Queso parmesano", cantidad: 40 },
  ]},
  { nombre: "Pasta fría con pollo", descripcion: "Ensalada de pasta con pollo.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Pechuga de pollo", cantidad: 250 }, TOMATE(150), { nombre: "Pimiento verde", cantidad: 80 }, ACEITE(15),
  ]},
  { nombre: "Pasta con salmón y nata", descripcion: "Pasta cremosa con salmón.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Salmón fresco", cantidad: 200 }, { nombre: "Nata", cantidad: 150 }, CEBOLLA(60), { nombre: "Eneldo", cantidad: 5 },
  ]},
  { nombre: "Tallarines con verduras salteadas", descripcion: "Noodles salteados al wok.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Tallarines", cantidad: 200 }, { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Brócoli", cantidad: 150 }, { nombre: "Salsa de soja", cantidad: 25 },
  ]},
  { nombre: "Pasta con pollo al pesto", descripcion: "Pasta con pollo y pesto verde.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Pechuga de pollo", cantidad: 250 }, { nombre: "Albahaca", cantidad: 30 }, { nombre: "Piñones", cantidad: 25 }, { nombre: "Queso parmesano", cantidad: 40 }, ACEITE(25),
  ]},
  { nombre: "Espaguetis con almejas", descripcion: "Espaguetis alle vongole.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pasta (cruda)", cantidad: 200 }, { nombre: "Almeja", cantidad: 400 }, AJO(10), ACEITE(25), { nombre: "Perejil", cantidad: 15 },
  ]},
];

const LEGUMBRES: RecetaSeed[] = [
  { nombre: "Lentejas guisadas", descripcion: "Clásicas lentejas con verduras.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Lentejas (crudas)", cantidad: 300 }, { nombre: "Zanahoria", cantidad: 150 }, CEBOLLA(100), TOMATE(200), AJO(5), ACEITE(20), { nombre: "Pimentón", cantidad: 5 },
  ]},
  { nombre: "Garbanzos con espinacas", descripcion: "Guiso de Cuaresma.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 500 }, { nombre: "Espinacas", cantidad: 300 }, AJO(10), { nombre: "Pimentón", cantidad: 5 }, ACEITE(20),
  ]},
  { nombre: "Cocido madrileño simplificado", descripcion: "Cocido clásico en versión rápida.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 400 }, { nombre: "Pollo", cantidad: 300 }, { nombre: "Ternera", cantidad: 200 }, { nombre: "Zanahoria", cantidad: 150 }, { nombre: "Repollo", cantidad: 200 },
  ]},
  { nombre: "Hummus casero", descripcion: "Crema de garbanzo con tahini.", porciones: 4, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 400 }, { nombre: "Tahini", cantidad: 50 }, AJO(5), LIMON(30), ACEITE(30), { nombre: "Comino", cantidad: 2 },
  ]},
  { nombre: "Alubias con chorizo", descripcion: "Guiso ligero de alubias.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Alubias blancas (cocidas)", cantidad: 500 }, { nombre: "Chorizo", cantidad: 100 }, CEBOLLA(100), TOMATE(150), AJO(5), ACEITE(15),
  ]},
  { nombre: "Lentejas con arroz", descripcion: "Mujadara libanesa.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Lentejas (crudas)", cantidad: 200 }, { nombre: "Arroz (crudo)", cantidad: 150 }, CEBOLLA(200), { nombre: "Comino", cantidad: 3 }, ACEITE(25),
  ]},
  { nombre: "Curry de garbanzos", descripcion: "Garbanzos en salsa curry.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 500 }, TOMATE(300), { nombre: "Leche de coco", cantidad: 200 }, { nombre: "Curry", cantidad: 10 }, CEBOLLA(150), AJO(5),
  ]},
  { nombre: "Chili con carne", descripcion: "Chili picante con alubias.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Ternera picada", cantidad: 400 }, { nombre: "Alubias rojas (cocidas)", cantidad: 400 }, TOMATE(400), CEBOLLA(150), { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Comino", cantidad: 5 },
  ]},
  { nombre: "Guiso de alubias pintas", descripcion: "Alubias pintas con chorizo.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Alubias pintas (cocidas)", cantidad: 500 }, { nombre: "Chorizo", cantidad: 80 }, CEBOLLA(100), TOMATE(150), AJO(5), ACEITE(15),
  ]},
  { nombre: "Ensalada tibia de lentejas", descripcion: "Lentejas templadas con verduras.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Lentejas (cocidas)", cantidad: 300 }, TOMATE(150), { nombre: "Pimiento rojo", cantidad: 80 }, CEBOLLA(50), ACEITE(15),
  ]},
  { nombre: "Crema de garbanzos", descripcion: "Crema suave estilo hummus caliente.", porciones: 4, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 500 }, CEBOLLA(100), AJO(5), { nombre: "Comino", cantidad: 3 }, ACEITE(20),
  ]},
  { nombre: "Falafel al horno", descripcion: "Croquetas de garbanzo especiadas.", porciones: 4, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 500 }, { nombre: "Perejil", cantidad: 40 }, AJO(10), { nombre: "Comino", cantidad: 5 }, ACEITE(20),
  ]},
  { nombre: "Judías blancas con verduras", descripcion: "Alubias blancas con puerro y tomate.", porciones: 4, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Alubias blancas (cocidas)", cantidad: 500 }, { nombre: "Puerro", cantidad: 150 }, TOMATE(200), AJO(5), ACEITE(15),
  ]},
  { nombre: "Potaje de garbanzos y bacalao", descripcion: "Guiso de garbanzos con bacalao.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 400 }, { nombre: "Bacalao", cantidad: 300 }, { nombre: "Espinacas", cantidad: 200 }, CEBOLLA(100), AJO(5),
  ]},
  { nombre: "Guiso de soja texturizada", descripcion: "Alternativa vegetal a la carne.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Soja texturizada", cantidad: 100 }, TOMATE(300), CEBOLLA(100), AJO(5), ACEITE(15),
  ]},
  { nombre: "Edamame salteado", descripcion: "Vainas de soja con sal.", porciones: 2, tiempoPreparacion: 10, ingredientes: [ { nombre: "Edamame", cantidad: 300 }, SAL(3), ACEITE(5) ]},
  { nombre: "Alubias rojas con arroz", descripcion: "Plato caribeño de alubia y arroz.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Alubias rojas (cocidas)", cantidad: 300 }, { nombre: "Arroz (crudo)", cantidad: 150 }, CEBOLLA(80), { nombre: "Pimiento verde", cantidad: 100 }, AJO(5),
  ]},
  { nombre: "Hamburguesa de lentejas", descripcion: "Hamburguesa vegetal.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Lentejas (cocidas)", cantidad: 300 }, { nombre: "Avena (copos)", cantidad: 50 }, CEBOLLA(60), AJO(3), ACEITE(10),
  ]},
  { nombre: "Hamburguesa de garbanzos", descripcion: "Burger de garbanzos y especias.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 300 }, { nombre: "Avena (copos)", cantidad: 50 }, { nombre: "Perejil", cantidad: 15 }, AJO(3), { nombre: "Comino", cantidad: 3 },
  ]},
  { nombre: "Chili vegetariano", descripcion: "Chili sin carne con alubias y maíz.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Alubias rojas (cocidas)", cantidad: 400 }, { nombre: "Maíz", cantidad: 200 }, TOMATE(400), CEBOLLA(150), { nombre: "Pimiento rojo", cantidad: 150 },
  ]},
  { nombre: "Dal de lentejas rojas", descripcion: "Dal indio cremoso.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Lentejas rojas", cantidad: 300 }, { nombre: "Leche de coco", cantidad: 200 }, { nombre: "Curry", cantidad: 8 }, CEBOLLA(100), { nombre: "Jengibre", cantidad: 10 },
  ]},
  { nombre: "Ensalada de alubias blancas", descripcion: "Ensalada fresca de alubias.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Alubias blancas (cocidas)", cantidad: 400 }, TOMATE(150), CEBOLLA(60), ACEITE(15), { nombre: "Vinagre", cantidad: 10 },
  ]},
  { nombre: "Lentejas al curry con coco", descripcion: "Lentejas cremosas de coco.", porciones: 4, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Lentejas (crudas)", cantidad: 250 }, { nombre: "Leche de coco", cantidad: 300 }, { nombre: "Curry", cantidad: 10 }, CEBOLLA(100), TOMATE(200),
  ]},
  { nombre: "Cocido de garbanzos", descripcion: "Cocido casero de garbanzo.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 500 }, { nombre: "Pollo", cantidad: 300 }, { nombre: "Zanahoria", cantidad: 150 }, { nombre: "Puerro", cantidad: 100 }, { nombre: "Patata", cantidad: 200 },
  ]},
  { nombre: "Crema de lentejas rojas", descripcion: "Crema especiada de lenteja.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Lentejas rojas", cantidad: 300 }, { nombre: "Zanahoria", cantidad: 150 }, CEBOLLA(100), { nombre: "Jengibre", cantidad: 10 }, { nombre: "Curry", cantidad: 5 },
  ]},
];

const PESCADOS: RecetaSeed[] = [
  { nombre: "Salmón al horno con limón", descripcion: "Salmón jugoso al horno.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Salmón fresco", cantidad: 400 }, LIMON(30), AJO(5), { nombre: "Eneldo", cantidad: 5 }, ACEITE(15), SAL(2),
  ]},
  { nombre: "Merluza a la plancha", descripcion: "Merluza fresca a la plancha.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Merluza", cantidad: 400 }, LIMON(20), ACEITE(10), SAL(2), { nombre: "Perejil", cantidad: 5 },
  ]},
  { nombre: "Atún a la parrilla", descripcion: "Lomo de atún sellado.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Atún fresco", cantidad: 350 }, { nombre: "Salsa de soja", cantidad: 20 }, { nombre: "Sésamo", cantidad: 10 }, ACEITE(10),
  ]},
  { nombre: "Bacalao al pil pil", descripcion: "Bacalao con salsa pil pil.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Bacalao", cantidad: 400 }, AJO(15), { nombre: "Guindilla", cantidad: 2 }, ACEITE(50),
  ]},
  { nombre: "Lubina a la sal", descripcion: "Lubina cocinada en costra de sal.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Lubina", cantidad: 600 }, SAL(600), LIMON(20),
  ]},
  { nombre: "Dorada a la espalda", descripcion: "Dorada con ajo y perejil.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Dorada", cantidad: 500 }, AJO(10), { nombre: "Perejil", cantidad: 10 }, ACEITE(20), { nombre: "Vinagre", cantidad: 15 },
  ]},
  { nombre: "Boquerones en vinagre", descripcion: "Boquerones marinados.", porciones: 4, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Boquerón", cantidad: 400 }, { nombre: "Vinagre", cantidad: 100 }, AJO(10), { nombre: "Perejil", cantidad: 15 }, ACEITE(50),
  ]},
  { nombre: "Sardinas a la plancha", descripcion: "Sardinas frescas a la parrilla.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Sardina", cantidad: 500 }, ACEITE(15), SAL(3), LIMON(20),
  ]},
  { nombre: "Salmón teriyaki", descripcion: "Salmón glaseado con salsa teriyaki.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Salmón fresco", cantidad: 350 }, { nombre: "Salsa de soja", cantidad: 30 }, { nombre: "Miel", cantidad: 15 }, { nombre: "Jengibre", cantidad: 5 }, { nombre: "Sésamo", cantidad: 5 },
  ]},
  { nombre: "Tartar de atún", descripcion: "Atún crudo con aguacate.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Atún fresco", cantidad: 250 }, { nombre: "Aguacate", cantidad: 120 }, { nombre: "Salsa de soja", cantidad: 15 }, LIMON(10), { nombre: "Sésamo", cantidad: 5 },
  ]},
  { nombre: "Ceviche de corvina", descripcion: "Corvina marinada en lima.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Corvina", cantidad: 300 }, { nombre: "Lima", cantidad: 60 }, CEBOLLA(80), { nombre: "Cilantro", cantidad: 10 }, { nombre: "Guindilla", cantidad: 2 },
  ]},
  { nombre: "Pescadito frito", descripcion: "Fritura andaluza.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Boquerón", cantidad: 300 }, { nombre: "Harina", cantidad: 80 }, ACEITE(80), SAL(3), LIMON(20),
  ]},
  { nombre: "Merluza en salsa verde", descripcion: "Merluza con perejil y almejas.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Merluza", cantidad: 400 }, { nombre: "Almeja", cantidad: 200 }, AJO(10), { nombre: "Perejil", cantidad: 15 }, ACEITE(20), { nombre: "Harina", cantidad: 15 },
  ]},
  { nombre: "Marmitako de bonito", descripcion: "Guiso vasco de bonito.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Bonito", cantidad: 500 }, { nombre: "Patata", cantidad: 500 }, { nombre: "Pimiento rojo", cantidad: 150 }, CEBOLLA(150), TOMATE(200),
  ]},
  { nombre: "Caballa al horno", descripcion: "Caballa sencilla al horno.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Caballa", cantidad: 400 }, LIMON(30), AJO(5), ACEITE(15), { nombre: "Perejil", cantidad: 5 },
  ]},
  { nombre: "Salmón con quinoa y brócoli", descripcion: "Plato completo equilibrado.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Salmón fresco", cantidad: 300 }, { nombre: "Quinoa", cantidad: 150 }, { nombre: "Brócoli", cantidad: 200 }, ACEITE(15),
  ]},
  { nombre: "Atún con cebolla encebollada", descripcion: "Atún encebollado tradicional.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Atún fresco", cantidad: 350 }, CEBOLLA(300), { nombre: "Vino blanco", cantidad: 80 }, ACEITE(20),
  ]},
  { nombre: "Brocheta de rape y gambas", descripcion: "Brocheta marinera a la plancha.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Rape", cantidad: 300 }, { nombre: "Gamba", cantidad: 200 }, { nombre: "Pimiento rojo", cantidad: 100 }, ACEITE(15), AJO(5),
  ]},
  { nombre: "Merluza al vapor con verduras", descripcion: "Plato ligero al vapor.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Merluza", cantidad: 400 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Calabacín", cantidad: 150 }, { nombre: "Puerro", cantidad: 100 },
  ]},
  { nombre: "Salmón en papillote", descripcion: "Salmón cocinado en papel.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Salmón fresco", cantidad: 350 }, { nombre: "Calabacín", cantidad: 150 }, { nombre: "Zanahoria", cantidad: 100 }, LIMON(30), { nombre: "Eneldo", cantidad: 5 },
  ]},
  { nombre: "Trucha a la navarra", descripcion: "Trucha rellena de jamón.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Trucha", cantidad: 500 }, { nombre: "Jamón serrano", cantidad: 80 }, ACEITE(15), AJO(5),
  ]},
  { nombre: "Lomo de atún con sésamo", descripcion: "Atún costra de sésamo.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Atún fresco", cantidad: 300 }, { nombre: "Sésamo", cantidad: 30 }, { nombre: "Salsa de soja", cantidad: 20 }, ACEITE(10),
  ]},
  { nombre: "Tacos de pescado", descripcion: "Tacos mexicanos de pescado.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Merluza", cantidad: 300 }, { nombre: "Tortilla de maíz", cantidad: 150 }, { nombre: "Aguacate", cantidad: 100 }, { nombre: "Col", cantidad: 100 }, LIMON(20),
  ]},
  { nombre: "Sopa de pescado y marisco", descripcion: "Sopa marinera completa.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Merluza", cantidad: 300 }, { nombre: "Gamba", cantidad: 200 }, { nombre: "Almeja", cantidad: 200 }, TOMATE(200), CEBOLLA(100), AJO(5),
  ]},
  { nombre: "Pulpo a la gallega", descripcion: "Pulpo cocido con pimentón.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Pulpo", cantidad: 600 }, { nombre: "Patata", cantidad: 500 }, { nombre: "Pimentón", cantidad: 5 }, ACEITE(30), SAL(5),
  ]},
  { nombre: "Mejillones al vapor", descripcion: "Mejillones al vino blanco.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Mejillón", cantidad: 500 }, { nombre: "Vino blanco", cantidad: 100 }, AJO(10), { nombre: "Perejil", cantidad: 15 },
  ]},
  { nombre: "Gambas al ajillo", descripcion: "Gambas salteadas con ajo.", porciones: 2, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Gamba", cantidad: 300 }, AJO(20), { nombre: "Guindilla", cantidad: 2 }, ACEITE(30), { nombre: "Perejil", cantidad: 10 },
  ]},
  { nombre: "Calamares a la plancha", descripcion: "Calamar con ajo y perejil.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Calamar", cantidad: 400 }, AJO(10), { nombre: "Perejil", cantidad: 10 }, ACEITE(15), LIMON(15),
  ]},
  { nombre: "Sepia a la plancha", descripcion: "Sepia con ajoaceite.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Sepia", cantidad: 400 }, AJO(10), { nombre: "Perejil", cantidad: 10 }, ACEITE(15),
  ]},
  { nombre: "Arroz con bacalao", descripcion: "Arroz meloso con bacalao.", porciones: 2, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 200 }, { nombre: "Bacalao", cantidad: 250 }, { nombre: "Pimiento rojo", cantidad: 100 }, TOMATE(150), AJO(5), ACEITE(15),
  ]},
];

const CARNES: RecetaSeed[] = [
  { nombre: "Solomillo de ternera al horno", descripcion: "Solomillo tierno al horno.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Solomillo de ternera", cantidad: 400 }, AJO(5), { nombre: "Romero", cantidad: 3 }, ACEITE(15), SAL(2),
  ]},
  { nombre: "Filete de ternera a la plancha", descripcion: "Filete clásico.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Ternera", cantidad: 200 }, ACEITE(5), SAL(1), PIMIENTA(1),
  ]},
  { nombre: "Albóndigas en salsa de tomate", descripcion: "Albóndigas caseras.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Ternera picada", cantidad: 500 }, HUEVO(60), { nombre: "Pan rallado", cantidad: 50 }, TOMATE(400), CEBOLLA(100), AJO(5),
  ]},
  { nombre: "Hamburguesa casera", descripcion: "Hamburguesa con lechuga y tomate.", porciones: 1, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Ternera picada", cantidad: 180 }, { nombre: "Pan de hamburguesa", cantidad: 80 }, { nombre: "Lechuga", cantidad: 30 }, TOMATE(50), { nombre: "Queso", cantidad: 30 },
  ]},
  { nombre: "Entrecot a la plancha", descripcion: "Entrecot con sal en escamas.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Entrecot", cantidad: 300 }, ACEITE(5), SAL(3),
  ]},
  { nombre: "Ragú de ternera", descripcion: "Carne estofada en vino.", porciones: 4, tiempoPreparacion: 90, ingredientes: [
    { nombre: "Ternera", cantidad: 800 }, { nombre: "Zanahoria", cantidad: 200 }, CEBOLLA(200), { nombre: "Vino tinto", cantidad: 200 }, TOMATE(200),
  ]},
  { nombre: "Carne guisada con patatas", descripcion: "Guiso casero.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Ternera", cantidad: 600 }, { nombre: "Patata", cantidad: 500 }, { nombre: "Zanahoria", cantidad: 150 }, CEBOLLA(150), TOMATE(150),
  ]},
  { nombre: "Cordero asado", descripcion: "Pierna de cordero al horno.", porciones: 4, tiempoPreparacion: 90, ingredientes: [
    { nombre: "Cordero", cantidad: 1000 }, AJO(10), { nombre: "Romero", cantidad: 5 }, ACEITE(30), { nombre: "Vino blanco", cantidad: 100 },
  ]},
  { nombre: "Costillas al horno con miel", descripcion: "Costillas glaseadas.", porciones: 2, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Costillas de cerdo", cantidad: 600 }, { nombre: "Miel", cantidad: 40 }, { nombre: "Salsa de soja", cantidad: 25 }, AJO(5),
  ]},
  { nombre: "Brocheta de ternera y pimientos", descripcion: "Brochetas coloridas.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Ternera", cantidad: 350 }, { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Pimiento verde", cantidad: 100 }, CEBOLLA(80), ACEITE(15),
  ]},
  { nombre: "Escalope de ternera", descripcion: "Escalope empanado.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Ternera", cantidad: 300 }, HUEVO(60), { nombre: "Pan rallado", cantidad: 60 }, ACEITE(20), LIMON(15),
  ]},
  { nombre: "Ropa vieja", descripcion: "Carne deshilachada con verduras.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Ternera", cantidad: 500 }, { nombre: "Pimiento rojo", cantidad: 200 }, CEBOLLA(150), TOMATE(200), AJO(5), ACEITE(20),
  ]},
  { nombre: "Estofado de ternera", descripcion: "Estofado tradicional.", porciones: 4, tiempoPreparacion: 90, ingredientes: [
    { nombre: "Ternera", cantidad: 700 }, { nombre: "Patata", cantidad: 400 }, { nombre: "Zanahoria", cantidad: 200 }, { nombre: "Vino tinto", cantidad: 150 }, CEBOLLA(100),
  ]},
  { nombre: "Bistec empanado", descripcion: "Bistec a la milanesa.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Ternera", cantidad: 300 }, HUEVO(60), { nombre: "Pan rallado", cantidad: 60 }, ACEITE(25),
  ]},
  { nombre: "Tataki de ternera", descripcion: "Ternera sellada tipo japonés.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Ternera", cantidad: 300 }, { nombre: "Salsa de soja", cantidad: 20 }, { nombre: "Jengibre", cantidad: 5 }, { nombre: "Sésamo", cantidad: 5 }, ACEITE(10),
  ]},
  { nombre: "Salteado de ternera con brócoli", descripcion: "Wok de ternera con brócoli.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Ternera", cantidad: 300 }, { nombre: "Brócoli", cantidad: 250 }, { nombre: "Salsa de soja", cantidad: 25 }, AJO(5), { nombre: "Jengibre", cantidad: 5 },
  ]},
  { nombre: "Lomo de cerdo asado", descripcion: "Lomo asado con especias.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Lomo de cerdo", cantidad: 800 }, AJO(10), { nombre: "Romero", cantidad: 3 }, ACEITE(20), { nombre: "Vino blanco", cantidad: 80 },
  ]},
  { nombre: "Solomillo de cerdo con manzana", descripcion: "Solomillo con reducción de manzana.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Solomillo de cerdo", cantidad: 400 }, { nombre: "Manzana", cantidad: 200 }, CEBOLLA(80), { nombre: "Nata", cantidad: 80 },
  ]},
  { nombre: "Costillas de cerdo a la barbacoa", descripcion: "Costillas con salsa BBQ.", porciones: 4, tiempoPreparacion: 75, ingredientes: [
    { nombre: "Costillas de cerdo", cantidad: 1000 }, { nombre: "Salsa barbacoa", cantidad: 120 }, AJO(5),
  ]},
  { nombre: "Pinchos morunos", descripcion: "Brochetas de cerdo especiadas.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Lomo de cerdo", cantidad: 400 }, { nombre: "Pimiento verde", cantidad: 100 }, CEBOLLA(80), { nombre: "Comino", cantidad: 3 }, ACEITE(15),
  ]},
  { nombre: "Tacos de carne picada", descripcion: "Tacos mexicanos.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Ternera picada", cantidad: 300 }, { nombre: "Tortilla de maíz", cantidad: 150 }, TOMATE(150), CEBOLLA(80), { nombre: "Comino", cantidad: 3 },
  ]},
  { nombre: "Chuletas de cerdo a la plancha", descripcion: "Chuletas sencillas.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Chuleta de cerdo", cantidad: 400 }, ACEITE(10), SAL(2), AJO(3),
  ]},
  { nombre: "Lasaña ligera de carne", descripcion: "Lasaña con verduras.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Lasaña", cantidad: 200 }, { nombre: "Ternera picada", cantidad: 400 }, TOMATE(400), { nombre: "Calabacín", cantidad: 200 }, { nombre: "Queso", cantidad: 100 },
  ]},
  { nombre: "Brochetas de cordero", descripcion: "Cordero marinado en brocheta.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Cordero", cantidad: 400 }, { nombre: "Pimiento rojo", cantidad: 100 }, CEBOLLA(80), { nombre: "Comino", cantidad: 3 }, ACEITE(15),
  ]},
  { nombre: "Wok de ternera con verduras", descripcion: "Salteado asiático.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Ternera", cantidad: 300 }, { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Brócoli", cantidad: 150 }, { nombre: "Salsa de soja", cantidad: 25 },
  ]},
  { nombre: "Ternera stroganoff", descripcion: "Ternera en salsa cremosa.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Ternera", cantidad: 400 }, { nombre: "Champiñón", cantidad: 200 }, CEBOLLA(100), { nombre: "Nata", cantidad: 150 }, ACEITE(15),
  ]},
  { nombre: "Carpaccio de ternera", descripcion: "Ternera cruda en láminas.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Ternera", cantidad: 200 }, { nombre: "Rúcula", cantidad: 60 }, { nombre: "Queso parmesano", cantidad: 40 }, ACEITE(20), LIMON(15),
  ]},
  { nombre: "Hamburguesa de ternera con queso", descripcion: "Cheeseburguer casera.", porciones: 1, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Ternera picada", cantidad: 180 }, { nombre: "Pan de hamburguesa", cantidad: 80 }, { nombre: "Queso cheddar", cantidad: 40 }, { nombre: "Lechuga", cantidad: 30 }, TOMATE(50),
  ]},
  { nombre: "Secreto ibérico a la plancha", descripcion: "Secreto jugoso con sal.", porciones: 2, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Secreto ibérico", cantidad: 400 }, ACEITE(5), SAL(3),
  ]},
  { nombre: "Chuletón a la brasa", descripcion: "Chuletón vuelta y vuelta.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Chuletón", cantidad: 600 }, SAL(5), ACEITE(10),
  ]},
];

const POLLO: RecetaSeed[] = [
  { nombre: "Pollo al curry", descripcion: "Pollo en salsa de curry y coco.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 400 }, { nombre: "Leche de coco", cantidad: 250 }, { nombre: "Curry", cantidad: 10 }, CEBOLLA(150), AJO(5),
  ]},
  { nombre: "Pechuga de pollo a la plancha", descripcion: "Pollo sencillo y jugoso.", porciones: 1, tiempoPreparacion: 12, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 200 }, ACEITE(5), SAL(1), LIMON(10),
  ]},
  { nombre: "Pollo asado al limón", descripcion: "Pollo entero al horno.", porciones: 4, tiempoPreparacion: 75, ingredientes: [
    { nombre: "Pollo", cantidad: 1500 }, LIMON(60), AJO(15), { nombre: "Romero", cantidad: 5 }, ACEITE(25),
  ]},
  { nombre: "Pollo al horno con patatas", descripcion: "Clásico pollo con patatas.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Pollo", cantidad: 1200 }, { nombre: "Patata", cantidad: 600 }, AJO(10), { nombre: "Vino blanco", cantidad: 100 }, ACEITE(30),
  ]},
  { nombre: "Alitas de pollo al horno", descripcion: "Alitas crujientes con especias.", porciones: 2, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Alitas de pollo", cantidad: 600 }, { nombre: "Pimentón", cantidad: 5 }, AJO(5), ACEITE(15),
  ]},
  { nombre: "Pollo teriyaki", descripcion: "Pollo glaseado estilo japonés.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 400 }, { nombre: "Salsa de soja", cantidad: 30 }, { nombre: "Miel", cantidad: 20 }, { nombre: "Jengibre", cantidad: 5 }, { nombre: "Sésamo", cantidad: 5 },
  ]},
  { nombre: "Pollo cacciatore", descripcion: "Pollo estofado con tomate.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Pollo", cantidad: 800 }, TOMATE(400), { nombre: "Pimiento rojo", cantidad: 150 }, CEBOLLA(150), { nombre: "Champiñón", cantidad: 150 },
  ]},
  { nombre: "Wrap de pollo con lechuga", descripcion: "Wrap ligero para llevar.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Tortilla de trigo", cantidad: 80 }, { nombre: "Pechuga de pollo", cantidad: 150 }, { nombre: "Lechuga", cantidad: 40 }, TOMATE(50), { nombre: "Yogur natural", cantidad: 30 },
  ]},
  { nombre: "Pollo al champiñón", descripcion: "Pollo en salsa de champiñón.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 400 }, { nombre: "Champiñón", cantidad: 250 }, { nombre: "Nata", cantidad: 150 }, CEBOLLA(80),
  ]},
  { nombre: "Pechuga de pavo a la plancha", descripcion: "Pavo magro a la plancha.", porciones: 1, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Pechuga de pavo", cantidad: 200 }, ACEITE(5), SAL(1), { nombre: "Perejil", cantidad: 5 },
  ]},
  { nombre: "Rollitos de pavo con queso", descripcion: "Rollitos rellenos al horno.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pechuga de pavo", cantidad: 300 }, { nombre: "Queso", cantidad: 80 }, { nombre: "Espinacas", cantidad: 80 }, ACEITE(10),
  ]},
  { nombre: "Brocheta de pollo al pincho", descripcion: "Pinchos morunos de pollo.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 400 }, { nombre: "Pimiento rojo", cantidad: 100 }, CEBOLLA(80), { nombre: "Comino", cantidad: 3 }, ACEITE(15),
  ]},
  { nombre: "Pollo tikka masala", descripcion: "Pollo en salsa tikka.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 400 }, TOMATE(300), { nombre: "Yogur natural", cantidad: 150 }, { nombre: "Curry", cantidad: 10 }, { nombre: "Jengibre", cantidad: 10 },
  ]},
  { nombre: "Pollo al ajillo", descripcion: "Pollo con ajo y vino.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Pollo", cantidad: 600 }, AJO(25), { nombre: "Vino blanco", cantidad: 80 }, ACEITE(20), { nombre: "Perejil", cantidad: 10 },
  ]},
  { nombre: "Pollo con verduras al wok", descripcion: "Wok de pollo asiático.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 300 }, { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Brócoli", cantidad: 150 }, { nombre: "Salsa de soja", cantidad: 25 },
  ]},
  { nombre: "Pechuga de pavo con verduras", descripcion: "Plato ligero equilibrado.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Pechuga de pavo", cantidad: 400 }, { nombre: "Calabacín", cantidad: 150 }, { nombre: "Pimiento rojo", cantidad: 100 }, ACEITE(15),
  ]},
  { nombre: "Pollo en pepitoria", descripcion: "Guiso con almendras y azafrán.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Pollo", cantidad: 1000 }, { nombre: "Almendras", cantidad: 80 }, HUEVO(60), { nombre: "Azafrán", cantidad: 1 }, CEBOLLA(150),
  ]},
  { nombre: "Pollo a la cerveza", descripcion: "Pollo guisado en cerveza.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Pollo", cantidad: 1000 }, { nombre: "Cerveza", cantidad: 330 }, CEBOLLA(200), AJO(10), ACEITE(20),
  ]},
  { nombre: "Pollo a la parmesana", descripcion: "Pollo gratinado con queso y tomate.", porciones: 2, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Pechuga de pollo", cantidad: 400 }, TOMATE(250), { nombre: "Mozzarella", cantidad: 100 }, { nombre: "Queso parmesano", cantidad: 40 }, { nombre: "Pan rallado", cantidad: 40 },
  ]},
  { nombre: "Estofado de pollo", descripcion: "Pollo estofado con verduras.", porciones: 4, tiempoPreparacion: 50, ingredientes: [
    { nombre: "Pollo", cantidad: 800 }, { nombre: "Patata", cantidad: 400 }, { nombre: "Zanahoria", cantidad: 200 }, CEBOLLA(150), { nombre: "Vino blanco", cantidad: 100 },
  ]},
];

const VEGETARIANAS: RecetaSeed[] = [
  { nombre: "Tortilla española", descripcion: "Tortilla de patatas tradicional.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    HUEVO(300), { nombre: "Patata", cantidad: 600 }, CEBOLLA(150), ACEITE(100), SAL(3),
  ]},
  { nombre: "Pisto manchego", descripcion: "Verduras salteadas con tomate.", porciones: 4, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Calabacín", cantidad: 400 }, { nombre: "Pimiento rojo", cantidad: 200 }, { nombre: "Pimiento verde", cantidad: 200 }, TOMATE(400), CEBOLLA(200), ACEITE(30),
  ]},
  { nombre: "Berenjenas rellenas de verduras", descripcion: "Berenjenas gratinadas.", porciones: 2, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Berenjena", cantidad: 500 }, TOMATE(200), { nombre: "Calabacín", cantidad: 150 }, { nombre: "Queso", cantidad: 80 }, CEBOLLA(100),
  ]},
  { nombre: "Tarta de calabacín", descripcion: "Pastel salado de calabacín.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Calabacín", cantidad: 500 }, HUEVO(240), { nombre: "Queso", cantidad: 100 }, CEBOLLA(100), { nombre: "Harina", cantidad: 80 },
  ]},
  { nombre: "Tofu salteado con verduras", descripcion: "Tofu al estilo asiático.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Tofu", cantidad: 300 }, { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Brócoli", cantidad: 150 }, { nombre: "Salsa de soja", cantidad: 25 }, { nombre: "Jengibre", cantidad: 5 },
  ]},
  { nombre: "Champiñones rellenos", descripcion: "Champiñones al horno con queso.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Champiñón", cantidad: 400 }, { nombre: "Queso", cantidad: 80 }, AJO(5), { nombre: "Perejil", cantidad: 10 }, ACEITE(15),
  ]},
  { nombre: "Verduras a la plancha", descripcion: "Verduras mixtas a la plancha.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Calabacín", cantidad: 200 }, { nombre: "Berenjena", cantidad: 200 }, { nombre: "Pimiento rojo", cantidad: 150 }, { nombre: "Espárrago verde", cantidad: 150 }, ACEITE(15),
  ]},
  { nombre: "Patatas al horno con romero", descripcion: "Patatas crujientes.", porciones: 2, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Patata", cantidad: 600 }, ACEITE(25), { nombre: "Romero", cantidad: 3 }, SAL(3), AJO(5),
  ]},
  { nombre: "Ratatouille", descripcion: "Verduras guisadas al estilo francés.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Berenjena", cantidad: 300 }, { nombre: "Calabacín", cantidad: 300 }, { nombre: "Pimiento rojo", cantidad: 200 }, TOMATE(400), CEBOLLA(150), ACEITE(25),
  ]},
  { nombre: "Pimientos del piquillo rellenos", descripcion: "Piquillos rellenos de bacalao.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Pimiento del piquillo", cantidad: 300 }, { nombre: "Bacalao", cantidad: 200 }, CEBOLLA(80), { nombre: "Nata", cantidad: 100 },
  ]},
  { nombre: "Crepes de espinacas", descripcion: "Crepes saladas rellenas.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Espinacas", cantidad: 250 }, HUEVO(120), { nombre: "Harina", cantidad: 100 }, { nombre: "Leche", cantidad: 200 }, { nombre: "Queso", cantidad: 60 },
  ]},
  { nombre: "Quiche de verduras", descripcion: "Tarta salada francesa.", porciones: 4, tiempoPreparacion: 50, ingredientes: [
    { nombre: "Masa quebrada", cantidad: 250 }, { nombre: "Calabacín", cantidad: 200 }, HUEVO(180), { nombre: "Nata", cantidad: 200 }, { nombre: "Queso", cantidad: 100 },
  ]},
  { nombre: "Tortilla de patatas ligera", descripcion: "Tortilla con menos aceite al horno.", porciones: 4, tiempoPreparacion: 35, ingredientes: [
    HUEVO(300), { nombre: "Patata", cantidad: 600 }, CEBOLLA(100), ACEITE(40),
  ]},
  { nombre: "Croquetas de espinacas", descripcion: "Croquetas vegetales.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Espinacas", cantidad: 300 }, { nombre: "Leche", cantidad: 250 }, { nombre: "Harina", cantidad: 80 }, HUEVO(60), { nombre: "Pan rallado", cantidad: 80 },
  ]},
  { nombre: "Revuelto de setas", descripcion: "Revuelto cremoso.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Champiñón", cantidad: 300 }, HUEVO(180), AJO(5), { nombre: "Perejil", cantidad: 5 }, ACEITE(15),
  ]},
  { nombre: "Berenjenas parmesanas", descripcion: "Berenjenas con tomate y mozzarella.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Berenjena", cantidad: 600 }, TOMATE(400), { nombre: "Mozzarella", cantidad: 200 }, { nombre: "Queso parmesano", cantidad: 60 }, { nombre: "Albahaca", cantidad: 10 },
  ]},
  { nombre: "Calabacines al horno con queso", descripcion: "Calabacín gratinado.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Calabacín", cantidad: 500 }, { nombre: "Queso", cantidad: 100 }, AJO(5), ACEITE(15),
  ]},
  { nombre: "Salteado de tofu y brócoli", descripcion: "Tofu marinado con brócoli.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Tofu", cantidad: 300 }, { nombre: "Brócoli", cantidad: 300 }, { nombre: "Salsa de soja", cantidad: 25 }, AJO(5), { nombre: "Sésamo", cantidad: 5 },
  ]},
  { nombre: "Curry vegetal", descripcion: "Curry de verduras y coco.", porciones: 4, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Coliflor", cantidad: 300 }, { nombre: "Patata", cantidad: 300 }, { nombre: "Leche de coco", cantidad: 300 }, { nombre: "Guisantes", cantidad: 150 }, { nombre: "Curry", cantidad: 10 },
  ]},
  { nombre: "Paella de verduras", descripcion: "Paella vegetal.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 400 }, { nombre: "Judías verdes", cantidad: 200 }, { nombre: "Pimiento rojo", cantidad: 150 }, TOMATE(200), { nombre: "Alcachofa", cantidad: 200 }, { nombre: "Azafrán", cantidad: 1 },
  ]},
  { nombre: "Wok de verduras con soja", descripcion: "Verduras rápidas al wok.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Pimiento rojo", cantidad: 100 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Brócoli", cantidad: 150 }, { nombre: "Champiñón", cantidad: 150 }, { nombre: "Salsa de soja", cantidad: 30 },
  ]},
  { nombre: "Tempura de verduras", descripcion: "Verduras rebozadas crujientes.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Calabacín", cantidad: 150 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Berenjena", cantidad: 100 }, { nombre: "Harina", cantidad: 100 }, HUEVO(60), ACEITE(60),
  ]},
  { nombre: "Espárragos gratinados", descripcion: "Espárragos con bechamel.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Espárrago verde", cantidad: 400 }, { nombre: "Bechamel", cantidad: 200 }, { nombre: "Queso", cantidad: 60 },
  ]},
  { nombre: "Coliflor al horno con queso", descripcion: "Coliflor gratinada.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Coliflor", cantidad: 500 }, { nombre: "Queso", cantidad: 100 }, { nombre: "Nata", cantidad: 100 }, AJO(5),
  ]},
  { nombre: "Hamburguesa vegetal de garbanzo", descripcion: "Burger vegetal con especias.", porciones: 2, tiempoPreparacion: 25, ingredientes: [
    { nombre: "Garbanzos (cocidos)", cantidad: 300 }, { nombre: "Avena (copos)", cantidad: 50 }, { nombre: "Perejil", cantidad: 15 }, AJO(3), { nombre: "Comino", cantidad: 3 }, CEBOLLA(60),
  ]},
];

const BATIDOS: RecetaSeed[] = [
  { nombre: "Smoothie verde detox", descripcion: "Espinaca, manzana y jengibre.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Espinacas", cantidad: 60 }, { nombre: "Manzana", cantidad: 150 }, { nombre: "Pepino", cantidad: 80 }, { nombre: "Jengibre", cantidad: 5 }, LIMON(15),
  ]},
  { nombre: "Batido de plátano y fresa", descripcion: "Clásico dulce y cremoso.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Plátano", cantidad: 120 }, { nombre: "Fresa", cantidad: 150 }, { nombre: "Leche", cantidad: 250 },
  ]},
  { nombre: "Smoothie de mango y piña", descripcion: "Tropical y energizante.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Mango", cantidad: 150 }, { nombre: "Piña", cantidad: 150 }, { nombre: "Yogur natural", cantidad: 150 },
  ]},
  { nombre: "Batido de proteínas y plátano", descripcion: "Post entreno alto en proteína.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Plátano", cantidad: 120 }, { nombre: "Leche", cantidad: 250 }, { nombre: "Proteína en polvo", cantidad: 30 }, { nombre: "Avena (copos)", cantidad: 30 },
  ]},
  { nombre: "Smoothie de frutos rojos", descripcion: "Batido antioxidante.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Frambuesa", cantidad: 80 }, { nombre: "Arándanos", cantidad: 80 }, { nombre: "Yogur natural", cantidad: 150 }, { nombre: "Miel", cantidad: 10 },
  ]},
  { nombre: "Batido de chocolate y plátano", descripcion: "Capricho saludable.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Plátano", cantidad: 120 }, { nombre: "Leche", cantidad: 250 }, { nombre: "Cacao", cantidad: 15 }, { nombre: "Avena (copos)", cantidad: 20 },
  ]},
  { nombre: "Smoothie de aguacate y espinacas", descripcion: "Cremoso y nutritivo.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Aguacate", cantidad: 80 }, { nombre: "Espinacas", cantidad: 50 }, { nombre: "Plátano", cantidad: 100 }, { nombre: "Leche", cantidad: 200 },
  ]},
  { nombre: "Batido de naranja y zanahoria", descripcion: "Rico en vitamina A y C.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Zumo de naranja", cantidad: 250 }, { nombre: "Zanahoria", cantidad: 100 }, { nombre: "Jengibre", cantidad: 3 },
  ]},
  { nombre: "Smoothie de piña y coco", descripcion: "Piña colada saludable.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Piña", cantidad: 200 }, { nombre: "Leche de coco", cantidad: 150 }, { nombre: "Yogur natural", cantidad: 100 },
  ]},
  { nombre: "Batido de kiwi y manzana", descripcion: "Refrescante vitamínico.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Kiwi", cantidad: 120 }, { nombre: "Manzana", cantidad: 150 }, { nombre: "Agua", cantidad: 150 },
  ]},
  { nombre: "Smoothie de remolacha", descripcion: "Batido rosa energizante.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Remolacha", cantidad: 100 }, { nombre: "Manzana", cantidad: 150 }, { nombre: "Zanahoria", cantidad: 80 }, LIMON(10),
  ]},
  { nombre: "Batido de melocotón y yogur", descripcion: "Suave y veraniego.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Melocotón", cantidad: 200 }, { nombre: "Yogur natural", cantidad: 150 }, { nombre: "Miel", cantidad: 10 },
  ]},
  { nombre: "Smoothie de arándanos y avena", descripcion: "Desayuno completo.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Arándanos", cantidad: 120 }, { nombre: "Avena (copos)", cantidad: 40 }, { nombre: "Leche", cantidad: 250 }, { nombre: "Plátano", cantidad: 80 },
  ]},
  { nombre: "Batido de mango y cúrcuma", descripcion: "Batido antiinflamatorio.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Mango", cantidad: 200 }, { nombre: "Leche de coco", cantidad: 200 }, { nombre: "Cúrcuma", cantidad: 3 },
  ]},
  { nombre: "Smoothie de sandía y menta", descripcion: "Hidratante y refrescante.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Sandía", cantidad: 300 }, { nombre: "Menta", cantidad: 10 }, LIMON(10),
  ]},
];

const SNACKS: RecetaSeed[] = [
  { nombre: "Hummus con crudités", descripcion: "Hummus con palitos de verdura.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Hummus", cantidad: 200 }, { nombre: "Zanahoria", cantidad: 150 }, { nombre: "Apio", cantidad: 100 }, { nombre: "Pepino", cantidad: 150 },
  ]},
  { nombre: "Edamame al vapor", descripcion: "Vainas de soja al vapor.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Edamame", cantidad: 300 }, SAL(3),
  ]},
  { nombre: "Guacamole con nachos", descripcion: "Aperitivo mexicano.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Aguacate", cantidad: 250 }, TOMATE(100), CEBOLLA(40), { nombre: "Lima", cantidad: 15 }, { nombre: "Nachos", cantidad: 100 },
  ]},
  { nombre: "Pinchos de mozzarella y tomate cherry", descripcion: "Brochetas caprese mini.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Mozzarella", cantidad: 150 }, { nombre: "Tomate cherry", cantidad: 200 }, { nombre: "Albahaca", cantidad: 10 }, ACEITE(10),
  ]},
  { nombre: "Tostaditas integrales con paté vegetal", descripcion: "Tostaditas con paté.", porciones: 2, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Pan integral", cantidad: 80 }, { nombre: "Paté vegetal", cantidad: 80 },
  ]},
  { nombre: "Dátiles rellenos de mantequilla de almendra", descripcion: "Snack dulce y energético.", porciones: 2, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Dátiles", cantidad: 100 }, { nombre: "Mantequilla de almendra", cantidad: 30 }, { nombre: "Sésamo", cantidad: 5 },
  ]},
  { nombre: "Palomitas caseras", descripcion: "Palomitas al punto de sal.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Maíz para palomitas", cantidad: 80 }, ACEITE(10), SAL(2),
  ]},
  { nombre: "Manzana con crema de cacahuete", descripcion: "Snack rápido y saciante.", porciones: 1, tiempoPreparacion: 3, ingredientes: [
    { nombre: "Manzana", cantidad: 150 }, { nombre: "Crema de cacahuete", cantidad: 20 },
  ]},
  { nombre: "Yogur con frutos secos", descripcion: "Yogur crujiente.", porciones: 1, tiempoPreparacion: 3, ingredientes: [
    { nombre: "Yogur natural", cantidad: 150 }, { nombre: "Almendras", cantidad: 20 }, { nombre: "Nueces", cantidad: 15 },
  ]},
  { nombre: "Queso cottage con fruta", descripcion: "Snack proteico.", porciones: 1, tiempoPreparacion: 3, ingredientes: [
    { nombre: "Queso cottage", cantidad: 150 }, { nombre: "Melocotón", cantidad: 100 }, { nombre: "Miel", cantidad: 10 },
  ]},
  { nombre: "Chips de kale", descripcion: "Kale crujiente al horno.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Kale", cantidad: 200 }, ACEITE(10), SAL(2),
  ]},
  { nombre: "Chips de manzana al horno", descripcion: "Manzana deshidratada dulce.", porciones: 2, tiempoPreparacion: 90, ingredientes: [
    { nombre: "Manzana", cantidad: 300 }, { nombre: "Canela", cantidad: 3 },
  ]},
  { nombre: "Nueces especiadas", descripcion: "Nueces al horno con especias.", porciones: 4, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Nueces", cantidad: 200 }, { nombre: "Miel", cantidad: 20 }, { nombre: "Canela", cantidad: 3 }, SAL(2),
  ]},
  { nombre: "Bocaditos de atún y pepino", descripcion: "Bocados ligeros.", porciones: 2, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Atún claro", cantidad: 80 }, { nombre: "Pepino", cantidad: 200 }, { nombre: "Queso fresco", cantidad: 60 },
  ]},
  { nombre: "Rollos de pavo y queso", descripcion: "Rollitos sin pan.", porciones: 1, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Pavo", cantidad: 80 }, { nombre: "Queso", cantidad: 40 }, { nombre: "Lechuga", cantidad: 30 },
  ]},
];

const POSTRES: RecetaSeed[] = [
  { nombre: "Mousse de yogur y fresa", descripcion: "Mousse ligero y fresco.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Yogur griego", cantidad: 300 }, { nombre: "Fresa", cantidad: 200 }, { nombre: "Miel", cantidad: 20 },
  ]},
  { nombre: "Manzana al horno con canela", descripcion: "Clásico aromático.", porciones: 2, tiempoPreparacion: 30, ingredientes: [
    { nombre: "Manzana", cantidad: 400 }, { nombre: "Canela", cantidad: 5 }, { nombre: "Miel", cantidad: 20 },
  ]},
  { nombre: "Flan de huevo casero", descripcion: "Flan tradicional.", porciones: 4, tiempoPreparacion: 60, ingredientes: [
    HUEVO(240), { nombre: "Leche", cantidad: 500 }, { nombre: "Azúcar", cantidad: 120 }, LIMON(10),
  ]},
  { nombre: "Crema de cacao y aguacate", descripcion: "Mousse vegano de chocolate.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Aguacate", cantidad: 200 }, { nombre: "Cacao", cantidad: 30 }, { nombre: "Miel", cantidad: 30 }, { nombre: "Leche", cantidad: 50 },
  ]},
  { nombre: "Bizcocho de yogur", descripcion: "Bizcocho clásico esponjoso.", porciones: 8, tiempoPreparacion: 50, ingredientes: [
    { nombre: "Yogur natural", cantidad: 125 }, HUEVO(180), { nombre: "Harina", cantidad: 250 }, { nombre: "Azúcar", cantidad: 150 }, ACEITE(100), LIMON(15),
  ]},
  { nombre: "Bolitas energéticas de dátil", descripcion: "Energy balls sin horno.", porciones: 8, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Dátiles", cantidad: 200 }, { nombre: "Avena (copos)", cantidad: 100 }, { nombre: "Almendras", cantidad: 80 }, { nombre: "Cacao", cantidad: 15 },
  ]},
  { nombre: "Pudding de chía con frutos rojos", descripcion: "Desayuno-postre saludable.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Semillas de chía", cantidad: 40 }, { nombre: "Leche", cantidad: 400 }, { nombre: "Frambuesa", cantidad: 100 }, { nombre: "Miel", cantidad: 15 },
  ]},
  { nombre: "Fresas con chocolate negro", descripcion: "Fresas bañadas.", porciones: 2, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Fresa", cantidad: 300 }, { nombre: "Chocolate negro", cantidad: 100 },
  ]},
  { nombre: "Helado de plátano", descripcion: "Nice cream sin lácteos.", porciones: 2, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Plátano", cantidad: 300 }, { nombre: "Cacao", cantidad: 10 }, { nombre: "Miel", cantidad: 10 },
  ]},
  { nombre: "Arroz con leche bajo en azúcar", descripcion: "Versión ligera.", porciones: 4, tiempoPreparacion: 45, ingredientes: [
    { nombre: "Arroz (crudo)", cantidad: 150 }, { nombre: "Leche", cantidad: 900 }, { nombre: "Azúcar", cantidad: 50 }, { nombre: "Canela", cantidad: 3 },
  ]},
  { nombre: "Tarta de queso ligera", descripcion: "Cheesecake al horno.", porciones: 6, tiempoPreparacion: 60, ingredientes: [
    { nombre: "Queso crema", cantidad: 400 }, HUEVO(180), { nombre: "Azúcar", cantidad: 100 }, { nombre: "Yogur griego", cantidad: 200 }, { nombre: "Galletas", cantidad: 100 },
  ]},
  { nombre: "Brownie de aguacate", descripcion: "Brownie saludable.", porciones: 6, tiempoPreparacion: 35, ingredientes: [
    { nombre: "Aguacate", cantidad: 200 }, { nombre: "Cacao", cantidad: 60 }, HUEVO(120), { nombre: "Miel", cantidad: 100 }, { nombre: "Harina", cantidad: 100 },
  ]},
  { nombre: "Galletas de avena y plátano", descripcion: "Galletas sencillas de 3 ingredientes.", porciones: 4, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Avena (copos)", cantidad: 150 }, { nombre: "Plátano", cantidad: 200 }, { nombre: "Pasas", cantidad: 30 },
  ]},
  { nombre: "Crepes con plátano y cacao", descripcion: "Crepes dulces.", porciones: 2, tiempoPreparacion: 20, ingredientes: [
    { nombre: "Harina", cantidad: 100 }, HUEVO(60), { nombre: "Leche", cantidad: 200 }, { nombre: "Plátano", cantidad: 150 }, { nombre: "Cacao", cantidad: 15 },
  ]},
  { nombre: "Pera al vino", descripcion: "Peras cocidas en vino tinto.", porciones: 4, tiempoPreparacion: 40, ingredientes: [
    { nombre: "Pera", cantidad: 600 }, { nombre: "Vino tinto", cantidad: 400 }, { nombre: "Azúcar", cantidad: 80 }, { nombre: "Canela", cantidad: 3 },
  ]},
];

const SALSAS: RecetaSeed[] = [
  { nombre: "Salsa tzatziki", descripcion: "Yogur con pepino y ajo.", porciones: 4, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Yogur griego", cantidad: 300 }, { nombre: "Pepino", cantidad: 150 }, AJO(5), { nombre: "Menta", cantidad: 5 }, ACEITE(15),
  ]},
  { nombre: "Pesto de albahaca", descripcion: "Salsa italiana verde.", porciones: 4, tiempoPreparacion: 10, ingredientes: [
    { nombre: "Albahaca", cantidad: 60 }, { nombre: "Piñones", cantidad: 40 }, { nombre: "Queso parmesano", cantidad: 60 }, AJO(5), ACEITE(80),
  ]},
  { nombre: "Salsa romesco", descripcion: "Salsa catalana de pimiento.", porciones: 4, tiempoPreparacion: 15, ingredientes: [
    { nombre: "Pimiento rojo", cantidad: 200 }, { nombre: "Almendras", cantidad: 80 }, TOMATE(150), AJO(5), ACEITE(60), { nombre: "Vinagre", cantidad: 15 },
  ]},
  { nombre: "Mayonesa casera", descripcion: "Mayonesa con aceite de girasol.", porciones: 4, tiempoPreparacion: 5, ingredientes: [
    HUEVO(60), { nombre: "Aceite de girasol", cantidad: 200 }, LIMON(15), SAL(2),
  ]},
  { nombre: "Alioli", descripcion: "Ajoaceite emulsionado.", porciones: 4, tiempoPreparacion: 10, ingredientes: [
    AJO(15), ACEITE(150), HUEVO(60), LIMON(10), SAL(2),
  ]},
  { nombre: "Salsa vinagreta", descripcion: "Vinagreta clásica.", porciones: 4, tiempoPreparacion: 3, ingredientes: [
    ACEITE(80), { nombre: "Vinagre", cantidad: 25 }, SAL(2), { nombre: "Mostaza", cantidad: 10 },
  ]},
  { nombre: "Tapenade de aceitunas", descripcion: "Paté de aceitunas negras.", porciones: 4, tiempoPreparacion: 8, ingredientes: [
    { nombre: "Aceitunas", cantidad: 200 }, { nombre: "Alcaparras", cantidad: 20 }, AJO(3), ACEITE(40), LIMON(10),
  ]},
  { nombre: "Crema de aguacate", descripcion: "Crema untable.", porciones: 4, tiempoPreparacion: 5, ingredientes: [
    { nombre: "Aguacate", cantidad: 250 }, LIMON(15), AJO(3), SAL(1),
  ]},
  { nombre: "Salsa barbacoa casera", descripcion: "BBQ sin azúcar refinado.", porciones: 6, tiempoPreparacion: 20, ingredientes: [
    TOMATE(300), { nombre: "Miel", cantidad: 40 }, { nombre: "Vinagre", cantidad: 30 }, { nombre: "Salsa de soja", cantidad: 20 }, { nombre: "Pimentón", cantidad: 5 },
  ]},
  { nombre: "Salsa rosa ligera", descripcion: "Mayonesa y ketchup ligero.", porciones: 4, tiempoPreparacion: 3, ingredientes: [
    { nombre: "Yogur griego", cantidad: 150 }, { nombre: "Ketchup", cantidad: 50 }, LIMON(5),
  ]},
];

export const RECETAS_SEED: RecetaSeed[] = [
  ...DESAYUNOS,
  ...ENSALADAS,
  ...SOPAS,
  ...ARROCES,
  ...PASTAS,
  ...LEGUMBRES,
  ...PESCADOS,
  ...CARNES,
  ...POLLO,
  ...VEGETARIANAS,
  ...BATIDOS,
  ...SNACKS,
  ...POSTRES,
  ...SALSAS,
];
