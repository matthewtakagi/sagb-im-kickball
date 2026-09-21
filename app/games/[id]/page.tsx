import Link from "next/link";
import { notFound } from "next/navigation";
import { Diamond } from "@/components/diamond";
import { GameLines } from "@/components/game-lines";
import { ForfeitButton } from "@/components/forfeit-button";
import { LivePoller } from "@/components/live-poller";
import { PlayLog } from "@/components/play-log";
import { Scoreboard } from "@/components/scoreboard";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin";
import { currentKicker } from "@/lib/kickball/engine";
import { POSITION_LABELS } from "@/lib/kickball/labels";
import { canonicalizePosition } from "@/lib/kickball/types";
import { getStore, playsForGame } from "@/lib/store";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await getStore();
  const game = store.games.find((g) => g.id === id);
  if (!game) notFound();
  const plays = playsForGame(store, id);
  const admin = await isAdmin();
  const kicker = currentKicker(game, store.players);
  const kicking = game.ourLineup
    .filter((s) => s.position !== "BENCH")
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <LivePoller enabled={game.status === "live"} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Game recap</h1>
        {admin ? (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/games/${game.id}/lineup`}>Lineup</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/games/${game.id}/score`}>Score</Link>
            </Button>
            {game.status !== "final" ? <ForfeitButton gameId={game.id} /> : null}
          </div>
        ) : null}
      </div>
      <Scoreboard game={game} plays={plays} />
      {game.forfeitBy === "them" ? (
        <p className="text-sm text-muted-foreground">
          {game.opponentName} forfeited. SAGB wins {game.state.ourScore}–{game.state.theirScore}.
        </p>
      ) : null}
      <GameLines game={game} players={store.players} plays={plays} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Diamond
          bases={game.state.bases}
          outs={game.state.outs}
          balls={game.state.balls}
          strikes={game.state.strikes}
          kicker={game.status === "live" ? kicker?.name : undefined}
        />
        <div>
          <h2 className="mb-3 font-semibold">SAGB lineup</h2>
          {kicking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Lineup not set.</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {kicking.map((slot) => {
                const player = store.players.find((p) => p.id === slot.playerId);
                return (
                  <li key={slot.playerId}>
                    {slot.order}. {player?.name ?? "Unknown"}{" "}
                    <span className="text-muted-foreground">
                      {POSITION_LABELS[canonicalizePosition(slot.position)]}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
      <section>
        <h2 className="mb-3 font-semibold">Play by play</h2>
        <PlayLog plays={plays} />
      </section>
    </div>
  );
}
