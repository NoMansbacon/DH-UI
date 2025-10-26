// src/lib/components/traits.tsx (renamed from ability-cards.tsx)
import React, { useState } from "react";
import type { AbilityCard } from "../../domains/abilities";

export function AbilityView({ data }: { data: AbilityCard[] }) {
  const [cards, setCards] = useState<AbilityCard[]>(data);

  const onToggle = (idx: number) => {
    setCards((prev) => {
      const next = [...prev];
      const c = { ...next[idx] };
      c.toggled = !c.toggled;
      try { localStorage.setItem(c.storageKey, c.toggled ? "1" : "0"); } catch {}
      next[idx] = c;
      return next;
    });
  };

  return (
    <div className="dh-ability-cards">
      {cards.map((c, i) => {
        const cls = "dh-ability-card" + (c.toggled ? " proficient" : "");
        return (
          <div key={c.name} className={cls} title={c.name}>
            <div className="dh-ability-name">
              <span>{c.label}</span>
              <span
                className={"dh-toggle" + (c.toggled ? " on" : "")}
                role="button"
                aria-pressed={c.toggled}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(i); }}
                title="Toggle"
              />
            </div>
            <div className={"dh-ability-total " + (c.total > 0 ? "dh-pos" : c.total < 0 ? "dh-neg" : "dh-zero")}>
              {c.total > 0 ? "+" + c.total : String(c.total)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

