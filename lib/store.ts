import { connection } from "next/server";
import seedData from "@/data/store.json";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import {
  initialState,
  playerPositions,
  type Game,
  type Play,
  type Player,
  type StoreData,
} from "./kickball/types";

const empty: StoreData = { players: [], games: [], plays: [] };

let writeChain: Promise<unknown> = Promise.resolve();
let didSeed = false;

type RawPlayer = {
  id?: string;
  name?: string;
  number?: string;
  throws?: string;
  bats?: string;
  primaryPosition?: string;
  positions?: string[];
  active?: boolean;
  createdAt?: string;
};

function normalizePlayer(player: RawPlayer): Player {
  const positions = playerPositions({
    primaryPosition: (player.primaryPosition as Player["primaryPosition"]) || "EH",
    positions: (player.positions ?? []) as Player["positions"],
  });
  return {
    id: player.id ?? crypto.randomUUID(),
    name: player.name?.trim() ?? "",
    number: player.number ?? "",
    throws: player.throws === "L" ? "L" : "R",
    bats: player.bats === "L" ? "L" : "R",
    positions,
    primaryPosition: positions[0] ?? "EH",
    active: player.active ?? true,
    createdAt: player.createdAt ?? new Date().toISOString(),
  };
}

function normalizeStore(parsed: unknown): StoreData {
  const data = (parsed && typeof parsed === "object" ? parsed : {}) as {
    players?: RawPlayer[];
    games?: StoreData["games"];
    plays?: StoreData["plays"];
  };
  return {
    players: (data.players ?? []).map(normalizePlayer),
    games: data.games ?? [],
    plays: data.plays ?? [],
  };
}

function bundledSeed(): StoreData {
  return normalizeStore(seedData);
}

function isEmpty(store: StoreData) {
  return store.players.length === 0 && store.games.length === 0 && store.plays.length === 0;
}

async function readStore(): Promise<StoreData> {
  if (!hasSupabaseConfig()) {
    return bundledSeed();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kickball_store")
    .select("data")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error(`Supabase read failed (${error.message}).`);
    return bundledSeed();
  }

  const store = normalizeStore(data?.data ?? empty);

  if (!didSeed && isEmpty(store) && hasServiceRoleKey()) {
    const seed = bundledSeed();
    if (!isEmpty(seed)) {
      await writeStore(seed);
      didSeed = true;
      return seed;
    }
  }

  didSeed = true;
  return store;
}

async function writeStore(store: StoreData) {
  if (!hasServiceRoleKey()) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add the service role key from Supabase → Project Settings → API so scoring can persist on Vercel.",
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("kickball_store").upsert({
    id: 1,
    data: store,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Supabase write failed (${error.message}).`);
  }
}

export async function getStore(): Promise<StoreData> {
  await connection();
  return readStore();
}

export async function updateStore<T>(fn: (store: StoreData) => T | Promise<T>): Promise<T> {
  await connection();
  const run = writeChain.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function defaultOpponentLineup(gameId: string, count = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${gameId}-opp-${i + 1}`,
    name: `Opp ${i + 1}`,
    order: i + 1,
  }));
}

export function newGame(partial: {
  opponentName: string;
  startsAt: string;
  location: string;
  notes?: string;
  isHome: boolean;
  inningsScheduled?: number;
}): Game {
  const id = crypto.randomUUID();
  return {
    id,
    opponentName: partial.opponentName,
    startsAt: partial.startsAt,
    location: partial.location,
    notes: partial.notes ?? "",
    isHome: partial.isHome,
    inningsScheduled: partial.inningsScheduled ?? 7,
    status: "scheduled",
    ourLineup: [],
    theirLineup: defaultOpponentLineup(id),
    pitcherId: null,
    state: initialState(),
    createdAt: new Date().toISOString(),
  };
}

export function newPlayer(partial: {
  name: string;
  throws?: Player["throws"];
  bats?: Player["bats"];
  positions?: Player["positions"];
  primaryPosition?: Player["primaryPosition"];
}): Player {
  const positions = playerPositions({
    positions: partial.positions ?? [],
    primaryPosition: partial.primaryPosition ?? "EH",
  });
  return {
    id: crypto.randomUUID(),
    name: partial.name.trim(),
    number: "",
    throws: partial.throws ?? "R",
    bats: partial.bats ?? "R",
    positions,
    primaryPosition: positions[0] ?? "EH",
    active: true,
    createdAt: new Date().toISOString(),
  };
}

export function playsForGame(store: StoreData, gameId: string): Play[] {
  return store.plays.filter((p) => p.gameId === gameId).sort((a, b) => a.seq - b.seq);
}

export function teamRecord(games: Game[]) {
  let w = 0;
  let l = 0;
  let t = 0;
  for (const game of games) {
    if (game.status !== "final") continue;
    if (game.state.ourScore > game.state.theirScore) w += 1;
    else if (game.state.ourScore < game.state.theirScore) l += 1;
    else t += 1;
  }
  return { w, l, t };
}
