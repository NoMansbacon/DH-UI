import React from "react";

export function RestRowView({
  shortLabel,
  longLabel,
  onShort,
  onLong,
}: {
  shortLabel: string;
  longLabel: string;
  onShort: () => void;
  onLong: () => void;
}) {
  return (
    <div className="dh-rest-row">
      <button className="dh-rest-trigger" onClick={onShort}>{shortLabel}</button>
      <button className="dh-rest-trigger" onClick={onLong}>{longLabel}</button>
    </div>
  );
}

