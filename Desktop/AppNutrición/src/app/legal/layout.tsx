import Link from "next/link";
import { Leaf, ArrowLeft, FileText, Shield, Cookie } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("legal.layout");

  const NAV_ITEMS = [
    { href: "/legal/terminos", label: t("navTerminos"), icon: FileText },
    { href: "/legal/privacidad", label: t("navPrivacidad"), icon: Shield },
    { href: "/legal/cookies", label: t("navCookies"), icon: Cookie },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#101117] dark:to-[#101117] text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#101117]/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600 dark:text-green-500" />
            <span className="text-lg font-bold">Annonia</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="hover:bg-gray-100 dark:hover:bg-gray-800" />
            <Link
              href="/landing"
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t("volver")}</span>
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0b0e] mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-green-100 dark:group-hover:bg-green-900/40 flex items-center justify-center transition-colors">
                  <item.icon className="w-5 h-5 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-500" />
              <span>© {new Date().getFullYear()} Annonia</span>
            </div>
            <span>legal@annonia.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
