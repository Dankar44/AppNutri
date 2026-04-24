import Link from "next/link";
import { Leaf, ArrowLeft, FileText, Shield, Cookie } from "lucide-react";

const NAV_ITEMS = [
  { href: "/legal/terminos", label: "Términos y condiciones", icon: FileText },
  { href: "/legal/privacidad", label: "Política de privacidad", icon: Shield },
  { href: "/legal/cookies", label: "Política de cookies", icon: Cookie },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            <span className="text-lg font-bold">Annonia</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/landing"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-200 bg-white mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-green-200 hover:bg-green-50/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                  <item.icon className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400">
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
