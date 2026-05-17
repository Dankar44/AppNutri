import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin";
import { locales, type Locale } from "@/i18n/config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const langParam = request.nextUrl.searchParams.get("lang");
  if (langParam && locales.includes(langParam as Locale)) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    const response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", langParam, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (token) {
      const session = await verifyAdminToken(token);
      if (session?.role === "creator" && !pathname.startsWith("/admin/crear-cuenta")) {
        return NextResponse.redirect(new URL("/admin/crear-cuenta", request.url));
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|api/health|api/locale|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
