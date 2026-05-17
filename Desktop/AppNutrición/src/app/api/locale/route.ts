import { NextResponse, type NextRequest } from "next/server";
import { locales, type Locale } from "@/i18n/config";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const locale = body.locale as string;

  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
