import { connection } from "next/server";
import seedData from "@/data/store.json";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { initialState, type Game, type Play, type Player, type StoreData } from "./kickball/types";

const empty: StoreData = { players: [], games: [], plays: [] };

let writeChain: Promise<unknown> = Promise.resolve();
let didSeed = false;

function normalizeStore(parsed: Partial<StoreData> | null | undefined): StoreData {
  return {
    players: parsed?.players ?? [],
    games: parsed?.games ?? [],
    plays: parsed?.plays ?? [],
  };
}

function bundledSeed(): StoreData {
  return normalizeStore(seedData as StoreData);
}

function isEmpty(store: StoreData) {
  return store.players.length === 0 && store.games.length === 0 && store.plays.length === 0;
}

async function readStore(): Promise<StoreData> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kickball_store")
    .select("data")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Supabase read failed (${error.message}). Run supabase/migrations/001_kickball_store.sql in the SQL editor, and set SUPABASE_SERVICE_ROLE_KEY for writes.`,
    );
  }

  const store = normalizeStore((data?.data as StoreData | undefined) ?? empty);

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
  number?: string;
  throws?: Player["throws"];
  bats?: Player["bats"];
  primaryPosition?: Player["primaryPosition"];
}): Player {
  return {
    id: crypto.randomUUID(),
    name: partial.name.trim(),
    number: partial.number?.trim() ?? "",
    throws: partial.throws ?? "R",
    bats: partial.bats ?? "R",
    primaryPosition: partial.primaryPosition ?? "EH",
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
