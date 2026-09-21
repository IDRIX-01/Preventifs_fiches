import { NextResponse } from "next/server";
import { generateWeeklyFiches } from "@/lib/generateFiches";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await generateWeeklyFiches();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cron] Échec génération des fiches", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}