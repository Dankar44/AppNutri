import type { DietistaAdminItem, DietistaDetalle, PacienteResumen, SuscripcionAdminItem } from "@/app/actions/admin";

const FAKE_DIETISTAS: {
  nombre: string;
  apellidos: string;
  email: string;
  especialidad: string;
  clinica: string;
  mesesAtras: number;
  plan: string;
  estado: string;
  pacientes: { nombre: string; apellidos: string; objetivo: string; activo: boolean }[];
  planes: number;
  consultas: number;
  recetas: number;
}[] = [
  {
    nombre: "María", apellidos: "López Fernández", email: "maria.lopez@nutricion.es",
    especialidad: "Nutrición deportiva", clinica: "Centro NutriSport Madrid",
    mesesAtras: 8, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Andrés", apellidos: "Ruiz García", objetivo: "RENDIMIENTO", activo: true },
      { nombre: "Lucía", apellidos: "Moreno Díaz", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Pablo", apellidos: "Jiménez Sanz", objetivo: "MASA_MUSCULAR", activo: true },
      { nombre: "Elena", apellidos: "Navarro Ruiz", objetivo: "MANTENIMIENTO", activo: false },
    ],
    planes: 12, consultas: 38, recetas: 22,
  },
  {
    nombre: "Carlos", apellidos: "Martínez Pérez", email: "carlos.martinez@dietaplus.com",
    especialidad: "Nutrición clínica", clinica: "Clínica DietaPlus Barcelona",
    mesesAtras: 11, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Isabel", apellidos: "Torres Vega", objetivo: "SALUD", activo: true },
      { nombre: "Marcos", apellidos: "Alonso Ramos", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Sara", apellidos: "Gil Herrera", objetivo: "SALUD", activo: true },
      { nombre: "Javier", apellidos: "Domínguez López", objetivo: "MANTENIMIENTO", activo: true },
      { nombre: "Ana", apellidos: "Blanco Morales", objetivo: "PERDIDA_PESO", activo: true },
    ],
    planes: 18, consultas: 52, recetas: 15,
  },
  {
    nombre: "Laura", apellidos: "García Sánchez", email: "laura.garcia@vitanutri.es",
    especialidad: "Nutrición pediátrica", clinica: "VitaNutri Sevilla",
    mesesAtras: 5, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Diego", apellidos: "Romero Castillo", objetivo: "SALUD", activo: true },
      { nombre: "Sofía", apellidos: "Hernández Ruiz", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Hugo", apellidos: "Muñoz Serrano", objetivo: "SALUD", activo: true },
    ],
    planes: 9, consultas: 27, recetas: 18,
  },
  {
    nombre: "Pablo", apellidos: "Rodríguez Gómez", email: "pablo.rodriguez@nutrisalud.com",
    especialidad: "Obesidad y sobrepeso", clinica: "NutriSalud Valencia",
    mesesAtras: 14, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Carmen", apellidos: "Ortega Méndez", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Fernando", apellidos: "Vargas Peña", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Marina", apellidos: "Iglesias Castro", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Roberto", apellidos: "Reyes Gallego", objetivo: "PERDIDA_PESO", activo: false },
      { nombre: "Nuria", apellidos: "Crespo Díaz", objetivo: "MANTENIMIENTO", activo: true },
      { nombre: "Óscar", apellidos: "Molina Fuentes", objetivo: "PERDIDA_PESO", activo: true },
    ],
    planes: 22, consultas: 68, recetas: 31,
  },
  {
    nombre: "Ana", apellidos: "Fernández Ruiz", email: "ana.fernandez@equilibrio.es",
    especialidad: "Trastornos alimentarios", clinica: "Equilibrio Nutrición Bilbao",
    mesesAtras: 3, plan: "BASICO", estado: "ACTIVA",
    pacientes: [
      { nombre: "Adrián", apellidos: "Soto Vázquez", objetivo: "SALUD", activo: true },
      { nombre: "Irene", apellidos: "Pascual Nieto", objetivo: "SALUD", activo: true },
    ],
    planes: 4, consultas: 14, recetas: 8,
  },
  {
    nombre: "Javier", apellidos: "Díaz Moreno", email: "javier.diaz@nutrifit.es",
    especialidad: "Nutrición deportiva", clinica: "NutriFit Zaragoza",
    mesesAtras: 6, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Daniel", apellidos: "Guerrero Lozano", objetivo: "RENDIMIENTO", activo: true },
      { nombre: "Paula", apellidos: "Marín Santana", objetivo: "MASA_MUSCULAR", activo: true },
      { nombre: "Álvaro", apellidos: "Delgado Rubio", objetivo: "RENDIMIENTO", activo: true },
      { nombre: "Marta", apellidos: "Prieto Calvo", objetivo: "MANTENIMIENTO", activo: false },
    ],
    planes: 14, consultas: 41, recetas: 19,
  },
  {
    nombre: "Sofía", apellidos: "Morales Herrero", email: "sofia.morales@nutrivida.com",
    especialidad: "Nutrición vegetariana", clinica: "NutriVida Granada",
    mesesAtras: 9, plan: "BASICO", estado: "ACTIVA",
    pacientes: [
      { nombre: "Raquel", apellidos: "Cabrera Peña", objetivo: "SALUD", activo: true },
      { nombre: "Miguel", apellidos: "Esteban Roca", objetivo: "MANTENIMIENTO", activo: true },
      { nombre: "Claudia", apellidos: "Aguilar Benítez", objetivo: "SALUD", activo: true },
    ],
    planes: 7, consultas: 21, recetas: 26,
  },
  {
    nombre: "Diego", apellidos: "Navarro Torres", email: "diego.navarro@alimenta.es",
    especialidad: "Nutrición oncológica", clinica: "Alimenta Málaga",
    mesesAtras: 12, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Teresa", apellidos: "Santos Flores", objetivo: "SALUD", activo: true },
      { nombre: "Alejandro", apellidos: "Ramos Cortés", objetivo: "SALUD", activo: true },
    ],
    planes: 8, consultas: 31, recetas: 11,
  },
  {
    nombre: "Lucía", apellidos: "Jiménez Ortega", email: "lucia.jimenez@saludintegral.es",
    especialidad: "Nutrición integrativa", clinica: "Salud Integral Murcia",
    mesesAtras: 2, plan: "BASICO", estado: "ACTIVA",
    pacientes: [
      { nombre: "Sergio", apellidos: "Herrera Campos", objetivo: "SALUD", activo: true },
    ],
    planes: 3, consultas: 8, recetas: 5,
  },
  {
    nombre: "Marcos", apellidos: "Gil Castro", email: "marcos.gil@nutrigenoma.com",
    especialidad: "Nutrigenómica", clinica: "NutriGenoma Lab Madrid",
    mesesAtras: 7, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Beatriz", apellidos: "Medina Arias", objetivo: "SALUD", activo: true },
      { nombre: "Gonzalo", apellidos: "Peña Rojas", objetivo: "SALUD", activo: true },
      { nombre: "Cristina", apellidos: "Lorenzo Vera", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Enrique", apellidos: "Soler Giménez", objetivo: "MANTENIMIENTO", activo: false },
    ],
    planes: 11, consultas: 35, recetas: 14,
  },
  {
    nombre: "Elena", apellidos: "Ortiz Ramírez", email: "elena.ortiz@comesano.es",
    especialidad: "Nutrición clínica", clinica: "Come Sano A Coruña",
    mesesAtras: 10, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Ricardo", apellidos: "Caballero Mora", objetivo: "SALUD", activo: true },
      { nombre: "Alicia", apellidos: "Vidal Cano", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Víctor", apellidos: "Parra León", objetivo: "MANTENIMIENTO", activo: true },
    ],
    planes: 10, consultas: 33, recetas: 20,
  },
  {
    nombre: "Raúl", apellidos: "Serrano López", email: "raul.serrano@nutriactiva.es",
    especialidad: "Nutrición deportiva", clinica: "NutriActiva Valladolid",
    mesesAtras: 4, plan: "BASICO", estado: "ACTIVA",
    pacientes: [
      { nombre: "Natalia", apellidos: "Cruz Reyes", objetivo: "RENDIMIENTO", activo: true },
      { nombre: "Iván", apellidos: "Montero Silva", objetivo: "MASA_MUSCULAR", activo: true },
    ],
    planes: 6, consultas: 17, recetas: 9,
  },
  {
    nombre: "Isabel", apellidos: "Vega Domínguez", email: "isabel.vega@bienestar.com",
    especialidad: "Nutrición geriátrica", clinica: "Centro Bienestar Salamanca",
    mesesAtras: 13, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Rosa", apellidos: "Ferrer Bravo", objetivo: "SALUD", activo: true },
      { nombre: "Antonio", apellidos: "Moya Ibáñez", objetivo: "SALUD", activo: true },
      { nombre: "Pilar", apellidos: "Suárez Carmona", objetivo: "SALUD", activo: false },
      { nombre: "Manuel", apellidos: "Rubio Espinosa", objetivo: "MANTENIMIENTO", activo: true },
      { nombre: "Amparo", apellidos: "Márquez Soria", objetivo: "SALUD", activo: true },
    ],
    planes: 16, consultas: 49, recetas: 17,
  },
  {
    nombre: "Hugo", apellidos: "Blanco Rivas", email: "hugo.blanco@consultanutri.es",
    especialidad: "Alergias alimentarias", clinica: "Consulta NutriAlergias Pamplona",
    mesesAtras: 1, plan: "BASICO", estado: "TRIAL",
    pacientes: [
      { nombre: "Julia", apellidos: "Carrasco Peña", objetivo: "SALUD", activo: true },
    ],
    planes: 2, consultas: 5, recetas: 3,
  },
  {
    nombre: "Marta", apellidos: "Alonso Guerrero", email: "marta.alonso@nutriclinic.es",
    especialidad: "Nutrición clínica", clinica: "NutriClinic Santander",
    mesesAtras: 6, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "David", apellidos: "Campos Navarro", objetivo: "SALUD", activo: true },
      { nombre: "Sandra", apellidos: "Rojas Moreno", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Jorge", apellidos: "Vázquez Gil", objetivo: "SALUD", activo: true },
    ],
    planes: 10, consultas: 29, recetas: 13,
  },
  {
    nombre: "Fernando", apellidos: "Castillo Méndez", email: "fernando.castillo@dietsaludable.es",
    especialidad: "Obesidad y sobrepeso", clinica: "Dieta Saludable Alicante",
    mesesAtras: 15, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Lorena", apellidos: "Pascual Herrero", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Pedro", apellidos: "Sánchez Blanco", objetivo: "PERDIDA_PESO", activo: true },
      { nombre: "Lidia", apellidos: "Fuentes Ortiz", objetivo: "PERDIDA_PESO", activo: false },
      { nombre: "Alberto", apellidos: "Roca Jiménez", objetivo: "MANTENIMIENTO", activo: true },
    ],
    planes: 15, consultas: 44, recetas: 21,
  },
  {
    nombre: "Adriana", apellidos: "Peña Molina", email: "adriana.pena@nutribalance.com",
    especialidad: "Nutrición materno-infantil", clinica: "NutriBalance Córdoba",
    mesesAtras: 3, plan: "BASICO", estado: "ACTIVA",
    pacientes: [
      { nombre: "Ángela", apellidos: "Flores Martín", objetivo: "SALUD", activo: true },
      { nombre: "Patricia", apellidos: "Guzmán Torres", objetivo: "SALUD", activo: true },
    ],
    planes: 5, consultas: 12, recetas: 7,
  },
  {
    nombre: "Álvaro", apellidos: "Herrera Soto", email: "alvaro.herrera@nutrimeta.es",
    especialidad: "Nutrición deportiva", clinica: "NutriMeta San Sebastián",
    mesesAtras: 5, plan: "PROFESIONAL", estado: "ACTIVA",
    pacientes: [
      { nombre: "Raúl", apellidos: "Benítez Calvo", objetivo: "RENDIMIENTO", activo: true },
      { nombre: "Eva", apellidos: "Giménez Pardo", objetivo: "MASA_MUSCULAR", activo: true },
      { nombre: "Tomás", apellidos: "Arias Leal", objetivo: "RENDIMIENTO", activo: true },
    ],
    planes: 11, consultas: 32, recetas: 16,
  },
  {
    nombre: "Nuria", apellidos: "Delgado Carmona", email: "nuria.delgado@saludnatural.es",
    especialidad: "Nutrición funcional", clinica: "Salud Natural Oviedo",
    mesesAtras: 8, plan: "BASICO", estado: "ACTIVA",
    pacientes: [
      { nombre: "Clara", apellidos: "Ibáñez Vera", objetivo: "SALUD", activo: true },
      { nombre: "Luis", apellidos: "Espinosa Cortés", objetivo: "MANTENIMIENTO", activo: true },
    ],
    planes: 6, consultas: 19, recetas: 12,
  },
  {
    nombre: "Roberto", apellidos: "Aguilar Santos", email: "roberto.aguilar@nutrimundo.com",
    especialidad: "Nutrición clínica", clinica: "NutriMundo Las Palmas",
    mesesAtras: 0, plan: "BASICO", estado: "TRIAL",
    pacientes: [],
    planes: 0, consultas: 0, recetas: 0,
  },
];

function fakeId(i: number) {
  return `fake-${String(i).padStart(3, "0")}`;
}

function fakeDate(mesesAtras: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - mesesAtras);
  d.setDate(Math.min(d.getDate(), 28));
  return d;
}

export function getFakeDietistas(busqueda?: string): DietistaAdminItem[] {
  const search = busqueda?.trim().toLowerCase();
  let items = FAKE_DIETISTAS;
  if (search) {
    items = items.filter(
      (d) =>
        d.nombre.toLowerCase().includes(search) ||
        d.apellidos.toLowerCase().includes(search) ||
        d.email.toLowerCase().includes(search)
    );
  }

  return items.map((d, i): DietistaAdminItem => {
    const dId = fakeId(i);
    const createdAt = fakeDate(d.mesesAtras);
    const pacientes: PacienteResumen[] = d.pacientes.map((p, j) => ({
      id: `${dId}-p${j}`,
      nombre: p.nombre,
      apellidos: p.apellidos,
      email: null,
      activo: p.activo,
      objetivo: p.objetivo,
      createdAt: new Date(createdAt.getTime() + (j + 1) * 86400000 * 5),
    }));
    return {
      id: dId,
      email: d.email,
      nombre: d.nombre,
      apellidos: d.apellidos,
      especialidad: d.especialidad,
      clinica: d.clinica,
      createdAt,
      suscripcion: { plan: d.plan, estado: d.estado },
      _count: {
        pacientes: d.pacientes.length,
        planes: d.planes,
        consultas: d.consultas,
        recetas: d.recetas,
      },
      pacientes,
    };
  });
}

export function getFakeStats() {
  const totalPacientes = FAKE_DIETISTAS.reduce((s, d) => s + d.pacientes.length, 0);
  const totalPlanes = FAKE_DIETISTAS.reduce((s, d) => s + d.planes, 0);
  const totalConsultas = FAKE_DIETISTAS.reduce((s, d) => s + d.consultas, 0);

  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const esteMes = FAKE_DIETISTAS.filter((d) => d.mesesAtras === 0).length;
  const mesAnterior = FAKE_DIETISTAS.filter((d) => d.mesesAtras === 1).length;
  const pacEsteMes = FAKE_DIETISTAS.filter((d) => d.mesesAtras <= 1).reduce((s, d) => s + d.pacientes.length, 0);

  return {
    dietistas: FAKE_DIETISTAS.length,
    pacientes: totalPacientes,
    planes: totalPlanes,
    consultas: Math.round(totalConsultas * 0.3),
    dietistasEsteMes: esteMes,
    mesAnterior,
    pacientesEsteMes: pacEsteMes,
  };
}

export function getFakeRegistrosMensuales(): { mes: string; dietistas: number; pacientes: number }[] {
  const ahora = new Date();
  const result: { mes: string; dietistas: number; pacientes: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const label = d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
    const dietistas = FAKE_DIETISTAS.filter((fd) => fd.mesesAtras === i).length;
    const pacientes = FAKE_DIETISTAS.filter((fd) => fd.mesesAtras === i).reduce((s, fd) => s + fd.pacientes.length, 0);
    result.push({ mes: label, dietistas, pacientes });
  }
  return result;
}

export function getFakeDistribucion() {
  const porPlan: Record<string, number> = {};
  const porEstado: Record<string, number> = {};
  for (const d of FAKE_DIETISTAS) {
    porPlan[d.plan] = (porPlan[d.plan] || 0) + 1;
    porEstado[d.estado] = (porEstado[d.estado] || 0) + 1;
  }
  return { porPlan, porEstado, total: FAKE_DIETISTAS.length };
}

export function getFakeSuscripciones(): SuscripcionAdminItem[] {
  return FAKE_DIETISTAS.map((d, i) => ({
    id: `fake-sub-${i}`,
    plan: d.plan,
    estado: d.estado,
    fechaInicio: fakeDate(d.mesesAtras),
    fechaFin: null,
    dietista: { nombre: d.nombre, apellidos: d.apellidos, email: d.email },
  }));
}

export function getFakeDietistaDetalle(dietistaId: string): DietistaDetalle | null {
  if (!dietistaId.startsWith("fake-")) return null;
  const idx = parseInt(dietistaId.replace("fake-", ""), 10);
  const d = FAKE_DIETISTAS[idx];
  if (!d) return null;

  const createdAt = fakeDate(d.mesesAtras);
  const pacientes = d.pacientes.map((p, j) => ({
    id: `${dietistaId}-p${j}`,
    nombre: p.nombre,
    apellidos: p.apellidos,
    email: null,
    objetivo: p.objetivo,
    activo: p.activo,
    createdAt: new Date(createdAt.getTime() + (j + 1) * 86400000 * 5),
    _count: { planes: Math.ceil(d.planes / Math.max(d.pacientes.length, 1)), consultas: Math.ceil(d.consultas / Math.max(d.pacientes.length, 1)), medidas: 3 },
  }));

  const motivos = ["Revisión mensual", "Primera consulta", "Seguimiento", "Control de peso", "Ajuste de plan"];

  return {
    id: dietistaId,
    email: d.email,
    nombre: d.nombre,
    apellidos: d.apellidos,
    telefono: "+34 6" + String(Math.abs(dietistaId.charCodeAt(5) * 12345678)).slice(0, 8),
    especialidad: d.especialidad,
    numColegiado: `COL-${String(idx + 100).padStart(4, "0")}`,
    clinica: d.clinica,
    logoUrl: null,
    createdAt,
    suscripcion: { plan: d.plan, estado: d.estado, fechaInicio: createdAt, fechaFin: null },
    pacientes,
    _count: { pacientes: d.pacientes.length, planes: d.planes, consultas: d.consultas, recetas: d.recetas, alimentos: d.recetas * 3, citas: Math.round(d.consultas * 0.6) },
    ultimasConsultas: d.pacientes.slice(0, 5).map((p, j) => ({
      id: `${dietistaId}-c${j}`,
      fecha: new Date(Date.now() - j * 86400000 * 3),
      motivo: motivos[j % motivos.length],
      paciente: { nombre: p.nombre, apellidos: p.apellidos },
    })),
  };
}

export function getFakeActividadDietistas() {
  return FAKE_DIETISTAS
    .filter((d) => d.consultas > 0)
    .sort((a, b) => b.consultas - a.consultas)
    .slice(0, 10)
    .map((d, i) => ({
      id: fakeId(i),
      nombre: `${d.nombre} ${d.apellidos}`,
      consultasMes: Math.round(d.consultas * 0.25),
      totalPacientes: d.pacientes.length,
    }));
}

export function getFakeUltimosDietistas() {
  return FAKE_DIETISTAS
    .sort((a, b) => a.mesesAtras - b.mesesAtras)
    .slice(0, 8)
    .map((d, i) => ({
      id: fakeId(i),
      nombre: d.nombre,
      apellidos: d.apellidos,
      email: d.email,
      createdAt: fakeDate(d.mesesAtras),
    }));
}
