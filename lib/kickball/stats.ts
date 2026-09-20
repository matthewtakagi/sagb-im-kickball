import type { Game, PAResult, Play, Player } from "./types";

const HITS: PAResult[] = ["single", "double", "triple", "home_run"];
const AT_BAT_EXCLUDES: PAResult[] = [
  "walk",
  "hit_by_pitch",
  "sacrifice_fly",
  "sacrifice_bunt",
  "interference",
];

function isAtBat(result: PAResult) {
  return !AT_BAT_EXCLUDES.includes(result);
}

function isHit(result: PAResult) {
  return HITS.includes(result);
}

const INFINITE_RATE = 99.99;

function avg(n: number, d: number) {
  if (!d) return 0;
  return n / d;
}

/** 99.99 only when a nonzero total is divided by zero (ERA, WHIP). */
function infiniteIfNoDenom(numerator: number, denominator: number) {
  if (!denominator) return numerator ? INFINITE_RATE : 0;
  return numerator / denominator;
}

function fmtAvg(n: number) {
  if (!Number.isFinite(n)) return ".000";
  return n.toFixed(3).replace(/^0/, "") || ".000";
}

export type KickingRow = {
  playerId: string;
  name: string;
  number: string;
  g: number;
  pa: number;
  ab: number;
  r: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  bb: number;
  k: number;
  sf: number;
  tb: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  iso: number;
  babip: number;
  gb: number;
  fb: number;
  ld: number;
};

export type PitchingRow = {
  playerId: string;
  name: string;
  number: string;
  g: number;
  ipOuts: number;
  tbf: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  k: number;
  hr: number;
  pitches: number;
  era: number;
  whip: number;
  k9: number;
  bb9: number;
  avgAgainst: number;
};

export type FieldingRow = {
  playerId: string;
  name: string;
  number: string;
  po: number;
  a: number;
  e: number;
  dp: number;
  fpct: number;
};

function playerMap(players: Player[]) {
  return new Map(players.map((p) => [p.id, p]));
}

export function kickingStats(players: Player[], _games: Game[], plays: Play[]): KickingRow[] {
  const byId = new Map<string, KickingRow>();
  const ensure = (id: string, name: string) => {
    const player = players.find((p) => p.id === id);
    if (!byId.has(id)) {
      byId.set(id, {
        playerId: id,
        name: player?.name ?? name,
        number: player?.number ?? "",
        g: 0,
        pa: 0,
        ab: 0,
        r: 0,
        h: 0,
        doubles: 0,
        triples: 0,
        hr: 0,
        rbi: 0,
        bb: 0,
        k: 0,
        sf: 0,
        tb: 0,
        avg: 0,
        obp: 0,
        slg: 0,
        ops: 0,
        iso: 0,
        babip: 0,
        gb: 0,
        fb: 0,
        ld: 0,
      });
    }
    return byId.get(id)!;
  };

  const gamesPlayed = new Map<string, Set<string>>();

  for (const play of plays) {
    if (play.offense !== "us") {
      for (const run of play.runs) {
        // opponent runs — ignore
      }
      continue;
    }
    const row = ensure(play.kickerId, play.kickerName);
    row.pa += 1;
    if (isAtBat(play.result)) row.ab += 1;
    if (isHit(play.result)) row.h += 1;
    if (play.result === "double") row.doubles += 1;
    if (play.result === "triple") row.triples += 1;
    if (play.result === "home_run") row.hr += 1;
    if (play.result === "walk") row.bb += 1;
    if (play.result === "strikeout") row.k += 1;
    if (play.result === "sacrifice_fly") row.sf += 1;
    row.rbi += play.rbi;
    if (play.result === "single") row.tb += 1;
    if (play.result === "double") row.tb += 2;
    if (play.result === "triple") row.tb += 3;
    if (play.result === "home_run") row.tb += 4;
    if (play.contact === "grounder" || play.contact === "hard_grounder" || play.contact === "bunt") {
      row.gb += 1;
    }
    if (play.contact === "fly" || play.contact === "popup") row.fb += 1;
    if (play.contact === "liner") row.ld += 1;

    const set = gamesPlayed.get(play.kickerId) ?? new Set();
    set.add(play.gameId);
    gamesPlayed.set(play.kickerId, set);

    for (const run of play.runs) {
      const runner = ensure(run.playerId, run.name);
      runner.r += 1;
    }
  }

  for (const row of byId.values()) {
    row.g = gamesPlayed.get(row.playerId)?.size ?? 0;
    row.avg = avg(row.h, row.ab);
    row.obp = avg(row.h + row.bb, row.pa);
    row.slg = avg(row.tb, row.ab);
    row.ops = row.obp + row.slg;
    row.iso = row.slg - row.avg;
    const babipDenom = row.ab - row.k + row.sf;
    row.babip = avg(row.h, babipDenom);
  }

  return [...byId.values()]
    .filter((r) => r.pa > 0 || r.r > 0)
    .sort((a, b) => b.ops - a.ops || b.pa - a.pa);
}

export function pitchingStats(players: Player[], plays: Play[]): PitchingRow[] {
  const byId = new Map<string, PitchingRow>();
  const gamesPlayed = new Map<string, Set<string>>();
  const map = playerMap(players);

  const ensure = (id: string) => {
    const player = map.get(id);
    if (!byId.has(id)) {
      byId.set(id, {
        playerId: id,
        name: player?.name ?? "Pitcher",
        number: player?.number ?? "",
        g: 0,
        ipOuts: 0,
        tbf: 0,
        h: 0,
        r: 0,
        er: 0,
        bb: 0,
        k: 0,
        hr: 0,
        pitches: 0,
        era: 0,
        whip: 0,
        k9: 0,
        bb9: 0,
        avgAgainst: 0,
      });
    }
    return byId.get(id)!;
  };

  for (const play of plays) {
    if (play.offense !== "them" || !play.pitcherId) continue;
    const row = ensure(play.pitcherId);
    row.tbf += 1;
    row.ipOuts += play.outsOnPlay;
    row.r += play.runs.length;
    row.er += play.result === "error" ? 0 : play.runs.length;
    row.pitches += play.pitches.length;
    if (isHit(play.result)) row.h += 1;
    if (play.result === "walk") row.bb += 1;
    if (play.result === "strikeout") row.k += 1;
    if (play.result === "home_run") row.hr += 1;
    const set = gamesPlayed.get(play.pitcherId) ?? new Set();
    set.add(play.gameId);
    gamesPlayed.set(play.pitcherId, set);
  }

  for (const row of byId.values()) {
    row.g = gamesPlayed.get(row.playerId)?.size ?? 0;
    const ip = row.ipOuts / 3;
    row.era = infiniteIfNoDenom(row.er * 7, ip);
    row.whip = infiniteIfNoDenom(row.h + row.bb, ip);
    row.k9 = ip ? (row.k * 7) / ip : 0;
    row.bb9 = ip ? (row.bb * 7) / ip : 0;
    const ab = row.tbf - row.bb;
    row.avgAgainst = avg(row.h, Math.max(ab, 0));
  }

  return [...byId.values()].sort((a, b) => a.era - b.era || b.ipOuts - a.ipOuts);
}

export function fieldingStats(players: Player[], plays: Play[]): FieldingRow[] {
  const byId = new Map<string, FieldingRow>();
  const map = playerMap(players);
  const dps = new Map<string, number>();

  const ensure = (id: string) => {
    const player = map.get(id);
    if (!byId.has(id)) {
      byId.set(id, {
        playerId: id,
        name: player?.name ?? "Unknown",
        number: player?.number ?? "",
        po: 0,
        a: 0,
        e: 0,
        dp: 0,
        fpct: 0,
      });
    }
    return byId.get(id)!;
  };

  for (const play of plays) {
    if (play.offense !== "them") continue;
    for (const credit of play.fielding) {
      const row = ensure(credit.playerId);
      row.po += credit.putouts;
      row.a += credit.assists;
      row.e += credit.errors;
      if (play.result === "double_play" || play.result === "triple_play") {
        dps.set(credit.playerId, (dps.get(credit.playerId) ?? 0) + 1);
      }
    }
  }

  for (const row of byId.values()) {
    row.dp = dps.get(row.playerId) ?? 0;
    const chances = row.po + row.a + row.e;
    row.fpct = chances ? (row.po + row.a) / chances : 0;
  }

  return [...byId.values()].sort((a, b) => b.po + b.a - (a.po + a.a));
}

export function formatAvg(n: number) {
  return fmtAvg(n);
}

export function formatIp(outs: number) {
  const innings = Math.floor(outs / 3);
  const rem = outs % 3;
  return `${innings}.${rem}`;
}

export function formatEra(n: number) {
  return formatRate(n, 2);
}

export function formatRate(n: number, digits: number) {
  if (!Number.isFinite(n) || n >= INFINITE_RATE) return "99.99";
  return n.toFixed(digits);
}
