import { useEffect, useMemo, useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Button, Panel } from "@/components/guide/ui";
import { walkWithBudget, type TreeNode, type WalkStep } from "@/lib/interview-sim";
import { cn } from "@/lib/cn";

/** The tree from the video's board: a page with a form that called setState, and a big list. */
const TREE: TreeNode[] = [
  { id: "app", label: "App", depth: 0, cost: 1, parent: null },
  { id: "header", label: "Header", depth: 1, cost: 1, parent: "app" },
  { id: "form", label: "Form ← setState", depth: 1, cost: 2, update: true, parent: "app" },
  { id: "input", label: "input", depth: 2, cost: 1, parent: "form" },
  { id: "error", label: "ErrorText", depth: 2, cost: 1, parent: "form" },
  { id: "list", label: "List (memo)", depth: 1, cost: 1, memo: true, parent: "app" },
  { id: "row1", label: "Row 1", depth: 2, cost: 2, parent: "list" },
  { id: "row2", label: "Row 2", depth: 2, cost: 2, parent: "list" },
  { id: "row3", label: "Row 3", depth: 2, cost: 2, parent: "list" },
  { id: "row4", label: "Row 4", depth: 2, cost: 2, parent: "list" },
  { id: "footer", label: "Footer", depth: 1, cost: 1, parent: "app" },
];

const ACTION_LABEL: Record<WalkStep["action"], string> = {
  render: "function ran",
  bailout: "bailout · same props",
  skipped: "reused by reference",
};

/**
 * Follow-up · why fiber? The update sits in Form's queue. React clones current into a
 * work-in-progress tree and walks it, a budget at a time, yielding between slices.
 */
export function SliceLab() {
  const [budget, setBudget] = useState(4);
  const [memo, setMemo] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = useMemo(() => walkWithBudget(TREE, budget, memo), [budget, memo]);
  const slices = steps.reduce((max, item) => Math.max(max, item.slice), 0) + 1;
  const done = step >= steps.length;
  const active = steps[Math.min(step, steps.length - 1)];
  const sliceNow = done ? slices - 1 : active.slice;
  const usedInSlice = steps
    .slice(0, step)
    .filter((item) => item.slice === sliceNow)
    .reduce((sum, item) => sum + item.cost, 0);
  const functionCalls = steps.filter((item) => item.action === "render").length;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((value) => {
        if (value >= steps.length) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, 520);
    return () => window.clearInterval(id);
  }, [playing, steps.length]);

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  const yielding = !done && step > 0 && steps[step]?.slice !== steps[step - 1]?.slice;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TreeColumn title="current · on screen" note="root.current" steps={null} step={0} />
        <TreeColumn
          title={done ? "work-in-progress · ready to commit" : "work-in-progress · being built"}
          note="current.alternate"
          steps={steps}
          step={step}
        />
      </div>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs tracking-widest text-mist uppercase">
            Slice {sliceNow + 1} of {slices}
          </p>
          <p className="font-mono text-xs text-mist">
            {usedInSlice} / {budget} units
          </p>
        </div>
        <div
          className="mt-2 h-3 w-full overflow-hidden rounded-sm border border-line bg-ink"
          aria-hidden="true"
        >
          <div
            className="h-full bg-copper transition-[width] duration-300"
            style={{ width: `${Math.min(100, (usedInSlice / budget) * 100)}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-paper" aria-live="polite">
          {done
            ? `Root completed. ${functionCalls} component functions ran. Commit can now swap current and work-in-progress in one synchronous pass.`
            : step === 0
              ? "Form’s update queue has one update. Press Play: React starts at the root, not at Form."
              : yielding
                ? "Budget spent. shouldYield() is true: React returns the main thread so the browser can handle input and paint. The half-built tree stays hidden."
                : `${TREE.find((node) => node.id === steps[step - 1]?.id)?.label}: ${ACTION_LABEL[steps[step - 1].action]}.`}
        </p>
      </Panel>

      <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase">
        Frame budget · {budget} units
        <input
          type="range"
          min={2}
          max={16}
          value={budget}
          onChange={(event) => {
            setBudget(Number(event.target.value));
            reset();
          }}
        />
      </label>
      <button
        type="button"
        aria-pressed={memo}
        onClick={() => {
          setMemo((value) => !value);
          reset();
        }}
        className={cn(
          "min-h-11 rounded-md border px-3 text-left font-mono text-sm",
          memo ? "border-copper bg-copper text-ink" : "border-line text-paper",
        )}
      >
        {memo
          ? "List is memo’d and its props did not change"
          : "Wrap List in memo (props unchanged)"}
      </button>

      <div className="grid grid-cols-3 gap-2">
        <Button type="button" onClick={reset}>
          Reset
        </Button>
        <Button
          type="button"
          onClick={() => setStep((value) => Math.min(steps.length, value + 1))}
          disabled={done}
        >
          Step
        </Button>
        <Button
          type="button"
          variant="solid"
          onClick={() => {
            if (done) setStep(0);
            setPlaying((value) => !value || done);
          }}
        >
          {playing ? "Pause" : done ? "Replay" : "Play"}
        </Button>
      </div>

      <Layer id="picture">
        <p>
          The update is attached to Form. React then works on a copy of the tree in the background,
          node by node, and gives the main thread back whenever the budget runs out. Nothing on the
          left changes until the right side is complete. Turn on memo and the list is not
          re-rendered: React keeps a reference to the previous rows, which is the video’s answer to
          “how does this not eat memory.”
        </p>
      </Layer>
      <Layer id="mechanism">
        <p>
          The copy is not a fresh deep clone each time. Each fiber has an alternate.
          createWorkInProgress reuses the alternate object and overwrites its fields, so after the
          first update React owns two trees and recycles them. A memo bailout skips calling the
          component and, when no lane is pending below, skips its whole subtree. Header and Footer
          still run here because their parent App re-rendered and they are not memo’d.
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          The update lives on the hook’s queue (dispatchSetState), not on a per-component “update
          queue” object, and scheduleUpdateOnFiber marks lanes up to the root. Rendering begins at
          the root in renderRootConcurrent. shouldYield in the scheduler package checks a ~5 ms
          interval (frameYieldMs), not a 50 ms idle deadline. memo bailouts happen in
          updateMemoComponent / updateSimpleMemoComponent, then bailoutOnAlreadyFinishedWork.
        </p>
      </Layer>
    </div>
  );
}

function TreeColumn({
  title,
  note,
  steps,
  step,
}: {
  title: string;
  note: string;
  steps: WalkStep[] | null;
  step: number;
}) {
  return (
    <Panel>
      <p className="font-mono text-xs tracking-widest text-mist uppercase">{title}</p>
      <p className="font-mono text-xs text-copper">{note}</p>
      <ul className="mt-3 flex flex-col gap-1">
        {TREE.map((node) => {
          const index = steps ? steps.findIndex((item) => item.id === node.id) : -1;
          const reached = steps ? index < step : true;
          const now = steps ? index === step : false;
          const action = steps && reached ? steps[index].action : null;
          return (
            <li
              key={node.id}
              className={cn(
                "flex min-h-8 items-center justify-between gap-2 rounded-sm border px-2 font-mono text-xs transition-colors duration-300",
                !steps && "border-line text-paper",
                steps && !reached && !now && "border-dashed border-line text-mist/50",
                now && "border-copper text-paper",
                action === "render" && "border-copper bg-copper text-ink",
                (action === "bailout" || action === "skipped") && "border-[#7fb38a] text-[#7fb38a]",
              )}
              style={{ marginLeft: `${node.depth * 1.1}rem` }}
            >
              <span className="truncate">{node.label}</span>
              {action === "render" ? <span>ran</span> : null}
              {action === "bailout" || action === "skipped" ? <span>↺ same ref</span> : null}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
