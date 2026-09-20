import { Badge } from "@/components/ui/badge";
import { TEAM_NAME } from "@/lib/kickball/labels";
import type { Game, Play } from "@/lib/kickball/types";
import { boxErrors, boxHits, inningCells } from "@/lib/kickball/engine";
import { cn } from "@/lib/utils";

export function Scoreboard({
  game,
  plays,
  compact = false,
}: {
  game: Game;
  plays: Play[];
  compact?: boolean;
}) {
  const innings = Math.max(
    game.inningsScheduled,
    game.state.inning,
    ...plays.map((p) => p.inning),
    1,
  );
  const us = inningCells(plays, innings, "us");
  const them = inningCells(plays, innings, "them");
  const headers = Array.from({ length: innings }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {game.isHome ? "Home" : "Away"} · {game.location}
          </p>
          <h2 className="text-lg font-semibold">
            {TEAM_NAME} vs {game.opponentName}
          </h2>
        </div>
        <Badge variant={game.status === "live" ? "default" : "secondary"}>
          {game.status === "live"
            ? `${game.state.half === "top" ? "Top" : "Bot"} ${game.state.inning}`
            : game.status}
        </Badge>
      </div>
      <table className="w-full min-w-[520px] text-center text-sm">
        <thead>
          <tr className="text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium"> </th>
            {headers.map((n) => (
              <th
                key={n}
                className={cn(
                  "px-1 py-2 font-medium",
                  n === game.state.inning && game.status === "live" && "text-primary",
                )}
              >
                {n}
              </th>
            ))}
            <th className="px-2 py-2 font-semibold">R</th>
            {!compact && <th className="px-2 py-2 font-semibold">H</th>}
            {!compact && <th className="px-2 py-2 font-semibold">E</th>}
          </tr>
        </thead>
        <tbody>
          {(game.isHome
            ? [
                {
                  name: game.opponentName,
                  cells: them,
                  runs: game.state.theirScore,
                  hits: boxHits(plays, "them"),
                  errors: boxErrors(plays, "us"),
                  active: game.status === "live" && game.state.half === "top",
                },
                {
                  name: TEAM_NAME,
                  cells: us,
                  runs: game.state.ourScore,
                  hits: boxHits(plays, "us"),
                  errors: boxErrors(plays, "them"),
                  active: game.status === "live" && game.state.half === "bottom",
                },
              ]
            : [
                {
                  name: TEAM_NAME,
                  cells: us,
                  runs: game.state.ourScore,
                  hits: boxHits(plays, "us"),
                  errors: boxErrors(plays, "them"),
                  active: game.status === "live" && game.state.half === "top",
                },
                {
                  name: game.opponentName,
                  cells: them,
                  runs: game.state.theirScore,
                  hits: boxHits(plays, "them"),
                  errors: boxErrors(plays, "us"),
                  active: game.status === "live" && game.state.half === "bottom",
                },
              ]
          ).map((row) => (
            <Line key={row.name} compact={compact} {...row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Line({
  name,
  cells,
  runs,
  hits,
  errors,
  compact,
  active,
}: {
  name: string;
  cells: number[];
  runs: number;
  hits: number;
  errors: number;
  compact: boolean;
  active: boolean;
}) {
  return (
    <tr className={cn(active && "bg-primary/5")}>
      <td className="truncate px-3 py-2 text-left font-medium">{name}</td>
      {cells.map((n, i) => (
        <td key={i} className="px-1 py-2 tabular-nums">
          {n}
        </td>
      ))}
      <td className="px-2 py-2 font-semibold tabular-nums">{runs}</td>
      {!compact && <td className="px-2 py-2 tabular-nums">{hits}</td>}
      {!compact && <td className="px-2 py-2 tabular-nums">{errors}</td>}
    </tr>
  );
}
