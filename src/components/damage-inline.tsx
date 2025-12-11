/**
 * Damage inline calculator React component
 * 
 * Compact damage input form with tier visualization.
 * Inputs: raw damage amount, armor slots used
 * Displays: major/severe thresholds
 * 
 * Used by: damage block, dashboard
 */
import React, { useState } from "react";

export function DamageInlineView({
  title,
  majorThreshold,
  severeThreshold,
  level,
  onApply,
}: {
  title?: string;
  majorThreshold?: number;
  severeThreshold?: number;
  level?: number;
  onApply: (damage: number, reduceTiers: number) => void | Promise<void>;
}) {
  const [dmg, setDmg] = useState<string>("0");
  const [reduce, setReduce] = useState<string>("0");
  const [busy, setBusy] = useState<boolean>(false);

  // Display thresholds with level added when level is provided.
  const displayMajor = Number.isFinite(majorThreshold as any)
    ? (majorThreshold as number) + (Number.isFinite(level as any) ? (level as number) : 0)
    : undefined;
  const displaySevere = Number.isFinite(severeThreshold as any)
    ? (severeThreshold as number) + (Number.isFinite(level as any) ? (level as number) : 0)
    : undefined;

  // Derive a simple visual "current tier" from the entered values.
  // Mirrors the tier logic in core/damage-calculator.ts, including armor-based reduction.
  const rawAmt = Number(dmg || 0) || 0;
  const tierReduce = Math.max(0, Math.floor(Number(reduce || 0) || 0));
  const hasMajor = Number.isFinite(displayMajor as any);
  const hasSevere = Number.isFinite(displaySevere as any);
  const finalMajor = hasMajor ? (displayMajor as number) : NaN;
  const finalSevere = hasSevere ? (displaySevere as number) : NaN;

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  let startTier = 0;
  if (Number.isFinite(finalSevere) && rawAmt >= finalSevere) startTier = 3;
  else if (Number.isFinite(finalMajor) && rawAmt >= finalMajor) startTier = 2;
  else if (rawAmt > 0) startTier = 1;

  const endTier = clamp(startTier - tierReduce, 0, 3);

  let currentTier: "minor" | "major" | "severe" | null = null;
  if (endTier === 1) currentTier = "minor";
  else if (endTier === 2) currentTier = "major";
  else if (endTier >= 3) currentTier = "severe";

  return (
    <div className="dh-damage-inline">
      <div className="dh-dmg-steps" role="group">
        <div className={`step${currentTier === "minor" ? " tier-active tier-minor" : ""}`}>
          <div className="label">MINOR<br/>DAMAGE</div>
          <div className="meta">Mark 1 HP</div>
        </div>
        <div className="conn"><span className="value">{Number.isFinite(displayMajor as any) ? displayMajor : ""}</span></div>
        <div className={`step${currentTier === "major" ? " tier-active tier-major" : ""}`}>
          <div className="label">MAJOR<br/>DAMAGE</div>
          <div className="meta">Mark 2 HP</div>
        </div>
        <div className="conn"><span className="value">{Number.isFinite(displaySevere as any) ? displaySevere : ""}</span></div>
        <div className={`step${currentTier === "severe" ? " tier-active tier-severe" : ""}`}>
          <div className="label">SEVERE<br/>DAMAGE</div>
          <div className="meta">Mark 3 HP</div>
        </div>
      </div>

      <div className="dh-dmg-row">
        <div className="dh-dmg-group">
          <label className="dh-dmg-label">Damage</label>
          <input
            className="dh-dmg-input"
            type="number"
            min={0}
            value={dmg}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.currentTarget.closest('.dh-dmg-row') as HTMLElement)?.querySelector('button.dh-event-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              }
            }}
            onChange={(e) => setDmg(e.currentTarget.value)}
          />
        </div>
        <div className="dh-dmg-group">
          <label className="dh-dmg-label"># Armor slots used</label>
          <input
            className="dh-dmg-input"
            type="number"
            min={0}
            max={3}
            value={reduce}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.currentTarget.closest('.dh-dmg-row') as HTMLElement)?.querySelector('button.dh-event-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              }
            }}
            onChange={(e) => setReduce(e.currentTarget.value)}
          />
        </div>
        <button
          className="dh-event-btn"
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              await Promise.resolve(onApply(Number(dmg || 0), Number(reduce || 0)));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

