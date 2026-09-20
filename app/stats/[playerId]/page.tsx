import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayLog } from "@/components/play-log";
import { FieldingTable, KickingTable, PitchingTable } from "@/components/stats-tables";
import { fieldingStats, kickingStats, pitchingStats } from "@/lib/kickball/stats";
import { getStore } from "@/lib/store";

export default async function PlayerStatsPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const store = await getStore();
  const player = store.players.find((p) => p.id === playerId);
  if (!player) notFound();

  const plays = store.plays.filter(
    (p) => p.kickerId === playerId || p.pitcherId === playerId || p.fielding.some((f) => f.playerId === playerId) || p.runs.some((r) => r.playerId === playerId),
  );
  const kicking = kickingStats(store.players, store.games, store.plays).filter((r) => r.playerId === playerId);
  const pitching = pitchingStats(store.players, store.plays).filter((r) => r.playerId === playerId);
  const fielding = fieldingStats(store.players, store.plays).filter((r) => r.playerId === playerId);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/stats" className="text-sm text-muted-foreground hover:underline">
          All stats
        </Link>
        <h1 className="text-2xl font-semibold">
          {player.number ? `#${player.number} ` : ""}
          {player.name}
        </h1>
      </div>
      {kicking.length ? (
        <section className="space-y-3">
          <h2 className="font-semibold">Kicking</h2>
          <KickingTable rows={kicking} />
        </section>
      ) : null}
      {pitching.length ? (
        <section className="space-y-3">
          <h2 className="font-semibold">Pitching</h2>
          <PitchingTable rows={pitching} />
        </section>
      ) : null}
      {fielding.length ? (
        <section className="space-y-3">
          <h2 className="font-semibold">Fielding</h2>
          <FieldingTable rows={fielding} />
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="font-semibold">Play log</h2>
        <PlayLog plays={plays.filter((p) => p.kickerId === playerId || p.pitcherId === playerId)} />
      </section>
    </div>
  );
}
