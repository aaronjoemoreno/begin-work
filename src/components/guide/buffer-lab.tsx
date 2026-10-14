import { useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Button, Panel } from "@/components/guide/ui";

type Phase = "idle" | "scheduled" | "rendered" | "committed" | "dropped";

function bodyFor(phase: Phase, count: number) {
  const next = count + 1;
  if (phase === "idle") {
    return `root.current is the tree on screen. It says ${count}. The alternate is spare memory, or empty on the first mount.`;
  }
  if (phase === "scheduled") {
    return `setState queued an update and cloned the current fiber into its alternate. The clone still says ${count}. The host has not been touched.`;
  }
  if (phase === "rendered") {
    return `The work loop finished. Work-in-progress says ${next}. root.current still says ${count}, so the screen says ${count}. This tree can still be thrown away.`;
  }
  if (phase === "committed") {
    return `commitRoot flipped root.current. The screen says ${count}. The previous tree is now the spare.`;
  }
  return `The in-progress tree was discarded before it could show ${next}. root.current stayed at ${count}.`;
}

export function BufferLab() {
  const [count, setCount] = useState(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const screen = count;
  const wipVisible = phase === "scheduled" || phase === "rendered";
  const wipCount = phase === "rendered" ? count + 1 : count;

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-sm text-copper" aria-live="polite">
        Screen shows {screen}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Panel className={phase !== "rendered" && phase !== "scheduled" ? "border-copper" : ""}>
          <p className="font-mono text-xs tracking-widest text-mist uppercase">current · root.current</p>
          <p className="mt-3 font-serif text-4xl tabular-nums text-paper">{screen}</p>
          <p className="mt-2 font-mono text-xs text-mist">Published tree</p>
        </Panel>
        <Panel className={wipVisible ? "border-copper" : ""}>
          <p className="font-mono text-xs tracking-widest text-mist uppercase">work-in-progress · alternate</p>
          {wipVisible ? (
            <>
              <p className="mt-3 font-serif text-4xl tabular-nums text-paper">{wipCount}</p>
              <p className="mt-2 font-mono text-xs text-mist">
                {phase === "scheduled" ? "Cloned. Not rendered yet." : "Rendered. Not committed."}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-mist">
              {phase === "dropped" ? "Discarded. Not installed." : "No render in flight."}
            </p>
          )}
        </Panel>
      </div>
      <p className="text-sm text-paper">{bodyFor(phase, count)}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={() => {
            setCount(1);
            setPhase("idle");
          }}
        >
          Reset
        </Button>
        <Button
          type="button"
          onClick={() => setPhase("scheduled")}
          disabled={phase !== "idle" && phase !== "dropped" && phase !== "committed"}
        >
          setState({count + 1})
        </Button>
        <Button type="button" onClick={() => setPhase("rendered")} disabled={phase !== "scheduled"}>
          Finish render
        </Button>
        <Button type="button" onClick={() => setPhase("dropped")} disabled={phase !== "scheduled" && phase !== "rendered"}>
          Discard WIP
        </Button>
      </div>
      <Button
        type="button"
        variant="solid"
        disabled={phase !== "rendered"}
        onClick={() => {
          setCount((value) => value + 1);
          setPhase("committed");
        }}
      >
        Commit
      </Button>
      <Layer id="picture">
        <p>
          React keeps two fiber trees and swaps which one the screen points at. Render writes the hidden copy.
          Commit publishes it. An interrupted render is safe because the unfinished copy is simply not installed.
        </p>
      </Layer>
      <Layer id="mechanism">
        <p>
          Each fiber's alternate points at its twin. The first render allocates the pair. Later renders reuse the
          twin, so the cost is walking and comparing, not allocating every node again. Passive effects are
          scheduled after the pointer flips, so they close over the tree that was just published.
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          createWorkInProgress(current, pendingProps) returns current.alternate or allocates one. commitRootImpl
          ends with root.current = finishedWork. Elements are not this pair. Elements are the immutable description
          the render just created. Fibers are the long-lived objects.
        </p>
      </Layer>
    </div>
  );
}
