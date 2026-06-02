// Lista de países (nombre en español + prefijo telefónico) para los desplegables
// de país de residencia y prefijo en el formulario de colaboradores.
export type Pais = { nombre: string; dial: string };

export const PAISES: Pais[] = [
  { nombre: "España", dial: "+34" },
  { nombre: "Portugal", dial: "+351" },
  { nombre: "México", dial: "+52" },
  { nombre: "Argentina", dial: "+54" },
  { nombre: "Colombia", dial: "+57" },
  { nombre: "Chile", dial: "+56" },
  { nombre: "Perú", dial: "+51" },
  { nombre: "Venezuela", dial: "+58" },
  { nombre: "Ecuador", dial: "+593" },
  { nombre: "Bolivia", dial: "+591" },
  { nombre: "Paraguay", dial: "+595" },
  { nombre: "Uruguay", dial: "+598" },
  { nombre: "Guatemala", dial: "+502" },
  { nombre: "Honduras", dial: "+504" },
  { nombre: "El Salvador", dial: "+503" },
  { nombre: "Nicaragua", dial: "+505" },
  { nombre: "Costa Rica", dial: "+506" },
  { nombre: "Panamá", dial: "+507" },
  { nombre: "Cuba", dial: "+53" },
  { nombre: "República Dominicana", dial: "+1" },
  { nombre: "Puerto Rico", dial: "+1" },
  { nombre: "Estados Unidos", dial: "+1" },
  { nombre: "Canadá", dial: "+1" },
  { nombre: "Brasil", dial: "+55" },
  { nombre: "Reino Unido", dial: "+44" },
  { nombre: "Francia", dial: "+33" },
  { nombre: "Alemania", dial: "+49" },
  { nombre: "Italia", dial: "+39" },
  { nombre: "Países Bajos", dial: "+31" },
  { nombre: "Bélgica", dial: "+32" },
  { nombre: "Suiza", dial: "+41" },
  { nombre: "Austria", dial: "+43" },
  { nombre: "Irlanda", dial: "+353" },
  { nombre: "Suecia", dial: "+46" },
  { nombre: "Noruega", dial: "+47" },
  { nombre: "Dinamarca", dial: "+45" },
  { nombre: "Finlandia", dial: "+358" },
  { nombre: "Polonia", dial: "+48" },
  { nombre: "Rumanía", dial: "+40" },
  { nombre: "Grecia", dial: "+30" },
  { nombre: "Andorra", dial: "+376" },
  { nombre: "Luxemburgo", dial: "+352" },
  { nombre: "Marruecos", dial: "+212" },
  { nombre: "Argelia", dial: "+213" },
  { nombre: "Túnez", dial: "+216" },
  { nombre: "Guinea Ecuatorial", dial: "+240" },
  { nombre: "Australia", dial: "+61" },
  { nombre: "Nueva Zelanda", dial: "+64" },
  { nombre: "China", dial: "+86" },
  { nombre: "Japón", dial: "+81" },
  { nombre: "India", dial: "+91" },
  { nombre: "Otro", dial: "" },
];

// Prefijos únicos para el selector de teléfono (ordenados por relevancia, sin duplicados).
export const PREFIJOS: { dial: string; etiqueta: string }[] = (() => {
  const vistos = new Set<string>();
  const out: { dial: string; etiqueta: string }[] = [];
  for (const p of PAISES) {
    if (!p.dial || vistos.has(p.dial)) continue;
    vistos.add(p.dial);
    out.push({ dial: p.dial, etiqueta: `${p.nombre} (${p.dial})` });
  }
  return out;
})();
