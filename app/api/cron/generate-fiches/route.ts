import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyFiches } from "@/lib/generateFiches";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const created = await generateWeeklyFiches();
  return NextResponse.json({ ok: true, created });
}