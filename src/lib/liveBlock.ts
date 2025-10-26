import type DaggerheartPlugin from "../main";
import type { MarkdownPostProcessorContext, TFile } from "obsidian";

/**
 * Live-updating codeblock registry.
 * Usage:
 *   registerLiveCodeBlock(plugin, "badges", (el, src, ctx) => { ... });
 *
 * - Renders on first pass
 * - Tracks instances per file
 * - On frontmatter/metadata change for that file, re-runs the correct renderer
 *   for each root.
 */

type Renderer = (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => void | Promise<void>;

const instancesByFile = new Map<string, Set<HTMLElement>>();                // filePath -> hosts (original codeblock elements)
const srcByHost = new WeakMap<HTMLElement, string>();                       // host -> original src
const ctxByHost = new WeakMap<HTMLElement, MarkdownPostProcessorContext>(); // host -> ctx
const rendererByHost = new WeakMap<HTMLElement, Renderer>();                // host -> renderer
const mountByHost = new WeakMap<HTMLElement, HTMLElement>();                // host -> stable mount child we control

function ensureMount(host: HTMLElement): HTMLElement {
  let mount = mountByHost.get(host);
  if (mount && host.contains(mount)) return mount;
  // Create a dedicated child we fully control so external DOM changes don't collide with React
  mount = document.createElement('div');
  mount.className = 'dh-react-root';
  // Clear host only for our own children with same class to avoid nuking unrelated siblings
  Array.from(host.querySelectorAll(':scope > .dh-react-root')).forEach((n) => {
    try { host.removeChild(n); } catch {}
  });
  host.appendChild(mount);
  mountByHost.set(host, mount);
  return mount;
}

let listenerInstalled = false;

export function registerLiveCodeBlock(
  plugin: DaggerheartPlugin,
  name: string,
  renderer: Renderer
) {
  // Install the global metadata change listener once
  if (!listenerInstalled) {
    plugin.registerEvent(
      plugin.app.metadataCache.on("changed", (file: TFile) => {
        const path = file?.path;
        if (!path) return;
        const roots = instancesByFile.get(path);
        if (!roots) return;

        for (const root of Array.from(roots)) {
          if (!root.isConnected) {
            roots.delete(root);
            continue;
          }

          const render = rendererByHost.get(root);
          const src = srcByHost.get(root);
          const oldCtx = ctxByHost.get(root);
          if (!render || src == null || !oldCtx) continue;

          // Build a fresh ctx-like object with updated frontmatter
          const fm = plugin.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
          const freshCtx: MarkdownPostProcessorContext = {
            ...oldCtx,
            // @ts-expect-error: Obsidian provides frontmatter on ctx; we refresh it here
            frontmatter: fm,
          };

          const mount = ensureMount(root);
          Promise.resolve(render(mount, src, freshCtx)).catch((e) => console.debug("[DH-UI] live render error", e));
        }
      })
    );
    listenerInstalled = true;
  }

  // Register the named code block
  plugin.registerMarkdownCodeBlockProcessor(name, (src, el, ctx) => {
    const mount = ensureMount(el);
    // Initial render into our mount
    Promise.resolve(renderer(mount, src, ctx)).catch((e) => console.debug("[DH-UI] render error", e));

    // Track for future refreshes (per-host)
    srcByHost.set(el, src);
    ctxByHost.set(el, ctx);
    rendererByHost.set(el, renderer);

    const filePath = ctx.sourcePath;
    let set = instancesByFile.get(filePath);
    if (!set) {
      set = new Set();
      instancesByFile.set(filePath, set);
    }
    set.add(el);

    // Auto-clean when removed
    queueMicrotask(() => {
      if (!el.isConnected) {
        set?.delete(el);
        srcByHost.delete(el);
        ctxByHost.delete(el);
        rendererByHost.delete(el);
        const m = mountByHost.get(el);
        if (m && m.parentElement) { try { m.parentElement.removeChild(m); } catch {} }
        mountByHost.delete(el);
      }
    });
  });
}
