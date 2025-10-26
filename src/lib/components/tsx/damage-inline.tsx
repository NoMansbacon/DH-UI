import React, { useState } from "react";

export function DamageInlineView({
  title,
  subtitle,
  onApply,
}: {
  title: string;
  subtitle: string;
  onApply: (damage: number, reduceTiers: number) => void;
}) {
  const [dmg, setDmg] = useState<string>("0");
  const [reduce, setReduce] = useState<string>("0");

  return (
    <div className="dh-damage-inline">
      <div className="dh-rest-title">{title}</div>
      <div className="dh-rest-sub">{subtitle}</div>
      <div className="dh-dmg-row">
        <div className="dh-dmg-group">
          <label className="dh-dmg-label">Damage</label>
          <input
            className="dh-dmg-input"
            type="number"
            min={0}
            value={dmg}
            onChange={(e) => setDmg(e.currentTarget.value)}
          />
        </div>
        <div className="dh-dmg-group">
          <label className="dh-dmg-label"># Armor slots used</label>
          <input
            className="dh-dmg-input"
            type="number"
            min={0}
            value={reduce}
            onChange={(e) => setReduce(e.currentTarget.value)}
          />
        </div>
        <button
          className="dh-event-btn"
          onClick={() => onApply(Number(dmg || 0), Number(reduce || 0))}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

