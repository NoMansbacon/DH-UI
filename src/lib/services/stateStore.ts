import type DaggerheartPlugin from "../../main";
import { KeyValueStore } from "./kv/kv";
import { JsonDataStore } from "./kv/local-file-store";
import { emitKvChanged } from "../../utils/events";

let kv: KeyValueStore | null = null;
let currentPath: string | null = null;

export function initializeStateStore(plugin: DaggerheartPlugin, filePath: string){
  if (!kv || currentPath !== filePath){
    kv = new KeyValueStore(new JsonDataStore(plugin.app.vault, filePath));
    currentPath = filePath;
    console.log("[DH-UI] state store:", filePath);
  }
}
function K(){ if (!kv) throw new Error("State store not initialized"); return kv; }

export async function get<T>(key: string, fallback?: T): Promise<T>{
  const v = await K().get<T>(key);
  return (v === undefined ? (fallback as T) : v) as T;
}
export async function set<T>(key: string, val: T){
  await K().set(key, val);
  emitKvChanged({ key, val });
}
export async function getBoolArray(key: string, len: number): Promise<boolean[]>{
  const raw = await get<boolean[]>(key, []);
  const out = new Array(Math.max(0,len)).fill(false);
  for (let i=0;i<Math.min(out.length, Array.isArray(raw)? raw.length:0);i++) out[i] = !!(raw as any)[i];
  return out;
}
export async function setBoolArray(key: string, arr: boolean[]){ await set<boolean[]>(key, Array.isArray(arr)? arr.slice():[]); }
