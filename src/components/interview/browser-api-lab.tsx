import { useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Button, Panel } from "@/components/guide/ui";

type IdleWindow = Window & {
  requestIdleCallback?: (
    cb: (deadline: { timeRemaining: () => number; didTimeout: boolean }) => void,
    opts?: { timeout: number },
  ) => number;
};

/** Where to start · the two browser APIs the video names, plus the one React's scheduler really uses. */
export function BrowserApiLab() {
  const [idle, setIdle] = useState<string>("Not measured yet.");
  const [frames, setFrames] = useState<string>("Not measured yet.");
  const [channel, setChannel] = useState<string>("Not measured yet.");

  function probeIdle() {
    const w = window as IdleWindow;
    if (typeof w.requestIdleCallback !== "function") {
      setIdle("requestIdleCallback is not available in this browser. React does not need it.");
      return;
    }
    const samples: number[] = [];
    const take = () =>
      w.requestIdleCallback!((deadline) => {
        samples.push(deadline.timeRemaining());
        if (samples.length < 5) take();
        else
          setIdle(
            `timeRemaining() at the start of 5 idle periods: ${samples.map((s) => s.toFixed(1)).join(", ")} ms. The spec caps it at 50 ms.`,
          );
      });
    take();
  }

  function probeFrames() {
    const stamps: number[] = [];
    const tick = (now: number) => {
      stamps.push(now);
      if (stamps.length < 7) requestAnimationFrame(tick);
      else {
        const gaps = stamps.slice(1).map((value, index) => value - stamps[index]);
        const avg = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
        setFrames(
          `Gap between frames: ${gaps.map((g) => g.toFixed(1)).join(", ")} ms. About ${Math.round(1000 / avg)} Hz.`,
        );
      }
    };
    requestAnimationFrame(tick);
  }

  function probeChannel() {
    const port = new MessageChannel();
    const hops: number[] = [];
    let start = performance.now();
    port.port1.onmessage = () => {
      hops.push(performance.now() - start);
      if (hops.length < 5) {
        start = performance.now();
        port.port2.postMessage(null);
      } else {
        port.port1.close();
        setChannel(
          `postMessage → onmessage: ${hops.map((h) => h.toFixed(2)).join(", ")} ms. A macrotask, without setTimeout’s clamping.`,
        );
      }
    };
    port.port2.postMessage(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Probe
          title="requestIdleCallback"
          body="“Are you idle?” The browser answers with a deadline."
          result={idle}
          onRun={probeIdle}
        />
        <Probe
          title="requestAnimationFrame"
          body="“I am about to paint. Anything first?”"
          result={frames}
          onRun={probeFrames}
        />
        <Probe
          title="MessageChannel"
          body="What React’s scheduler posts to get the next slice."
          result={channel}
          onRun={probeChannel}
        />
      </div>
      <Layer id="picture">
        <p>
          The video’s advice is to learn these two browser APIs first, because concurrent React is
          built around the same idea: do work when the browser is free, get out of the way before it
          paints. That idea is portable to any framework, including Preact and Inferno, which have
          no scheduler of their own.
        </p>
      </Layer>
      <Layer id="mechanism">
        <p>
          React experimented with requestIdleCallback early on and moved away from it: idle
          callbacks fire too rarely when the page is busy, and the deadline is tuned for “nice to
          have” work, not for rendering. The scheduler instead posts a MessageChannel message, works
          for about 5 ms, checks the clock, and posts again. requestAnimationFrame is not where
          React commits. Commit runs right when a render finishes, then the browser paints at its
          next frame.
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          packages/scheduler/src/forks/Scheduler.js: schedulePerformWorkUntilDeadline uses
          setImmediate in Node, MessageChannel in browsers, and setTimeout as a last resort.
          shouldYieldToHost compares getCurrentTime() - startTime with frameInterval (frameYieldMs,
          5 ms). Task order is a min-heap (SchedulerMinHeap.js) keyed by expiration time — the
          “priority heap” the video mentions.
        </p>
      </Layer>
    </div>
  );
}

function Probe({
  title,
  body,
  result,
  onRun,
}: {
  title: string;
  body: string;
  result: string;
  onRun: () => void;
}) {
  return (
    <Panel className="flex flex-col gap-3">
      <p className="font-mono text-sm text-copper">{title}</p>
      <p className="text-sm text-paper">{body}</p>
      <Button type="button" variant="solid" onClick={onRun}>
        Measure
      </Button>
      <p className="font-mono text-xs text-mist" aria-live="polite">
        {result}
      </p>
    </Panel>
  );
}
