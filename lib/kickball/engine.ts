import { RESULT_LABELS, LOCATION_LABELS, TEAM_NAME } from "./labels";
import {
  EMPTY_BASES,
  initialState,
  type Bases,
  type Game,
  type GameState,
  type Occupant,
  type PAResult,
  type Pitch,
  type Play,
  type RunnerMove,
  type ScoreInput,
} from "./types";

export function offenseFor(game: Game, state: GameState): "us" | "them" {
  if (game.isHome) {
    return state.half === "bottom" ? "us" : "them";
  }
  return state.half === "top" ? "us" : "them";
}

export function currentKicker(
  game: Game,
  players: { id: string; name: string }[],
): Occupant | null {
  const offense = offenseFor(game, game.state);
  if (offense === "us") {
    const kicking = game.ourLineup
      .filter((s) => s.position !== "BENCH")
      .sort((a, b) => a.order - b.order);
    if (kicking.length === 0) return null;
    const slot = kicking[game.state.ourKickerIndex % kicking.length];
    const player = players.find((p) => p.id === slot.playerId);
    return player
      ? { playerId: player.id, name: player.name }
      : { playerId: slot.playerId, name: "Unknown" };
  }
  const kicking = [...game.theirLineup].sort((a, b) => a.order - b.order);
  if (kicking.length === 0) return null;
  const slot = kicking[game.state.theirKickerIndex % kicking.length];
  return { playerId: slot.id, name: slot.name };
}

export function currentPitcher(
  game: Game,
  players: { id: string; name: string }[],
): Occupant | null {
  if (offenseFor(game, game.state) === "us") return null;
  const id =
    game.pitcherId ??
    game.ourLineup.find((s) => s.position === "P")?.playerId ??
    null;
  if (!id) return null;
  const player = players.find((p) => p.id === id);
  return { playerId: id, name: player?.name ?? "Pitcher" };
}

export function countString(balls: number, strikes: number) {
  return `${balls}-${strikes}`;
}

export function applyPitch(state: GameState, type: Pitch["type"]): GameState {
  const pitches = [
    ...state.pitches,
    { type, count: countString(state.balls, state.strikes) },
  ];
  if (type === "ball") {
    return { ...state, balls: state.balls + 1, pitches };
  }
  if (type === "strike") {
    return { ...state, strikes: state.strikes + 1, pitches };
  }
  if (type === "foul") {
    return {
      ...state,
      strikes: Math.min(2, state.strikes + 1),
      pitches,
    };
  }
  return { ...state, pitches };
}

export function pitchSequenceForResult(
  result: PAResult,
  existing: Pitch[],
): Pitch[] {
  if (existing.length > 0) {
    return existing;
  }
  if (result === "walk") {
    return [
      { type: "ball", count: "0-0" },
      { type: "ball", count: "1-0" },
      { type: "ball", count: "2-0" },
      { type: "ball", count: "3-0" },
    ];
  }
  if (result === "strikeout") {
    return [
      { type: "strike", count: "0-0" },
      { type: "strike", count: "0-1" },
      { type: "strike", count: "0-2" },
    ];
  }
  if (result === "hit_by_pitch") {
    return [{ type: "hbp", count: "0-0" }];
  }
  return [{ type: "in_play", count: "0-0" }];
}

function kickerDestination(result: PAResult): 1 | 2 | 3 | 4 | null {
  switch (result) {
    case "single":
    case "walk":
    case "hit_by_pitch":
    case "error":
    case "fielder_choice":
    case "interference":
      return 1;
    case "double":
      return 2;
    case "triple":
      return 3;
    case "home_run":
      return 4;
    default:
      return null;
  }
}

function forceAdvance(
  bases: Bases,
  kicker: Occupant,
  extra: 1 | 2 | 3 | 4,
): RunnerMove[] {
  const moves: RunnerMove[] = [];
  const third = bases[3];
  const second = bases[2];
  const first = bases[1];
  if (extra === 4) {
    if (third) moves.push({ ...third, from: 3, to: 4, out: false });
    if (second) moves.push({ ...second, from: 2, to: 4, out: false });
    if (first) moves.push({ ...first, from: 1, to: 4, out: false });
    moves.push({ ...kicker, from: 0, to: 4, out: false });
    return moves;
  }
  if (third && extra >= 1) {
    const to = Math.min(4, 3 + extra) as 1 | 2 | 3 | 4;
    moves.push({ ...third, from: 3, to, out: false });
  }
  if (second && extra >= 1) {
    const to = Math.min(4, 2 + extra) as 1 | 2 | 3 | 4;
    moves.push({ ...second, from: 2, to, out: false });
  }
  if (first && extra >= 1) {
    const to = Math.min(4, 1 + extra) as 1 | 2 | 3 | 4;
    moves.push({ ...first, from: 1, to, out: false });
  }
  moves.push({ ...kicker, from: 0, to: extra, out: false });
  return moves;
}

export function suggestRunnerMoves(
  result: PAResult,
  bases: Bases,
  kicker: Occupant,
): RunnerMove[] {
  const dest = kickerDestination(result);
  if (dest) return forceAdvance(bases, kicker, dest);

  const holdRunners = (): RunnerMove[] => {
    const moves: RunnerMove[] = [];
    if (bases[3]) moves.push({ ...bases[3], from: 3, to: 3, out: false });
    if (bases[2]) moves.push({ ...bases[2], from: 2, to: 2, out: false });
    if (bases[1]) moves.push({ ...bases[1], from: 1, to: 1, out: false });
    return moves;
  };

  if (result === "strikeout" || result === "fly_out" || result === "line_out" || result === "pop_out") {
    return [{ ...kicker, from: 0, to: 1, out: true, outType: "fly" }, ...holdRunners()];
  }

  if (result === "sacrifice_fly") {
    const moves: RunnerMove[] = [
      { ...kicker, from: 0, to: 1, out: true, outType: "fly" },
    ];
    if (bases[3]) moves.push({ ...bases[3], from: 3, to: 4, out: false });
    if (bases[2]) moves.push({ ...bases[2], from: 2, to: 2, out: false });
    if (bases[1]) moves.push({ ...bases[1], from: 1, to: 1, out: false });
    return moves;
  }

  if (result === "sacrifice_bunt") {
    const moves: RunnerMove[] = [
      { ...kicker, from: 0, to: 1, out: true, outType: "force" },
    ];
    if (bases[3]) moves.push({ ...bases[3], from: 3, to: 3, out: false });
    if (bases[2]) moves.push({ ...bases[2], from: 2, to: 3, out: false });
    if (bases[1]) moves.push({ ...bases[1], from: 1, to: 2, out: false });
    return moves;
  }

  if (result === "ground_out") {
    const moves: RunnerMove[] = [
      { ...kicker, from: 0, to: 1, out: true, outType: "force" },
    ];
    if (bases[3]) moves.push({ ...bases[3], from: 3, to: 3, out: false });
    if (bases[2]) moves.push({ ...bases[2], from: 2, to: 2, out: false });
    if (bases[1]) moves.push({ ...bases[1], from: 1, to: 1, out: false });
    return moves;
  }

  if (result === "double_play") {
    const moves: RunnerMove[] = [
      { ...kicker, from: 0, to: 1, out: true, outType: "force" },
    ];
    if (bases[1]) {
      moves.push({ ...bases[1], from: 1, to: 2, out: true, outType: "force" });
    } else if (bases[2]) {
      moves.push({ ...bases[2], from: 2, to: 3, out: true, outType: "force" });
    }
    if (bases[3]) moves.push({ ...bases[3], from: 3, to: 3, out: false });
    if (bases[2] && bases[1]) moves.push({ ...bases[2], from: 2, to: 2, out: false });
    return moves;
  }

  if (result === "triple_play") {
    const moves: RunnerMove[] = [
      { ...kicker, from: 0, to: 1, out: true, outType: "force" },
    ];
    if (bases[1]) moves.push({ ...bases[1], from: 1, to: 2, out: true, outType: "force" });
    if (bases[2]) moves.push({ ...bases[2], from: 2, to: 3, out: true, outType: "force" });
    return moves;
  }

  return [{ ...kicker, from: 0, to: 1, out: true, outType: "force" }, ...holdRunners()];
}

export function defaultRbi(result: PAResult, runs: number) {
  if (
    result === "error" ||
    result === "strikeout" ||
    result === "double_play" ||
    result === "triple_play"
  ) {
    return 0;
  }
  return runs;
}

export function describePlay(input: {
  kickerName: string;
  result: PAResult;
  location?: ScoreInput["location"];
  runnerMoves: RunnerMove[];
  notes?: string;
}) {
  const loc = input.location ? ` to ${LOCATION_LABELS[input.location]}` : "";
  const scored = input.runnerMoves.filter((m) => !m.out && m.to === 4 && m.from !== 0);
  const kickerScored = input.runnerMoves.some((m) => m.playerId === input.runnerMoves.find((x) => x.from === 0)?.playerId && !m.out && m.to === 4);
  const parts = [`${input.kickerName} ${RESULT_LABELS[input.result].toLowerCase()}${loc}`];
  if (scored.length) {
    parts.push(`${scored.map((s) => s.name).join(", ")} scored`);
  }
  if (kickerScored && input.result === "home_run") {
    const ribbies = input.runnerMoves.filter((m) => !m.out && m.to === 4);
    if (ribbies.length > 1) parts.push(`${ribbies.length}-run shot`);
  }
  if (input.notes) parts.push(input.notes);
  return parts.join("; ") + ".";
}

function resetCount(state: GameState): GameState {
  return { ...state, balls: 0, strikes: 0, pitches: [] };
}

function endHalf(state: GameState): GameState {
  const nextHalf = state.half === "top" ? "bottom" : "top";
  const nextInning = state.half === "bottom" ? state.inning + 1 : state.inning;
  return resetCount({
    ...state,
    half: nextHalf,
    inning: nextInning,
    outs: 0,
    bases: { ...EMPTY_BASES },
  });
}

export function applyCompletedPa(
  game: Game,
  players: { id: string; name: string }[],
  input: ScoreInput,
  seq: number,
): { game: Game; play: Play } {
  const state = { ...game.state, bases: { ...game.state.bases } };
  const offense = offenseFor(game, state);
  const kicker = currentKicker(game, players);
  if (!kicker) {
    throw new Error("No kicker in the lineup for this plate appearance.");
  }
  const pitcher = currentPitcher(game, players);
  const pitches = pitchSequenceForResult(input.result, input.pitches ?? state.pitches);
  const moves =
    input.runnerMoves.length > 0
      ? input.runnerMoves
      : suggestRunnerMoves(input.result, state.bases, kicker);
  const runs = moves.filter((m) => !m.out && m.to === 4).map((m) => ({
    playerId: m.playerId,
    name: m.name,
  }));
  const outsOnPlay = moves.filter((m) => m.out).length;
  const rbi = input.rbi ?? defaultRbi(input.result, runs.length);

  let nextBases: Bases = { 1: null, 2: null, 3: null };
  for (const move of moves) {
    if (move.out || move.to === 4) continue;
    nextBases[move.to] = { playerId: move.playerId, name: move.name };
  }

  let next: GameState = resetCount({
    ...state,
    bases: nextBases,
    outs: state.outs + outsOnPlay,
    ourScore: offense === "us" ? state.ourScore + runs.length : state.ourScore,
    theirScore: offense === "them" ? state.theirScore + runs.length : state.theirScore,
  });

  if (offense === "us") {
    const kicking = game.ourLineup.filter((s) => s.position !== "BENCH");
    next.ourKickerIndex =
      kicking.length === 0 ? 0 : (state.ourKickerIndex + 1) % kicking.length;
  } else {
    const kicking = game.theirLineup;
    next.theirKickerIndex =
      kicking.length === 0 ? 0 : (state.theirKickerIndex + 1) % kicking.length;
  }

  const play: Play = {
    id: crypto.randomUUID(),
    gameId: game.id,
    seq,
    inning: state.inning,
    half: state.half,
    offense,
    kickerId: kicker.playerId,
    kickerName: kicker.name,
    pitcherId: pitcher?.playerId ?? null,
    pitches,
    contact: input.contact,
    location: input.location,
    result: input.result,
    description: describePlay({
      kickerName: kicker.name,
      result: input.result,
      location: input.location,
      runnerMoves: moves,
      notes: input.notes,
    }),
    notes: input.notes,
    rbi: offense === "us" ? rbi : 0,
    runs,
    outsOnPlay,
    fielding: offense === "them" ? input.fielding : [],
    runnerMoves: moves,
    createdAt: new Date().toISOString(),
  };

  const homeScore = game.isHome ? next.ourScore : next.theirScore;
  const awayScore = game.isHome ? next.theirScore : next.ourScore;
  const walkOff =
    next.inning >= game.inningsScheduled &&
    state.half === "bottom" &&
    homeScore > awayScore;

  if (next.outs >= 3 && !walkOff) {
    next = endHalf(next);
  }

  let status = game.status;
  if (walkOff) {
    status = "final";
    next = { ...next, outs: Math.min(next.outs, 3), bases: { ...EMPTY_BASES } };
  } else if (
    next.inning > game.inningsScheduled &&
    next.half === "top" &&
    next.ourScore !== next.theirScore &&
    state.half === "bottom"
  ) {
    status = "final";
  }

  return {
    game: {
      ...game,
      status,
      state: next,
    },
    play,
  };
}

export function replayGame(game: Game, plays: Play[], players: { id: string; name: string }[]): Game {
  const sorted = [...plays].sort((a, b) => a.seq - b.seq);
  let current: Game = {
    ...game,
    status: game.status === "scheduled" ? "scheduled" : "live",
    state: initialState(),
  };
  for (const play of sorted) {
    const input: ScoreInput = {
      result: play.result,
      contact: play.contact,
      location: play.location,
      pitches: play.pitches,
      rbi: play.rbi,
      runnerMoves: play.runnerMoves,
      fielding: play.fielding,
      notes: play.notes,
    };
    const applied = applyCompletedPa(current, players, input, play.seq);
    current = { ...applied.game, status: applied.game.status };
  }
  if (game.status === "final") {
    current = { ...current, status: "final" };
  }
  return current;
}

export function gameShouldBeFinal(game: Game) {
  const { state, inningsScheduled, isHome } = game;
  if (state.inning < inningsScheduled) return false;
  if (state.ourScore === state.theirScore) return false;
  const homeScore = isHome ? state.ourScore : state.theirScore;
  const awayScore = isHome ? state.theirScore : state.ourScore;
  if (state.inning === inningsScheduled && state.half === "top") return false;
  if (state.inning === inningsScheduled && state.half === "bottom" && homeScore > awayScore) {
    return true;
  }
  if (state.inning > inningsScheduled && state.half === "top" && homeScore !== awayScore) {
    return true;
  }
  return false;
}

export function inningCells(plays: Play[], innings: number, side: "us" | "them") {
  const cells: number[] = Array.from({ length: innings }, () => 0);
  for (const play of plays) {
    if (play.offense !== side) continue;
    const idx = play.inning - 1;
    if (idx >= 0 && idx < cells.length) {
      cells[idx] += play.runs.length;
    } else if (idx >= cells.length) {
      cells.push(play.runs.length);
    }
  }
  return cells;
}

export function boxHits(plays: Play[], side: "us" | "them") {
  return plays.filter(
    (p) =>
      p.offense === side &&
      ["single", "double", "triple", "home_run"].includes(p.result),
  ).length;
}

export function boxErrors(plays: Play[], fieldingSide: "us" | "them") {
  if (fieldingSide !== "us") return 0;
  return plays
    .filter((p) => p.offense === "them")
    .reduce((sum, p) => sum + p.fielding.reduce((s, f) => s + f.errors, 0), 0);
}

export function scoreLine(game: Game) {
  return `${TEAM_NAME} ${game.state.ourScore} — ${game.opponentName} ${game.state.theirScore}`;
}
