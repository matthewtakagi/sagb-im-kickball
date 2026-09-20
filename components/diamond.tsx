import type { Bases } from "@/lib/kickball/types";
import { cn } from "@/lib/utils";

export function Diamond({
  bases,
  outs,
  balls,
  strikes,
  kicker,
}: {
  bases: Bases;
  outs: number;
  balls: number;
  strikes: number;
  kicker?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium">{kicker ? `Up: ${kicker}` : "Between innings"}</span>
        <span className="tabular-nums text-muted-foreground">
          Count {balls}-{strikes} · {outs} out{outs === 1 ? "" : "s"}
        </span>
      </div>
      <svg viewBox="0 0 200 200" className="mx-auto h-56 w-56">
        <rect width="200" height="200" rx="12" className="fill-emerald-950/90 dark:fill-emerald-950" />
        <polygon points="100,28 172,100 100,172 28,100" className="fill-amber-100/90 dark:fill-amber-200/80" />
        <polygon points="100,72 128,100 100,128 72,100" className="fill-emerald-800/40" />
        <Base x={100} y={28} occupied={Boolean(bases[2])} label="2B" name={bases[2]?.name} />
        <Base x={172} y={100} occupied={Boolean(bases[1])} label="1B" name={bases[1]?.name} />
        <Base x={28} y={100} occupied={Boolean(bases[3])} label="3B" name={bases[3]?.name} />
        <circle cx="100" cy="172" r="8" className="fill-white stroke-stone-700" strokeWidth="2" />
        <text x="100" y="194" textAnchor="middle" className="fill-amber-50 text-[10px]">
          HP
        </text>
      </svg>
    </div>
  );
}

function Base({
  x,
  y,
  occupied,
  label,
  name,
}: {
  x: number;
  y: number;
  occupied: boolean;
  label: string;
  name?: string;
}) {
  return (
    <g>
      <rect
        x={x - 8}
        y={y - 8}
        width="16"
        height="16"
        transform={`rotate(45 ${x} ${y})`}
        className={cn(occupied ? "fill-amber-400" : "fill-white")}
        stroke="#444"
        strokeWidth="1.5"
      />
      {name ? (
        <text
          x={x}
          y={y - 16}
          textAnchor="middle"
          className="fill-amber-50 text-[9px]"
        >
          {name.split(" ")[0]}
        </text>
      ) : (
        <text x={x} y={y - 16} textAnchor="middle" className="fill-emerald-100/80 text-[9px]">
          {label}
        </text>
      )}
    </g>
  );
}
