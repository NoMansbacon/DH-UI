import React from "react";

export type BadgeRow = { label: string; value: string };

export function BadgesView({ items }: { items: BadgeRow[] }) {
  return (
    <div className="dh-badges">
      {items.map((it, idx) => (
        <div key={idx} className="dh-badge">
          <span className="dh-badge-label">{it.label}</span>
          <span className="dh-badge-value">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

