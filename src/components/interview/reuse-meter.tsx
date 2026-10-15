import { useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Panel } from "@/components/guide/ui";
import { reuseStats } from "@/lib/interview-sim";
import { cn } from "@/lib/cn";

/** Follow-up · memory. Two trees, recycled. memo saves calls, not fibers. */
export function ReuseMeter() {
  const [rows, setRows] = useState(200);
  const [memo, setMemo] = useState(true);
  const stats = reuseStats(rows, 4, memo);
  const max = Math.max(
    ...stats.map((item) => Math.max(item.fibersAllocated, item.componentCalls)),
    1,
  );

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase">
        Rows in the list · {rows}
        <input
          type="range"
          min={10}
          max={2000}
          step={10}
          value={rows}
          onChange={(e) => setRows(Number(e.target.value))}
        />
      </label>
      <button
        type="button"
        aria-pressed={memo}
        onClick={() => setMemo((value) => !value)}
        className={cn(
          "min-h-11 rounded-md border px-3 text-left font-mono text-sm",
          memo ? "border-copper bg-copper text-ink" : "border-line text-paper",
        )}
      >
        {memo ? "Rows are memo’d, props stable" : "Rows are not memo’d"}
      </button>
      <Panel>
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-3">
          {stats.map((item) => (
            <div key={item.render} className="contents">
              <p className="font-mono text-xs text-mist">
                render {item.render}
                <br />
                {item.render === 1 ? "mount" : "update"}
              </p>
              <div className="flex flex-col gap-1">
                <Bar
                  label="new fiber objects"
                  value={item.fibersAllocated}
                  max={max}
                  tone="bg-copper"
                />
                <Bar
                  label="component calls"
                  value={item.componentCalls}
                  max={max}
                  tone="bg-paper"
                />
                <p className="font-mono text-[11px] text-mist">
                  live fibers {item.liveFibers.toLocaleString("en-US")} · recycled{" "}
                  {item.fibersRecycled.toLocaleString("en-US")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Layer id="picture">
        <p>
          The video’s worry is fair: the fiber tree stays in memory and React keeps a second one
          while it works. The answer is reuse. After the second render nothing new is allocated for
          these fibers. React flips between the two copies.
        </p>
      </Layer>
      <Layer id="mechanism">
        <p>
          memo and useMemo reduce how many component functions run and how many elements and
          closures get allocated during render. They do not remove fibers: a memo’d row still has a
          fiber and an alternate. On a memory-tight device the lever for fiber count is how many
          components exist at all — virtualize long lists.
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          createWorkInProgress(current, pendingProps): if current.alternate is null, createFiber;
          otherwise reuse it and reset flags, subtreeFlags, and deletions. This meter is a teaching
          model: it counts the root, the list, and one fiber per row, and ignores host children and
          hook objects.
        </p>
      </Layer>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 overflow-hidden rounded-sm bg-ink" aria-hidden="true">
        <div
          className={cn("h-full transition-[width] duration-300", tone)}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <p className="w-36 shrink-0 font-mono text-[11px] text-paper">
        {value.toLocaleString("en-US")} {label}
      </p>
    </div>
  );
}
