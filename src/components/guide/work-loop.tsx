import { useMemo, useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Button, Panel } from "@/components/guide/ui";

type Tag = "function" | "host";

type NodeDef = {
  id: string;
  name: string;
  tag: Tag;
  children: string[];
};

const NODES: Record<string, NodeDef> = {
  app: { id: "app", name: "App", tag: "function", children: ["header", "list", "footer"] },
  header: { id: "header", name: "header", tag: "host", children: [] },
  list: { id: "list", name: "List", tag: "function", children: ["a", "b"] },
  a: { id: "a", name: "li A", tag: "host", children: [] },
  b: { id: "b", name: "li B", tag: "host", children: [] },
  footer: { id: "footer", name: "footer", tag: "host", children: [] },
};

type Step = {
  id: string;
  phase: "begin" | "complete";
  via: string;
  picture: string;
  mechanism: string;
  source: string;
};

function buildSteps(): Step[] {
  const parent: Record<string, string | null> = {};
  const sibling: Record<string, string | null> = {};

  function link(id: string, up: string | null) {
    parent[id] = up;
    const kids = NODES[id].children;
    kids.forEach((kid, index) => {
      sibling[kid] = kids[index + 1] ?? null;
      link(kid, id);
    });
  }
  link("app", null);
  sibling.app = null;

  const steps: Step[] = [];
  let wip: string | null = "app";

  while (wip) {
    const node: NodeDef = NODES[wip];
    const child: string | null = node.children[0] ?? null;
    const runs = node.tag === "function";
    steps.push({
      id: wip,
      phase: "begin",
      via: child ? `next unit is child ${NODES[child].name}` : "no child, so complete this fiber",
      picture: runs
        ? `Call ${node.name}. Whatever it returns becomes the children to reconcile. Then step down.`
        : `This is a host node (${node.name}). Do not run user code. Its children, if it had any, would be props.children.`,
      mechanism: child
        ? `beginWork returns the first child. workInProgress moves to ${NODES[child].name}. The parent stays unfinished on purpose.`
        : `beginWork returns null. performUnitOfWork falls into completeUnitOfWork.`,
      source: runs
        ? `${node.name} is a FunctionComponent. updateFunctionComponent → renderWithHooks → reconcileChildren. The global is workInProgress, not the call stack.`
        : `HostComponent skips renderWithHooks. reconcileChildren still runs if there are element children. Here there are none.`,
    });

    if (child) {
      wip = child;
      continue;
    }

    let completed: string | null = wip;
    while (completed) {
      const nodeDone = NODES[completed];
      const nextSibling: string | null = sibling[completed] ?? null;
      const up: string | null = parent[completed];
      const via = nextSibling
        ? `sibling → ${NODES[nextSibling].name}`
        : up
          ? `no sibling, return → ${NODES[up].name}`
          : "no sibling and no parent. Render is finished.";
      steps.push({
        id: completed,
        phase: "complete",
        via,
        picture:
          nodeDone.tag === "host"
            ? `${nodeDone.name} is finished. If this were a mount, its DOM node would be created now, off the document.`
            : `${nodeDone.name} is finished. Flags from its children bubble onto it so commit can skip empty subtrees later.`,
        mechanism: `completeWork runs, then subtreeFlags and childLanes bubble to the parent. The next unit is the sibling, else the return pointer.`,
        source: `completeUnitOfWork. Host mount calls createInstance + appendInitialChild through the host config. Flags bubble here, not during begin.`,
      });
      if (nextSibling) {
        wip = nextSibling;
        break;
      }
      completed = up;
      wip = up;
      if (!completed) break;
    }
  }

  return steps;
}

const ORDER = ["app", "header", "list", "a", "b", "footer"];

export function WorkLoopLab() {
  const steps = useMemo(() => buildSteps(), []);
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<"sync" | "concurrent">("concurrent");
  const [yieldAt, setYieldAt] = useState(4);
  const step = steps[cursor];
  const yielded = mode === "concurrent" && cursor === yieldAt && cursor < steps.length;

  function statusOf(id: string) {
    let begun = false;
    let done = false;
    for (let index = 0; index <= cursor; index += 1) {
      if (steps[index].id !== id) continue;
      if (steps[index].phase === "begin") begun = true;
      if (steps[index].phase === "complete") done = true;
    }
    if (done) return "done";
    if (begun) return "open";
    return "waiting";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={mode === "sync" ? "solid" : "ghost"} onClick={() => setMode("sync")}>
          Sync lane
        </Button>
        <Button
          type="button"
          variant={mode === "concurrent" ? "solid" : "ghost"}
          onClick={() => setMode("concurrent")}
        >
          Concurrent
        </Button>
      </div>
      <Panel>
        <ol className="flex flex-col gap-2">
          {ORDER.map((id) => {
            const node = NODES[id];
            const state = statusOf(id);
            const current = step.id === id;
            const depth = id === "a" || id === "b" ? "pl-6" : id === "header" || id === "list" || id === "footer" ? "pl-3" : "";
            const mark = current ? "this unit" : state === "done" ? "complete" : state === "open" ? "unfinished" : "waiting";
            return (
              <li
                key={id}
                className={`rounded-md border px-3 py-2 ${depth} ${current ? "border-copper bg-ink" : "border-line"}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-sm text-paper">{node.name}</span>
                  <span className="font-mono text-xs text-mist">
                    {node.tag === "function" ? "function" : "host"} · {mark}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>
      {yielded ? (
        <p className="rounded-md border border-copper px-4 py-3 text-sm text-paper">
          Yield. shouldYield() is true, so workLoopConcurrent returns. The work-in-progress tree is not on
          screen. The browser may paint the current tree. A later scheduled task resumes at this fiber.
        </p>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          onClick={() => {
            setCursor(0);
          }}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="solid"
          onClick={() => setCursor((value) => Math.min(steps.length - 1, value + 1))}
          disabled={cursor >= steps.length - 1}
        >
          Step
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (mode === "sync") {
              setCursor(steps.length - 1);
              return;
            }
            setCursor((value) => (value < yieldAt ? yieldAt : steps.length - 1));
          }}
        >
          Run
        </Button>
      </div>
      <p className="font-mono text-xs text-mist" aria-live="polite">
        Unit {cursor + 1} / {steps.length} · {step.phase} {NODES[step.id].name} · {step.via}
      </p>
      <Layer id="picture">
        <p>{step.picture}</p>
      </Layer>
      <Layer id="mechanism">
        <p>
          {step.mechanism}{" "}
          {mode === "sync"
            ? "workLoopSync never asks shouldYield. A discrete click flushes this way."
            : `workLoopConcurrent checks shouldYield between units. This demo yields after unit ${yieldAt}.`}
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">{step.source}</p>
      </Layer>
      {mode === "concurrent" ? (
        <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase">
          Yield after unit {yieldAt}
          <input
            type="range"
            min={1}
            max={steps.length - 1}
            value={yieldAt}
            onChange={(event) => setYieldAt(Number(event.target.value))}
          />
        </label>
      ) : null}
    </div>
  );
}
