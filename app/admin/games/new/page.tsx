import { createGameAction } from "@/app/actions/kickball";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/admin";

export default async function NewGamePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Schedule a game</h1>
      <form action={createGameAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="opponentName">Opponent</Label>
          <Input id="opponentName" name="opponentName" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input id="time" name="time" type="time" defaultValue="18:00" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Field</Label>
          <Input id="location" name="location" placeholder="IM field 2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="isHome">Home / away</Label>
            <select id="isHome" name="isHome" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="innings">Innings</Label>
            <Input id="innings" name="innings" type="number" defaultValue={7} min={3} max={12} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Weather, refs, etc." />
        </div>
        <Button type="submit">Create game</Button>
      </form>
    </div>
  );
}
