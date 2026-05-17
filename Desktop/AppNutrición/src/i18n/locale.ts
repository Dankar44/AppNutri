"use server";

import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

const COOKIE_NAME = "NEXT_LOCALE";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  return locales.includes(raw as Locale) ? (raw as Locale) : defaultLocale;
}

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
