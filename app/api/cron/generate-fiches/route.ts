import { generateWeeklyFiches } from "@/lib/generateFiches";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const result = await generateWeeklyFiches();
    console.log("[cron] Fiches générées :", result);
    return Response.json({ ok: true, result });
  } catch (e) {
    console.error("[cron] ERREUR :", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}