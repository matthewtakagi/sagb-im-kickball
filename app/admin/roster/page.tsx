import { createPlayerAction, togglePlayerAction } from "@/app/actions/kickball";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { POSITION_LABELS } from "@/lib/kickball/labels";
import { POSITIONS, type LineupPosition } from "@/lib/kickball/types";
import { requireAdmin } from "@/lib/admin";
import { getStore } from "@/lib/store";

const POS: LineupPosition[] = [...POSITIONS, "EH"];

export default async function AdminRosterPage() {
  await requireAdmin();
  const store = await getStore();
  const players = [...store.players].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Roster</h1>
      <form action={createPlayerAction} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="number">#</Label>
          <Input id="number" name="number" />
        </div>
        <div>
          <Label htmlFor="primaryPosition">Pos</Label>
          <select
            id="primaryPosition"
            name="primaryPosition"
            className="mt-0 h-9 w-full rounded-md border bg-background px-2 text-sm"
            defaultValue="EH"
          >
            {POS.map((p) => (
              <option key={p} value={p}>
                {POSITION_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="bats">Bats</Label>
          <select id="bats" name="bats" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
            <option value="R">R</option>
            <option value="L">L</option>
          </select>
        </div>
        <div>
          <Label htmlFor="throws">Throws</Label>
          <select id="throws" name="throws" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
            <option value="R">R</option>
            <option value="L">L</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Add player
          </Button>
        </div>
      </form>

      <ul className="divide-y rounded-xl border">
        {players.map((player) => (
          <li key={player.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className={player.active ? "" : "text-muted-foreground line-through"}>
              {player.number ? `#${player.number} ` : ""}
              {player.name} · {player.primaryPosition}
            </span>
            <form action={togglePlayerAction}>
              <input type="hidden" name="id" value={player.id} />
              <Button type="submit" size="sm" variant="ghost">
                {player.active ? "Deactivate" : "Activate"}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
