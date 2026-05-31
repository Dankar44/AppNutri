"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Leaf, ArrowRight, ChevronRight, X,
  Utensils, Fish, Croissant, Salad, Wheat, Vegan, Pizza, Soup, Beef, CupSoda,
  Carrot, Egg, Nut, Cherry, Banana, Bean, Sandwich, IceCreamCone, Apple, Grape, Citrus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { NuestraHistoria } from "@/components/landing/nuestra-historia";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";

const SHOWCASE_LAYOUT = [
  {
    key: "dietistas" as const,
    ctaHref: "/registro",
    imageSrc: "/images/landing/sw_gestion.png",
    imagePosition: "right" as const,
    gradientClasses: "from-green-50 to-green-200/60 border-green-200/60 dark:from-green-950/40 dark:to-green-900/30 dark:border-green-800/40",
    direction: "left" as const,
  },
  {
    key: "pacientes" as const,
    ctaHref: "/registro",
    imageSrc: "/images/landing/pacientes.png",
    imagePosition: "left" as const,
    gradientClasses: "from-emerald-50 to-green-100/70 border-emerald-200/60 dark:from-emerald-950/40 dark:to-green-900/30 dark:border-emerald-800/40",
    direction: "right" as const,
  },
  {
    key: "ia" as const,
    ctaHref: "/registro",
    imageSrc: "/images/landing/planes_ai.png",
    imagePosition: "right" as const,
    gradientClasses: "from-green-100/80 to-emerald-200/50 border-green-200/60 dark:from-green-950/40 dark:to-emerald-900/30 dark:border-green-800/40",
    direction: "left" as const,
  },
];

const FAQ_KEYS = ["probarGratis", "datosSeguridad", "cambiarPlan", "pacientesCuenta", "funcionaMovil"] as const;

// Slides del carrusel del hero (texto en español).
type HeroSlide = {
  image: string;
  part1: string;
  part2: string;
  part3: string;
  notifNombre: string;
  notifMensaje: string;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/images/landing/banner-oficina.png",
    part1: "Toda tu consulta",
    part2: "en un solo lugar",
    part3: "y más tiempo para ti",
    notifNombre: "Annonia",
    notifMensaje: "Agenda, fichas y planes de hoy al día ✅",
  },
  {
    image: "/images/landing/banner.png",
    part1: "Nutrición",
    part2: "personalizada",
    part3: "para cada paciente",
    notifNombre: "Nutricionista Teresa",
    notifMensaje: "¡Muy bien Claudia! Se nota que sigues tu plan cocinando en casa 🍳",
  },
  {
    image: "/images/landing/banner-planes.png",
    part1: "Crea y ajusta",
    part2: "dietas personalizadas",
    part3: "en cualquier dispositivo",
    notifNombre: "Carlos García",
    notifMensaje: "¡Recibido mi nuevo plan! 🥗 Esta semana lo sigo a tope",
  },
];

const HERO_SLIDE_INTERVAL = 6000; // ms

// Programas destacados: una tarjeta por tipo de público.
// href apunta a su bloque de "Cómo funciona"; null = aún por hacer.
const PROGRAMAS: {
  label: string;
  image: string;
  color: string;
  href: string | null;
}[] = [
  { label: "Nutricionistas", image: "/images/landing/programas/nutricionistas.png", color: "#CFE0DF", href: "#para-dietistas" },
  { label: "Pacientes", image: "/images/landing/programas/pacientes.png", color: "#ECE2CE", href: "#para-pacientes" },
  { label: "Universidades", image: "/images/landing/programas/universidades.png", color: "#CFDBD3", href: null },
  { label: "Centros", image: "/images/landing/programas/centros.png", color: "#DDE6E5", href: null },
];

export function LandingPage() {
  const t = useTranslations("landing");

  const SHOWCASE_SECTIONS = SHOWCASE_LAYOUT.map((item) => ({
    ...item,
    tag: t(`showcase.${item.key}.tag`),
    title: t(`showcase.${item.key}.titulo`),
    description: t(`showcase.${item.key}.descripcion`),
    ctaText: t(`showcase.${item.key}.cta`),
    imageAlt: t(`showcase.${item.key}.imageAlt`),
  }));

  const FAQS = FAQ_KEYS.map((key) => ({
    q: t(`faqSection.preguntas.${key}.pregunta`),
    a: t(`faqSection.preguntas.${key}.respuesta`),
  }));

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  const heroSlides = HERO_SLIDES;

  // Auto-avance del carrusel del hero.
  useEffect(() => {
    if (HERO_SLIDES.length <= 1) return;
    const id = setTimeout(
      () => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length),
      HERO_SLIDE_INTERVAL
    );
    return () => clearTimeout(id);
  }, [heroSlide]);

  useEffect(() => {
    function handleScroll() {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setScrolled(heroBottom <= 64);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#101117] text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled && "bg-white dark:bg-[#101117] shadow-md dark:shadow-black/30"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5">
            <Leaf
              className={cn(
                "w-7 h-7 transition-colors duration-300",
                scrolled ? "text-green-600" : "text-white drop-shadow-md"
              )}
            />
            <span
              className={cn(
                "text-xl font-bold transition-colors duration-300",
                scrolled ? "text-gray-900 dark:text-gray-100" : "text-white drop-shadow-md"
              )}
            >
              Annonia
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-base font-extrabold drop-shadow-md">
            <a
              href="#como-funciona"
              className={cn(
                "transition-colors duration-300",
                scrolled ? "text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 drop-shadow-none" : "text-white hover:text-green-200"
              )}
            >
              {t("navbar.comoFunciona")}
            </a>
            <Link
              href="/precios"
              className={cn(
                "transition-colors duration-300",
                scrolled ? "text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 drop-shadow-none" : "text-white hover:text-green-200"
              )}
            >
              {t("navbar.precios")}
            </Link>
            <a
              href="#faq"
              className={cn(
                "transition-colors duration-300",
                scrolled ? "text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 drop-shadow-none" : "text-white hover:text-green-200"
              )}
            >
              {t("navbar.faq")}
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                "px-4 py-2 text-base font-extrabold transition-colors duration-300",
                scrolled ? "text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 drop-shadow-none" : "text-white drop-shadow-md hover:text-green-200"
              )}
            >
              {t("navbar.iniciarSesion")}
            </Link>
            <LanguageSwitcher className={cn(
              scrolled
                ? "border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                : "border-white/30 bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
            )} />
            <ThemeToggle className={cn(
              "!w-9 !h-9 rounded-lg transition-colors",
              scrolled ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300" : "hover:bg-white/15 text-white drop-shadow-md"
            )} />
            <Link
              href="/registro"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
            >
              {t("navbar.empezarGratis")}
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-[5px] z-[60]"
            aria-label={t("mobileMenu.abrirMenu")}
          >
            <span
              className={cn(
                "block w-6 h-[2px] rounded-full transition-all duration-300",
                scrolled ? "bg-gray-800 dark:bg-gray-200" : "bg-white drop-shadow-md",
                menuOpen && "translate-y-[7px] rotate-45"
              )}
            />
            <span
              className={cn(
                "block w-6 h-[2px] rounded-full transition-all duration-300",
                scrolled ? "bg-gray-800 dark:bg-gray-200" : "bg-white drop-shadow-md",
                menuOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "block w-6 h-[2px] rounded-full transition-all duration-300",
                scrolled ? "bg-gray-800 dark:bg-gray-200" : "bg-white drop-shadow-md",
                menuOpen && "-translate-y-[7px] -rotate-45"
              )}
            />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        onClick={closeMenu}
        className={cn(
          "fixed inset-0 bg-black/40 z-[55] md:hidden transition-opacity duration-300",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Mobile slide-in menu */}
      <div
        className="fixed top-0 right-0 w-full h-full bg-white dark:bg-[#17181e] z-[60] shadow-2xl md:hidden overflow-y-auto"
        style={{
          transform: menuOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="flex items-center justify-between px-6 h-16">
          <Link href="/landing" className="flex items-center gap-2" onClick={closeMenu}>
            <Leaf className="w-6 h-6 text-green-600 dark:text-green-500" />
            <span className="text-lg font-bold text-green-600 dark:text-green-500">Annonia</span>
          </Link>
          <button
            onClick={closeMenu}
            className="w-10 h-10 flex items-center justify-center text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label={t("mobileMenu.cerrarMenu")}
          >
            <X className="w-7 h-7" />
          </button>
        </div>
        <nav className="flex flex-col px-6 pt-6">
          <a href="#como-funciona" onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.comoFunciona")}</a>
          <Link href="/precios" onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.precios")}</Link>
          <a href="#faq" onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.faq")}</a>
          <Link href="/login" onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.iniciarSesion")}</Link>
          <Link href="/registro" onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.empezarGratis")}</Link>
          <div className="py-5 flex items-center gap-4">
            <LanguageSwitcher variant="inline" className="!text-gray-900 dark:!text-gray-100 !text-xl !font-bold hover:!text-green-700 dark:hover:!text-green-400 w-auto" />
            <ThemeToggle variant="inline" className="!text-gray-900 dark:!text-gray-100 !text-xl !font-bold hover:!text-green-700 dark:hover:!text-green-400" />
          </div>
        </nav>
      </div>

      {/* ─── HERO (carrusel) ─── */}
      <section
        ref={heroRef}
        className="relative bg-green-50 dark:bg-green-950 overflow-hidden aspect-square sm:aspect-[3003/1231]"
      >
        {/* Imágenes apiladas con crossfade */}
        {heroSlides.map((slide, i) => (
          <Image
            key={slide.image}
            src={slide.image}
            alt={t("hero.bannerAlt")}
            width={3003}
            height={1231}
            priority={i === 0}
            className={cn(
              "absolute inset-0 z-0 w-full h-full object-cover object-[75%_center] sm:object-center transition-opacity duration-1000 ease-in-out",
              i === heroSlide ? "opacity-100" : "opacity-0"
            )}
          />
        ))}

        {/* Vignette */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.85) 100%)" }}
        />

        {/* Blurred edges */}
        <div
          className="absolute inset-y-0 left-0 w-[24%] sm:w-[20%] lg:w-[18%] z-[2] pointer-events-none"
          style={{
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 100%)",
            maskImage: "linear-gradient(to right, black 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-[24%] sm:w-[20%] lg:w-[18%] z-[2] pointer-events-none"
          style={{
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            WebkitMaskImage: "linear-gradient(to left, black 0%, transparent 100%)",
            maskImage: "linear-gradient(to left, black 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[20%] z-[2] pointer-events-none"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          }}
        />

        {/* Notificación flotante (por slide) */}
        {heroSlides.map((slide, i) => (
          <div
            key={`notif-${i}`}
            className={cn(
              "hidden lg:block absolute top-[55%] right-[12%] z-20 transition-all duration-700 ease-out",
              i === heroSlide
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
            )}
          >
            <div className="bg-white dark:bg-[#17181e] rounded-2xl shadow-xl shadow-black/10 px-5 py-4 flex items-start gap-3 max-w-xs">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{slide.notifNombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                  {slide.notifMensaje}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Texto del hero (por slide) */}
        {heroSlides.map((slide, i) => (
          <div
            key={`text-${i}`}
            className={cn(
              "absolute inset-x-0 bottom-[28%] sm:bottom-[46%] lg:bottom-[48%] z-10 transition-opacity duration-700",
              i === heroSlide ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-3 sm:pl-5 lg:pl-8 xl:pl-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] text-white drop-shadow-md max-w-3xl">
                {slide.part1}{" "}
                <span className="bg-[#bdd9c5] dark:bg-[#2a5e3a] px-1.5 -mx-0.5 text-gray-900 dark:text-green-100 drop-shadow-none">
                  {slide.part2}
                </span>
                <br />
                {slide.part3}
              </h1>
            </div>
          </div>
        ))}

        {/* Puntitos de navegación del carrusel */}
        {heroSlides.length > 1 && (
          <div className="absolute bottom-[15%] sm:bottom-[12%] lg:bottom-[10%] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
            {heroSlides.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                onClick={() => setHeroSlide(i)}
                aria-label={`Ir a la imagen ${i + 1}`}
                aria-current={i === heroSlide}
                className={cn(
                  "h-2.5 rounded-full shadow-sm shadow-black/20 transition-all duration-300",
                  i === heroSlide ? "w-7 bg-white" : "w-2.5 bg-white/55 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── WAVE hero → spacer ─── */}
      <div className="relative -mt-[3vw] z-30">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[5vw] sm:h-[4vw] lg:h-[3.5vw] block">
          <path d="M0 80V40C240 0 480 0 720 20C960 40 1200 60 1440 30V80H0Z" className="fill-[#bdd9c5] dark:fill-[#1a3a24]" />
        </svg>
        <section className="bg-[#bdd9c5] dark:bg-[#1a3a24] -mt-px h-12 sm:h-16 lg:h-20" />
      </div>

      {/* ─── FOOD ICONS + HEADLINE ─── */}
      <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden bg-gradient-to-b from-green-50/40 to-white dark:from-green-950/20 dark:to-[#101117]">
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          <Utensils className="absolute top-[2%] left-[2%] w-8 h-8 text-green-300 dark:text-green-800 opacity-[0.55]" style={{ transform: "rotate(-15deg)" }} />
          <Fish className="absolute top-[3%] left-[11%] w-9 h-9 text-green-300 dark:text-green-800 opacity-[0.50]" style={{ transform: "rotate(5deg)" }} />
          <Croissant className="absolute top-[1%] left-[22%] w-8 h-8 text-green-300 dark:text-green-800 opacity-[0.45]" style={{ transform: "rotate(8deg)" }} />
          <Salad className="absolute top-[4%] left-[33%] w-8 h-8 text-green-300 dark:text-green-800 opacity-[0.40]" style={{ transform: "rotate(-8deg)" }} />
          <Wheat className="absolute top-[2%] left-[43%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.35]" style={{ transform: "rotate(12deg)" }} />
          <Vegan className="absolute top-[5%] left-[52%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.30]" style={{ transform: "rotate(-5deg)" }} />
          <Pizza className="absolute top-[1%] right-[33%] w-8 h-8 text-green-300 dark:text-green-800 opacity-[0.40]" style={{ transform: "rotate(-12deg)" }} />
          <Soup className="absolute top-[3%] right-[22%] w-9 h-9 text-green-300 dark:text-green-800 opacity-[0.45]" style={{ transform: "rotate(-5deg)" }} />
          <Beef className="absolute top-[4%] right-[11%] w-8 h-8 text-green-300 dark:text-green-800 opacity-[0.50]" style={{ transform: "rotate(-10deg)" }} />
          <CupSoda className="absolute top-[2%] right-[2%] w-8 h-8 text-green-300 dark:text-green-800 opacity-[0.55]" style={{ transform: "rotate(15deg)" }} />
          <Carrot className="absolute top-[13%] left-[5%] w-8 h-8 text-green-300 dark:text-green-800 opacity-[0.40]" style={{ transform: "rotate(10deg)" }} />
          <Egg className="absolute top-[16%] left-[16%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.35]" style={{ transform: "rotate(20deg)" }} />
          <Nut className="absolute top-[12%] left-[27%] w-6 h-6 text-green-200 dark:text-green-900 opacity-[0.30]" style={{ transform: "rotate(-8deg)" }} />
          <Cherry className="absolute top-[19%] left-[37%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.25]" style={{ transform: "rotate(12deg)" }} />
          <Banana className="absolute top-[14%] right-[37%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.25]" style={{ transform: "rotate(8deg)" }} />
          <Bean className="absolute top-[17%] right-[27%] w-6 h-6 text-green-200 dark:text-green-900 opacity-[0.30]" style={{ transform: "rotate(15deg)" }} />
          <Sandwich className="absolute top-[12%] right-[16%] w-8 h-8 text-green-200 dark:text-green-900 opacity-[0.35]" style={{ transform: "rotate(8deg)" }} />
          <IceCreamCone className="absolute top-[15%] right-[5%] w-7 h-7 text-green-300 dark:text-green-800 opacity-[0.40]" style={{ transform: "rotate(-20deg)" }} />
          <Apple className="absolute top-[27%] left-[4%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.20]" style={{ transform: "rotate(-20deg)" }} />
          <Grape className="absolute top-[32%] left-[18%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.16]" style={{ transform: "rotate(5deg)" }} />
          <Citrus className="absolute top-[29%] right-[18%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.16]" style={{ transform: "rotate(10deg)" }} />
          <Croissant className="absolute top-[34%] right-[4%] w-7 h-7 text-green-200 dark:text-green-900 opacity-[0.20]" style={{ transform: "rotate(8deg)" }} />
        </div>
        <ScrollReveal>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
              {t("subheadline.titulo")}
            </h2>
            <p className="text-xl sm:text-2xl text-gray-400">
              {t("subheadline.subtitulo")}
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── PROGRAMAS DESTACADOS ─── */}
      <section className="bg-white dark:bg-[#101117] pt-4 sm:pt-8 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {PROGRAMAS.map((p, i) => {
              const href = p.href;
              const cardClass = cn(
                "group relative block aspect-[3/4.3] rounded-[20px] overflow-hidden will-change-transform transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2.5 hover:scale-[1.045] hover:shadow-[0_30px_60px_rgba(15,23,42,0.18)] hover:z-[5]",
                href ? "cursor-pointer" : "cursor-default"
              );
              const contenido = (
                <>
                  {/* Imagen al fondo */}
                  <div className="absolute inset-x-0 bottom-0 h-[90%]">
                    <Image
                      src={p.image}
                      alt={`Para ${p.label}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-top"
                    />
                  </div>
                  {/* Difuminado de la franja de color hacia la imagen */}
                  <div
                    className="absolute inset-x-0 top-0 h-[34%] pointer-events-none z-[1]"
                    style={{ background: `linear-gradient(to bottom, ${p.color} 0%, ${p.color} 55%, rgba(255,255,255,0) 100%)` }}
                  />
                  {/* Etiqueta */}
                  <span className="absolute top-5 inset-x-4 z-[2] text-center font-bold text-gray-900 leading-snug text-sm sm:text-base lg:text-xl">
                    Para{" "}
                    <span className="inline-block bg-[#c8e6c9] px-[0.3em] py-[0.05em] text-[1.45em] font-extrabold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                      {p.label}
                    </span>
                  </span>
                </>
              );
              return (
                <ScrollReveal key={p.label} delay={i * 100} direction="up">
                  {href ? (
                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(href.slice(1));
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "start" });
                          window.history.pushState(null, "", href);
                        }
                      }}
                      className={cardClass}
                      style={{ backgroundColor: p.color }}
                    >
                      {contenido}
                    </a>
                  ) : (
                    <div className={cardClass} style={{ backgroundColor: p.color }}>
                      {contenido}
                    </div>
                  )}
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SHOWCASE: Cómo funciona ─── */}
      <section id="como-funciona">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8 sm:pt-4 sm:pb-12 space-y-16 sm:space-y-24">
          {SHOWCASE_SECTIONS.map((section, idx) => (
            <ScrollReveal key={idx} direction={section.direction} delay={100}>
              <div
                id={`para-${section.key}`}
                className={cn(
                  "scroll-mt-24 flex flex-col-reverse items-center gap-10 lg:gap-16",
                  section.imagePosition === "right" ? "lg:flex-row" : "lg:flex-row-reverse"
                )}
              >
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-5 leading-[1.2]">
                    <span className="bg-[#bdd9c5] dark:bg-[#2a5e3a] px-1.5 -mx-0.5 dark:text-green-100">{section.tag}</span>{" "}
                    {section.title}
                  </h3>
                  <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-7">
                    {section.description}
                  </p>
                  <Link
                    href={section.ctaHref}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all shadow-sm shadow-green-600/20 hover:-translate-y-0.5"
                  >
                    {section.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex-1 w-full max-w-lg lg:max-w-xl flex justify-center">
                  <div className="relative aspect-square w-full max-w-lg">
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full bg-gradient-to-br border shadow-sm",
                        section.gradientClasses
                      )}
                    />
                    <Image
                      src={section.imageSrc}
                      alt={section.imageAlt}
                      width={800}
                      height={600}
                      sizes="(min-width: 1024px) 35vw, 68vw"
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68%] h-auto shadow-md"
                      style={{ borderRadius: "1.75rem" }}
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── WAVE white → green (Trust) ─── */}
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block -mb-px">
        <path d="M0 80V50C240 20 480 40 720 60C960 80 1200 70 1440 40V80H0Z" className="fill-[#bdd9c5] dark:fill-[#1a3a24]" />
      </svg>

      {/* ─── NUESTRA HISTORIA ─── */}
      <section className="relative bg-[#bdd9c5] dark:bg-[#1a3a24] overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <NuestraHistoria />
        </div>
      </section>

      {/* ─── WAVE green → white ─── */}
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block -mt-px">
        <path d="M0 0V30C240 60 480 40 720 20C960 0 1200 10 1440 40V0H0Z" className="fill-[#bdd9c5] dark:fill-[#1a3a24]" />
      </svg>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
                {t("faqSection.tituloPart1")}{" "}
                <span className="bg-[#bdd9c5] dark:bg-[#2a5e3a] dark:text-green-100 px-2 -mx-0.5">{t("faqSection.tituloPart2")}</span>{" "}
                {t("faqSection.tituloPart3")}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
                {t("faqSection.descripcion")}
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
            <ScrollReveal direction="left">
              <div className="divide-y divide-gray-200 dark:divide-gray-700 border-l-2 border-[#bdd9c5] dark:border-[#2a5e3a] pl-6 sm:pl-8">
                {FAQS.map((faq, i) => (
                  <details key={i} className="group py-5 first:pt-0 last:pb-0">
                    <summary className="flex items-center justify-between cursor-pointer text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-green-700 dark:hover:text-green-400 transition-colors [&::-webkit-details-marker]:hidden list-none">
                      <span>{faq.q}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform duration-200 group-open:rotate-90" />
                    </summary>
                    <div className="pt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" className="flex justify-center">
              <div className="relative w-full max-w-[240px] sm:max-w-[280px]">
                <div className="absolute -inset-6 bg-gradient-to-br from-green-100/60 to-[#bdd9c5]/40 dark:from-green-900/30 dark:to-[#1a3a24]/40 rounded-[2rem] blur-2xl" />
                <Image
                  src="/images/landing/pacientes.png"
                  alt={t("faqSection.faqImageAlt")}
                  width={560}
                  height={800}
                  sizes="280px"
                  className="relative w-full h-auto rounded-2xl shadow-2xl shadow-green-900/15 dark:shadow-black/30"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
                {t("cta.tituloPart1")}{" "}
                <span className="bg-[#bdd9c5] dark:bg-[#2a5e3a] dark:text-green-100 px-2 -mx-0.5">{t("cta.tituloPart2")}</span>{" "}
                {t("cta.tituloPart3")}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
                {t("cta.descripcion")}
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 hover:-translate-y-0.5"
              >
                {t("cta.boton")}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-5 text-sm text-gray-400 dark:text-gray-500">
                {t("cta.garantia")}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── WAVE white → dark (Footer) ─── */}
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block -mb-px">
        <path d="M0 80V50C240 20 480 40 720 60C960 80 1200 70 1440 40V80H0Z" className="fill-[#2d3748] dark:fill-[#0a0b0e]" />
      </svg>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#2d3748] dark:bg-[#0a0b0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-green-400" />
                <span className="text-lg font-bold text-white">Annonia</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                {t("footer.descripcion")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="text-sm font-semibold text-white mb-4">{t("footer.producto")}</p>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><a href="#como-funciona" className="hover:text-green-300 transition-colors">{t("navbar.comoFunciona")}</a></li>
                  <li><Link href="/precios" className="hover:text-green-300 transition-colors">{t("navbar.precios")}</Link></li>
                  <li><a href="#faq" className="hover:text-green-300 transition-colors">{t("navbar.faq")}</a></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-4">{t("footer.acceso")}</p>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link href="/login" className="hover:text-green-300 transition-colors">{t("navbar.iniciarSesion")}</Link></li>
                  <li><Link href="/registro" className="hover:text-green-300 transition-colors">{t("footer.crearCuenta")}</Link></li>
                  <li><Link href="/paciente/login" className="hover:text-green-300 transition-colors">{t("footer.portalPacientes")}</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-4">{t("footer.legal")}</p>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link href="/legal/terminos" className="hover:text-green-300 transition-colors">{t("footer.terminosCondiciones")}</Link></li>
                  <li><Link href="/legal/privacidad" className="hover:text-green-300 transition-colors">{t("footer.politicaPrivacidad")}</Link></li>
                  <li><Link href="/legal/cookies" className="hover:text-green-300 transition-colors">{t("footer.politicaCookies")}</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-sm text-gray-500 text-center">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  );
}
