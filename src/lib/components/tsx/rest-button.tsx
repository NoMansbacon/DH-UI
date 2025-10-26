import React from "react";

export function RestButtonView({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="dh-rest-trigger" onClick={onClick}>
      {label}
    </button>
  );
}

