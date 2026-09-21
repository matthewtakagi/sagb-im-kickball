import Link from "next/link";
import { EndGameButton } from "@/components/end-game-button";
import { ForfeitButton } from "@/components/forfeit-button";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin";
import { formatGameDateTime } from "@/lib/kickball/datetime";
import { getStore } from "@/lib/store";

export default async function AdminHomePage() {
  await requireAdmin();
  const store = await getStore();
  const live = store.games.filter((g) => g.status === "live");
  const upcoming = store.games
    .filter((g) => g.status === "scheduled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const completed = store.games
    .filter((g) => g.status === "final")
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Scoring desk</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/roster">Roster</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/games/new">New game</Link>
          </Button>
        </div>
      </div>
      {live.length ? (
        <section className="space-y-2">
          <h2 className="font-semibold">Live</h2>
          {live.map((game) => (
            <div key={game.id} className="flex items-center justify-between gap-3 rounded-xl border p-4">
              <Link href={`/admin/games/${game.id}/score`} className="min-w-0 flex-1 hover:underline">
                vs {game.opponentName} · {game.state.ourScore}–{game.state.theirScore}
              </Link>
              <div className="flex gap-2">
                <EndGameButton gameId={game.id} />
                <ForfeitButton gameId={game.id} />
              </div>
            </div>
          ))}
        </section>
      ) : null}
      <section className="space-y-2">
        <h2 className="font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scheduled games.</p>
        ) : (
          upcoming.map((game) => (
            <div key={game.id} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">vs {game.opponentName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatGameDateTime(game.startsAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/games/${game.id}/lineup`}>Lineup</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/admin/games/${game.id}/score`}>Score</Link>
                </Button>
                <EndGameButton gameId={game.id} />
                <ForfeitButton gameId={game.id} />
              </div>
            </div>
          ))
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Completed</h2>
        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed games yet.</p>
        ) : (
          completed.map((game) => (
            <div key={game.id} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">vs {game.opponentName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatGameDateTime(game.startsAt)} · {game.state.ourScore}–{game.state.theirScore}
                  {game.forfeitBy === "them" ? " forfeit" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/games/${game.id}`}>Box</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/admin/games/${game.id}/score`}>Score</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
