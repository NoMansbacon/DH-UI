import type { App, MarkdownPostProcessorContext } from "obsidian";
import { extractFirstCodeBlock } from "./codeblock-extractor";
import { parseTraitsBlock, computeAbilities } from "../domains/abilities";

export type Frontmatter = Record<string, any>;
export interface AbilityScores {
  agility:number; strength:number; finesse:number;
  instinct:number; presence:number; knowledge:number;
}
export interface TemplateContext {
  frontmatter: Frontmatter;
  abilities: AbilityScores;
  skills: any;
}

export function hasTemplateVariables(t: string){ return typeof t==="string" && t.includes("{{") && t.includes("}}"); }

export function processTemplate(text: string, ctx: TemplateContext): string {
  if (!hasTemplateVariables(text)) return text ?? "";
  return String(text).replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, raw) => {
    try { return String(evalExpr(raw.trim(), ctx)); } catch { return ""; }
  });
}

export function createTemplateContext(el: HTMLElement, app: App, mdctx: MarkdownPostProcessorContext, fmOverride?: Frontmatter): TemplateContext {
  const fm = (fmOverride ?? (app.metadataCache.getCache(mdctx.sourcePath || "")?.frontmatter ?? {})) as Frontmatter;

  let abilities: AbilityScores = { agility:0, strength:0, finesse:0, instinct:0, presence:0, knowledge:0 };
  try{
    const section = mdctx.getSectionInfo(el);
    const text = section?.text || "";
    const y = extractFirstCodeBlock(text, "traits");
    if (y){
      const tb = parseTraitsBlock(y);
      const list = computeAbilities(tb);
      for (const {key,total} of list) (abilities as any)[key.toLowerCase()] = total;
    }
  }catch{}

  return { frontmatter: fm, abilities, skills: {} };
}

function evalExpr(expr: string, ctx: TemplateContext): string|number {
  const mFM = expr.match(/^frontmatter\.([a-zA-Z0-9_\-]+)$/);
  if (mFM) return toStr(ctx.frontmatter?.[mFM[1]]);
  const mAB = expr.match(/^abilities\.([a-zA-Z0-9_\-]+)$/);
  if (mAB) return toNum((ctx.abilities as any)?.[mAB[1]]);

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
  const mAB = tok.match(/^abilities\.([a-zA-Z0-9_\-]+)$/); if (mAB) return (ctx.abilities as any)?.[mAB[1]];
  return "";
}
function toNum(v:any){ const n = Number(v); return Number.isFinite(n)? n: 0; }
function toStr(v:any){ return v==null? "": String(v); }
