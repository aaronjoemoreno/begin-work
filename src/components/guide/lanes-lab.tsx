import { useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Button, Panel } from "@/components/guide/ui";

/** Bit positions match React 19.2 ReactFiberLane.js. Lower bit = higher priority. */
const LANES: { name: string; bit: number; means: string }[] = [
  { name: "SyncHydrationLane", bit: 0, means: "Hydration that must beat everything, including a sync update." },
  { name: "SyncLane", bit: 1, means: "A discrete update: a click, or flushSync. Render before the browser paints." },
  { name: "InputContinuousLane", bit: 3, means: "Drag, scroll, mousemove. Higher than a normal setState, lower than a click." },
  { name: "DefaultLane", bit: 5, means: "Most setStates outside a transition: timeouts, promises, plain events that are not discrete." },
  { name: "GestureLane", bit: 6, means: "React 19 gesture transitions. Below Default, above ordinary transitions." },
  { name: "TransitionLane", bit: 8, means: "startTransition, useTransition, Actions. A band of lanes, not one bit. Interruptible." },
  { name: "RetryLane", bit: 15, means: "A Suspense retry after a thenable resolves. Separate so retries do not stampede." },
  { name: "SelectiveHydrationLane", bit: 19, means: "The dehydrated boundary the user just touched jumps the hydration queue." },
  { name: "IdleLane", bit: 21, means: "Work that should wait until the browser is bored." },
  { name: "OffscreenLane", bit: 22, means: "A hidden tree (Offscreen / Activity). It can prepare without blocking the screen." },
  { name: "DeferredLane", bit: 30, means: "The lowest bit in the mask. Everything else wins." },
];

function highest(mask: number) {
  return LANES.find((lane) => (mask & (1 << lane.bit)) !== 0) ?? null;
}

export function LanesLab() {
  const [mask, setMask] = useState(0);
  const [log, setLog] = useState("Nothing is scheduled. Toggle lanes, then render the highest one.");
  const next = highest(mask);

  function toggle(bit: number) {
    setMask((value) => value ^ (1 << bit));
  }

  function renderHighest() {
    const lane = highest(mask);
    if (!lane) {
      setLog("No lanes left. The root can go idle.");
      return;
    }
    setMask((value) => value & ~(1 << lane.bit));
    const rest = mask & ~(1 << lane.bit);
    setLog(
      rest === 0
        ? `Rendered ${lane.name}. The mask is clear.`
        : `Rendered ${lane.name}. ${highest(rest)?.name ?? "other lanes"} still pending, at a lower priority. It was not dropped.`,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="font-mono text-xs tracking-widest text-mist uppercase">Pending mask</p>
        <p className="mt-2 font-mono text-sm break-all text-copper">
          {mask.toString(2).padStart(31, "0")}
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {LANES.map((lane) => {
            const on = (mask & (1 << lane.bit)) !== 0;
            return (
              <li key={lane.name}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(lane.bit)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-3 text-left ${
                    on ? "border-copper bg-copper text-ink" : "border-line text-paper"
                  }`}
                >
                  <span className="font-mono text-sm">{lane.name}</span>
                  <span className="font-mono text-xs">bit {lane.bit}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
      <Button type="button" variant="solid" onClick={renderHighest}>
        {next ? `Render ${next.name}` : "Nothing to render"}
      </Button>
      <p className="text-sm text-paper" aria-live="polite">
        {log}
      </p>
      {next ? <p className="text-sm text-mist">{next.means}</p> : null}
      <Layer id="picture">
        <p>
          Priority is a bit, not a queue position. Several updates can be waiting on one fiber. React renders the
          lowest set bit first. The other bits stay in the mask, so a click does not erase a transition. It only
          cuts in front of it.
        </p>
      </Layer>
      <Layer id="mechanism">
        <p>
          A click outside a transition takes SyncLane and flushes in that turn, which is why it feels instant.
          startTransition claims the next transition lane and schedules through the scheduler, so
          workLoopConcurrent may yield. Updates from the same event are entangled: they share a lane and flush
          together, so a transition does not tear halfway through one gesture.
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          ReactFiberLane.js in 19.2 has TotalLanes = 31. getHighestPriorityLane isolates the least significant
          set bit. Transition lanes are a range (TransitionLane1 through TransitionLane14), handed out by
          claimNextTransitionLane so one long transition does not occupy the only slot. Hydration lanes sit one
          bit above their matching update lane. This demo keeps a single representative bit per band. The real
          mask can have several transition bits set at once.
        </p>
      </Layer>
    </div>
  );
}
