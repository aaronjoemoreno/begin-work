/**
 * Teaching models for the interview drill (/interview).
 * Time is in abstract "units", not milliseconds. The shapes are what matter:
 * a stack render cannot yield, a sliced render yields between fibers.
 */

export type ThreadMode = "stack" | "fiber";

export type SlotKind = "render" | "commit" | "input" | "paint" | "idle" | "yield";

export type Slot = {
  start: number;
  length: number;
  kind: SlotKind;
  label: string;
  slice?: number;
};

export type KeyResult = {
  char: string;
  pressedAt: number;
  handledAt: number | null;
  paintedAt: number | null;
};

export type ThreadResult = {
  slots: Slot[];
  keys: KeyResult[];
  end: number;
  renderDoneAt: number;
  maxLatency: number;
};

export type ThreadOptions = {
  mode: ThreadMode;
  /** Units of render work for the whole tree. */
  renderUnits: number;
  /** In fiber mode, how many units run before the loop checks shouldYield. */
  sliceUnits: number;
  /** When each keystroke arrives, in units. */
  keystrokes: { char: string; at: number }[];
};

/**
 * Simulate one main thread. In stack mode the render runs to the end, then commit, then the
 * queued input, then a paint. In fiber mode the render yields every sliceUnits; at each yield
 * the browser handles any queued input and paints it, then React continues.
 */
export function simulateMainThread(options: ThreadOptions): ThreadResult {
  const { mode, renderUnits } = options;
  const sliceUnits = Math.max(1, Math.floor(options.sliceUnits));
  const keys: KeyResult[] = [...options.keystrokes]
    .sort((a, b) => a.at - b.at)
    .map((key) => ({ char: key.char, pressedAt: key.at, handledAt: null, paintedAt: null }));
  const slots: Slot[] = [];
  let t = 0;
  let done = 0;
  let inSlice = 0;
  let slice = 0;
  let committed = false;
  let renderDoneAt = -1;
  const pending: KeyResult[] = [];
  let nextKey = 0;
  let guard = 0;

  function push(kind: SlotKind, length: number, label: string, sliceIndex?: number) {
    const last = slots[slots.length - 1];
    if (
      last &&
      last.kind === kind &&
      kind !== "yield" &&
      last.slice === sliceIndex &&
      last.label === label
    ) {
      last.length += length;
    } else {
      slots.push({ start: t, length, kind, label, slice: sliceIndex });
    }
    t += length;
  }

  function arrive() {
    while (nextKey < keys.length && keys[nextKey].pressedAt <= t) {
      pending.push(keys[nextKey]);
      nextKey += 1;
    }
  }

  function flushInput() {
    if (pending.length === 0) return false;
    for (const key of pending) {
      push("input", 1, "keydown handler");
      key.handledAt = t;
    }
    push("paint", 1, "paint");
    for (const key of pending) key.paintedAt = t;
    pending.length = 0;
    return true;
  }

  while (guard < 10_000) {
    guard += 1;
    arrive();

    if (done < renderUnits) {
      if (mode === "stack" || inSlice < sliceUnits) {
        push(
          "render",
          1,
          mode === "stack" ? "recursive render" : "performUnitOfWork",
          mode === "fiber" ? slice : 0,
        );
        done += 1;
        inSlice += 1;
        continue;
      }
      // Fiber mode, slice exhausted: yield to the browser.
      push("yield", 0, "shouldYield() → true");
      flushInput();
      inSlice = 0;
      slice += 1;
      continue;
    }

    if (!committed) {
      renderDoneAt = t;
      push("commit", 2, "commit (sync)");
      committed = true;
      arrive();
      if (pending.length === 0) push("paint", 1, "paint");
      continue;
    }

    if (flushInput()) continue;

    if (nextKey < keys.length) {
      const wait = keys[nextKey].pressedAt - t;
      if (wait > 0) push("idle", wait, "idle");
      continue;
    }
    break;
  }

  const maxLatency = keys.reduce(
    (max, key) => (key.paintedAt === null ? max : Math.max(max, key.paintedAt - key.pressedAt)),
    0,
  );
  return { slots, keys, end: t, renderDoneAt, maxLatency };
}

/* ------------------------------------------------------------------ */
/* Work-in-progress walk with a frame budget and bailouts              */
/* ------------------------------------------------------------------ */

export type TreeNode = {
  id: string;
  label: string;
  depth: number;
  /** Units of work when the component function actually runs. */
  cost: number;
  /** The component has a pending update in its queue. */
  update?: boolean;
  /** Wrapped in memo with unchanged props. */
  memo?: boolean;
  /** Ancestor id, for skipping a bailed-out subtree. */
  parent: string | null;
};

export type WalkStep = {
  id: string;
  action: "render" | "bailout" | "skipped";
  cost: number;
  slice: number;
};

/** Depth-first walk. A memo node with no update bails out; its subtree is reused by reference. */
export function walkWithBudget(tree: TreeNode[], budget: number, useMemo: boolean): WalkStep[] {
  const steps: WalkStep[] = [];
  const reusedRoots = new Set<string>();
  let slice = 0;
  let used = 0;
  const b = Math.max(1, budget);

  function underReused(node: TreeNode) {
    let parent = node.parent;
    while (parent) {
      if (reusedRoots.has(parent)) return true;
      parent = tree.find((item) => item.id === parent)?.parent ?? null;
    }
    return false;
  }

  for (const node of tree) {
    if (underReused(node)) {
      steps.push({ id: node.id, action: "skipped", cost: 0, slice });
      continue;
    }
    const bail = useMemo && node.memo && !node.update;
    const cost = bail ? 0 : node.cost;
    if (cost > 0 && used + cost > b && used > 0) {
      slice += 1;
      used = 0;
    }
    used += cost;
    if (bail) reusedRoots.add(node.id);
    steps.push({ id: node.id, action: bail ? "bailout" : "render", cost, slice });
  }
  return steps;
}

/* ------------------------------------------------------------------ */
/* Fiber object counts across renders (double buffering)               */
/* ------------------------------------------------------------------ */

export type ReuseStats = {
  render: number;
  componentCalls: number;
  fibersAllocated: number;
  fibersRecycled: number;
  liveFibers: number;
};

/**
 * Rows under a parent that re-renders. Render 1 mounts. Render 2 allocates every alternate once.
 * From render 3 on, createWorkInProgress recycles the alternate instead of allocating.
 * memo only changes how many component functions run, not how many fibers exist.
 */
export function reuseStats(rows: number, renders: number, memoRows: boolean): ReuseStats[] {
  const fibers = rows + 2; // root + list + rows
  const out: ReuseStats[] = [];
  for (let render = 1; render <= renders; render += 1) {
    const mount = render === 1;
    const componentCalls = mount ? rows + 1 : memoRows ? 1 : rows + 1;
    // Teaching model: every row fiber gets a work-in-progress twin when its parent reconciles,
    // memo or not. memo skips the row's function call, not its fiber.
    const fibersAllocated = mount || render === 2 ? fibers : 0;
    const fibersRecycled = mount || render === 2 ? 0 : fibers;
    out.push({
      render,
      componentCalls,
      fibersAllocated,
      fibersRecycled,
      liveFibers: mount ? fibers : fibers * 2,
    });
  }
  return out;
}

export function cubic(n: number) {
  return n ** 3;
}

export function formatCount(value: number) {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)} trillion`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(value % 1e9 === 0 ? 0 : 1)} billion`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(value % 1e6 === 0 ? 0 : 1)} million`;
  if (value >= 1e3) return value.toLocaleString("en-US");
  return String(value);
}

export function timestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const VIDEO_ID = "XU6O4ASQoWs";

export function videoAt(seconds: number) {
  return `https://youtu.be/${VIDEO_ID}?t=${seconds}`;
}
