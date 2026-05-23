import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

interface Entry {
  email: string;
  creadoPor: string;
  fuenteContacto: string | null;
}

const entries: Entry[] = [
  // Daniel + Instagram
  { email: "martaespinosalopezz@gmail.com", creadoPor: "Daniel", fuenteContacto: "instagram" },
  { email: "rocioj.nutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: "instagram" },
  { email: "nutricionista@tamaraarellano.cl", creadoPor: "Daniel", fuenteContacto: "instagram" },
  { email: "tunutripersonalkm@gmail.com", creadoPor: "Daniel", fuenteContacto: "instagram" },
  { email: "nutrioptimizado@gmail.com", creadoPor: "Daniel", fuenteContacto: "instagram" },
  { email: "annikanavas@gmail.com", creadoPor: "Daniel", fuenteContacto: "instagram" },
  { email: "evecastellini@gmail.com", creadoPor: "Daniel", fuenteContacto: "instagram" },
  { email: "sandranutricionholistica@gmail.com", creadoPor: "Daniel", fuenteContacto: "instagram" },
  { email: "nutricionerein@gmail.com", creadoPor: "Daniel", fuenteContacto: "instagram" },

  // Daniel + WhatsApp
  { email: "verodebourg@gmail.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },
  { email: "anagoni.nutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },
  { email: "munay.ec@gmail.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },
  { email: "karlafernandez.nutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },
  { email: "tagleandrea27@gmail.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },
  { email: "info@mgnutricion.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },
  { email: "info@monfortnutricion.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },
  { email: "egbsol@hotmail.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },
  { email: "mariamorenonutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: "whatsapp" },

  // Daniel + ? (solo creadoPor)
  { email: "juanmanuelmartinez365117@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "luciabarcelodiaz@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "dayanamartinezmorillo@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "jznutriciondeportiva@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "anabelseguranutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "vicophotosss@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "martinfajardotoledo@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "adrianaponte78@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "claudiafores.nutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "sergionutricionysalud@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "ainara.nutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "paudelacalle.nutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "mariodiazrodriguez972@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "nhortos@hotmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "jorgeoneal36@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "i.dellibardavarela@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "tarragaperezagus@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "angelnicogm@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "josemiguel.ms@ua.es", creadoPor: "Daniel", fuenteContacto: null },
  { email: "nutri.constanzasanchez@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "v.r.oyarzo@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "anlo.nutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "dietaurics@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "leodietic@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "hola@nutrelia.es", creadoPor: "Daniel", fuenteContacto: null },
  { email: "nta.catalinachavez@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "rosisella@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "estelamagrini@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "info@nevadonutricion.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "albadonadog@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "mariavmateache@outlook.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "mariaserranocarmona0@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "nutriconvalen@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "masanmac18@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "soynutritiroides@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "marinagarcia.nutricion@hotmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "info@carlosjcuesta.es", creadoPor: "Daniel", fuenteContacto: null },
  { email: "linsa.nutricion@gmail.com", creadoPor: "Daniel", fuenteContacto: null },
  { email: "elisabet15@hotmail.es", creadoPor: "Daniel", fuenteContacto: null },

  // Claudia + WhatsApp
  { email: "isabeljgiron@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "raquelorteganutricion@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "meritxell.icasas@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "miguel.srlupulo@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "mcviga26@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "anasana6@hotmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "maldeguerm@hotmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "lauraaguayomedina@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "estefanylopera@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "aj7.alicia@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "info@antiaallernutricion.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "anasantananavass@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "santiagolorentesp@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "ruthmagem@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "info@ariadnapares.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "elviradarve@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "mdlmartorell@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "mviga26@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "jokesnal@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "evelinguardiola@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "lorenamoleroserrato@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "alba.mm@hotmail.es", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "josealbertopg11@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "nataliass95@hotmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "fran22.rg@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "sediazs.cc@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "jacque221@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "josemanuelroga9@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "cinsanutricion@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "lucia.morante@gmail.es", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "herianna.m94@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "mg.julian85@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "jmdomperr@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "m_ibanez@outlook.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "adrianaperezguerrero1@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "loretomedinamartinez@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "martxcachafeiro@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "irenesolcas01@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "y_herrero@hotmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "elitomart97@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "mardaom19@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "natalia_0904@hotmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "lucijordan15@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "nutricionydieteticacabrera@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },
  { email: "luciaherrero15@gmail.com", creadoPor: "Claudia", fuenteContacto: "whatsapp" },

  // Guillermo + ? (solo creadoPor)
  { email: "nutrimar.coach@gmail.com", creadoPor: "Guillermo", fuenteContacto: null },
  { email: "demo-showcase@annonia.com", creadoPor: "Guillermo", fuenteContacto: null },
  { email: "vallinutrifit@gmail.com", creadoPor: "Guillermo", fuenteContacto: null },
  { email: "larajeffsmarcela@gmail.com", creadoPor: "Guillermo", fuenteContacto: null },
  { email: "guillermoprieto17@gmail.com", creadoPor: "Guillermo", fuenteContacto: null },
  { email: "aguilera02alba@gmail.com", creadoPor: "Guillermo", fuenteContacto: null },
  { email: "nutricionintolerancias@gmail.com", creadoPor: "Guillermo", fuenteContacto: null },
  { email: "lopezmartinezheber1990@gmail.com", creadoPor: "Guillermo", fuenteContacto: null },
];

async function main() {
  const client = await pool.connect();
  try {
    let updated = 0;
    let notFound = 0;
    const missing: string[] = [];

    for (const entry of entries) {
      let result;
      if (entry.fuenteContacto) {
        result = await client.query(
          `UPDATE dietistas SET "creadoPor" = $1, "fuenteContacto" = $2, "updatedAt" = NOW() WHERE email = $3`,
          [entry.creadoPor, entry.fuenteContacto, entry.email]
        );
      } else {
        result = await client.query(
          `UPDATE dietistas SET "creadoPor" = $1, "updatedAt" = NOW() WHERE email = $2`,
          [entry.creadoPor, entry.email]
        );
      }

      if (result.rowCount === 0) {
        notFound++;
        missing.push(entry.email);
      } else {
        updated++;
      }
    }

    console.log(`\n✅ Actualización completada:`);
    console.log(`   Actualizados: ${updated}`);
    console.log(`   No encontrados: ${notFound}`);
    if (missing.length > 0) {
      console.log(`\n⚠️  Emails no encontrados en la DB:`);
      missing.forEach((e) => console.log(`   - ${e}`));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
