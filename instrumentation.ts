export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { generateWeeklyFiches } = await import("@/lib/generateFiches");

    // Tous les lundis à 10h00, heure d'Abidjan
    cron.schedule(
      "0 10 * * 1",
      async () => {
        console.log("[cron] Génération hebdomadaire des fiches…");
        await generateWeeklyFiches();
      },
      { timezone: "Africa/Abidjan" }
    );

    console.log("[cron] Tâche planifiée : chaque lundi à 10h (Africa/Abidjan)");
  }
}