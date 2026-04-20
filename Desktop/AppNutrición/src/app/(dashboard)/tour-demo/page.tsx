import {
  User, Mail, Phone, Calendar, Heart, AlertTriangle, Pill, Sparkles,
  Dumbbell, Briefcase, Clock, Target, Moon, Ruler, FileText, BookOpen,
  Shield, UtensilsCrossed, MessageSquareText, TrendingUp,
} from "lucide-react";

const PACIENTE_DEMO = {
  nombre: "Laura",
  apellidos: "Martínez García",
  email: "laura.martinez@email.com",
  telefono: "612 345 678",
  fechaNacimiento: "15/03/1992",
  edad: 34,
  sexo: "Femenino",
  peso: 65.2,
  altura: 168,
  imc: "23.1",
  objetivo: "Mantenimiento",
  objetivoDetalle: "Mantener peso actual y mejorar composición corporal",
  alergias: ["Frutos secos", "Marisco"],
  intolerancias: ["Lactosa"],
  patologias: [],
  medicamentos: ["Anticonceptivos"],
  suplementos: ["Vitamina D", "Omega 3", "Magnesio"],
  ocupacion: "Diseñadora gráfica",
  nivelActividad: "Moderado (3-4 días/sem)",
  tipoEjercicio: "Pilates, Running",
  horarioTrabajo: "9:00 - 17:00",
  horarioEjercicio: "18:00 - 19:30",
  horasDescanso: "7-8h, de 23:00 a 7:00",
  preferencias: ["Mediterránea", "Sin gluten"],
  recomendaciones: "Recuerda beber al menos 2L de agua al día. Intenta cenar ligero 2h antes de dormir. Incluye más verduras de hoja verde en tus almuerzos.",
  planes: [
    { nombre: "Plan Mantenimiento Marzo", fecha: "21/03/2026", kcal: 1800 },
    { nombre: "Plan Deportivo", fecha: "15/03/2026", kcal: 2100 },
  ],
};

function TagList({ tags, color }: { tags: string[]; color: string }) {
  if (tags.length === 0) return <span className="text-sm text-muted-foreground">Ninguna registrada</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{t}</span>
      ))}
    </div>
  );
}

export default function TourDemoPage() {
  const p = PACIENTE_DEMO;

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
          Paciente de demostración — Solo para el tour guiado
        </p>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">LM</div>
        <div>
          <h1 className="text-2xl font-bold">{p.nombre} {p.apellidos}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-medium">Activo</span>
            <span className="text-sm text-muted-foreground">Alta: 01/01/2026</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos personales */}
          <section data-tour="patient-personal-data" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Datos personales
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium">{p.email}</p></div></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><div><span className="text-muted-foreground text-xs">Teléfono</span><p className="font-medium">{p.telefono}</p></div></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><div><span className="text-muted-foreground text-xs">Nacimiento</span><p className="font-medium">{p.fechaNacimiento} ({p.edad} años)</p></div></div>
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><div><span className="text-muted-foreground text-xs">Sexo</span><p className="font-medium">{p.sexo}</p></div></div>
            </div>
          </section>

          {/* Historial médico */}
          <section data-tour="patient-medical" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" /> Historial médico
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div><div className="flex items-center gap-1 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-sm font-medium">Alergias</span></div><TagList tags={p.alergias} color="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" /></div>
              <div><div className="flex items-center gap-1 mb-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium">Intolerancias</span></div><TagList tags={p.intolerancias} color="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400" /></div>
              <div><div className="flex items-center gap-1 mb-2"><Pill className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium">Medicamentos</span></div><TagList tags={p.medicamentos} color="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" /></div>
              <div><div className="flex items-center gap-1 mb-2"><Sparkles className="w-4 h-4 text-cyan-500" /><span className="text-sm font-medium">Suplementos</span></div><TagList tags={p.suplementos} color="bg-cyan-50 text-cyan-700" /></div>
            </div>
          </section>

          {/* Actividad */}
          <section data-tour="patient-lifestyle" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-indigo-500" /> Actividad física y estilo de vida
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { icon: Briefcase, label: "Ocupación", val: p.ocupacion },
                { icon: Dumbbell, label: "Nivel actividad", val: p.nivelActividad },
                { icon: Target, label: "Tipo ejercicio", val: p.tipoEjercicio },
                { icon: Clock, label: "Horario trabajo", val: p.horarioTrabajo },
                { icon: Clock, label: "Horario ejercicio", val: p.horarioEjercicio },
                { icon: Moon, label: "Descanso", val: p.horasDescanso },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <item.icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div><span className="text-muted-foreground text-xs">{item.label}</span><p className="font-medium">{item.val}</p></div>
                </div>
              ))}
            </div>
          </section>

          {/* Horario */}
          <section data-tour="patient-schedule" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Horario semanal
            </h2>
            <p className="text-sm text-muted-foreground">Compartido entre dietista y paciente. Ambos pueden editarlo.</p>
          </section>

          {/* Evolución */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Evolución
            </h2>
            <p className="text-sm text-muted-foreground">Gráficas de peso, IMC y medidas a lo largo del tiempo.</p>
          </section>

          {/* Planes */}
          <section data-tour="patient-plans" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" /> Planes alimenticios
            </h2>
            <div className="space-y-2">
              {p.planes.map((plan) => (
                <div key={plan.nombre} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div><p className="text-sm font-medium">{plan.nombre}</p><p className="text-xs text-muted-foreground">{plan.fecha}</p></div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">{plan.kcal} kcal</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar derecho */}
        <div className="space-y-6">
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" /> Objetivo
            </h2>
            <span className="text-primary font-medium">{p.objetivo}</span>
            <p className="text-sm text-muted-foreground mt-1">{p.objetivoDetalle}</p>
          </section>

          <section data-tour="patient-measures" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Medidas
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Peso</span><span className="font-medium">{p.peso} kg</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Altura</span><span className="font-medium">{p.altura} cm</span></div>
              <div className="flex justify-between pt-2 border-t border-border"><span className="text-sm text-muted-foreground">IMC</span><span className="font-bold text-lg">{p.imc}</span></div>
            </div>
          </section>

          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" /> Consultas
            </h2>
            <p className="text-sm text-muted-foreground">Ver historial de consultas</p>
          </section>

          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" /> Diario alimentario
            </h2>
            <p className="text-sm text-muted-foreground">Ver diario del paciente</p>
          </section>

          <section data-tour="patient-recommendations" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-teal-500" /> Recomendaciones
            </h2>
            <p className="text-sm text-muted-foreground">{p.recomendaciones}</p>
          </section>

          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Portal del paciente
            </h2>
            <p className="text-sm text-muted-foreground">Configurar acceso al portal</p>
          </section>
        </div>
      </div>
    </div>
  );
}
