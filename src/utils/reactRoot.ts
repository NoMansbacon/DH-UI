import { createRoot, Root } from "react-dom/client";

/**
 * Shared helper for mounting React roots into Markdown containers.
 *
 * - Uses a WeakMap<HTMLElement, Root> so each host element has a stable root.
 * - If the host's children were externally cleared, it safely unmounts and
 *   recreates the root to avoid React warnings.
 */
export function getOrCreateRoot(
  roots: WeakMap<HTMLElement, Root>,
  el: HTMLElement
): Root {
  let root = roots.get(el);

  // If something external cleared the container, recreate the root to
  // keep React happy and avoid "Cannot update an unmounted root" warnings.
  if (root && el.childElementCount === 0) {
    try {
      root.unmount();
    } catch {}
    roots.delete(el);
    root = undefined as any;
  }

  if (!root) {
    root = createRoot(el);
    roots.set(el, root);
  }

  return root;
}