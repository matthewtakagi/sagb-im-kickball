import { promises as fs } from "fs";
import path from "path";
import { connection } from "next/server";
import { initialState, type Game, type Play, type Player, type StoreData } from "./kickball/types";

const FILE = path.join(process.cwd(), "data", "store.json");

const empty: StoreData = { players: [], games: [], plays: [] };

let writeChain: Promise<unknown> = Promise.resolve();

async function ensureFile() {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, JSON.stringify(empty, null, 2));
  }
}

async function readStore(): Promise<StoreData> {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as StoreData;
    return {
      players: parsed.players ?? [],
      games: parsed.games ?? [],
      plays: parsed.plays ?? [],
    };
  } catch {
    return { ...empty };
  }
}

async function writeStore(store: StoreData) {
  await ensureFile();
  await fs.writeFile(FILE, JSON.stringify(store, null, 2));
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
