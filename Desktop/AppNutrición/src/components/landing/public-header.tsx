"use client";

import { useState, useEffect, useCallback, type RefObject } from "react";
import Link from "next/link";
import { Leaf, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";

type PublicHeaderProps = {
  /**
   * Bloque sobre el que el header va transparente (el hero de la landing):
   * mientras asoma se ve la imagen debajo, y al pasarlo el header se vuelve
   * sólido. Sin ref (resto de páginas públicas) es sólido desde el principio.
   */
  heroRef?: RefObject<HTMLElement | null>;
  /**
   * Prefijo de los enlaces de ancla del nav: "" en la landing (misma página),
   * "/landing" desde otra página pública.
   */
  anchorBase?: string;
};

export function PublicHeader({ heroRef, anchorBase = "" }: PublicHeaderProps) {
  const t = useTranslations("landing");

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!heroRef);

  useEffect(() => {
    if (!heroRef) return;
    function handleScroll() {
      const heroBottom = heroRef!.current?.getBoundingClientRect().bottom ?? 0;
      setScrolled(heroBottom <= 64);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroRef]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
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
              href={`${anchorBase}#como-funciona`}
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
              href={`${anchorBase}#faq`}
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
          <a href={`${anchorBase}#como-funciona`} onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.comoFunciona")}</a>
          <Link href="/precios" onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.precios")}</Link>
          <a href={`${anchorBase}#faq`} onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.faq")}</a>
          <Link href="/login" onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.iniciarSesion")}</Link>
          <Link href="/registro" onClick={closeMenu} className="py-5 text-xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 hover:text-green-700 dark:hover:text-green-400 transition-colors">{t("navbar.empezarGratis")}</Link>
          <div className="py-5 flex items-center gap-4">
            <LanguageSwitcher variant="inline" className="!text-gray-900 dark:!text-gray-100 !text-xl !font-bold hover:!text-green-700 dark:hover:!text-green-400 w-auto" />
            <ThemeToggle variant="inline" className="!text-gray-900 dark:!text-gray-100 !text-xl !font-bold hover:!text-green-700 dark:hover:!text-green-400" />
          </div>
        </nav>
      </div>
    </>
  );
}
