import { POSITION_LABELS } from "@/lib/kickball/labels";
import { POSITIONS, canonicalizePosition, type LineupPosition } from "@/lib/kickball/types";

const POS: Exclude<LineupPosition, "EH">[] = [...POSITIONS, "DH"];

export function PositionCheckboxes({
  selected,
}: {
  selected?: LineupPosition[];
}) {
  const chosen = new Set((selected ?? []).map((pos) => canonicalizePosition(pos)));
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {POS.map((pos) => (
        <label key={pos} className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            name="positions"
            value={pos}
            defaultChecked={chosen.has(pos)}
            className="h-3.5 w-3.5 accent-primary"
          />
          <span title={POSITION_LABELS[pos]}>{pos}</span>
        </label>
      ))}
    </div>
  );
}
