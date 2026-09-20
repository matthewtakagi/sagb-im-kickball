import { createPlayerAction, togglePlayerAction, updatePlayerAction } from "@/app/actions/kickball";
import { PositionCheckboxes } from "@/components/position-checkboxes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPlayerPositions } from "@/lib/kickball/labels";
import { playerPositions } from "@/lib/kickball/types";
import { requireAdmin } from "@/lib/admin";
import { getStore } from "@/lib/store";

export default async function AdminRosterPage() {
  await requireAdmin();
  const store = await getStore();
  const players = [...store.players].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Roster</h1>
      <form action={createPlayerAction} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
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
        <div className="sm:col-span-2 lg:col-span-6">
          <Label>Positions</Label>
          <div className="mt-2">
            <PositionCheckboxes selected={["EH"]} />
          </div>
        </div>
        <div className="flex items-end">
          <Button type="submit">Add player</Button>
        </div>
      </form>

      <ul className="space-y-3">
        {players.map((player) => (
          <li key={player.id} className="rounded-xl border p-4">
            <form action={updatePlayerAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <input type="hidden" name="id" value={player.id} />
              <div className="lg:col-span-2">
                <Label htmlFor={`name-${player.id}`}>Name</Label>
                <Input id={`name-${player.id}`} name="name" defaultValue={player.name} required />
              </div>
              <div>
                <Label htmlFor={`bats-${player.id}`}>Bats</Label>
                <select
                  id={`bats-${player.id}`}
                  name="bats"
                  defaultValue={player.bats}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="R">R</option>
                  <option value="L">L</option>
                </select>
              </div>
              <div>
                <Label htmlFor={`throws-${player.id}`}>Throws</Label>
                <select
                  id={`throws-${player.id}`}
                  name="throws"
                  defaultValue={player.throws}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="R">R</option>
                  <option value="L">L</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Label>Positions</Label>
                <p className={`mt-1 text-xs ${player.active ? "text-muted-foreground" : "text-muted-foreground line-through"}`}>
                  {formatPlayerPositions(player)}
                </p>
                <div className="mt-2">
                  <PositionCheckboxes selected={playerPositions(player)} />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Button type="submit" size="sm">
                  Save
                </Button>
              </div>
            </form>
            <form action={togglePlayerAction} className="mt-2">
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
