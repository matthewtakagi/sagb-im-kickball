import Link from "next/link";
import { formatAvg, formatEra, formatIp, type FieldingRow, type KickingRow, type PitchingRow } from "@/lib/kickball/stats";

export function KickingTable({ rows }: { rows: KickingRow[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {["Player", "G", "PA", "AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K", "AVG", "OBP", "SLG", "OPS", "ISO", "BABIP"].map(
              (h) => (
                <th key={h} className="px-2 py-2 font-medium">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId} className="border-t">
              <td className="px-2 py-2 font-medium">
                <Link className="hover:underline" href={`/stats/${row.playerId}`}>
                  {row.name}
                </Link>
              </td>
              <Num n={row.g} />
              <Num n={row.pa} />
              <Num n={row.ab} />
              <Num n={row.r} />
              <Num n={row.h} />
              <Num n={row.doubles} />
              <Num n={row.triples} />
              <Num n={row.hr} />
              <Num n={row.rbi} />
              <Num n={row.bb} />
              <Num n={row.k} />
              <td className="px-2 py-2 tabular-nums">{formatAvg(row.avg)}</td>
              <td className="px-2 py-2 tabular-nums">{formatAvg(row.obp)}</td>
              <td className="px-2 py-2 tabular-nums">{formatAvg(row.slg)}</td>
              <td className="px-2 py-2 tabular-nums">{formatAvg(row.ops)}</td>
              <td className="px-2 py-2 tabular-nums">{formatAvg(row.iso)}</td>
              <td className="px-2 py-2 tabular-nums">{formatAvg(row.babip)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PitchingTable({ rows }: { rows: PitchingRow[] }) {
  if (rows.length === 0) return <Empty text="No pitching stats yet. They appear when the other team kicks." />;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {["Player", "G", "IP", "TBF", "H", "R", "ER", "BB", "K", "HR", "Pitches", "ERA", "WHIP", "K/7", "BB/7", "BAA"].map(
              (h) => (
                <th key={h} className="px-2 py-2 font-medium">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId} className="border-t">
              <td className="px-2 py-2 font-medium">
                <Link className="hover:underline" href={`/stats/${row.playerId}`}>
                  {row.name}
                </Link>
              </td>
              <Num n={row.g} />
              <td className="px-2 py-2 tabular-nums">{formatIp(row.ipOuts)}</td>
              <Num n={row.tbf} />
              <Num n={row.h} />
              <Num n={row.r} />
              <Num n={row.er} />
              <Num n={row.bb} />
              <Num n={row.k} />
              <Num n={row.hr} />
              <Num n={row.pitches} />
              <td className="px-2 py-2 tabular-nums">{formatEra(row.era)}</td>
              <td className="px-2 py-2 tabular-nums">{row.whip.toFixed(2)}</td>
              <td className="px-2 py-2 tabular-nums">{row.k9.toFixed(1)}</td>
              <td className="px-2 py-2 tabular-nums">{row.bb9.toFixed(1)}</td>
              <td className="px-2 py-2 tabular-nums">{formatAvg(row.avgAgainst)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FieldingTable({ rows }: { rows: FieldingRow[] }) {
  if (rows.length === 0) return <Empty text="No fielding credits yet. Log putouts, assists, and errors while scoring." />;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {["Player", "PO", "A", "E", "DP", "FPCT"].map((h) => (
              <th key={h} className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId} className="border-t">
              <td className="px-2 py-2 font-medium">
                <Link className="hover:underline" href={`/stats/${row.playerId}`}>
                  {row.name}
                </Link>
              </td>
              <Num n={row.po} />
              <Num n={row.a} />
              <Num n={row.e} />
              <Num n={row.dp} />
              <td className="px-2 py-2 tabular-nums">{formatAvg(row.fpct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Num({ n }: { n: number }) {
  return <td className="px-2 py-2 tabular-nums">{n}</td>;
}

function Empty({ text = "No kicking stats yet. They appear as soon as you score a game." }: { text?: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
