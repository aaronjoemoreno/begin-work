import { useEffect, useMemo, useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Button, Panel } from "@/components/guide/ui";
import { simulateMainThread, type SlotKind, type ThreadMode } from "@/lib/interview-sim";
import { cn } from "@/lib/cn";

const WORD = "hello";
const KEY_TIMES = [2, 6, 11, 15, 21];
const RENDER_UNITS = 28;

const TONE: Record<SlotKind, string> = {
  render: "bg-copper",
  commit: "bg-paper",
  input: "bg-mist",
  paint: "bg-[#7fb38a]",
  idle: "bg-transparent",
  yield: "bg-transparent",
};

const LEGEND: { kind: SlotKind; label: string }[] = [
  { kind: "render", label: "render work" },
  { kind: "commit", label: "commit" },
  { kind: "input", label: "keydown handler" },
  { kind: "paint", label: "paint" },
];

/**
 * Q2 · The stack reconciler blocks the main thread; a fiber render yields between units.
 * The user "types" hello while a big list renders. Watch when each letter reaches the screen.
 */
export function MainThreadLab() {
  const [mode, setMode] = useState<ThreadMode>("stack");
  const [slice, setSlice] = useState(4);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);

  const result = useMemo(
    () =>
      simulateMainThread({
        mode,
        renderUnits: RENDER_UNITS,
        sliceUnits: slice,
        keystrokes: WORD.split("").map((char, index) => ({ char, at: KEY_TIMES[index] })),
      }),
    [mode, slice],
  );

  const end = Math.max(result.end, 1);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setT((value) => {
        if (value >= end) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, 140);
    return () => window.clearInterval(id);
  }, [playing, end]);

  function restart(nextMode?: ThreadMode) {
    if (nextMode) setMode(nextMode);
    setT(0);
    setPlaying(true);
  }

  const pressed = result.keys
    .filter((key) => key.pressedAt <= t)
    .map((key) => key.char)
    .join("");
  const painted = result.keys
    .filter((key) => key.paintedAt !== null && key.paintedAt <= t)
    .map((key) => key.char)
    .join("");
  const current = result.slots.find(
    (slot) => slot.length > 0 && t >= slot.start && t < slot.start + slot.length,
  );
  const rendered = result.slots
    .filter((slot) => slot.kind === "render")
    .reduce((sum, slot) => sum + Math.max(0, Math.min(slot.length, t - slot.start)), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Reconciler">
        {(["stack", "fiber"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={mode === item}
            onClick={() => restart(item)}
            className={cn(
              "min-h-11 rounded-md border px-2 font-mono text-sm",
              mode === item ? "border-copper bg-copper text-ink" : "border-line text-paper",
            )}
          >
            {item === "stack" ? "Stack reconciler (≤ 15)" : "Fiber, time-sliced (16+)"}
          </button>
        ))}
      </div>

      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-widest text-mist uppercase">User pressed</p>
            <p className="mt-1 min-h-8 font-mono text-xl text-mist">{pressed || "·"}</p>
          </div>
          <div>
            <p className="font-mono text-xs tracking-widest text-mist uppercase">Screen shows</p>
            <p className="mt-1 flex min-h-8 items-center rounded-md border border-line bg-ink px-2 font-mono text-xl text-paper">
              {painted}
              <span
                className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-copper"
                aria-hidden="true"
              />
            </p>
          </div>
        </div>

        <p className="mt-4 font-mono text-xs tracking-widest text-mist uppercase">Main thread</p>
        <div
          className="relative mt-2 h-10 w-full overflow-hidden rounded-sm border border-line bg-ink"
          aria-hidden="true"
        >
          {result.slots.map((slot, index) =>
            slot.kind === "yield" ? (
              <div
                key={index}
                className="absolute inset-y-0 w-0.5 bg-paper/70"
                style={{ left: `${(slot.start / end) * 100}%` }}
              />
            ) : (
              <div
                key={index}
                className={cn(
                  "absolute inset-y-1 rounded-[2px] transition-opacity",
                  TONE[slot.kind],
                  slot.kind === "render" && (slot.slice ?? 0) % 2 === 1 && "opacity-70",
                  t < slot.start && "opacity-15",
                )}
                style={{
                  left: `${(slot.start / end) * 100}%`,
                  width: `${(slot.length / end) * 100}%`,
                }}
              />
            ),
          )}
          {result.keys.map((key) => (
            <div
              key={key.char + key.pressedAt}
              className="absolute -top-0 font-mono text-[10px] text-mist"
              style={{ left: `${(key.pressedAt / end) * 100}%` }}
            >
              ↓{key.char}
            </div>
          ))}
          <div
            className="absolute inset-y-0 w-px bg-copper"
            style={{ left: `${(Math.min(t, end) / end) * 100}%` }}
          />
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {LEGEND.map((item) => (
            <li key={item.kind} className="flex items-center gap-2 font-mono text-xs text-mist">
              <span className={cn("inline-block h-3 w-3 rounded-[2px]", TONE[item.kind])} />
              {item.label}
            </li>
          ))}
          {mode === "fiber" ? (
            <li className="flex items-center gap-2 font-mono text-xs text-mist">
              <span className="inline-block h-3 w-0.5 bg-paper/70" />
              yield point
            </li>
          ) : null}
        </ul>

        <dl className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
          <div>
            <dt className="text-mist">Now</dt>
            <dd className="text-paper">{current?.label ?? (t >= end ? "done" : "idle")}</dd>
          </div>
          <div>
            <dt className="text-mist">Render</dt>
            <dd className="text-paper">
              {rendered} / {RENDER_UNITS} units
            </dd>
          </div>
          <div>
            <dt className="text-mist">Worst key → paint</dt>
            <dd className="text-copper">{result.maxLatency} units</dd>
          </div>
        </dl>
      </Panel>

      {mode === "fiber" ? (
        <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase">
          Units per slice before shouldYield · {slice}
          <input
            type="range"
            min={1}
            max={RENDER_UNITS}
            value={slice}
            onChange={(event) => {
              setSlice(Number(event.target.value));
              setT(0);
            }}
          />
        </label>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant="solid" onClick={() => restart()}>
          {t === 0 || t >= end ? "Play" : "Restart"}
        </Button>
        <Button type="button" onClick={() => setPlaying((value) => !value)} disabled={t >= end}>
          {playing ? "Pause" : "Resume"}
        </Button>
        <Button
          type="button"
          onClick={() => setT((value) => Math.min(end, value + 1))}
          disabled={t >= end}
        >
          Step
        </Button>
      </div>

      <Layer id="picture">
        <p>
          In stack mode every render function is on the call stack until the whole tree is done. The
          keydown events queue behind it, so the letters appear in a burst at the end. That is the
          “typing in a form shows nothing” moment from the video. In fiber mode the loop stops
          between fibers, the browser handles the key and paints, and the render picks up again.
          Same amount of render work. Very different feel.
        </p>
      </Layer>
      <Layer id="mechanism">
        <p>
          Drag the slice slider to the right and fiber mode turns back into stack mode: a slice as
          big as the whole render never yields. To the left, the input is snappier, but each yield
          has overhead and the render ends later. Real React picks the slice by time, not by count,
          and only for concurrent work. A discrete event like this keydown gets SyncLane and its own
          update renders without yielding.
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          workLoopSync: while (workInProgress !== null) performUnitOfWork(workInProgress).
          workLoopConcurrent adds
          {" && !shouldYield()"}. The stack reconciler (React ≤ 15) had no equivalent of
          workInProgress; the next thing to do was a return address on the JS call stack. This lab
          uses abstract units. Nothing is timed.
        </p>
      </Layer>
    </div>
  );
}
