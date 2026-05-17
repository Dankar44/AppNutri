import {
  UserRound, Mail, Phone, Calendar, Heart, AlertTriangle, Pill, Sparkles,
  Dumbbell, Briefcase, Clock, Target, Moon, Ruler, MessageSquareText,
  Shield, UtensilsCrossed, Plus, ArrowRight, StickyNote, ChevronRight,
} from "lucide-react";
import { getDemoPatient, getDemoPlans, AVATAR_DEMO } from "@/lib/tour-demo-data";
import { getTranslations } from "next-intl/server";

function TagList({ tags, color, emptyLabel }: { tags: string[]; color: string; emptyLabel: string }) {
  if (tags.length === 0) return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{tag}</span>
      ))}
    </div>
  );
}

export default async function TourDemoPage() {
  const t = await getTranslations("settings.tours");
  const tDemo = await getTranslations("settings.tours.demoData");
  const p = getDemoPatient(tDemo);
  const allPlans = getDemoPlans(tDemo);
  const planesVisibles = allPlans.slice(0, 3);

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
          {t("demoBanner")}
        </p>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <img src={AVATAR_DEMO} alt="" className="w-16 h-16 rounded-full shrink-0" />
        <div>
          <h1 className="text-2xl font-bold">{p.nombre} {p.apellidos}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{p.fechaNacimiento} ({p.edad} {t("years")})</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">{t("examplePatient")}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-medium">{t("active")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Columna principal */}
        <div className="space-y-6">
          {/* Datos personales */}
          <section data-tour="patient-personal-data" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary" /> {t("personalData")}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><div><span className="text-muted-foreground text-xs">{t("email")}</span><p className="font-medium">{p.email}</p></div></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><div><span className="text-muted-foreground text-xs">{t("phone")}</span><p className="font-medium">{p.telefono}</p></div></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><div><span className="text-muted-foreground text-xs">{t("birthDate")}</span><p className="font-medium">{p.fechaNacimiento} ({p.edad} {t("years")})</p></div></div>
              <div className="flex items-center gap-2"><UserRound className="w-4 h-4 text-muted-foreground" /><div><span className="text-muted-foreground text-xs">{t("sex")}</span><p className="font-medium">{p.sexo}</p></div></div>
            </div>
          </section>

          {/* Historial médico */}
          <section data-tour="patient-medical" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" /> {t("medicalHistory")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div><div className="flex items-center gap-1 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-sm font-medium">{t("allergies")}</span></div><TagList tags={p.alergias} color="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" emptyLabel={t("noneRegistered")} /></div>
              <div><div className="flex items-center gap-1 mb-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium">{t("intolerances")}</span></div><TagList tags={p.intolerancias} color="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400" emptyLabel={t("noneRegistered")} /></div>
              <div><div className="flex items-center gap-1 mb-2"><Heart className="w-4 h-4 text-purple-500" /><span className="text-sm font-medium">{t("pathologies")}</span></div><TagList tags={p.patologias} color="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400" emptyLabel={t("noneRegistered")} /></div>
              <div><div className="flex items-center gap-1 mb-2"><Pill className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium">{t("medications")}</span></div><TagList tags={p.medicamentos} color="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" emptyLabel={t("noneRegistered")} /></div>
              <div className="sm:col-span-2"><div className="flex items-center gap-1 mb-2"><Sparkles className="w-4 h-4 text-cyan-500" /><span className="text-sm font-medium">{t("supplements")}</span></div><TagList tags={p.suplementos} color="bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400" emptyLabel={t("noneRegistered")} /></div>
            </div>
          </section>

          {/* Actividad */}
          <section data-tour="patient-lifestyle" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-indigo-500" /> {t("activityLifestyle")}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { icon: Briefcase, label: t("occupation"), val: p.ocupacion },
                { icon: Dumbbell, label: t("activityLevel"), val: p.nivelActividad },
                { icon: Target, label: t("exerciseType"), val: p.tipoEjercicio },
                { icon: Clock, label: t("workSchedule"), val: p.horarioTrabajo },
                { icon: Clock, label: t("exerciseSchedule"), val: p.horarioEjercicio },
                { icon: Moon, label: t("rest"), val: p.horasDescanso },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <item.icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div><span className="text-muted-foreground text-xs">{item.label}</span><p className="font-medium">{item.val}</p></div>
                </div>
              ))}
            </div>
          </section>

          {/* Horario semanal */}
          <section data-tour="patient-schedule" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> {t("weeklySchedule")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("weeklyScheduleDescription")}</p>
          </section>

          {/* Planes alimenticios */}
          <section data-tour="patient-plans" className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" /> {t("mealPlans")}
              </h2>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium cursor-default">
                <Plus className="w-3.5 h-3.5" /> {t("newPlan")}
              </span>
            </div>
            <div className="space-y-2">
              {planesVisibles.map((plan) => (
                <div key={plan.nombre} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{plan.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {plan.activo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-medium">{t("active")}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">{plan.kcal} kcal</span>
                </div>
              ))}
            </div>
            <span className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 cursor-default">
              {t("viewAllPlans", { count: allPlans.length })} <ChevronRight className="w-4 h-4" />
            </span>
          </section>
        </div>

        {/* Sidebar derecho */}
        <div className="space-y-6">
          {/* Objetivo */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" /> {t("goal")}
            </h2>
            <span className="text-primary font-medium">{p.objetivo}</span>
            <p className="text-sm text-muted-foreground mt-1">{p.objetivoDetalle}</p>
          </section>

          {/* Medidas */}
          <section data-tour="patient-measures" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-600 dark:text-blue-400" /> {t("measures")}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">{t("weight")}</span><span className="font-medium">{p.peso} kg</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">{t("height")}</span><span className="font-medium">{p.altura} cm</span></div>
              <div className="flex justify-between pt-2 border-t border-border"><span className="text-sm text-muted-foreground">IMC</span><span className="font-bold text-lg">{p.imc}</span></div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 cursor-default">
              {t("viewEvolution")} <ArrowRight className="w-4 h-4" />
            </span>
          </section>

          {/* Observaciones */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-500" /> {t("observations")}
            </h2>
            <p className="text-sm text-muted-foreground">{p.notas}</p>
          </section>

          {/* Recomendaciones */}
          <section data-tour="patient-recommendations" className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-teal-500" /> {t("recommendations")}
            </h2>
            <p className="text-sm text-muted-foreground">{p.recomendaciones}</p>
          </section>

          {/* Portal del paciente */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" /> {t("patientPortal")}
            </h2>
            <span className="inline-flex items-center gap-1 text-sm text-primary font-medium cursor-default">
              {t("configurePortalAccess")} <ArrowRight className="w-4 h-4" />
            </span>
          </section>
        </div>
      </div>
    </div>
  );
}
