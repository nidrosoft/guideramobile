/**
 * Anchor & action registry.
 *
 * Surfaces register a ref under an anchorId via <TourAnchor>. The tour
 * controller measures that ref (measureInWindow) to position the spotlight.
 * Screens also register imperative action handlers (scroll, open launcher)
 * used by step preActions — this keeps the GuidanceProvider decoupled from
 * any specific screen.
 */
import type { View } from 'react-native';

export interface AnchorFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

type AnchorRef = { current: View | null };

const anchors = new Map<string, AnchorRef>();
const actionHandlers = new Map<string, (...args: any[]) => void | Promise<void>>();

export function registerAnchor(id: string, ref: AnchorRef): void {
  anchors.set(id, ref);
}

export function unregisterAnchor(id: string, ref: AnchorRef): void {
  // only remove if the current ref still owns the slot (avoids races on remount)
  if (anchors.get(id) === ref) anchors.delete(id);
}

export function hasAnchor(id: string): boolean {
  const ref = anchors.get(id);
  return !!ref?.current;
}

/**
 * Measure an anchor in window coordinates. Retries briefly to allow layout to
 * settle after a preAction (tab switch, scroll). Resolves null if the anchor
 * never appears (feature flagged off, etc.) so the controller can skip it.
 */
export function measureAnchor(id: string, attempt = 0): Promise<AnchorFrame | null> {
  return new Promise((resolve) => {
    const ref = anchors.get(id);
    const node = ref?.current;

    if (!node) {
      if (attempt >= 8) return resolve(null);
      setTimeout(() => measureAnchor(id, attempt + 1).then(resolve), 120);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0 && attempt < 8) {
        setTimeout(() => measureAnchor(id, attempt + 1).then(resolve), 120);
        return;
      }
      resolve({ x, y, width, height });
    });
  });
}

// ─── Imperative action handlers (preActions) ──────────────────────────────────

export function registerActionHandler(
  key: string,
  fn: (...args: any[]) => void | Promise<void>
): () => void {
  actionHandlers.set(key, fn);
  return () => {
    if (actionHandlers.get(key) === fn) actionHandlers.delete(key);
  };
}

export async function runActionHandler(key: string, ...args: any[]): Promise<void> {
  const fn = actionHandlers.get(key);
  if (fn) await fn(...args);
}

export function hasActionHandler(key: string): boolean {
  return actionHandlers.has(key);
}
