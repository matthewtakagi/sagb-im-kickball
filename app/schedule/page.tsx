import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin";
import { TEAM_NAME } from "@/lib/kickball/labels";
import { getStore } from "@/lib/store";

export default async function SchedulePage() {
  const store = await getStore();
  const admin = await isAdmin();
  const games = [...store.games].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <div className="space-y-6">
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
        <ul className="divide-y rounded-xl border">
          {games.map((game) => (
            <li key={game.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">
                  {TEAM_NAME} {game.isHome ? "vs" : "@"} {game.opponentName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(game.startsAt).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {game.location}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={game.status === "live" ? "default" : "secondary"}>
                  {game.status === "final"
                    ? `${game.state.ourScore}–${game.state.theirScore}`
                    : game.status}
                </Badge>
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
          ))}
        </ul>
      )}
    </div>
  );
}
