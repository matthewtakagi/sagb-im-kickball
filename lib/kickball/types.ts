export const POSITIONS = [
  "P",
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "LF",
  "LCF",
  "RCF",
  "RF",
] as const;

export type Position = (typeof POSITIONS)[number];
export type LineupPosition = Position | "EH" | "BENCH";

export type PitchType = "ball" | "strike" | "foul" | "in_play" | "hbp";

export type Pitch = {
  type: PitchType;
  count: string;
};

export type ContactType =
  | "grounder"
  | "hard_grounder"
  | "bunt"
  | "liner"
  | "fly"
  | "popup";

export type FieldLocation =
  | "p"
  | "c"
  | "1b"
  | "2b"
  | "3b"
  | "ss"
  | "lf"
  | "lcf"
  | "cf"
  | "rcf"
  | "rf"
  | "left_foul"
  | "right_foul";

export type PAResult =
  | "single"
  | "double"
  | "triple"
  | "home_run"
  | "walk"
  | "strikeout"
  | "hit_by_pitch"
  | "ground_out"
  | "fly_out"
  | "line_out"
  | "pop_out"
  | "fielder_choice"
  | "sacrifice_fly"
  | "sacrifice_bunt"
  | "double_play"
  | "triple_play"
  | "error"
  | "interference";

export type Occupant = {
  playerId: string;
  name: string;
};

export type Bases = {
  1: Occupant | null;
  2: Occupant | null;
  3: Occupant | null;
};

export type RunnerMove = {
  playerId: string;
  name: string;
  from: 0 | 1 | 2 | 3;
  to: 1 | 2 | 3 | 4;
  out: boolean;
  outType?: "force" | "tag" | "fly" | "thrown";
};

export type FieldingCredit = {
  playerId: string;
  putouts: number;
  assists: number;
  errors: number;
};

export type GameState = {
  inning: number;
  half: "top" | "bottom";
  outs: number;
  balls: number;
  strikes: number;
  ourScore: number;
  theirScore: number;
  bases: Bases;
  ourKickerIndex: number;
  theirKickerIndex: number;
  pitches: Pitch[];
};

export type LineupSlot = {
  playerId: string;
  order: number;
  position: LineupPosition;
};

export type OpponentBatter = {
  id: string;
  name: string;
  order: number;
};

export type GameStatus = "scheduled" | "live" | "final";

export type Player = {
  id: string;
  name: string;
  number: string;
  throws: "R" | "L";
  bats: "R" | "L";
  primaryPosition: LineupPosition;
  active: boolean;
  createdAt: string;
};

export type Play = {
  id: string;
  gameId: string;
  seq: number;
  inning: number;
  half: "top" | "bottom";
  offense: "us" | "them";
  kickerId: string;
  kickerName: string;
  pitcherId: string | null;
  pitches: Pitch[];
  contact?: ContactType;
  location?: FieldLocation;
  result: PAResult;
  description: string;
  notes?: string;
  rbi: number;
  runs: Occupant[];
  outsOnPlay: number;
  fielding: FieldingCredit[];
  runnerMoves: RunnerMove[];
  createdAt: string;
};

export type Game = {
  id: string;
  opponentName: string;
  startsAt: string;
  location: string;
  notes: string;
  isHome: boolean;
  inningsScheduled: number;
  status: GameStatus;
  ourLineup: LineupSlot[];
  theirLineup: OpponentBatter[];
  pitcherId: string | null;
  state: GameState;
  createdAt: string;
};

export type StoreData = {
  players: Player[];
  games: Game[];
  plays: Play[];
};

export type ScoreInput = {
  result: PAResult;
  contact?: ContactType;
  location?: FieldLocation;
  pitches?: Pitch[];
  rbi?: number;
  runnerMoves: RunnerMove[];
  fielding: FieldingCredit[];
  notes?: string;
};

export const EMPTY_BASES: Bases = { 1: null, 2: null, 3: null };

export function initialState(): GameState {
  return {
    inning: 1,
    half: "top",
    outs: 0,
    balls: 0,
    strikes: 0,
    ourScore: 0,
    theirScore: 0,
    bases: { ...EMPTY_BASES },
    ourKickerIndex: 0,
    theirKickerIndex: 0,
    pitches: [],
  };
}
