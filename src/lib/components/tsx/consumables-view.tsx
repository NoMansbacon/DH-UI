import React, { useState, useEffect } from "react";

export type ConsumableRow = {
  label: string;
  stateKey: string;
  uses: number;
  filled: number;
};

function ConsumableRowView({ row, onChange }: { row: ConsumableRow; onChange: (stateKey: string, filled: number) => void }) {
  const [filled, setFilled] = useState(row.filled);
  useEffect(() => { setFilled(Math.max(0, Math.min(row.uses, row.filled))); }, [row.uses, row.filled]);

  const boxes = Array.from({ length: Math.max(0, row.uses) }, (_, i) => i);
  const click = (i: number) => {
    const next = i + 1;
    const nextFilled = next === filled ? i : next;
    setFilled(nextFilled);
    onChange(row.stateKey, nextFilled);
  };

  return (
    <div className="dh-consumable">
      <div className="dh-consumable-head"><span>{row.label}</span></div>
      <div className="dh-consumable-uses">
        {boxes.map((i) => (
          <div key={i} className={`dh-consume-box${i < filled ? " on" : ""}`} onClick={() => click(i)} />
        ))}
      </div>
    </div>
  );
}

export function ConsumablesView({ rows, onChange }: { rows: ConsumableRow[]; onChange: (stateKey: string, filled: number) => void }) {
  return (
    <div className="dh-consumables">
      {rows.map((r) => (
        <ConsumableRowView key={r.stateKey || r.label} row={r} onChange={onChange} />
      ))}
    </div>
  );
}

