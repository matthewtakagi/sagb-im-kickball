import Link from "next/link";
import { Scoreboard } from "@/components/scoreboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin } from "@/lib/admin";
import { formatGameDateTime } from "@/lib/kickball/datetime";
import { TEAM_NAME } from "@/lib/kickball/labels";
import { getStore, playsForGame, teamRecord } from "@/lib/store";

export default async function HomePage() {
  const store = await getStore();
  const admin = await isAdmin();
  const record = teamRecord(store.games);
  const live = store.games.find((g) => g.status === "live");
  const upcoming = store.games
    .filter((g) => g.status === "scheduled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const last = store.games
    .filter((g) => g.status === "final")
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary">IM Kickball</p>
          <h1 className="text-3xl font-semibold tracking-tight">{TEAM_NAME}</h1>
          <p className="mt-1 text-muted-foreground">
            Schedule, lineups, live play-by-play, and stats.
          </p>
        </div>
        <p className="text-2xl font-semibold tabular-nums">
          {record.w}-{record.l}
          {record.t ? `-${record.t}` : ""}
        </p>
      </section>

      {live ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live now</h2>
            <Button asChild>
              <Link href={admin ? `/admin/games/${live.id}/score` : `/games/${live.id}`}>
                {admin ? "Open scoring" : "Follow along"}
              </Link>
            </Button>
          </div>
          <Scoreboard game={live} plays={playsForGame(store, live.id)} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Next game</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming ? (
              <GameBlurb
                opponent={upcoming.opponentName}
                when={upcoming.startsAt}
                where={upcoming.location}
                href={`/games/${upcoming.id}`}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last result</CardTitle>
          </CardHeader>
          <CardContent>
            {last ? (
              <GameBlurb
                opponent={last.opponentName}
                when={last.startsAt}
                where={`${TEAM_NAME} ${last.state.ourScore}–${last.state.theirScore}${last.forfeitBy === "them" ? " (forfeit)" : ""}`}
                href={`/games/${last.id}`}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No final games yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {admin ? (
              <>
                <Button asChild className="w-full">
                  <Link href="/admin/games/new">Schedule a game</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/roster">Edit roster</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Anyone can watch the schedule and stats. Scoring is admin-only.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/login">Admin login</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GameBlurb({
  opponent,
  when,
  where,
  href,
}: {
  opponent: string;
  when: string;
  where: string;
  href: string;
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium">vs {opponent}</p>
      <p className="text-sm text-muted-foreground">
        {formatGameDateTime(when)}
      </p>
      <p className="text-sm">{where}</p>
      <Link className="text-sm text-primary hover:underline" href={href}>
        View game
      </Link>
    </div>
  );
}
