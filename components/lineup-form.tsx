import { saveLineupAction } from "@/app/actions/kickball";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POSITION_LABELS } from "@/lib/kickball/labels";
import { POSITIONS, type Game, type LineupPosition, type Player } from "@/lib/kickball/types";

const POS: LineupPosition[] = [...POSITIONS, "EH", "BENCH"];

export function LineupForm({ game, players }: { game: Game; players: Player[] }) {
  const active = players.filter((p) => p.active);
  const their = game.theirLineup.length ? game.theirLineup : [];

  return (
    <form action={saveLineupAction.bind(null, game.id)} className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">SAGB batting order</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Give each player a kicking slot (1, 2, 3…) and a defensive position. Leave order blank to keep them out of this game.
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Position</th>
              </tr>
            </thead>
            <tbody>
              {active.map((player) => {
                const slot = game.ourLineup.find((s) => s.playerId === player.id);
                return (
                  <tr key={player.id} className="border-t">
                    <td className="px-3 py-2">
                      {player.number ? `#${player.number} ` : ""}
                      {player.name}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        name={`order-${player.id}`}
                        type="number"
                        min={1}
                        max={20}
                        defaultValue={slot?.order || ""}
                        className="w-20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        name={`pos-${player.id}`}
                        defaultValue={slot?.position ?? player.primaryPosition}
                        className="h-9 rounded-md border bg-background px-2"
                      >
                        {POS.map((pos) => (
                          <option key={pos} value={pos}>
                            {POSITION_LABELS[pos]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <label className="mt-4 block text-sm">
          Starting pitcher
          <select
            name="pitcherId"
            defaultValue={game.pitcherId ?? ""}
            className="mt-1 h-9 w-full max-w-sm rounded-md border bg-background px-2"
          >
            <option value="">Use player marked Pitcher</option>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{game.opponentName} order</h2>
        <input type="hidden" name="theirCount" value={Math.max(their.length, 10)} />
        <div className="grid gap-2">
          {Array.from({ length: Math.max(their.length, 10) }, (_, i) => {
            const batter = their[i];
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
                <input type="hidden" name={`them-id-${i + 1}`} value={batter?.id ?? `${game.id}-opp-${i + 1}`} />
                <Input name={`them-name-${i + 1}`} defaultValue={batter?.name ?? `Opp ${i + 1}`} />
              </div>
            );
          })}
        </div>
      </section>

      <Button type="submit">Save lineup</Button>
    </form>
  );
}
