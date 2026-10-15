import { FrameLab, type Frame } from "@/components/guide/frame-lab";
import { Panel } from "@/components/guide/ui";
import { cn } from "@/lib/cn";

const FRAMES: Frame[] = [
  {
    kicker: "Low priority",
    title: "A big list is rendering in the background",
    picture:
      "Data came back and React is rendering a huge list. Nothing urgent: the user does not need it this instant.",
    mechanism:
      "If the update was wrapped in startTransition (or came from useDeferredValue), it is on a transition lane and renders with workLoopConcurrent, which can yield.",
    source:
      "A plain setState in a fetch callback gets DefaultLane. DefaultLane renders are not time-sliced by default in React 18+ (includesBlockingLane). Use a transition if you want the list render to be interruptible.",
  },
  {
    kicker: "Input",
    title: "The user types into the search field",
    picture:
      "Typing, a focus outline, an error message: the video calls these high priority, because the user is waiting on them.",
    mechanism:
      "The keydown is a discrete event. setState inside it inherits SyncLane. The scheduler is told there is more urgent work.",
    source:
      "getCurrentEventPriority → DiscreteEventPriority → SyncLane. scheduleUpdateOnFiber marks the lane on the fiber and up to the root.",
  },
  {
    kicker: "Interrupt",
    title: "At the next yield, the list render stops",
    picture: "Video: React pauses the low-priority render. The half-built list waits.",
    mechanism:
      "What actually happens: the in-progress transition tree is thrown away. Its lanes are still pending on the root, so nothing is lost but the partial work.",
    source:
      "The sync work is flushed from ensureRootIsScheduled’s microtask. renderRootSync sees workInProgressRootRenderLanes differ from SyncLane and calls prepareFreshStack, which resets workInProgress to a new clone of root.current. The transition lanes stay in root.pendingLanes.",
  },
  {
    kicker: "Urgent render",
    title: "A fresh work-in-progress tree for the keystroke",
    picture:
      "React builds a new work-in-progress tree just for the urgent update, as the video says.",
    mechanism:
      "SyncLane renders with workLoopSync. Everything without that lane bails out, so only the input and its ancestors do real work.",
    source:
      "renderRootSync → workLoopSync. Bailout is attemptEarlyBailoutIfNoScheduledUpdate. The list fibers are cloned and skipped.",
  },
  {
    kicker: "Commit",
    title: "The keystroke commits and the browser paints",
    picture: "The letter appears. The UI feels fluid even though background work is unfinished.",
    mechanism:
      "Commit is synchronous. root.current now includes the typed letter. The list is still the old list.",
    source:
      "commitRoot → commitMutationEffects → root.current = finishedWork. Then the browser paints.",
  },
  {
    kicker: "Back to low",
    title: "The list render starts again",
    picture: "Video: React goes back to the low-priority update and finishes it.",
    mechanism:
      "It restarts from the root, on top of the new current tree, so the list render sees the latest query. Bailouts and memo make the redo cheap. Resuming exactly where it stopped is not what React 18 or 19 do.",
    source:
      "ensureRootIsScheduled schedules the remaining transition lanes. A new renderRootConcurrent begins with prepareFreshStack. The work loop never resumes a discarded tree.",
  },
  {
    kicker: "Commit",
    title: "The list commits",
    picture: "Both updates are on screen, in priority order.",
    mechanism:
      "If the user had kept typing, the transition could have been restarted several times. That is the trade: wasted render work in exchange for input that never waits.",
    source: "This is why render must be pure: React can call it, discard it, and call it again.",
  },
];

type Bar = {
  label: string;
  fill: number;
  tone: "low" | "high" | "done-low" | "done-high" | "dead";
};

const VISUAL: { current: string; bars: Bar[] }[] = [
  {
    current: "query: “ca” · list: old",
    bars: [{ label: "WIP · list (transition)", fill: 45, tone: "low" }],
  },
  {
    current: "query: “ca” · list: old",
    bars: [
      { label: "WIP · list (transition)", fill: 55, tone: "low" },
      { label: "queued · keystroke (SyncLane)", fill: 0, tone: "high" },
    ],
  },
  {
    current: "query: “ca” · list: old",
    bars: [
      { label: "WIP · list — discarded", fill: 55, tone: "dead" },
      { label: "queued · keystroke (SyncLane)", fill: 0, tone: "high" },
    ],
  },
  {
    current: "query: “ca” · list: old",
    bars: [{ label: "WIP · keystroke (SyncLane)", fill: 70, tone: "high" }],
  },
  {
    current: "query: “cat” · list: old",
    bars: [{ label: "committed · keystroke", fill: 100, tone: "done-high" }],
  },
  {
    current: "query: “cat” · list: old",
    bars: [{ label: "WIP · list, restarted", fill: 35, tone: "low" }],
  },
  {
    current: "query: “cat” · list: new",
    bars: [{ label: "committed · list", fill: 100, tone: "done-low" }],
  },
];

function Visual({ index }: { index: number }) {
  const frame = VISUAL[index];
  return (
    <Panel>
      <p className="font-mono text-xs tracking-widest text-mist uppercase">root.current</p>
      <p className="mt-1 font-mono text-sm text-paper">{frame.current}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {frame.bars.map((bar) => (
          <li key={bar.label}>
            <p className="font-mono text-xs text-mist">{bar.label}</p>
            <div
              className="mt-1 h-4 overflow-hidden rounded-sm border border-line bg-ink"
              aria-hidden="true"
            >
              <div
                className={cn(
                  "h-full transition-[width] duration-500",
                  bar.tone === "low" && "bg-mist",
                  bar.tone === "high" && "bg-copper",
                  bar.tone === "done-high" && "bg-copper",
                  bar.tone === "done-low" && "bg-[#7fb38a]",
                  bar.tone === "dead" && "bg-line",
                )}
                style={{ width: `${bar.fill}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function InterruptLab() {
  return <FrameLab frames={FRAMES} renderVisual={(index) => <Visual index={index} />} />;
}

/** The video's four-level list next to the lanes that implement it. */
export const PRIORITY_LADDER = [
  {
    video: "1 · Discrete event — click, typing",
    lane: "SyncLane",
    note: "Renders before paint, no yielding.",
  },
  {
    video: "2 · Scroll",
    lane: "InputContinuousLane",
    note: "Also drag, mousemove, pointer moves.",
  },
  {
    video: "3 · Normal — data fetch",
    lane: "DefaultLane",
    note: "setState outside an event or transition.",
  },
  {
    video: "4 · Very low — route change",
    lane: "TransitionLanes / IdleLane",
    note: "Only if the router wraps navigation in startTransition. Otherwise it is whatever lane the event gave it.",
  },
];
