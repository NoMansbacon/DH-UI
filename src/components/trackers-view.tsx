/**
 * Tracker row React component
 * 
 * Renders a single tracker with clickable boxes.
 * Box types: rectangles (HP/stress/armor) or diamonds (hope)
 * Features: state persistence, live sync across instances
 * 
 * Used by: individual tracker blocks, vitals, dashboard
 */
import React, { useEffect, useState } from "react";
import { onTrackerChanged } from "../utils/events";

export type TrackerKind = "hp" | "stress" | "armor" | "hope";

export function TrackerRowView({
  label,
  kind,
  shape,
  total,
  initialFilled,
  onChange,
  stateKey,
  debounceMs = 120,
}: {
  label: string;
  kind: TrackerKind;
  shape: "rect" | "diamond";
  total: number;
  initialFilled: number;
  onChange: (filled: number) => void;
  stateKey?: string;
  debounceMs?: number;
}) {
  const [filled, setFilled] = useState<number>(initialFilled);
  const latest = React.useRef<number>(initialFilled);
  const tRef = React.useRef<number | any>(0);
  const scheduleEmit = React.useCallback((val: number) => {
    latest.current = val;
    try { if (tRef.current) clearTimeout(tRef.current); } catch {}
    tRef.current = setTimeout(() => {
      try { onChange(latest.current); } catch {}
    }, Math.max(0, debounceMs|0));
  }, [onChange, debounceMs]);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(total, initialFilled));
    setFilled(clamped);
    latest.current = clamped;
  }, [initialFilled, total]);

  useEffect(() => {
    return () => { try { if (tRef.current) clearTimeout(tRef.current); } catch {} };
  }, []);

  // Sync when other parts of the app change the same tracker key
  useEffect(() => {
    if (!stateKey) return;
    const off = onTrackerChanged(({ key, filled }) => {
      if (key === stateKey) {
        const next = Math.max(0, Math.min(total, Number(filled || 0)));
        setFilled(next);
      }
    });
    return () => off();
  }, [stateKey, total]);

  const onClickBox = (idx: number) => {
    const next = idx + 1;
    const nextFilled = next === filled ? idx : next;
    setFilled(nextFilled);
    scheduleEmit(nextFilled);
  };

  const boxes: number[] = Array.from({ length: Math.max(0, total) }, (_, i) => i);

  const shapeCls = shape === "diamond" ? "dh-track-diamond" : "dh-track-rect";

  return (
    <div className="dh-tracker" data-dh-key={stateKey || ""}>
      <div className="dh-tracker-label">{label}</div>
      <div className={`dh-tracker-boxes ${shapeCls} dh-track-${kind}`}>
        {boxes.map((i) => (
          <div
            key={i}
            className={`dh-track-box${i < filled ? " on" : ""}`}
            onClick={() => onClickBox(i)}
          />
        ))}
      </div>
    </div>
  );
}
