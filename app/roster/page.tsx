import { formatPlayerPositions } from "@/lib/kickball/labels";
import { getStore } from "@/lib/store";

export default async function RosterPage() {
  const store = await getStore();
  const players = store.players.filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Roster</h1>
      {players.length === 0 ? (
        <p className="text-muted-foreground">No players yet. Admins can add the roster.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">B / T</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{formatPlayerPositions(p)}</td>
                  <td className="px-3 py-2">
                    {p.bats} / {p.throws}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
