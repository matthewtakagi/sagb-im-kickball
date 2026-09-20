import { FieldingTable, KickingTable, PitchingTable } from "@/components/stats-tables";
import { fieldingStats, kickingStats, pitchingStats } from "@/lib/kickball/stats";
import { getStore } from "@/lib/store";

export default async function StatsPage() {
  const store = await getStore();
  const kicking = kickingStats(store.players, store.games, store.plays);
  const pitching = pitchingStats(store.players, store.plays);
  const fielding = fieldingStats(store.players, store.plays);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Team stats</h1>
        <p className="text-sm text-muted-foreground">
          If you don't like your stats, blame the official scorer
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Kicking</h2>
        <KickingTable rows={kicking} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pitching</h2>
        <PitchingTable rows={pitching} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Fielding</h2>
        <FieldingTable rows={fielding} />
      </section>
    </div>
  );
}
