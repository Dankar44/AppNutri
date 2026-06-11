import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { normalizarNombreAlimento, normalizarParaBusqueda, redondearMacros } from "../src/lib/alimento-utils";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const alimentos = [
  // FRUTAS
  { nombre: "Manzana", categoria: "FRUTAS" as const, calorias: 52, proteinas: 0.3, carbohidratos: 14, grasas: 0.2, fibra: 2.4, porcion: 180 },
  { nombre: "Plátano", categoria: "FRUTAS" as const, calorias: 89, proteinas: 1.1, carbohidratos: 23, grasas: 0.3, fibra: 2.6, porcion: 120 },
  { nombre: "Naranja", categoria: "FRUTAS" as const, calorias: 47, proteinas: 0.9, carbohidratos: 12, grasas: 0.1, fibra: 2.4, porcion: 200 },
  { nombre: "Fresa", categoria: "FRUTAS" as const, calorias: 32, proteinas: 0.7, carbohidratos: 7.7, grasas: 0.3, fibra: 2, porcion: 150 },
  { nombre: "Uva", categoria: "FRUTAS" as const, calorias: 69, proteinas: 0.7, carbohidratos: 18, grasas: 0.2, fibra: 0.9, porcion: 100 },
  { nombre: "Pera", categoria: "FRUTAS" as const, calorias: 57, proteinas: 0.4, carbohidratos: 15, grasas: 0.1, fibra: 3.1, porcion: 170 },
  { nombre: "Melocotón", categoria: "FRUTAS" as const, calorias: 39, proteinas: 0.9, carbohidratos: 10, grasas: 0.3, fibra: 1.5, porcion: 150 },
  { nombre: "Sandía", categoria: "FRUTAS" as const, calorias: 30, proteinas: 0.6, carbohidratos: 7.6, grasas: 0.2, fibra: 0.4, porcion: 200 },

  // VERDURAS
  { nombre: "Tomate", categoria: "VERDURAS" as const, calorias: 18, proteinas: 0.9, carbohidratos: 3.9, grasas: 0.2, fibra: 1.2, porcion: 150 },
  { nombre: "Lechuga", categoria: "VERDURAS" as const, calorias: 15, proteinas: 1.4, carbohidratos: 2.9, grasas: 0.2, fibra: 1.3, porcion: 80 },
  { nombre: "Cebolla", categoria: "VERDURAS" as const, calorias: 40, proteinas: 1.1, carbohidratos: 9.3, grasas: 0.1, fibra: 1.7, porcion: 100 },
  { nombre: "Zanahoria", categoria: "VERDURAS" as const, calorias: 41, proteinas: 0.9, carbohidratos: 10, grasas: 0.2, fibra: 2.8, porcion: 80 },
  { nombre: "Pimiento rojo", categoria: "VERDURAS" as const, calorias: 31, proteinas: 1, carbohidratos: 6, grasas: 0.3, fibra: 2.1, porcion: 150 },
  { nombre: "Espinacas", categoria: "VERDURAS" as const, calorias: 23, proteinas: 2.9, carbohidratos: 3.6, grasas: 0.4, fibra: 2.2, porcion: 100 },
  { nombre: "Brócoli", categoria: "VERDURAS" as const, calorias: 34, proteinas: 2.8, carbohidratos: 7, grasas: 0.4, fibra: 2.6, porcion: 150 },
  { nombre: "Calabacín", categoria: "VERDURAS" as const, calorias: 17, proteinas: 1.2, carbohidratos: 3.1, grasas: 0.3, fibra: 1, porcion: 200 },
  { nombre: "Berenjena", categoria: "VERDURAS" as const, calorias: 25, proteinas: 1, carbohidratos: 6, grasas: 0.2, fibra: 3, porcion: 200 },
  { nombre: "Judías verdes", categoria: "VERDURAS" as const, calorias: 31, proteinas: 1.8, carbohidratos: 7, grasas: 0.1, fibra: 3.4, porcion: 150 },

  // CEREALES
  { nombre: "Arroz blanco (cocido)", categoria: "CEREALES" as const, calorias: 130, proteinas: 2.7, carbohidratos: 28, grasas: 0.3, fibra: 0.4, porcion: 150 },
  { nombre: "Arroz integral (cocido)", categoria: "CEREALES" as const, calorias: 111, proteinas: 2.6, carbohidratos: 23, grasas: 0.9, fibra: 1.8, porcion: 150 },
  { nombre: "Pan blanco", categoria: "CEREALES" as const, calorias: 265, proteinas: 9, carbohidratos: 49, grasas: 3.2, fibra: 2.7, porcion: 40 },
  { nombre: "Pan integral", categoria: "CEREALES" as const, calorias: 247, proteinas: 13, carbohidratos: 41, grasas: 3.4, fibra: 7, porcion: 40 },
  { nombre: "Pasta (cocida)", categoria: "CEREALES" as const, calorias: 131, proteinas: 5, carbohidratos: 25, grasas: 1.1, fibra: 1.8, porcion: 150 },
  { nombre: "Avena", categoria: "CEREALES" as const, calorias: 389, proteinas: 17, carbohidratos: 66, grasas: 6.9, fibra: 10.6, porcion: 40 },
  { nombre: "Quinoa (cocida)", categoria: "CEREALES" as const, calorias: 120, proteinas: 4.4, carbohidratos: 21, grasas: 1.9, fibra: 2.8, porcion: 150 },

  // LEGUMBRES
  { nombre: "Lentejas (cocidas)", categoria: "LEGUMBRES" as const, calorias: 116, proteinas: 9, carbohidratos: 20, grasas: 0.4, fibra: 7.9, porcion: 150 },
  { nombre: "Garbanzos (cocidos)", categoria: "LEGUMBRES" as const, calorias: 164, proteinas: 8.9, carbohidratos: 27, grasas: 2.6, fibra: 7.6, porcion: 150 },
  { nombre: "Alubias blancas (cocidas)", categoria: "LEGUMBRES" as const, calorias: 139, proteinas: 9.7, carbohidratos: 25, grasas: 0.5, fibra: 6.3, porcion: 150 },
  { nombre: "Guisantes", categoria: "LEGUMBRES" as const, calorias: 81, proteinas: 5.4, carbohidratos: 14, grasas: 0.4, fibra: 5.7, porcion: 100 },

  // CARNES
  { nombre: "Pechuga de pollo", categoria: "CARNES" as const, calorias: 165, proteinas: 31, carbohidratos: 0, grasas: 3.6, fibra: 0, porcion: 150 },
  { nombre: "Muslo de pollo", categoria: "CARNES" as const, calorias: 209, proteinas: 26, carbohidratos: 0, grasas: 11, fibra: 0, porcion: 150 },
  { nombre: "Ternera (solomillo)", categoria: "CARNES" as const, calorias: 158, proteinas: 28, carbohidratos: 0, grasas: 4.6, fibra: 0, porcion: 150 },
  { nombre: "Cerdo (lomo)", categoria: "CARNES" as const, calorias: 143, proteinas: 26, carbohidratos: 0, grasas: 3.5, fibra: 0, porcion: 150 },
  { nombre: "Pavo (pechuga)", categoria: "CARNES" as const, calorias: 135, proteinas: 30, carbohidratos: 0, grasas: 1, fibra: 0, porcion: 150 },
  { nombre: "Jamón serrano", categoria: "CARNES" as const, calorias: 241, proteinas: 31, carbohidratos: 0.3, grasas: 13, fibra: 0, porcion: 30 },
  { nombre: "Jamón york", categoria: "CARNES" as const, calorias: 126, proteinas: 18, carbohidratos: 2, grasas: 5, fibra: 0, porcion: 30 },

  // PESCADOS
  { nombre: "Salmón", categoria: "PESCADOS" as const, calorias: 208, proteinas: 20, carbohidratos: 0, grasas: 13, fibra: 0, porcion: 150 },
  { nombre: "Merluza", categoria: "PESCADOS" as const, calorias: 82, proteinas: 17, carbohidratos: 0, grasas: 1.3, fibra: 0, porcion: 150 },
  { nombre: "Atún fresco", categoria: "PESCADOS" as const, calorias: 144, proteinas: 23, carbohidratos: 0, grasas: 5, fibra: 0, porcion: 150 },
  { nombre: "Atún en lata (natural)", categoria: "PESCADOS" as const, calorias: 116, proteinas: 26, carbohidratos: 0, grasas: 0.8, fibra: 0, porcion: 80 },
  { nombre: "Sardinas", categoria: "PESCADOS" as const, calorias: 208, proteinas: 25, carbohidratos: 0, grasas: 11, fibra: 0, porcion: 100 },
  { nombre: "Lubina", categoria: "PESCADOS" as const, calorias: 97, proteinas: 18, carbohidratos: 0, grasas: 2.5, fibra: 0, porcion: 150 },
  { nombre: "Gambas", categoria: "PESCADOS" as const, calorias: 99, proteinas: 24, carbohidratos: 0.2, grasas: 0.3, fibra: 0, porcion: 100 },
  { nombre: "Mejillones", categoria: "PESCADOS" as const, calorias: 86, proteinas: 12, carbohidratos: 3.7, grasas: 2.2, fibra: 0, porcion: 100 },

  // LACTEOS
  { nombre: "Leche entera", categoria: "LACTEOS" as const, calorias: 61, proteinas: 3.2, carbohidratos: 4.8, grasas: 3.3, fibra: 0, porcion: 250 },
  { nombre: "Leche semidesnatada", categoria: "LACTEOS" as const, calorias: 46, proteinas: 3.4, carbohidratos: 4.9, grasas: 1.6, fibra: 0, porcion: 250 },
  { nombre: "Yogur natural", categoria: "LACTEOS" as const, calorias: 61, proteinas: 3.5, carbohidratos: 4.7, grasas: 3.3, fibra: 0, porcion: 125 },
  { nombre: "Yogur griego", categoria: "LACTEOS" as const, calorias: 97, proteinas: 9, carbohidratos: 3.6, grasas: 5, fibra: 0, porcion: 125 },
  { nombre: "Queso fresco", categoria: "LACTEOS" as const, calorias: 174, proteinas: 11, carbohidratos: 3.3, grasas: 13, fibra: 0, porcion: 50 },
  { nombre: "Queso manchego", categoria: "LACTEOS" as const, calorias: 376, proteinas: 26, carbohidratos: 0.5, grasas: 30, fibra: 0, porcion: 30 },
  { nombre: "Requesón", categoria: "LACTEOS" as const, calorias: 98, proteinas: 11, carbohidratos: 3.4, grasas: 4.3, fibra: 0, porcion: 100 },

  // HUEVOS
  { nombre: "Huevo entero", categoria: "HUEVOS" as const, calorias: 155, proteinas: 13, carbohidratos: 1.1, grasas: 11, fibra: 0, porcion: 60 },
  { nombre: "Clara de huevo", categoria: "HUEVOS" as const, calorias: 52, proteinas: 11, carbohidratos: 0.7, grasas: 0.2, fibra: 0, porcion: 33 },

  // FRUTOS SECOS
  { nombre: "Almendras", categoria: "FRUTOS_SECOS" as const, calorias: 579, proteinas: 21, carbohidratos: 22, grasas: 50, fibra: 12.5, porcion: 30 },
  { nombre: "Nueces", categoria: "FRUTOS_SECOS" as const, calorias: 654, proteinas: 15, carbohidratos: 14, grasas: 65, fibra: 6.7, porcion: 30 },
  { nombre: "Cacahuetes", categoria: "FRUTOS_SECOS" as const, calorias: 567, proteinas: 26, carbohidratos: 16, grasas: 49, fibra: 8.5, porcion: 30 },
  { nombre: "Pistachos", categoria: "FRUTOS_SECOS" as const, calorias: 560, proteinas: 20, carbohidratos: 28, grasas: 45, fibra: 10, porcion: 30 },
  { nombre: "Semillas de chía", categoria: "FRUTOS_SECOS" as const, calorias: 486, proteinas: 17, carbohidratos: 42, grasas: 31, fibra: 34, porcion: 15 },

  // ACEITES
  { nombre: "Aceite de oliva virgen extra", categoria: "ACEITES" as const, calorias: 884, proteinas: 0, carbohidratos: 0, grasas: 100, fibra: 0, porcion: 10 },
  { nombre: "Aceite de girasol", categoria: "ACEITES" as const, calorias: 884, proteinas: 0, carbohidratos: 0, grasas: 100, fibra: 0, porcion: 10 },
  { nombre: "Mantequilla", categoria: "ACEITES" as const, calorias: 717, proteinas: 0.9, carbohidratos: 0.1, grasas: 81, fibra: 0, porcion: 10 },
  { nombre: "Aguacate", categoria: "ACEITES" as const, calorias: 160, proteinas: 2, carbohidratos: 8.5, grasas: 15, fibra: 6.7, porcion: 80 },

  // BEBIDAS
  { nombre: "Bebida de avena", categoria: "BEBIDAS" as const, calorias: 46, proteinas: 1, carbohidratos: 8, grasas: 1.5, fibra: 0.8, porcion: 250 },
  { nombre: "Bebida de soja", categoria: "BEBIDAS" as const, calorias: 54, proteinas: 3.3, carbohidratos: 6, grasas: 1.8, fibra: 0.6, porcion: 250 },
  { nombre: "Bebida de almendras", categoria: "BEBIDAS" as const, calorias: 17, proteinas: 0.6, carbohidratos: 0.6, grasas: 1.1, fibra: 0.2, porcion: 250 },

  // CONDIMENTOS
  { nombre: "Miel", categoria: "CONDIMENTOS" as const, calorias: 304, proteinas: 0.3, carbohidratos: 82, grasas: 0, fibra: 0.2, porcion: 15 },
  { nombre: "Salsa de tomate", categoria: "CONDIMENTOS" as const, calorias: 29, proteinas: 1.3, carbohidratos: 5.1, grasas: 0.2, fibra: 1.5, porcion: 50 },

  // OTROS
  { nombre: "Tofu", categoria: "OTROS" as const, calorias: 76, proteinas: 8, carbohidratos: 1.9, grasas: 4.8, fibra: 0.3, porcion: 100 },
  { nombre: "Patata (cocida)", categoria: "VERDURAS" as const, calorias: 87, proteinas: 1.9, carbohidratos: 20, grasas: 0.1, fibra: 1.8, porcion: 200 },
  { nombre: "Boniato (cocido)", categoria: "VERDURAS" as const, calorias: 90, proteinas: 2, carbohidratos: 21, grasas: 0.1, fibra: 3, porcion: 200 },
  { nombre: "Cuscús (cocido)", categoria: "CEREALES" as const, calorias: 112, proteinas: 3.8, carbohidratos: 23, grasas: 0.2, fibra: 1.4, porcion: 150 },
  { nombre: "Chocolate negro 85%", categoria: "DULCES" as const, calorias: 580, proteinas: 10, carbohidratos: 22, grasas: 46, fibra: 11, porcion: 20 },
  { nombre: "Proteína whey", categoria: "OTROS" as const, calorias: 380, proteinas: 78, carbohidratos: 8, grasas: 5, fibra: 0, porcion: 30 },
];

async function main() {
  console.log("Sembrando alimentos...");
  // NOTA: el seed inserta todo en GRAMOS. Tras sembrar, ejecutar
  // `npx tsx scripts/asignar-unidades-alimentos.ts --apply` para asignar las
  // unidades caseras por defecto (huevo → ud, leche → ml, pan → reb…) (#21).

  for (const alimento of alimentos) {
    await prisma.alimento.create({
      data: {
        ...alimento,
        nombre: normalizarNombreAlimento(alimento.nombre),
        nombreNormalizado: normalizarParaBusqueda(alimento.nombre),
        calorias: redondearMacros(alimento.calorias),
        proteinas: redondearMacros(alimento.proteinas),
        carbohidratos: redondearMacros(alimento.carbohidratos),
        grasas: redondearMacros(alimento.grasas),
        fibra: redondearMacros(alimento.fibra),
        unidad: "GRAMOS",
        origen: "PERSONALIZADO",
        dietistaId: null,
      },
    });
  }

  console.log(`${alimentos.length} alimentos creados.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
