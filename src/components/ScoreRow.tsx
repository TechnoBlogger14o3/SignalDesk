import { formatScore } from "@/lib/format";

export function ScoreRow({
  technical,
  fundamental,
  overall,
}: {
  technical: number | null;
  fundamental: number | null;
  overall: number | null;
}) {
  return (
    <div className="score-row">
      <Score label="Technical" value={technical} />
      <Score label="Fundamental" value={fundamental} />
      <Score label="Overall" value={overall} />
    </div>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  const width = value ?? 0;
  return (
    <div className="score">
      <div className="score-head">
        <span>{label}</span>
        <strong>{formatScore(value)}</strong>
      </div>
      <div className="score-track">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
