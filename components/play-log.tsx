import { LOCATION_LABELS, RESULT_LABELS } from "@/lib/kickball/labels";
import type { Play } from "@/lib/kickball/types";

export function PlayLog({ plays, empty = "No plays yet." }: { plays: Play[]; empty?: string }) {
  if (plays.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  const reversed = [...plays].reverse();

  return (
    <ol className="space-y-3">
      {reversed.map((play) => (
        <li key={play.id} className="rounded-lg border bg-card px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {play.half === "top" ? "Top" : "Bot"} {play.inning}
            </span>
            <span>·</span>
            <span>{RESULT_LABELS[play.result]}</span>
            {play.location ? (
              <>
                <span>·</span>
                <span>{LOCATION_LABELS[play.location]}</span>
              </>
            ) : null}
            {play.rbi ? (
              <>
                <span>·</span>
                <span>{play.rbi} RBI</span>
              </>
            ) : null}
          </div>
          <p className="mt-1">{play.description}</p>
          {play.pitches.length > 0 ? (
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {play.pitches.map((p) => p.type[0].toUpperCase()).join(" ")}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
