import { notFound } from "next/navigation";
import { LineupForm } from "@/components/lineup-form";
import { requireAdmin } from "@/lib/admin";
import { getStore } from "@/lib/store";

export default async function LineupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const store = await getStore();
  const game = store.games.find((g) => g.id === id);
  if (!game) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lineup vs {game.opponentName}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(game.startsAt).toLocaleString()} · {game.location}
        </p>
      </div>
      <LineupForm game={game} players={store.players} />
    </div>
  );
}
