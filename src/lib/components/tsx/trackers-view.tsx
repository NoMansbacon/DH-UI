import React, { useEffect, useState } from "react";

export type TrackerKind = "hp" | "stress" | "armor" | "hope";

export function TrackerRowView({
  label,
  kind,
  shape,
  total,
  initialFilled,
  onChange,
  stateKey,
}: {
  label: string;
  kind: TrackerKind;
  shape: "rect" | "diamond";
  total: number;
  initialFilled: number;
  onChange: (filled: number) => void;
  stateKey?: string;
}) {
  const [filled, setFilled] = useState<number>(initialFilled);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(total, initialFilled));
    setFilled(clamped);
  }, [initialFilled, total]);

  // Sync when other parts of the app change the same tracker key
  useEffect(() => {
    if (!stateKey) return;
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ key: string; filled: number }>;
      if (ev.detail && ev.detail.key === stateKey) {
        const next = Math.max(0, Math.min(total, Number(ev.detail.filled || 0)));
        setFilled(next);
      }
    };
    window.addEventListener('dh:tracker:changed', handler as any);
    return () => window.removeEventListener('dh:tracker:changed', handler as any);
  }, [stateKey, total]);

  const onClickBox = (idx: number) => {
    const next = idx + 1;
    const nextFilled = next === filled ? idx : next;
    setFilled(nextFilled);
    onChange(nextFilled);
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
