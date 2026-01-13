import React from "react";

export type ControlsRowProps = {
  // Visibility toggles
  showShort?: boolean;
  showLong?: boolean;
  showLevelUp?: boolean;
  showFullHeal?: boolean;
  showResetAll?: boolean;

  // Labels
  restLabel?: string;
  shortLabel?: string;
  longLabel?: string;
  levelupLabel?: string;
  fullHealLabel?: string;
  resetAllLabel?: string;

  // Handlers
  onRest?: () => void;
  onShort?: () => void;
  onLong?: () => void;
  onLevelUp?: () => void;
  onFullHeal?: () => void;
  onResetAll?: () => void;
};

export function ControlsRowView(props: ControlsRowProps) {
  const {
    showShort = true,
    showLong = true,
    showLevelUp = false,
    showFullHeal = false,
    showResetAll = false,

    restLabel = "Rest",
    shortLabel = "Short Rest",
    longLabel = "Long Rest",
    levelupLabel = "Level Up",
    fullHealLabel = "Full Heal",
    resetAllLabel = "Reset All",

    onRest,
    onShort,
    onLong,
    onLevelUp,
    onFullHeal,
    onResetAll,
  } = props;

  const showCombinedRest = showShort && showLong;

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const k = e.key.toLowerCase();

    if (showCombinedRest) {
      // Keyboard shortcuts still work to bias the initially-highlighted column.
      if (k === 's' && onShort) { e.preventDefault(); onShort(); }
      else if (k === 'l' && onLong) { e.preventDefault(); onLong(); }
      else if (k === 'enter' && (onRest || onShort)) { e.preventDefault(); (onRest || onShort)?.(); }
      return;
    }

    if (k === 's' && showShort && onShort) { e.preventDefault(); onShort(); }
    else if (k === 'l' && showLong && onLong) { e.preventDefault(); onLong(); }
    else if (k === 'enter' && showShort && onShort) { e.preventDefault(); onShort(); }
  };

  const restTitle = showCombinedRest ? `${restLabel} (S / L / Enter)` : undefined;

  return (
    <div className="dh-control-row" tabIndex={0} onKeyDown={onKeyDown}>
      {showCombinedRest ? (
        <button className="dh-rest-trigger" onClick={onRest || onShort} title={restTitle}>{restLabel}</button>
      ) : (
        <>
          {showShort && (
            <button className="dh-rest-trigger" onClick={onShort} title={`${shortLabel} (S or Enter)`}>{shortLabel}</button>
          )}
          {showLong && (
            <button className="dh-rest-trigger" onClick={onLong} title={`${longLabel} (L)`}>{longLabel}</button>
          )}
        </>
      )}

      {showLevelUp && (
        <button className="dh-rest-trigger" onClick={onLevelUp}>{levelupLabel}</button>
      )}
      {showFullHeal && (
        <button className="dh-rest-trigger" onClick={onFullHeal}>{fullHealLabel}</button>
      )}
      {showResetAll && (
        <button className="dh-rest-trigger" onClick={onResetAll}>{resetAllLabel}</button>
      )}
    </div>
  );
}
