import type { App, MarkdownPostProcessorContext } from "obsidian";
import { extractFirstCodeBlock } from "./codeblock-extractor";
import { computeAbilities } from "../core/abilities";

export type Frontmatter = Record<string, any>;
export interface AbilityScores {
  agility:number; strength:number; finesse:number;
  instinct:number; presence:number; knowledge:number;
}

/**
 * Optional, generic skills/moves context.
 *
 * Populated from frontmatter.skills (or similar shape) when present so
 * templates can reference e.g. `{{ skills.attack }}`.
 */
export interface SkillsContext {
  [name: string]: number;
}

/**
 * High-level character summary derived from frontmatter for use in templates.
 *
 * Examples:
 * - character.level / character.tier
 * - character.hp / character.stress / character.armor / character.hope
 */
export interface CharacterContext {
  name?: string;
  level: number;
  tier: number;
  hp?: number;
  stress?: number;
  armor?: number;
  hope?: number;
}

export interface TemplateContext {
  frontmatter: Frontmatter;
  // Daggerheart core traits; exposed to templates as both `traits.*` (preferred)
  // and `abilities.*` (backwards-compatible alias for older notes).
  abilities: AbilityScores;
  skills: SkillsContext;
  character: CharacterContext;
}

export function hasTemplateVariables(t: string){ return typeof t==="string" && t.includes("{{") && t.includes("}}"); }

export function processTemplate(text: string, ctx: TemplateContext): string {
  if (!hasTemplateVariables(text)) return text ?? "";
  return String(text).replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, raw) => {
    try { return String(evalExpr(raw.trim(), ctx)); } catch { return ""; }
  });
}

export function createTemplateContext(el: HTMLElement, app: App, mdctx: MarkdownPostProcessorContext, fmOverride?: Frontmatter): TemplateContext {
  // Be resilient: try multiple sources for frontmatter
  let fm: Frontmatter = {};
  try {
    if (fmOverride) fm = fmOverride as Frontmatter;
    else {
      const fromCache = app.metadataCache.getCache(mdctx.sourcePath || "")?.frontmatter as Frontmatter | undefined;
      if (fromCache) fm = fromCache;
      else {
        const file = app.vault.getFileByPath(mdctx.sourcePath || "");
        const fromFile = file ? (app.metadataCache.getFileCache(file as any)?.frontmatter as Frontmatter | undefined) : undefined;
        if (fromFile) fm = fromFile;
      }
    }
  } catch { /* ignore */ }

  // Aggregate current ability totals from the nearest ```traits block, if present.
  let abilities: AbilityScores = { agility:0, strength:0, finesse:0, instinct:0, presence:0, knowledge:0 };
  try{
    const section = mdctx.getSectionInfo(el);
    const text = section?.text || "";
    const y = extractFirstCodeBlock(text, "traits");
    if (y){
      const totals = computeAbilities(y);
      for (const [name, total] of Object.entries(totals as any)) (abilities as any)[String(name).toLowerCase()] = total as number;
    }
  }catch{}

  // Optional skills/moves context, taken directly from frontmatter if present.
  const skills: SkillsContext = {};
  try {
    const rawSkills = (fm as any)?.skills;
    if (rawSkills && typeof rawSkills === "object") {
      if (Array.isArray(rawSkills)) {
        // Support array of { name, value } items
        for (const item of rawSkills) {
          const name = (item as any)?.name ?? (item as any)?.label;
          const value = (item as any)?.value;
          if (!name) continue;
          const n = toNum(value);
          if (Number.isFinite(n)) skills[String(name)] = n;
        }
      } else {
        // Plain object map: skills: { checkA: 2, checkB: 3 }
        for (const [key, val] of Object.entries(rawSkills)) {
          const n = toNum(val);
          if (Number.isFinite(n)) skills[key] = n;
        }
      }
    }
  } catch { /* ignore skills parsing */ }

  // High-level character summary derived from frontmatter.
  const lvl = toNum((fm as any)?.level ?? (fm as any)?.tier ?? 0);
  const tier = toNum((fm as any)?.tier ?? (fm as any)?.level ?? 0);
  const character: CharacterContext = {
    name: (fm as any)?.name ?? (fm as any)?.title,
    level: lvl,
    tier,
    hp: toNum((fm as any)?.hp ?? (fm as any)?.health ?? (fm as any)?.din_health ?? 0),
    stress: toNum((fm as any)?.stress ?? (fm as any)?.din_stress ?? 0),
    armor: toNum((fm as any)?.armor ?? (fm as any)?.din_armor ?? 0),
    hope: toNum((fm as any)?.hope ?? (fm as any)?.din_hope ?? 0),
  };

  return { frontmatter: fm || {}, abilities, skills, character };
}

function evalExpr(expr: string, ctx: TemplateContext): string|number {
  const mFM = expr.match(/^frontmatter\.([a-zA-Z0-9_\-]+)$/);
  if (mFM) return toStr(ctx.frontmatter?.[mFM[1]]);
  const mTR = expr.match(/^traits\.([a-zA-Z0-9_\-]+)$/);
  if (mTR) return toNum((ctx.abilities as any)?.[mTR[1]]);
  const mAB = expr.match(/^abilities\.([a-zA-Z0-9_\-]+)$/);
  if (mAB) return toNum((ctx.abilities as any)?.[mAB[1]]);
  const mSK = expr.match(/^skills\.([a-zA-Z0-9_\-]+)$/);
  if (mSK) return toNum((ctx.skills as any)?.[mSK[1]]);
  const mCH = expr.match(/^character\.([a-zA-Z0-9_\-]+)$/);
  if (mCH) return toStr((ctx.character as any)?.[mCH[1]]);

  const parts = expr.split(/\s+/).filter(Boolean);
  const head = (parts.shift()||"").toLowerCase();
  const nums = parts.map(p => toNum(resolveToken(p, ctx)));

  switch(head){
    case "add": return nums.reduce((a,b)=>a+b,0);
    case "subtract": return nums.slice(1).reduce((a,b)=>a-b, nums[0]??0);
    case "multiply": return nums.reduce((a,b)=>a*b,1);
    case "divide": return nums.slice(1).reduce((a,b)=> (b===0?NaN:a/b), nums[0]??0);
    case "floor": return Math.floor(nums[0]??0);
    case "ceil": return Math.ceil(nums[0]??0);
    case "round": return Math.round(nums[0]??0);
    case "modifier": return nums[0]??0;
    default: return toStr(resolveToken(expr, ctx));
  }
}
function resolveToken(tok: string, ctx: TemplateContext): any {
  tok = tok.trim();
  if (/^[+-]?\d+(\.\d+)?$/.test(tok)) return Number(tok);
  const mFM = tok.match(/^frontmatter\.([a-zA-Z0-9_\-]+)$/); if (mFM) return ctx.frontmatter?.[mFM[1]];
  const mTR = tok.match(/^traits\.([a-zA-Z0-9_\-]+)$/); if (mTR) return (ctx.abilities as any)?.[mTR[1]];
  const mAB = tok.match(/^abilities\.([a-zA-Z0-9_\-]+)$/); if (mAB) return (ctx.abilities as any)?.[mAB[1]];
  const mSK = tok.match(/^skills\.([a-zA-Z0-9_\-]+)$/); if (mSK) return (ctx.skills as any)?.[mSK[1]];
  const mCH = tok.match(/^character\.([a-zA-Z0-9_\-]+)$/); if (mCH) return (ctx.character as any)?.[mCH[1]];
  return "";
}
function toNum(v:any){ const n = Number(v); return Number.isFinite(n)? n: 0; }
function toStr(v:any){ return v==null? "": String(v); }
