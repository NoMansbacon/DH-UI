/**
 * Individual tracker code block processors
 * 
 * Registers: ```hp, ```stress, ```armor, ```hope
 * 
 * Standalone tracker blocks.
 * Each displays:
 * - Label
 * - Clickable boxes (rectangles for HP/stress/armor, diamonds for hope)
 * - Persistent state via localStorage
 * - Template support for counts
 * 
 * Used when you need individual trackers rather than the vitals grid.
 */
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { TrackerRowView } from "../components/trackers-view";
import { registerLiveCodeBlock } from "../utils/liveBlock";
import * as store from "../lib/services/stateStore";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { KVProvider } from "../components/state/kv-context";
const roots = new WeakMap<HTMLElement, Root>();
/**
 * Trackers: hp | stress | armor | hope
 * - Accept either type-specific key or generic `uses:`
 * - Values support templates, e.g. "{{ frontmatter.hp }}"
 * - Hope defaults to 6 if not specified
 * - Rectangles for hp/stress/armor, diamonds for hope (via CSS classes below)
 */

type TrackerYaml = {
  state_key?: string;
  label?: string;
  uses?: number | string;
  hp?: number | string;
  stress?: number | string;
  armor?: number | string;
  hope?: number | string;
  class?: string;
};

function parseYaml(src: string): TrackerYaml {
  try {
    return parseYamlSafe<TrackerYaml>(src) ?? {};
  } catch (e) {
    console.error("[DH-UI] tracker YAML error:", e);
    return {};
  }
}

function resolveCount(
  raw: number | string | undefined,
  el: HTMLElement,
  app: any,
  ctx: MarkdownPostProcessorContext
): number {
  if (raw == null) return 0;
  if (typeof raw === "number") {
    const n = Math.floor(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  try {
    const tctx = createTemplateContext(el, app, ctx);
    const s = String(raw).trim();
    const m = s.match(/^\{\{\s*frontmatter\.([a-zA-Z0-9_\-]+)\s*\}\}$|^frontmatter\.([a-zA-Z0-9_\-]+)$/);
    if (m) {
      const key = (m[1] || m[2]) as string;
      const v = (tctx.frontmatter as any)?.[key];
      const n = Math.floor(Number(String(v)));
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
    const out = processTemplate(String(raw), tctx).trim();
    const n = Math.floor(Number(out));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

async function readState(key: string, max: number): Promise<number> {
  const n = Number(await store.get<number>(`tracker:${key}`, 0) ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, n));
}

async function writeState(key: string, v: number) {
  await store.set<number>(`tracker:${key}`, Math.max(0, v|0));
}
/** Registers one tracker code block (hp | stress | armor | hope). */
function registerOneTracker(
  plugin: DaggerheartPlugin,
  blockName: "hp" | "stress" | "armor" | "hope",
  extraBoxCls: string
) {
  registerLiveCodeBlock(plugin, blockName, async (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => {
    const app = plugin.app;
    let root: Root | null = null;

    const y = parseYaml(src);
    const klass = String(y.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
    el.addClass('dh-tracker-block');
    if (klass) el.addClass(klass);
    const labelText = (y.label || blockName.toUpperCase()).toString();
    const stateKey = (y.state_key || "").toString().trim();

    let rawCount: number | string | undefined =
      y.uses !== undefined
        ? y.uses
        : blockName === "hp" ? y.hp
        : blockName === "stress" ? y.stress
        : blockName === "armor" ? y.armor
        : y.hope;

    if (blockName === "hope" && (rawCount === undefined || String(rawCount).trim() === "")) {
      rawCount = 6;
    }

    const count = resolveCount(rawCount, el, app, ctx);
    const saved = stateKey ? await readState(stateKey, count) : 0;
    const shape = extraBoxCls.includes("dh-track-diamond") ? "diamond" : "rect";
    root = roots.get(el) || null;
    if (!root) { root = createRoot(el); roots.set(el, root); }
    root.render(
      React.createElement(ErrorBoundary, { name: `Tracker:${blockName}` },
        React.createElement(KVProvider, null,
          React.createElement(TrackerRowView, {
            label: labelText,
            kind: blockName as any,
            shape: shape as any,
            total: count,
            initialFilled: saved,
            stateKey: stateKey || undefined,
            onChange: async (v:number) => {
              if (!stateKey) return;
              await writeState(stateKey, v);
              // Proactively repaint all tracker rows bound to this key to avoid stale classes
              try {
                const safe = (CSS && (CSS as any).escape) ? (CSS as any).escape : (s: string) => String(s).replace(/["\\]/g,'\\$&');
                const sel = `.dh-tracker[data-dh-key="${safe(stateKey)}"] .dh-track-${blockName}`;
                document.querySelectorAll(sel).forEach((n) => {
                  const boxes = n.querySelectorAll('.dh-track-box');
                  boxes.forEach((b, i) => (b as HTMLDivElement).classList.toggle('on', i < v));
                });
              } catch {}
              try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: stateKey, filled: v } })); } catch {}
            }
          })
        )
      )
    );
  });
}

export function registerTrackersBlocks(plugin: DaggerheartPlugin) {
  // FORCE rectangles for HP / Stress / Armor by class
  registerOneTracker(plugin, "hp",     "dh-track-rect dh-track-hp");
  registerOneTracker(plugin, "stress", "dh-track-rect dh-track-stress");
  registerOneTracker(plugin, "armor",  "dh-track-rect dh-track-armor");
  // Diamonds for Hope
  registerOneTracker(plugin, "hope",   "dh-track-diamond dh-track-hope");
}
