"use client";

import { useMemo, useState, useTransition } from "react";
import {
  recordPitchAction,
  recordPlayAction,
  setPitcherAction,
  undoPlayAction,
} from "@/app/actions/kickball";
import { Diamond } from "@/components/diamond";
import { EndGameButton } from "@/components/end-game-button";
import { Button } from "@/components/ui/button";
import { currentKicker, currentPitcher, offenseFor, suggestRunnerMoves } from "@/lib/kickball/engine";
import {
  CONTACT_LABELS,
  LOCATION_LABELS,
  RESULT_LABELS,
} from "@/lib/kickball/labels";
import type {
  ContactType,
  FieldLocation,
  FieldingCredit,
  Game,
  PAResult,
  Play,
  Player,
  RunnerMove,
} from "@/lib/kickball/types";
import { cn } from "@/lib/utils";

const QUICK: PAResult[] = [
  "single",
  "double",
  "triple",
  "home_run",
  "walk",
  "strikeout",
  "ground_out",
  "fly_out",
  "line_out",
  "pop_out",
  "fielder_choice",
  "error",
  "sacrifice_fly",
  "double_play",
];

const CONTACTS = Object.keys(CONTACT_LABELS) as ContactType[];
const LOCS = Object.keys(LOCATION_LABELS) as FieldLocation[];

export function ScoringConsole({
  game,
  players,
  plays,
}: {
  game: Game;
  players: Player[];
  plays: Play[];
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PAResult>("single");
  const [contact, setContact] = useState<ContactType | "">("");
  const [location, setLocation] = useState<FieldLocation | "">("");
  const [notes, setNotes] = useState("");
  const [rbi, setRbi] = useState<number | "">("");
  const kicker = currentKicker(game, players);
  const pitcher = currentPitcher(game, players);
  const offense = offenseFor(game, game.state);

  const suggested = useMemo(
    () => (kicker ? suggestRunnerMoves(result, game.state.bases, kicker) : []),
    [result, game.state.bases, kicker],
  );
  const [moves, setMoves] = useState<RunnerMove[] | null>(null);
  const runnerMoves = moves ?? suggested;

  const fielders = game.ourLineup
    .filter((s) => s.position !== "BENCH" && s.position !== "DH" && s.position !== "EH")
    .map((s) => {
      const player = players.find((p) => p.id === s.playerId);
      return { id: s.playerId, name: player?.name ?? "Unknown", position: s.position };
    });

  const [credits, setCredits] = useState<Record<string, FieldingCredit>>({});

  function resetDraft() {
    setMoves(null);
    setContact("");
    setLocation("");
    setNotes("");
    setRbi("");
    setCredits({});
  }

  function submitPlay(nextResult = result) {
    startTransition(async () => {
      await recordPlayAction(game.id, {
        result: nextResult,
        contact: contact || undefined,
        location: location || undefined,
        notes: notes || undefined,
        rbi: rbi === "" ? undefined : Number(rbi),
        runnerMoves: nextResult === result ? runnerMoves : [],
        fielding: Object.values(credits).filter(
          (c) => c.putouts || c.assists || c.errors,
        ),
      });
      resetDraft();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Diamond
          bases={game.state.bases}
          outs={game.state.outs}
          balls={game.state.balls}
          strikes={game.state.strikes}
          kicker={kicker?.name}
        />

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p>
              {offense === "us" ? "SAGB kicking" : `${game.opponentName} kicking`}
              {pitcher ? ` · P: ${pitcher.name}` : ""}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending || plays.length === 0}
                onClick={() => startTransition(() => undoPlayAction(game.id))}
              >
                Undo last
              </Button>
              <EndGameButton gameId={game.id} />
            </div>
          </div>

          {offense === "them" ? (
            <div className="mb-3">
              <label className="text-xs text-muted-foreground">Pitcher</label>
              <select
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={game.pitcherId ?? ""}
                onChange={(e) =>
                  startTransition(() => setPitcherAction(game.id, e.target.value))
                }
              >
                {players
                  .filter((p) => p.active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : null}

          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pitch
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["ball", "Ball"],
                ["strike", "Strike"],
                ["foul", "Foul"],
              ] as const
            ).map(([type, label]) => (
              <Button
                key={type}
                type="button"
                variant={type === "ball" ? "outline" : "secondary"}
                disabled={pending || game.status !== "live"}
                onClick={() => startTransition(() => recordPitchAction(game.id, type))}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Result
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((item) => (
              <button
                key={item}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  result === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
                onClick={() => {
                  setResult(item);
                  setMoves(null);
                }}
              >
                {RESULT_LABELS[item]}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Contact
              <select
                className="mt-1 h-9 w-full rounded-md border bg-background px-2"
                value={contact}
                onChange={(e) => setContact(e.target.value as ContactType | "")}
              >
                <option value="">Unknown</option>
                {CONTACTS.map((c) => (
                  <option key={c} value={c}>
                    {CONTACT_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              RBI
              <input
                className="mt-1 h-9 w-full rounded-md border bg-background px-2"
                type="number"
                min={0}
                max={4}
                placeholder="auto"
                value={rbi}
                onChange={(e) =>
                  setRbi(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </label>
          </div>

          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Spray
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LOCS.map((loc) => (
              <button
                key={loc}
                type="button"
                className={cn(
                  "rounded-md border px-2 py-1 text-xs",
                  location === loc ? "border-primary bg-primary/10" : "hover:bg-accent",
                )}
                onClick={() => setLocation(location === loc ? "" : loc)}
              >
                {LOCATION_LABELS[loc]}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Baserunners
            </p>
            <div className="space-y-2">
              {runnerMoves.map((move, idx) => (
                <div key={`${move.playerId}-${move.from}`} className="grid grid-cols-[1fr_90px_90px] gap-2 text-sm">
                  <span className="truncate self-center">
                    {move.from === 0 ? "Kicker" : `${move.from}B`}: {move.name}
                  </span>
                  <select
                    className="h-8 rounded-md border bg-background px-1"
                    value={move.out ? "out" : String(move.to)}
                    onChange={(e) => {
                      const next = runnerMoves.map((m, i) => {
                        if (i !== idx) return m;
                        if (e.target.value === "out") {
                          return { ...m, out: true, to: 1 as const };
                        }
                        return { ...m, out: false, to: Number(e.target.value) as 1 | 2 | 3 | 4 };
                      });
                      setMoves(next);
                    }}
                  >
                    <option value="1">1B</option>
                    <option value="2">2B</option>
                    <option value="3">3B</option>
                    <option value="4">Score</option>
                    <option value="out">Out</option>
                  </select>
                  <select
                    className="h-8 rounded-md border bg-background px-1"
                    value={move.outType ?? ""}
                    disabled={!move.out}
                    onChange={(e) => {
                      const next = runnerMoves.map((m, i) =>
                        i === idx
                          ? { ...m, outType: (e.target.value || undefined) as RunnerMove["outType"] }
                          : m,
                      );
                      setMoves(next);
                    }}
                  >
                    <option value="">Out type</option>
                    <option value="force">Force</option>
                    <option value="tag">Tag</option>
                    <option value="fly">Fly</option>
                    <option value="thrown">Thrown</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {offense === "them" ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Fielding credits
              </p>
              <div className="space-y-1">
                {fielders.map((f) => {
                  const credit = credits[f.id] ?? {
                    playerId: f.id,
                    putouts: 0,
                    assists: 0,
                    errors: 0,
                  };
                  return (
                    <div key={f.id} className="grid grid-cols-[1fr_repeat(3,52px)] items-center gap-2 text-xs">
                      <span className="truncate">
                        {f.position} {f.name}
                      </span>
                      {(["putouts", "assists", "errors"] as const).map((key) => (
                        <label key={key} className="flex items-center gap-1">
                          {key === "putouts" ? "PO" : key === "assists" ? "A" : "E"}
                          <input
                            type="number"
                            min={0}
                            max={3}
                            className="h-7 w-10 rounded border bg-background px-1"
                            value={credit[key]}
                            onChange={(e) =>
                              setCredits({
                                ...credits,
                                [f.id]: {
                                  ...credit,
                                  [key]: Number(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <label className="mt-4 block text-sm">
            Notes
            <input
              className="mt-1 h-9 w-full rounded-md border bg-background px-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hard kick, bad hop, etc."
            />
          </label>

          <Button
            className="mt-4 w-full"
            disabled={pending || game.status !== "live" || !kicker}
            onClick={() => submitPlay()}
          >
            Record plate appearance
          </Button>
        </div>
      </div>
    </div>
  );
}
