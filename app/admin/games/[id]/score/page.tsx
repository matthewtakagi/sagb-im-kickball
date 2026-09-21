import Link from "next/link";
import { notFound } from "next/navigation";
import { startGameAction } from "@/app/actions/kickball";
import { EndGameButton } from "@/components/end-game-button";
import { ForfeitButton } from "@/components/forfeit-button";
import { GameLines } from "@/components/game-lines";
import { PlayLog } from "@/components/play-log";
import { Scoreboard } from "@/components/scoreboard";
import { ScoringConsole } from "@/components/scoring-console";
import { Button } from "@/components/ui/button";
import { getStore, playsForGame } from "@/lib/store";
import { requireAdmin } from "@/lib/admin";

export default async function ScorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const store = await getStore();
  const game = store.games.find((g) => g.id === id);
  if (!game) notFound();
  const plays = playsForGame(store, id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Live scoring</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/games/${game.id}/lineup`}>Lineup</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/games/${game.id}`}>Public view</Link>
          </Button>
          {game.status !== "final" ? (
            <>
              <EndGameButton gameId={game.id} />
              <ForfeitButton gameId={game.id} />
            </>
          ) : null}
        </div>
      </div>
      <Scoreboard game={game} plays={plays} compact />
      <GameLines game={game} players={store.players} plays={plays} />
      {game.status === "scheduled" ? (
        <form action={startGameAction.bind(null, game.id)}>
          <Button type="submit">Start game</Button>
        </form>
      ) : game.status === "final" ? (
        <p className="text-sm text-muted-foreground">
          {game.forfeitBy === "them"
            ? `${game.opponentName} forfeited. SAGB is credited with a ${game.state.ourScore}–${game.state.theirScore} win.`
            : "This game is final. Undo the last play if you still need to edit."}
        </p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <ScoringConsole game={game} players={store.players} plays={plays} />
          <div>
            <h2 className="mb-3 font-semibold">Play by play</h2>
            <PlayLog plays={plays} />
          </div>
        </div>
      )}
    </div>
  );
}
