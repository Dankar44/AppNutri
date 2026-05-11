import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
