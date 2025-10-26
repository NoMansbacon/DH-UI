import { parseYaml as obsidianParseYaml } from "obsidian";

// Safe YAML parsing wrapper backed by Obsidian's built-in parser.
export function parseYamlSafe<T = any>(src: string): T {
  try {
    return (obsidianParseYaml(src) as T) ?? ({} as any);
  } catch {
    return {} as any;
  }
}

