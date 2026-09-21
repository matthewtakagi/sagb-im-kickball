"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, loginAdmin, logoutAdmin } from "@/lib/admin";
import {
  applyCompletedPa,
  applyPitch,
  replayGame,
} from "@/lib/kickball/engine";
import { pacificWallClockToIso } from "@/lib/kickball/datetime";
import {
  canonicalizePosition,
  initialState,
  POSITIONS,
  type LineupPosition,
  type LineupSlot,
  type OpponentBatter,
  type PAResult,
  type Pitch,
  type ScoreInput,
} from "@/lib/kickball/types";
import {
  defaultOpponentLineup,
  getStore,
  newGame,
  newPlayer,
  playsForGame,
  updateStore,
} from "@/lib/store";

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Admin only.");
  }
}

function refreshAll(gameId?: string) {
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/roster");
  revalidatePath("/stats");
  revalidatePath("/admin");
  revalidatePath("/admin/roster");
  if (gameId) {
    revalidatePath(`/games/${gameId}`);
    revalidatePath(`/admin/games/${gameId}`);
    revalidatePath(`/admin/games/${gameId}/lineup`);
    revalidatePath(`/admin/games/${gameId}/score`);
  }
}

export async function adminLoginAction(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  const result = await loginAdmin(pin);
  if (!result.ok) {
    redirect(`/admin/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/admin");
}

export async function adminLogoutAction() {
  await logoutAdmin();
  redirect("/");
}

function parsePositions(formData: FormData): LineupPosition[] {
  const allowed = new Set<string>([...POSITIONS, "DH", "EH"]);
  const positions = formData
    .getAll("positions")
    .map(String)
    .filter((pos) => allowed.has(pos))
    .map((pos) => canonicalizePosition(pos));
  return positions.length ? positions : ["DH"];
}

export async function createPlayerAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  await updateStore((store) => {
    store.players.push(
      newPlayer({
        name,
        throws: formData.get("throws") === "L" ? "L" : "R",
        bats: formData.get("bats") === "L" ? "L" : "R",
        positions: parsePositions(formData),
      }),
    );
  });
  refreshAll();
}

export async function updatePlayerAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const positions = parsePositions(formData);
  await updateStore((store) => {
    const player = store.players.find((p) => p.id === id);
    if (!player) throw new Error("Player not found.");
    player.name = name;
    player.throws = formData.get("throws") === "L" ? "L" : "R";
    player.bats = formData.get("bats") === "L" ? "L" : "R";
    player.positions = positions;
    player.primaryPosition = positions[0] ?? "DH";
    player.number = "";
  });
  refreshAll();
}

export async function togglePlayerAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await updateStore((store) => {
    const player = store.players.find((p) => p.id === id);
    if (player) player.active = !player.active;
  });
  refreshAll();
}

export async function createGameAction(formData: FormData) {
  await requireAdmin();
  const opponentName = String(formData.get("opponentName") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "18:00");
  const location = String(formData.get("location") ?? "").trim();
  if (!opponentName || !date) throw new Error("Opponent and date are required.");
  const game = newGame({
    opponentName,
    startsAt: pacificWallClockToIso(date, time),
    location: location || "TBD",
    notes: String(formData.get("notes") ?? ""),
    isHome: formData.get("isHome") !== "away",
    inningsScheduled: Number(formData.get("innings") ?? 7) || 7,
  });
  await updateStore((store) => {
    store.games.push(game);
  });
  refreshAll(game.id);
  redirect(`/admin/games/${game.id}/lineup`);
}

export async function saveLineupAction(gameId: string, formData: FormData) {
  await requireAdmin();
  const store = await getStore();
  const playerIds = store.players.filter((p) => p.active).map((p) => p.id);
  const ourLineup: LineupSlot[] = [];
  for (const id of playerIds) {
    const order = Number(formData.get(`order-${id}`) ?? 0);
    const position = String(formData.get(`pos-${id}`) ?? "BENCH") as LineupSlot["position"];
    if (!order && position === "BENCH") continue;
    if (order > 0) {
      ourLineup.push({ playerId: id, order, position: canonicalizePosition(position || "DH") });
    }
  }
  ourLineup.sort((a, b) => a.order - b.order);

  const theirCount = Number(formData.get("theirCount") ?? 10) || 10;
  const theirLineup: OpponentBatter[] = [];
  for (let i = 1; i <= theirCount; i += 1) {
    const name = String(formData.get(`them-name-${i}`) ?? `Opp ${i}`).trim() || `Opp ${i}`;
    theirLineup.push({
      id: String(formData.get(`them-id-${i}`) ?? `${gameId}-opp-${i}`),
      name,
      order: i,
    });
  }

  const pitcherId = String(formData.get("pitcherId") ?? "") || null;

  await updateStore((s) => {
    const game = s.games.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found.");
    game.ourLineup = ourLineup;
    game.theirLineup = theirLineup.length ? theirLineup : defaultOpponentLineup(gameId);
    game.pitcherId =
      pitcherId || ourLineup.find((slot) => slot.position === "P")?.playerId || null;
  });
  refreshAll(gameId);
}

export async function startGameAction(gameId: string) {
  await requireAdmin();
  await updateStore((store) => {
    const game = store.games.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found.");
    if (game.forfeitBy === "them") throw new Error("This game was forfeited.");
    if (game.ourLineup.filter((s) => s.position !== "BENCH").length < 1) {
      throw new Error("Set a kicking lineup before starting.");
    }
    if (game.status === "scheduled") {
      game.status = "live";
      game.state = initialState();
    }
  });
  refreshAll(gameId);
  redirect(`/admin/games/${gameId}/score`);
}

export async function finalizeGameAction(gameId: string) {
  await requireAdmin();
  await updateStore((store) => {
    const game = store.games.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found.");
    if (game.status === "final") return;
    game.status = "final";
  });
  refreshAll(gameId);
}

export async function forfeitGameAction(gameId: string) {
  await requireAdmin();
  await updateStore((store) => {
    const game = store.games.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found.");
    const runs = game.inningsScheduled || 7;
    game.status = "final";
    game.forfeitBy = "them";
    game.state = { ...initialState(), ourScore: runs, theirScore: 0 };
    store.plays = store.plays.filter((play) => play.gameId !== gameId);
  });
  refreshAll(gameId);
}

export async function recordPitchAction(gameId: string, type: Pitch["type"]) {
  await requireAdmin();
  let auto: PAResult | null = null;
  await updateStore((store) => {
    const game = store.games.find((g) => g.id === gameId);
    if (!game || game.status !== "live") throw new Error("Game is not live.");
    game.state = applyPitch(game.state, type);
    if (game.state.balls >= 4) auto = "walk";
    else if (game.state.strikes >= 3) auto = "strikeout";
  });
  if (auto) {
    await recordPlayAction(gameId, { result: auto, runnerMoves: [], fielding: [] });
    return;
  }
  refreshAll(gameId);
}

export async function recordPlayAction(gameId: string, input: ScoreInput) {
  await requireAdmin();
  await updateStore((store) => {
    const game = store.games.find((g) => g.id === gameId);
    if (!game || game.status !== "live") throw new Error("Game is not live.");
    const seq = playsForGame(store, gameId).length + 1;
    const { game: next, play } = applyCompletedPa(game, store.players, input, seq);
    Object.assign(game, next);
    store.plays.push(play);
  });
  refreshAll(gameId);
}

export async function undoPlayAction(gameId: string) {
  await requireAdmin();
  await updateStore((store) => {
    const game = store.games.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found.");
    const plays = playsForGame(store, gameId);
    const last = plays.at(-1);
    if (!last) return;
    store.plays = store.plays.filter((p) => p.id !== last.id);
    const remaining = playsForGame(store, gameId);
    const rebuilt = replayGame(
      { ...game, status: remaining.length ? "live" : "live", state: initialState() },
      remaining,
      store.players,
    );
    game.state = rebuilt.state;
    game.status = remaining.length ? rebuilt.status : "live";
    if (game.status === "final" && remaining.length) {
      game.status = "live";
    }
  });
  refreshAll(gameId);
}

export async function setPitcherAction(gameId: string, pitcherId: string) {
  await requireAdmin();
  await updateStore((store) => {
    const game = store.games.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found.");
    game.pitcherId = pitcherId;
  });
  refreshAll(gameId);
}
