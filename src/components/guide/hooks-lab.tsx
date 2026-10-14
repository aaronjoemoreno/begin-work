import { useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Button, Panel } from "@/components/guide/ui";

type HookNode = {
  name: string;
  state: string;
  pending: string | null;
};

const MOUNT: HookNode[] = [
  { name: "useState", state: "n = 0", pending: null },
  { name: "useState", state: "on = true", pending: null },
  { name: "useEffect", state: "deps [0]", pending: null },
];

const SAMPLE = `function Counter() {
  const [n, setN] = useState(0)
  const [on, setOn] = useState(true)
  useEffect(() => { document.title = n }, [n])
}`;

export function HooksLab() {
  const [phase, setPhase] = useState<"mount" | "queued" | "rendered" | "mismatch">("mount");
  const [hooks, setHooks] = useState<HookNode[]>(MOUNT);

  function mount() {
    setPhase("mount");
    setHooks(MOUNT.map((hook) => ({ ...hook })));
  }

  function queue() {
    setPhase("queued");
    setHooks(MOUNT.map((hook, index) => (index === 0 ? { ...hook, pending: "update 1, SyncLane" } : { ...hook })));
  }

  function render() {
    setPhase("rendered");
    setHooks([
      { name: "useState", state: "n = 1", pending: null },
      { name: "useState", state: "on = true", pending: null },
      { name: "useEffect", state: "deps [1] · HookHasEffect", pending: null },
    ]);
  }

  function mismatch() {
    setPhase("mismatch");
    setHooks([
      { name: "useState", state: "n = 1 (this part is fine)", pending: null },
      { name: "useEffect", state: "read as hook 1, but hook 1 was useState", pending: null },
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <pre className="font-mono text-sm whitespace-pre-wrap text-mist">{SAMPLE}</pre>
        <ol className="mt-4 flex flex-col gap-2">
          {hooks.map((hook, index) => (
            <li key={`${hook.name}-${index}`} className="rounded-md border border-line px-3 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-sm text-paper">
                  hook {index} · {hook.name}
                </span>
                {index < hooks.length - 1 ? <span className="font-mono text-xs text-copper">next</span> : null}
              </div>
              <p className="mt-1 font-mono text-xs text-mist">{hook.state}</p>
              {hook.pending ? <p className="mt-1 font-mono text-xs text-copper">pending · {hook.pending}</p> : null}
            </li>
          ))}
        </ol>
      </Panel>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" onClick={mount}>
          Mount
        </Button>
        <Button type="button" onClick={queue}>
          setN(1)
        </Button>
        <Button type="button" variant="solid" onClick={render} disabled={phase === "mismatch"}>
          Render update
        </Button>
        <Button type="button" onClick={mismatch}>
          Skip a hook
        </Button>
      </div>
      {phase === "mount" ? (
        <p className="text-sm text-paper">
          First render. The dispatcher is HooksDispatcherOnMount. Each call allocates a hook and links it. There is
          no current list to walk.
        </p>
      ) : null}
      {phase === "queued" ? (
        <p className="text-sm text-paper">
          dispatchSetState did not render. It appended an update to hook 0's circular queue and scheduled the
          fiber. The screen still shows 0 until the work loop calls the component again.
        </p>
      ) : null}
      {phase === "rendered" ? (
        <p className="text-sm text-paper">
          HooksDispatcherOnUpdate walks the old list in call order. Hook 0 reduces 0 to 1. Hook 1 has an empty queue,
          so it keeps true. Hook 2 sees deps [0] versus [1], so the effect is tagged HookHasEffect and will run after
          paint. Not before.
        </p>
      ) : null}
      {phase === "mismatch" ? (
        <p className="text-sm text-paper">
          The second call is now useEffect, but the fiber's second hook is a useState queue. React throws. The
          rule of hooks is this linked list, not a style guide. Conditional hooks move the pointer.
        </p>
      ) : null}
      <Layer id="picture">
        <p>
          Hooks are a linked list on the function component's fiber. React does not match them by name. It
          matches them by the order of the calls. That is the whole constraint.
        </p>
      </Layer>
      <Layer id="mechanism">
        <p>
          renderWithHooks sets the dispatcher, then calls your function. On mount, each hook creates a node. On
          update, each hook reads the next node from the current fiber and clones it onto the work-in-progress
          fiber. useEffect's object is also pushed onto the fiber's effect list. Commit runs that list. If
          the deps were equal, the effect is pushed without HookHasEffect, and commit skips it.
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          ReactFiberHooks.js. A hook is memoizedState, baseState, baseQueue, queue, and next. The state queue is
          circular: queue.pending points at the last update, and last.next points at the first. updateReducer
          rebases skipped lanes onto baseState so a high-priority render does not drop a transition update that was
          not included. Class state does not use this list. It uses fiber.updateQueue, and fiber.memoizedState is the
          state object. stateNode is the instance.
        </p>
      </Layer>
    </div>
  );
}
