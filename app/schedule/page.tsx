import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin";
import { formatGameDateTime } from "@/lib/kickball/datetime";
import { TEAM_NAME } from "@/lib/kickball/labels";
import type { Game } from "@/lib/kickball/types";
import { getStore } from "@/lib/store";

function resultBadge(game: Game) {
  if (game.forfeitBy === "them") {
    return `${game.state.ourScore}–${game.state.theirScore} forfeit`;
  }
  if (game.status === "final") {
    return `${game.state.ourScore}–${game.state.theirScore}`;
  }
  return game.status;
}

function GameRow({ game, admin }: { game: Game; admin: boolean }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="font-medium">
          {TEAM_NAME} {game.isHome ? "vs" : "@"} {game.opponentName}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatGameDateTime(game.startsAt)} · {game.location}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={game.status === "live" ? "default" : "secondary"}>{resultBadge(game)}</Badge>
        <Link className="text-sm hover:underline" href={`/games/${game.id}`}>
          Box
        </Link>
        {admin ? (
          <Link className="text-sm hover:underline" href={`/admin/games/${game.id}/lineup`}>
            Lineup
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export default async function SchedulePage() {
  const store = await getStore();
  const admin = await isAdmin();
  const games = [...store.games].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = games.filter((g) => g.status !== "final");
  const completed = games.filter((g) => g.status === "final");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        {admin ? (
          <Button asChild>
            <Link href="/admin/games/new">Add game</Link>
          </Button>
        ) : null}
      </div>
      {games.length === 0 ? (
        <p className="text-muted-foreground">No games yet.</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No remaining games.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {upcoming.map((game) => (
                  <GameRow key={game.id} game={game} admin={admin} />
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Completed</h2>
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed games yet.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {completed.map((game) => (
                  <GameRow key={game.id} game={game} admin={admin} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
