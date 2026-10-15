import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cubic,
  formatCount,
  reuseStats,
  simulateMainThread,
  timestamp,
  videoAt,
  walkWithBudget,
  type TreeNode,
} from "./interview-sim.ts";

const KEYS = [
  { char: "h", at: 3 },
  { char: "i", at: 9 },
];

describe("simulateMainThread", () => {
  it("stack mode cannot paint a keystroke until the whole render and commit finish", () => {
    const result = simulateMainThread({
      mode: "stack",
      renderUnits: 20,
      sliceUnits: 5,
      keystrokes: KEYS,
    });
    assert.equal(result.renderDoneAt, 20);
    for (const key of result.keys) {
      assert.ok(
        key.paintedAt !== null && key.paintedAt > 20,
        `${key.char} painted after the render`,
      );
    }
    assert.equal(result.slots.filter((slot) => slot.kind === "yield").length, 0);
  });

  it("fiber mode yields between slices and paints input much sooner", () => {
    const stack = simulateMainThread({
      mode: "stack",
      renderUnits: 20,
      sliceUnits: 5,
      keystrokes: KEYS,
    });
    const fiber = simulateMainThread({
      mode: "fiber",
      renderUnits: 20,
      sliceUnits: 5,
      keystrokes: KEYS,
    });
    assert.ok(fiber.slots.some((slot) => slot.kind === "yield"));
    assert.ok(fiber.maxLatency < stack.maxLatency, `${fiber.maxLatency} < ${stack.maxLatency}`);
    const h = fiber.keys.find((key) => key.char === "h");
    assert.ok(h?.paintedAt !== null && (h?.paintedAt ?? 99) < 20, "first key painted mid-render");
  });

  it("render work is conserved: both modes do the same amount of render", () => {
    for (const mode of ["stack", "fiber"] as const) {
      const result = simulateMainThread({ mode, renderUnits: 17, sliceUnits: 4, keystrokes: KEYS });
      const units = result.slots
        .filter((slot) => slot.kind === "render")
        .reduce((sum, slot) => sum + slot.length, 0);
      assert.equal(units, 17, mode);
      assert.equal(result.slots.filter((slot) => slot.kind === "commit").length, 1, mode);
    }
  });
});

const TREE: TreeNode[] = [
  { id: "app", label: "App", depth: 0, cost: 1, parent: null },
  { id: "form", label: "Form", depth: 1, cost: 2, update: true, parent: "app" },
  { id: "list", label: "List", depth: 1, cost: 1, memo: true, parent: "app" },
  { id: "row1", label: "Row", depth: 2, cost: 3, parent: "list" },
  { id: "row2", label: "Row", depth: 2, cost: 3, parent: "list" },
];

describe("walkWithBudget", () => {
  it("splits work into slices that never exceed the budget", () => {
    const steps = walkWithBudget(TREE, 3, false);
    const perSlice = new Map<number, number>();
    for (const step of steps) perSlice.set(step.slice, (perSlice.get(step.slice) ?? 0) + step.cost);
    for (const [, cost] of perSlice) assert.ok(cost <= 3);
    assert.ok(perSlice.size > 1);
  });

  it("a memo subtree with no update bails out and its children are reused", () => {
    const steps = walkWithBudget(TREE, 3, true);
    assert.equal(steps.find((step) => step.id === "list")?.action, "bailout");
    assert.equal(steps.find((step) => step.id === "row1")?.action, "skipped");
    assert.equal(steps.find((step) => step.id === "form")?.action, "render");
  });
});

describe("reuseStats", () => {
  it("allocates on the first two renders, then recycles the alternate", () => {
    const stats = reuseStats(10, 4, false);
    assert.equal(stats[0].fibersAllocated, 12);
    assert.equal(stats[1].fibersAllocated, 12);
    assert.equal(stats[2].fibersAllocated, 0);
    assert.equal(stats[3].fibersRecycled, 12);
    assert.equal(stats[3].liveFibers, 24);
  });

  it("memo cuts component calls, not fibers", () => {
    const plain = reuseStats(10, 3, false)[2];
    const memo = reuseStats(10, 3, true)[2];
    assert.ok(memo.componentCalls < plain.componentCalls);
    assert.equal(memo.liveFibers, plain.liveFibers);
  });
});

describe("helpers", () => {
  it("n cubed for 1000 elements is a billion", () => {
    assert.equal(cubic(1000), 1e9);
    assert.equal(formatCount(1e9), "1 billion");
  });

  it("formats timestamps and deep links", () => {
    assert.equal(timestamp(137), "02:17");
    assert.equal(videoAt(137), "https://youtu.be/XU6O4ASQoWs?t=137");
  });
});
