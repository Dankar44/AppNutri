export const AVATAR_DEMO =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBmaWxsPSJub25lIj4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iI0U4RjVFOSIvPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjcyIiByPSIyOCIgZmlsbD0iIzY2QkI2QSIvPgogIDxwYXRoIGQ9Ik0xMDAgMTA4Yy0zMCAwLTU0IDE2LTU0IDM2djhjMCA0IDIgNyA2IDkgMTIgNiAzMCA5IDQ4IDlzMzYtMyA0OC05YzQtMiA2LTUgNi05di04YzAtMjAtMjQtMzYtNTQtMzZ6IiBmaWxsPSIjNjZCQjZBIi8+Cjwvc3ZnPgo=";

export const DEMO_PATIENT = {
  nombre: "Paciente",
  apellidos: "Prueba",
  email: "paciente.prueba@demo.annonia.com",
  telefono: "+34 600 123 456",
  sexo: "Masculino",
  fechaNacimiento: "15/06/1992",
  edad: 33,
  peso: 78,
  altura: 175,
  imc: "25.5",
  objetivo: "Perder peso",
  objetivoDetalle: "Perder 5 kg de forma saludable en 3 meses",
  alergias: ["Frutos secos (almendras)", "Polen estacional"],
  intolerancias: ["Lactosa (parcial)"],
  patologias: ["Hipertensión controlada", "Hipotiroidismo subclínico leve"],
  medicamentos: ["Enalapril 10 mg cada 24 h", "Levotiroxina 50 mcg en ayunas"],
  suplementos: ["Vitamina D3 1000 UI", "Omega-3 EPA/DHA", "Magnesio bisglicinato"],
  ocupacion: "Oficina",
  nivelActividad: "Moderado (3 veces/sem)",
  tipoEjercicio: "Entrenamiento de fuerza y cardio",
  horarioTrabajo: "09:00 – 18:00",
  horarioEjercicio: "L/X/V 19:00",
  horasDescanso: "7-8 horas",
  preferencias: ["Mediterránea", "Pescado azul", "Verduras de temporada", "Sin ultraprocesados"],
  recomendaciones:
    "Beber al menos 2L de agua al día. Cenar ligero 2h antes de dormir. Incluir más verduras de hoja verde.",
  notas:
    "Paciente de prueba preconfigurado para que explores las funciones de la app. Puedes editarlo o eliminarlo cuando quieras.",
};

export const DEMO_PLANS = [
  { nombre: "Plan inicial — ejemplo", kcal: 2000, prot: 150, carb: 220, grasa: 70, activo: true },
  { nombre: "Plan de mantenimiento", kcal: 2200, prot: 140, carb: 260, grasa: 75, activo: false },
  { nombre: "Plan deportivo — alto volumen", kcal: 2600, prot: 180, carb: 320, grasa: 75, activo: false },
  { nombre: "Plan low-carb", kcal: 1800, prot: 160, carb: 100, grasa: 95, activo: false },
  { nombre: "Plan mediterráneo — legumbres", kcal: 1900, prot: 120, carb: 230, grasa: 65, activo: false },
];

interface DemoFood {
  nombre: string;
  g: number;
}

export const DEMO_DIETA_DIAS: {
  nombre: string;
  comidas: { tipo: string; items: DemoFood[] }[];
}[] = [
  {
    nombre: "Lunes",
    comidas: [
      { tipo: "DESAYUNO", items: [{ nombre: "Avena", g: 60 }, { nombre: "Plátano", g: 100 }, { nombre: "Leche entera", g: 200 }] },
      { tipo: "MEDIA MAÑANA", items: [] },
      { tipo: "ALMUERZO", items: [{ nombre: "Pollo", g: 150 }, { nombre: "Arroz", g: 80 }, { nombre: "Brócoli", g: 150 }, { nombre: "Aceite de oliva", g: 10 }] },
      { tipo: "MERIENDA", items: [{ nombre: "Manzana", g: 180 }, { nombre: "Yogur", g: 125 }, { nombre: "Nueces", g: 20 }] },
      { tipo: "CENA", items: [{ nombre: "Pollo", g: 120 }, { nombre: "Brócoli", g: 200 }, { nombre: "Aceite de oliva", g: 8 }] },
    ],
  },
  {
    nombre: "Martes",
    comidas: [
      { tipo: "DESAYUNO", items: [{ nombre: "Pan integral", g: 60 }, { nombre: "Huevo", g: 100 }, { nombre: "Aguacate", g: 50 }] },
      { tipo: "MEDIA MAÑANA", items: [] },
      { tipo: "ALMUERZO", items: [{ nombre: "Pasta integral", g: 100 }, { nombre: "Ternera", g: 120 }, { nombre: "Tomate", g: 100 }, { nombre: "Aceite de oliva", g: 10 }] },
      { tipo: "MERIENDA", items: [{ nombre: "Naranja", g: 150 }, { nombre: "Almendras", g: 25 }] },
      { tipo: "CENA", items: [{ nombre: "Merluza", g: 150 }, { nombre: "Patata", g: 200 }, { nombre: "Espinacas", g: 100 }] },
    ],
  },
  {
    nombre: "Miércoles",
    comidas: [
      { tipo: "DESAYUNO", items: [{ nombre: "Avena", g: 80 }, { nombre: "Plátano", g: 120 }, { nombre: "Huevo", g: 150 }] },
      { tipo: "MEDIA MAÑANA", items: [] },
      { tipo: "ALMUERZO", items: [{ nombre: "Ternera", g: 180 }, { nombre: "Boniato", g: 250 }, { nombre: "Pimiento", g: 100 }, { nombre: "Aceite de oliva", g: 12 }] },
      { tipo: "MERIENDA", items: [{ nombre: "Yogur", g: 200 }, { nombre: "Fresas", g: 100 }, { nombre: "Almendras", g: 30 }] },
      { tipo: "CENA", items: [{ nombre: "Salmón", g: 180 }, { nombre: "Quinoa", g: 80 }, { nombre: "Espinacas", g: 150 }] },
    ],
  },
];

export const DEMO_CITAS_SEMANA = [
  { dia: 0, hora: "10:00", duracion: 45, paciente: "Paciente Prueba", estado: "COMPLETADA", motivo: "Segunda revisión de seguimiento" },
  { dia: 0, hora: "15:00", duracion: 30, paciente: "Paciente Prueba", estado: "PENDIENTE", motivo: "Revisión medidas" },
  { dia: 1, hora: "17:00", duracion: 30, paciente: "Paciente Prueba", estado: "CANCELADA", motivo: "Consulta puntual" },
  { dia: 2, hora: "11:30", duracion: 30, paciente: "Paciente Prueba", estado: "CONFIRMADA", motivo: "Tercera revisión mensual" },
  { dia: 3, hora: "16:00", duracion: 60, paciente: "Paciente Prueba", estado: "CONFIRMADA", motivo: "Revisión plan deportivo" },
  { dia: 4, hora: "10:30", duracion: 30, paciente: "Paciente Prueba", estado: "COMPLETADA", motivo: "Control peso quincenal" },
];
