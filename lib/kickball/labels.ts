import type {
  ContactType,
  FieldLocation,
  LineupPosition,
  PAResult,
  PitchType,
} from "./types";

export const RESULT_LABELS: Record<PAResult, string> = {
  single: "Single",
  double: "Double",
  triple: "Triple",
  home_run: "Home run",
  walk: "Walk",
  strikeout: "Strikeout",
  hit_by_pitch: "Hit by pitch",
  ground_out: "Ground out",
  fly_out: "Fly out",
  line_out: "Line out",
  pop_out: "Pop out",
  fielder_choice: "Fielder's choice",
  sacrifice_fly: "Sacrifice fly",
  sacrifice_bunt: "Sacrifice bunt",
  double_play: "Double play",
  triple_play: "Triple play",
  error: "Reached on error",
  interference: "Interference",
};

export const CONTACT_LABELS: Record<ContactType, string> = {
  grounder: "Grounder",
  hard_grounder: "Hard grounder",
  bunt: "Bunt / dribbler",
  liner: "Line drive",
  fly: "Fly ball",
  popup: "Popup",
};

export const LOCATION_LABELS: Record<FieldLocation, string> = {
  p: "Pitcher",
  c: "Catcher",
  "1b": "First",
  "2b": "Second",
  "3b": "Third",
  ss: "Shortstop",
  lf: "Left",
  lcf: "Left center",
  cf: "Center",
  rcf: "Right center",
  rf: "Right",
  left_foul: "Left foul",
  right_foul: "Right foul",
};

export const PITCH_LABELS: Record<PitchType, string> = {
  ball: "Ball",
  strike: "Strike",
  foul: "Foul",
  in_play: "In play",
  hbp: "HBP",
};

export const POSITION_LABELS: Record<LineupPosition, string> = {
  P: "Pitcher",
  C: "Catcher",
  "1B": "First base",
  "2B": "Second base",
  "3B": "Third base",
  SS: "Shortstop",
  LF: "Left field",
  LCF: "Left center",
  RCF: "Right center",
  RF: "Right field",
  EH: "Extra hitter",
  BENCH: "Bench",
};

export const TEAM_NAME = "SAGB";

export function formatPlayerPositions(player: {
  primaryPosition: LineupPosition;
  positions?: LineupPosition[];
}) {
  const positions = player.positions?.length ? player.positions : [player.primaryPosition];
  return positions.map((pos) => POSITION_LABELS[pos] ?? pos).join(" / ");
}
