import { generateWeeklyFiches } from "@/lib/generateFiches";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await generateWeeklyFiches();
    return Response.json({ ok: true, result });
  } catch (e) {
    console.error("[test-fiches] ERREUR :", e);
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}