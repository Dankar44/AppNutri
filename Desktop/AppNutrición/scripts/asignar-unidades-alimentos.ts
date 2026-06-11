// #21 Medidas caseras: asigna la unidad natural por defecto (UNIDAD, MILILITROS,
// CUCHARADA, CUCHARADITA, REBANADA) a los alimentos GLOBALES (dietistaId null),
// que hoy están todos en GRAMOS. Los macros siguen siendo por 100 g; `porcion`
// pasa a significar "gramos por 1 unidad de la medida" (para g/ml sigue siendo
// la cantidad por defecto al añadir). NO toca alimentos personalizados de nutris
// ni ningún plan existente (AlimentoEnComida guarda su propio snapshot).
//
// Dry-run (default):  npx tsx scripts/asignar-unidades-alimentos.ts
//   → escribe scripts/cambios-unidades.tsv con TODOS los cambios propuestos.
// Aplicar:            npx tsx scripts/asignar-unidades-alimentos.ts --apply
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

type Unidad = "UNIDAD" | "MILILITROS" | "CUCHARADA" | "CUCHARADITA" | "REBANADA" | "LATA" | "LONCHA";
interface Cambio { unidad: Unidad; porcion?: number } // porcion solo si cambia

interface Alimento { id: string; nombre: string; categoria: string; porcion: number }

// ── Helpers de matching (sobre nombre en minúsculas) ─────────────────────────
const re = (p: string) => new RegExp(p, "i");

// Modificadores que convierten una fruta/pieza en producto a granel → se queda en GRAMOS.
const NO_PIEZA = re("deshidratad|liofilizad|congelad|seco\\b|seca\\b|pasa\\b|pasas\\b|almíbar|su jugo|confitad|en trozos|rallad|escarchad|polvo|compota|puré|pulpa|chips|crema|mermelada|rodajas|fresco \\(agua");

/**
 * Decide el cambio para un alimento global. Devuelve null si se queda como está
 * (GRAMOS con su porción actual). Primera regla que aplica gana.
 */
function decidir(a: Alimento): Cambio | null {
  const n = a.nombre.toLowerCase();
  const c = a.categoria;

  // ── HUEVOS ──
  if (c === "HUEVOS") {
    if (re("pasteurizad").test(n)) return { unidad: "MILILITROS" };
    if (re("polvo").test(n)) return null;
    return { unidad: "UNIDAD" }; // huevo/clara/yema/tortilla francesa: porcion ya es 1 ud
  }

  // ── ACEITES ──
  if (c === "ACEITES") {
    if (re("spray").test(n)) return null;
    if (re("manteca|margarina|sebo|grasa de").test(n)) {
      if (re("mantequilla de cacahuete").test(n)) return { unidad: "CUCHARADA" };
      return null;
    }
    if (a.porcion <= 5) return { unidad: "CUCHARADITA" };
    return { unidad: "CUCHARADA" };
  }

  // ── BEBIDAS ──
  if (c === "BEBIDAS") {
    if (re("matcha \\(polvo\\)").test(n)) return { unidad: "CUCHARADITA" };
    if (re("cacao en polvo|cacao soluble|colacao").test(n)) return { unidad: "CUCHARADA" };
    return { unidad: "MILILITROS" }; // porciones ya curadas: vaso 250, lata 330, copa 150…
  }

  // ── LÁCTEOS ──
  if (c === "LACTEOS") {
    if (re("leche en polvo").test(n)) return { unidad: "CUCHARADA" };
    if (re("leche condensada|dulce de leche").test(n)) return { unidad: "CUCHARADA" };
    if (re("^leche |^kéfir|lassi|yogur bebible").test(n)) return { unidad: "MILILITROS" };
    if (re("nata (líquida|para cocinar|para montar|para repostería|ecológica para montar|vegetal)").test(n)) return { unidad: "MILILITROS" };
    if (re("mozzarella (fresca|de búfala|light|ecológica)$|^burrata").test(n)) return { unidad: "UNIDAD", porcion: 125 }; // 1 bola
    if (re("queso en lonchas|queso fundido en lonchas|queso de sandwich").test(n)) return { unidad: "LONCHA" }; // porcion 20 = 1 loncha
    if (re("babybel|mozzarella string").test(n)) return { unidad: "UNIDAD" };
    if (re("^yogur|petit suisse|^actimel|^cuajada|^natillas|^flan |^flan$|arroz con leche|leche fermentada|^skyr").test(n)) {
      if (re("helado|polo").test(n)) return n.startsWith("polo") ? { unidad: "UNIDAD" } : null;
      return { unidad: "UNIDAD" }; // envase: yogur 125, petit 55, flan 110, natillas 125…
    }
    if (re("^polo de").test(n)) return { unidad: "UNIDAD" };
    return null; // quesos, requesón, helados, mantequilla… → GRAMOS
  }

  // ── FRUTAS ──
  if (c === "FRUTAS") {
    // ^… para no capturar "Naranja De Zumo" (que es una pieza de fruta).
    if (re("^(smoothie|batido|zumo)").test(n)) return { unidad: "MILILITROS" };
    if (re("mermelada").test(n)) return { unidad: "CUCHARADA" };
    if (NO_PIEZA.test(n)) return null;
    if (re("^dátil").test(n)) return { unidad: "UNIDAD", porcion: re("medjoul").test(n) ? 25 : 10 };
    const PIEZA = re(
      "^(manzana|pera|plátano|naranja|mandarina|clementina|melocotón|nectarina|paraguaya|kiwi|ciruela|albaricoque|higo|breva|caqui|chirimoya|granada|limón|lima|pomelo|mango|maracuyá|fruta de la pasión|guayaba|carambola)\\b",
    );
    if (PIEZA.test(n) && !re("lima kaffir").test(n)) return { unidad: "UNIDAD" }; // porcion ya = 1 pieza
    return null; // uva, fresa, cereza, sandía, melón, piña, aguacate… → GRAMOS
  }

  // ── CEREALES ──
  if (c === "CEREALES") {
    if (re("pan rallado|panko").test(n)) return null;
    if (re("galleta").test(n)) {
      if (re("maría").test(n)) return { unidad: "UNIDAD", porcion: 5 };
      if (re("wafer").test(n)) return { unidad: "UNIDAD", porcion: 10 };
      return { unidad: "UNIDAD" }; // digestive 15, oreo ~10, arroz inflado 10…
    }
    if (re("^blinis").test(n)) return { unidad: "UNIDAD", porcion: 25 };
    if (re("^(bagel|brioche|croissant|crumpet|muffin|arepa|tortilla de|wrap|tortita|tostada|biscote|gofre|pancake|crepe|taco shell|pretzel|matzo|regañá|rosquilleta|pan ácimo)").test(n)) {
      return { unidad: "UNIDAD" };
    }
    if (re("pan (de hamburguesa|de pita|pita|naan)").test(n)) return { unidad: "UNIDAD" };
    if (re("pan crujiente").test(n)) return { unidad: "UNIDAD" }; // tipo Wasa
    if (re("^(pan|baguette|chapata|ciabatta|focaccia)\\b").test(n)) return { unidad: "REBANADA" };
    return null; // arroz, pasta, harina, copos, avena, granola, muesli… → GRAMOS
  }

  // ── LEGUMBRES / VERDURAS ──
  if (c === "VERDURAS") {
    if (re("^(crema|sopa) de").test(n)) return { unidad: "MILILITROS" };
    if (re("concentrado de tomate").test(n)) return { unidad: "CUCHARADA" };
    return null; // patata, tomate, zanahoria… se pesan (porción típica ya configurada)
  }
  if (c === "LEGUMBRES") return null;

  // ── CARNES ──
  if (c === "CARNES") {
    if (re("hamburguesa|salchicha").test(n)) return { unidad: "UNIDAD" }; // porcion ya = 1 pieza
    if (re("croqueta").test(n)) return { unidad: "UNIDAD", porcion: 35 };
    // Fiambres en lonchas (sobres): jamón serrano/ibérico/pato y cecina cortados finos (~15 g),
    // cocidos/fiambres/bacon/chopped/mortadela más gruesos (~20-25 g).
    // Salchichón/chorizo/fuet/salami NO: sus lonchitas (~4 g) no sirven para pautar.
    if (re("jamón (serrano|ibérico|de pato)|^cecina|lomo embuchado").test(n)) return { unidad: "LONCHA", porcion: 15 };
    if (re("jamón cocido|^fiambre|^chopped|^bacon").test(n)) return { unidad: "LONCHA", porcion: 20 };
    if (re("^mortadela").test(n)) return { unidad: "LONCHA", porcion: 25 };
    if (re("^lacón curado").test(n)) return { unidad: "LONCHA", porcion: 20 };
    return null;
  }

  // ── PESCADOS ──
  if (c === "PESCADOS") {
    if (re("palito de cangrejo|palitos de surimi|surimi barritas|surimi en barritas").test(n)) return { unidad: "UNIDAD", porcion: 15 };
    if (re("varitas de|palitos de pescado").test(n)) return { unidad: "UNIDAD", porcion: 30 };
    // Conservas en lata → "1 lata" con su peso escurrido típico redondeado (atún RO-85
    // ≈ 50 g, sardinas RR-125 = 85 g…). Frascos raros (arenque, bacalao, cocktail) → gramos.
    if (re("^(atún|bonito|ventresca)").test(n) && re("conserva|lata").test(n)) return { unidad: "LATA", porcion: 50 };
    if (re("^(sardina|caballa)").test(n) && re("conserva|lata|en tomate|al natural").test(n)) return { unidad: "LATA", porcion: 85 };
    if (re("^mejillón").test(n) && re("conserva").test(n)) return { unidad: "LATA", porcion: 65 };
    if (re("^berberecho").test(n) && re("conserva").test(n)) return { unidad: "LATA", porcion: 60 };
    if (re("^(navaja|zamburiña)").test(n) && re("conserva").test(n)) return { unidad: "LATA", porcion: 65 };
    return null;
  }

  // ── CONDIMENTOS ──
  if (c === "CONDIMENTOS") {
    if (re("bouillon en cubo").test(n)) return { unidad: "UNIDAD", porcion: 10 }; // 1 pastilla
    if (re("banderilla").test(n)) return { unidad: "UNIDAD" };
    if (re("piquillo").test(n)) return { unidad: "UNIDAD", porcion: 25 }; // 1 pimiento
    if (re("^caldo ecológico|^fumet").test(n)) return { unidad: "MILILITROS" };
    if (re("^(azúcar|panela|eritritol|xilitol)").test(n)) return { unidad: "CUCHARADITA", porcion: 5 };
    if (re("^(tabasco|sriracha|wasabi|sambal|xo sauce|pasta de gambas|nuoc mam|salsa worcestershire)").test(n)) {
      return { unidad: "CUCHARADITA", porcion: 5 };
    }
    if (re("^aceite de trufa").test(n)) return { unidad: "CUCHARADITA" };
    if (re("^aceite").test(n)) return { unidad: "CUCHARADA" };
    if (re("^(mermelada|confitura|miel|sirope|melaza|vinagre|reducción de vinagre|vinagreta|mayonesa|ketchup|alioli|aderezo|chermoula|mojo|chutney|pesto|salsa pesto|tahini|miso|pasta de miso|pasta de curry|doenjang|gochujang|mirin|vino de arroz|levadura nutricional|crema de rábano|tapenade)").test(n)) {
      return { unidad: "CUCHARADA" };
    }
    if (re("^mostaza").test(n) && !re("en grano").test(n)) return { unidad: "CUCHARADA" };
    // Salsas dosificables a cuchara (≤20 g por cda colmada); tzatziki/agridulce (30 g) y
    // salsa de tomate/gravy (50 g) son ración → gramos.
    if (re("^salsa").test(n) && a.porcion <= 20) return { unidad: "CUCHARADA" };
    return null; // especias, hierbas, sal, encurtidos, kimchi… → GRAMOS
  }

  // ── DULCES ──
  if (c === "DULCES") {
    if (re("crema de cacao").test(n)) return { unidad: "CUCHARADA" };
    if (re("^(alfajor|barquillo|barrita|bombón|buñuelo|churro|cookie|cruasán|donut|dorayaki|eclair|ensaimada|galleta|macarón|magdalena|mantecado|merengue|mochi|muffin|napolitana|palmera|pastel de nata|pestiño|polo|polvorón|porras|rosquilla|soletilla|torrija|toffee|caramelo duro|regaliz|yema de santa teresa)").test(n)) {
      return { unidad: "UNIDAD" };
    }
    if (re("^(flan|natillas)").test(n)) return { unidad: "UNIDAD" }; // vasito
    return null; // chocolate en tableta, tartas, helados, turrón… → GRAMOS
  }

  // ── OTROS ──
  if (c === "OTROS") {
    if (re("^barrita").test(n)) return { unidad: "UNIDAD" };
    if (re("bebida de proteína").test(n)) return { unidad: "MILILITROS" };
    if (re("beyond meat").test(n)) return { unidad: "UNIDAD" };
    return null; // proteínas en polvo, tofu, tempeh… → GRAMOS
  }

  return null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const { rows } = await pool.query<Alimento>(
    `SELECT id, nombre, categoria, porcion FROM alimentos WHERE "dietistaId" IS NULL ORDER BY categoria, nombre`,
  );

  const cambios: { a: Alimento; c: Cambio }[] = [];
  for (const a of rows) {
    const c = decidir(a);
    if (!c) continue;
    // Pesos "bonitos": en unidades caseras la porción va a múltiplos de 5 (17 → 15),
    // salvo porciones mínimas (<5 g, p. ej. cdta de matcha = 2 g). En g/ml no se toca.
    if (c.unidad !== "MILILITROS") {
      const base = c.porcion ?? a.porcion;
      const redondeada = Math.round(base / 5) * 5;
      if (redondeada >= 5 && redondeada !== base) c.porcion = redondeada;
    }
    cambios.push({ a, c });
  }

  // TSV de revisión (siempre se escribe)
  const tsvPath = path.join(__dirname, "cambios-unidades.tsv");
  const lineas = ["categoria\tnombre\tunidad_nueva\tporcion_antes\tporcion_despues"];
  for (const { a, c } of cambios) {
    lineas.push(`${a.categoria}\t${a.nombre}\t${c.unidad}\t${a.porcion}\t${c.porcion ?? a.porcion}`);
  }
  fs.writeFileSync(tsvPath, lineas.join("\n"));

  // Resumen por unidad y categoría
  const porUnidad = new Map<string, number>();
  for (const { c } of cambios) porUnidad.set(c.unidad, (porUnidad.get(c.unidad) || 0) + 1);
  console.log(`Alimentos globales: ${rows.length}`);
  console.log(`Cambios propuestos: ${cambios.length} (${rows.length - cambios.length} se quedan en GRAMOS)`);
  for (const [u, n] of [...porUnidad.entries()].sort((x, y) => y[1] - x[1])) console.log(`  ${u}: ${n}`);
  const conPorcion = cambios.filter(({ a, c }) => c.porcion != null && c.porcion !== a.porcion);
  console.log(`Con ajuste de porción: ${conPorcion.length}`);
  console.log(`TSV: ${tsvPath}`);

  if (!apply) {
    console.log("\nDRY-RUN: no se ha tocado la base de datos. Revisa el TSV y ejecuta con --apply.");
    await pool.end();
    return;
  }

  console.log("\nAplicando cambios…");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const { a, c } of cambios) {
      await client.query(
        `UPDATE alimentos SET unidad = $1, porcion = $2, "updatedAt" = NOW() WHERE id = $3 AND "dietistaId" IS NULL`,
        [c.unidad, c.porcion ?? a.porcion, a.id],
      );
    }
    await client.query("COMMIT");
    console.log(`✓ ${cambios.length} alimentos actualizados.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
