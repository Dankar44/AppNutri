import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check 1: env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  checks.SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING";

  // Check 2: Prisma connection
  try {
    const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>("SELECT COUNT(*) as count FROM dietistas");
    checks.prisma = `OK (${result[0]?.count} dietistas)`;
  } catch (e) {
    checks.prisma = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Check 3: Prisma model query
  try {
    const count = await prisma.dietista.count();
    checks.prisma_model = `OK (${count} dietistas)`;
  } catch (e) {
    checks.prisma_model = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Check 4: Supabase auth
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    checks.supabase_auth = error ? `No user (${error.message})` : `User: ${data.user?.email}`;
  } catch (e) {
    checks.supabase_auth = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Check 5: verificado column
  try {
    const rows = await prisma.$queryRawUnsafe<{ verificado: boolean }[]>(
      "SELECT verificado FROM dietistas LIMIT 1"
    );
    checks.verificado_column = `OK (value: ${rows[0]?.verificado})`;
  } catch (e) {
    checks.verificado_column = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(checks, { status: 200 });
}
