import Link from "next/link";
import { Leaf } from "lucide-react";
import { useTranslations } from "next-intl";

type PublicFooterProps = {
  /**
   * Prefijo de los enlaces de ancla del footer: "" en la landing (misma
   * página), "/landing" desde otra página pública.
   */
  anchorBase?: string;
};

export function PublicFooter({ anchorBase = "" }: PublicFooterProps) {
  const t = useTranslations("landing");

  return (
    <>
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
                  <li><a href={`${anchorBase}#como-funciona`} className="hover:text-green-300 transition-colors">{t("navbar.comoFunciona")}</a></li>
                  <li><Link href="/precios" className="hover:text-green-300 transition-colors">{t("navbar.precios")}</Link></li>
                  <li><a href={`${anchorBase}#faq`} className="hover:text-green-300 transition-colors">{t("navbar.faq")}</a></li>
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
    </>
  );
}
