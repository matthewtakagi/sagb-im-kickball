import { KickingTable, PitchingTable } from "@/components/stats-tables";
import { kickingStats, pitchingStats } from "@/lib/kickball/stats";
import type { Game, Play, Player } from "@/lib/kickball/types";

export function GameLines({
  game,
  players,
  plays,
}: {
  game: Game;
  players: Player[];
  plays: Play[];
}) {
  const kicking = kickingStats(players, [game], plays);
  const pitching = pitchingStats(players, plays);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-semibold">Hitting</h2>
        <KickingTable rows={kicking} empty="No hitting yet this game." />
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Pitching</h2>
        <PitchingTable rows={pitching} empty="No pitching yet this game." />
      </section>
    </div>
  );
}
