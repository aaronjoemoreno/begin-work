import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DepthProvider, Layer, useDepth, type Depth } from "@/components/guide/depth";
import { BufferLab } from "@/components/guide/buffer-lab";
import { ChildrenLab } from "@/components/guide/children-lab";
import { FiberLab } from "@/components/guide/fiber-lab";
import { HooksLab } from "@/components/guide/hooks-lab";
import { LanesLab } from "@/components/guide/lanes-lab";
import { SuspenseLab } from "@/components/guide/suspense-lab";
import { CHAPTERS, Chapter, Kicker, Select } from "@/components/guide/ui";
import { WorkLoopLab } from "@/components/guide/work-loop";

const DEPTHS: { id: Depth; label: string }[] = [
  { id: "all", label: "All layers" },
  { id: "picture", label: "Picture" },
  { id: "mechanism", label: "Mechanism" },
  { id: "source", label: "Source" },
];

export function Guide() {
  return (
    <DepthProvider>
      <GuideBody />
    </DepthProvider>
  );
}

function GuideBody() {
  const { depth, setDepth } = useDepth();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max <= 0 ? 0 : root.scrollTop / max);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="fixed inset-x-0 top-0 z-30 h-1 bg-line" aria-hidden="true">
        <div className="h-full origin-left bg-copper" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <header className="sticky top-0 z-20 border-b border-line bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <a href="#top" className="font-mono text-sm tracking-widest text-paper uppercase">
              Begin Work
            </a>
            <div className="flex items-baseline gap-4">
              <Link to="/interview" className="font-mono text-xs text-copper hover:text-paper">
                Interview drill →
              </Link>
              <p className="hidden font-mono text-xs text-mist sm:block">React 19.2</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Reading depth">
            {DEPTHS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={depth === item.id}
                onClick={() => setDepth(item.id)}
                className={`min-h-11 rounded-md border px-2 font-mono text-sm ${
                  depth === item.id ? "border-copper bg-copper text-ink" : "border-line text-paper"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase xl:hidden">
            Jump
            <Select
              aria-label="Jump to a chapter"
              defaultValue=""
              onChange={(event) => {
                const id = event.target.value;
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <option value="" disabled>
                Chapter
              </option>
              {CHAPTERS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 xl:grid-cols-[14rem_minmax(0,1fr)]">
        <nav className="sticky top-36 hidden h-fit xl:block" aria-label="Chapters">
          <ol className="flex flex-col gap-1">
            {CHAPTERS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="flex min-h-11 items-center font-mono text-xs text-mist hover:text-paper">
                  {label}
                </a>
              </li>
            ))}
          </ol>
          <Link
            to="/interview"
            className="mt-4 flex min-h-11 items-center border-t border-line pt-3 font-mono text-xs text-copper hover:text-paper"
          >
            Interview drill: fiber, reconciliation, virtual DOM →
          </Link>
        </nav>

        <main id="top" className="min-w-0 pb-24">
          <header className="py-12 md:py-16">
            <Kicker>Field guide · reconciler</Kicker>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl text-paper md:text-6xl">
              How React decides what to do next
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-mist">
              From the sentence “UI is a function of state” down to the sibling pointers, the lane bits, and the
              one synchronous pass that is allowed to touch the DOM.
            </p>
            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              <Fact title="Child walk" body="One pass, with keys. Not a general tree diff." />
              <Fact title="Two phases" body="Render may be thrown away. Commit may not." />
              <Fact title="31 lanes" body="Priority is a bit in a mask, pinned here to React 19.2." />
            </dl>
            <p className="mt-6 max-w-2xl text-sm text-mist">
              The instruments stay visible on every layer. The switch above changes how much of the prose you are
              reading: the claim, the moving parts, or the names in the React 19.2 source.
            </p>
          </header>

          <Chapter
            id="orientation"
            index="01"
            title="The reconciler is the part that turns a description into a plan"
            lede="JSX does not update the screen. Your component does not update the screen. The reconciler builds a plan, and a host renderer carries it out."
          >
            <Layer id="picture">
              <p>
                You describe the UI you want. React remembers the UI it already committed. The reconciler is the
                comparison between those two, plus the scheduler that decides whether the comparison is allowed to
                finish right now. react-dom is not the reconciler. Neither is React Native. They are both clients of
                the same package, react-reconciler.
              </p>
            </Layer>
            <Layer id="mechanism">
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                <li>Something schedules an update: setState, a root render, a ping from a promise, a transition.</li>
                <li>The fiber’s lanes record how urgent it is. The root remembers that work exists.</li>
                <li>Render walks fibers. It may yield. It writes no visible DOM.</li>
                <li>Commit applies the notes in one synchronous pass. Then the browser paints.</li>
                <li>Passive effects run after paint. They are not part of the paint.</li>
              </ol>
            </Layer>
            <Layer id="source">
              <p className="font-mono text-sm leading-relaxed">
                scheduleUpdateOnFiber → ensureRootIsScheduled → performSyncWorkOnRoot or
                performConcurrentWorkOnRoot → renderRootSync or renderRootConcurrent → workLoopSync or
                workLoopConcurrent → commitRoot. The entry from a renderer is updateContainer in
                ReactFiberReconciler.js. The loop lives in ReactFiberWorkLoop.js. Read performUnitOfWork before you
                read the file from the top. It is thousands of lines of scheduling around a small loop.
              </p>
            </Layer>
          </Chapter>

          <Chapter
            id="objects"
            index="02"
            title="Three objects get called the virtual DOM"
            lede="They are not interchangeable. Most of the confusion in older explanations comes from using one name for all three."
          >
            <div className="grid gap-3">
              <ObjectCard
                name="Element"
                meta="plain object, thrown away every render"
                body="What JSX returns. type, key, props, ref. No state. No pointers to the screen. Creating one is cheap and does nothing visible."
              />
              <ObjectCard
                name="Fiber"
                meta="mutable, kept across renders"
                body="The unit of work. State, effects, lanes, and the links to parent, first child, and next sibling. This is what the reconciler actually walks."
              />
              <ObjectCard
                name="Host node"
                meta="DOM node, native view, terminal cell"
                body="The thing in the outside world. A host fiber points at it from stateNode. Function components do not have one. Their memory is the hook list."
              />
            </div>
            <Layer id="picture">
              <p>
                A render produces a new element tree. The reconciler turns that into an updated fiber tree by reusing
                fibers it can prove are the same component. Only the host fibers at the edge turn into real nodes,
                and only the ones with flags are touched during commit.
              </p>
            </Layer>
            <Layer id="mechanism">
              <p>
                JSX compiles to calls in react/jsx-runtime. Those calls return elements. beginWork is where an
                element becomes a fiber: either a fresh one, or the alternate of the fiber from last time.
                completeWork is where a host fiber learns its DOM node on mount. Commit is where an existing DOM
                node is moved, updated, or removed.
              </p>
            </Layer>
            <Layer id="source">
              <p className="font-mono text-sm leading-relaxed">
                An element’s $$typeof is checked so a plain object cannot sneak into the tree. createFiberFromTypeAndProps
                picks the work tag. Host stateNode is assigned in completeWork through the host config. If you are
                holding “the virtual DOM” in your head as one tree of DOM-shaped objects, split it into these three
                or the rest of this guide will feel like trivia.
              </p>
            </Layer>
          </Chapter>

          <Chapter
            id="fiber"
            index="03"
            title="A fiber is a unit of work with a resume point"
            lede="The tree is not an array of children. It is three pointers, so the walk can be a loop instead of a call stack."
          >
            <Layer id="picture">
              <p>
                React 15 rendered by recursing. The call stack was the work list, so a render had to finish. Fiber
                makes every component a node you can stop on. The next thing to do is a variable, workInProgress, not
                a return address. That is the whole architectural bet.
              </p>
            </Layer>
            <FiberLab />
          </Chapter>

          <Chapter
            id="loop"
            index="04"
            title="The work loop is depth-first, and it can stop between fibers"
            lede="Down the first child is begin. Back up, then across to the sibling, is complete. Commit happens only after the root completes."
          >
            <WorkLoopLab />
            <Layer id="picture">
              <p>
                Begin means “process this node and tell me the next child.” Complete means “this subtree is as
                finished as it is going to get in this attempt.” A function component runs during begin. A DOM node
                is created during complete, off the document, if it does not exist yet. The screen changes later.
              </p>
            </Layer>
            <Layer id="mechanism">
              <p>
                Bailout is the other path through begin. If the props are the same, no lane on this fiber overlaps
                the render, and no context it reads changed, React clones the finished child fibers instead of
                calling the component again. It still walks a child if childLanes says something underneath has
                work. That is why a setState in a leaf still reaches the leaf when the parent memoizes: the parent
                bails out of its own function, then follows the lane down.
              </p>
            </Layer>
            <Layer id="source">
              <p className="font-mono text-sm leading-relaxed">
                workLoopSync is while (workInProgress !== null) performUnitOfWork. workLoopConcurrent adds
                && !shouldYield(). shouldYield comes from the scheduler package, which timeslices with a
                MessageChannel macrotask and a few milliseconds of budget. Context changes are tracked on
                fiber.dependencies. Object.is on the provider value decides whether consumers can bail out.
                memo and SimpleMemoComponent do a shallow props compare before renderWithHooks. The React Compiler
                does not replace this loop. It emits caches so those compares succeed more often.
              </p>
            </Layer>
          </Chapter>

          <Chapter
            id="children"
            index="05"
            title="Keys are identity. Moves fall out of one integer."
            lede="The child reconciler does not compute a diff. It reuses a fiber when the key and the type still match, and it flags the rest."
          >
            <ChildrenLab />
          </Chapter>

          <Chapter
            id="buffer"
            index="06"
            title="Render writes the hidden tree"
            lede="Current is what commit published. Work-in-progress is the clone. They trade places. The screen never points at a tree that was abandoned halfway."
          >
            <BufferLab />
          </Chapter>

          <Chapter
            id="hooks"
            index="07"
            title="Hooks are a linked list the next render has to walk in order"
            lede="There is no registry of hook names. There is a pointer, and your function calls move it."
          >
            <HooksLab />
          </Chapter>

          <Chapter
            id="lanes"
            index="08"
            title="Urgency is a bit, so a click can cut in line without erasing the rest"
            lede="React 19.2 keeps 31 lanes in one number. The lowest set bit wins. The other bits stay pending."
          >
            <LanesLab />
          </Chapter>

          <Chapter
            id="commit"
            index="09"
            title="Commit is the pass that is not allowed to stop"
            lede="Render took notes on fibers. Commit reads the notes and talks to the host. The browser has not painted until this pass returns."
          >
            <Layer id="picture">
              <p>
                If render were allowed to move DOM nodes as it went, an interrupted update would leave the page torn.
                So render only sets flags. Commit walks the finished tree once, synchronously, and applies every
                flag it finds. After it returns, the browser can paint. Effects that were marked passive run after
                that paint. Layout effects run before it.
              </p>
            </Layer>
            <ol className="flex flex-col gap-3">
              <Phase
                n="1"
                title="Before mutation"
                body="Read the host before anything changes. Class getSnapshotBeforeUpdate lives here. The snapshot is passed to componentDidUpdate later."
              />
              <Phase
                n="2"
                title="Mutation"
                body="Insert, update, and delete host nodes. Detach refs from nodes that are going away. This is the pass that can be seen."
              />
              <Phase
                n="3"
                title="Layout"
                body="useLayoutEffect, componentDidMount, componentDidUpdate, and attaching refs. The browser still has not painted, so measuring the DOM here is coherent and also blocks paint."
              />
              <Phase
                n="4"
                title="Passive"
                body="useEffect. Scheduled so the browser can paint first. Cleanup from the previous commit runs before the next create. It is not “async setState.” It is “after paint.”"
              />
            </ol>
            <Layer id="mechanism">
              <p>
                subtreeFlags are why this walk is cheap on a quiet page. A fiber whose flags and subtreeFlags are
                empty is skipped, along with its children. Deletions are processed from the parent’s deletions list
                because those fibers are no longer reachable as children. Strict Mode in development double-invokes
                render and replays passive effects to surface missing cleanups. That is a dev-only extra pass over
                the same machinery, not a second algorithm.
              </p>
            </Layer>
            <Layer id="source">
              <p className="font-mono text-sm leading-relaxed">
                commitRoot in ReactFiberWorkLoop.js, with the host work split across ReactFiberCommitWork.js,
                ReactFiberCommitEffects.js, and ReactFiberCommitHostEffects.js. In React 19.2, Placement is bit 1,
                Update is bit 2, ChildDeletion is bit 4, Passive is the passive-effect bit. PassiveMask is Passive |
                Visibility | ChildDeletion. Mutation also consumes Placement, Update, ContentReset, Ref, Hydrating,
                and Visibility. Hydration is the mount path that attaches to existing DOM instead of calling
                createInstance. A mismatch sets the tree up to client-render. A click on a dehydrated boundary can
                be promoted with SelectiveHydrationLane so that region hydrates first.
              </p>
            </Layer>
          </Chapter>

          <Chapter
            id="suspense"
            index="10"
            title="Suspense is a boundary the work loop can unwind to"
            lede="Throwing a promise is how a render says “I cannot finish this subtree.” It is not an error, and it is not a fetch."
          >
            <SuspenseLab />
          </Chapter>

          <Chapter
            id="host"
            index="11"
            title="The reconciler does not know what a DOM node is"
            lede="react-reconciler exports a function. You pass a host config. react-dom’s config speaks DOM. A custom renderer speaks something else. The work loop stays."
          >
            <Layer id="picture">
              <p>
                Everything above this chapter is renderer-neutral. The moment a fiber becomes a div, React calls a
                method you could have implemented yourself. That seam is why the same reconciler drives the DOM,
                React Native, a three.js scene, or a terminal.
              </p>
            </Layer>
            <ul className="flex flex-col gap-2">
              {HOST_ROWS.map((row) => (
                <li key={row.method} className="rounded-md border border-line px-4 py-3">
                  <p className="font-mono text-sm text-copper">{row.method}</p>
                  <p className="mt-1 font-mono text-xs text-mist">{row.when}</p>
                  <p className="mt-1 text-sm text-paper">{row.what}</p>
                </li>
              ))}
            </ul>
            <Layer id="mechanism">
              <p>
                On mount, completeWork builds a detached tree: createInstance, then appendInitialChild, then
                finalizeInitialChildren. Those nodes are not in the document. Commit inserts the top host node that
                actually attaches to an existing parent. On update, prepareUpdate returns a payload or null.
                Null means “no Update flag.” commitUpdate applies the payload. Portals are fibers whose host parent
                is a different container than their React parent. The return pointer still points at the React
                parent. The host parent is found by walking to the portal’s stateNode.
              </p>
            </Layer>
            <Layer id="source">
              <p className="font-mono text-sm leading-relaxed">
                The public entry is Reconciler(hostConfig). react-dom’s implementation is the host config object
                passed into that factory. supportsMutation is true for the DOM. getCurrentEventPriority maps the
                native event to a lane, which is how a click becomes SyncLane and a mousemove becomes
                InputContinuousLane. HostHoistable (tag 26) and HostSingleton (tag 27) are how React 19 hoists
                title, meta, link, and stylesheet tags. That hoisting is a host behavior sitting on the same fiber
                walk. In React 19, ref is a normal prop. forwardRef still works. The reconciler did not grow a
                second ref system.
              </p>
            </Layer>
          </Chapter>

          <Chapter
            id="trace"
            index="12"
            title="One click, from the event to the passive effect"
            lede="Hold a single setState in your head and name every handoff. If you can do that, you can read a profile."
          >
            <ol className="flex flex-col gap-4">
              {TRACE.map((beat, index) => (
                <li key={beat.title} className="rounded-md border border-line px-4 py-4">
                  <p className="font-mono text-xs text-copper">
                    {String(index + 1).padStart(2, "0")} · {beat.where}
                  </p>
                  <h3 className="mt-1 font-serif text-xl text-paper">{beat.title}</h3>
                  <div className="mt-3 flex flex-col gap-3">
                    <Layer id="picture">
                      <p>{beat.picture}</p>
                    </Layer>
                    <Layer id="mechanism">
                      <p>{beat.mechanism}</p>
                    </Layer>
                    <Layer id="source">
                      <p className="font-mono text-sm leading-relaxed">{beat.source}</p>
                    </Layer>
                  </div>
                </li>
              ))}
            </ol>
          </Chapter>

          <Chapter
            id="myths"
            index="13"
            title="Models that feel right and teach the wrong thing"
            lede="If one of these is still the picture in your head, the source will look arbitrary. It is not."
          >
            <ul className="flex flex-col gap-3">
              {MYTHS.map((myth) => (
                <li key={myth.claim} className="rounded-md border border-line px-4 py-4">
                  <p className="font-serif text-lg text-paper">{myth.claim}</p>
                  <p className="mt-2 text-sm text-mist">{myth.fix}</p>
                </li>
              ))}
            </ul>
          </Chapter>

          <Chapter
            id="map"
            index="14"
            title="A reading order for the real source"
            lede="Do not start at line 1 of the work loop. Start at the struct, then the walk, then one feature."
          >
            <ol className="flex flex-col gap-3">
              {FILES.map((file, index) => (
                <li key={file.name} className="grid gap-1 border-t border-line pt-3 sm:grid-cols-2">
                  <p className="font-mono text-sm text-copper">
                    {String(index + 1).padStart(2, "0")} {file.name}
                  </p>
                  <p className="text-sm text-paper">{file.why}</p>
                </li>
              ))}
            </ol>
            <Layer id="picture">
              <p>
                The history is three bets. React 15 rendered on the stack and could not stop. React 16 made the
                unit of work explicit so it could. React 18 made the priority of that work a lane, and shipped
                concurrent rendering as the default for createRoot. React 19 adds Actions, use(), and Activity on
                top of the same loop. The compiler sits outside it.
              </p>
            </Layer>
            <Layer id="source">
              <p className="font-mono text-sm leading-relaxed">
                Package paths, React 19.2: packages/react-reconciler/src for the loop,
                packages/react-dom-bindings for the DOM host config, packages/scheduler for shouldYield. Bit
                positions in this guide are from that tag. They move between majors. The shape — fiber, two phases,
                keys, lanes, a host config — is the part that has stayed.
              </p>
            </Layer>
            <Glossary />
          </Chapter>

          <section className="border-t border-line py-12 md:py-16">
            <p className="font-mono text-xs tracking-widest text-copper uppercase">Next · practice</p>
            <h2 className="mt-2 font-serif text-3xl text-paper md:text-4xl">Say it out loud: the interview drill</h2>
            <p className="mt-3 max-w-2xl text-lg text-mist">
              A companion to theSeniorDev’s senior React interview video: three questions and five follow-ups on fiber,
              reconciliation, and the virtual DOM, each with a lab, a correction against the source, and a quick check.
            </p>
            <Link
              to="/interview"
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-copper px-4 font-mono text-sm text-ink"
            >
              Open the interview drill →
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-line px-4 py-3">
      <dt className="font-mono text-xs tracking-widest text-copper uppercase">{title}</dt>
      <dd className="mt-1 text-sm text-paper">{body}</dd>
    </div>
  );
}

function ObjectCard({ name, meta, body }: { name: string; meta: string; body: string }) {
  return (
    <article className="rounded-md border border-line px-4 py-4">
      <h3 className="font-serif text-2xl text-paper">{name}</h3>
      <p className="mt-1 font-mono text-xs text-copper">{meta}</p>
      <p className="mt-2 text-sm text-mist">{body}</p>
    </article>
  );
}

function Phase({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-md border border-line px-4 py-3">
      <span className="font-mono text-sm text-copper">{n}</span>
      <div>
        <h3 className="font-serif text-xl text-paper">{title}</h3>
        <p className="mt-1 text-sm text-mist">{body}</p>
      </div>
    </li>
  );
}

const HOST_ROWS = [
  { method: "createInstance", when: "complete, mount", what: "Make a detached host node." },
  { method: "createTextInstance", when: "complete, mount", what: "Make a text node." },
  { method: "appendInitialChild", when: "complete, mount", what: "Attach a child before the parent is in the document." },
  { method: "finalizeInitialChildren", when: "complete, mount", what: "Last chance on mount. Autofocus is decided here." },
  { method: "prepareUpdate", when: "complete, update", what: "Diff props. Return a payload, or null to skip Update." },
  { method: "commitUpdate", when: "commit, mutation", what: "Apply the payload to a live node." },
  { method: "appendChild / insertBefore", when: "commit, mutation", what: "Place a node that was flagged Placement." },
  { method: "removeChild", when: "commit, mutation", what: "Drop a node listed in parent.deletions." },
  { method: "hideInstance / unhideInstance", when: "commit", what: "Suspense and Activity visibility without unmounting." },
  { method: "getCurrentEventPriority", when: "dispatch", what: "Map a native event to a lane." },
];

const TRACE = [
  {
    where: "Event",
    title: "The click is discrete",
    picture: "A click is not a suggestion. React treats it as work the user is waiting on.",
    mechanism: "The DOM binding maps the event to a priority before your handler runs. Inside the handler, setState inherits that priority unless you opt into a transition.",
    source: "getCurrentEventPriority. A discrete event maps to SyncLane. startTransition around the setState would claim a transition lane instead, on purpose.",
  },
  {
    where: "Hook",
    title: "dispatchSetState queues an update",
    picture: "setState does not change the screen. It records a request.",
    mechanism: "The update object goes onto that hook’s circular pending list. The fiber’s lane bit is set. Child lanes bubble to the root so ancestors know work exists below them.",
    source: "dispatchSetState in ReactFiberHooks.js, then scheduleUpdateOnFiber. The update’s lane is the event’s lane. Entangled lanes from the same event are marked so they flush together.",
  },
  {
    where: "Schedule",
    title: "The root flushes sync work now",
    picture: "For a click, React usually does not wait for a later frame. It renders before paint.",
    mechanism: "ensureRootIsScheduled sees a sync lane and calls the sync render path on this turn. A transition would instead schedule a callback and return to the browser.",
    source: "ensureRootIsScheduled → performSyncWorkOnRoot for SyncLane. Concurrent work goes through Scheduler.scheduleCallback and later performConcurrentWorkOnRoot.",
  },
  {
    where: "Render",
    title: "The work loop walks from the root",
    picture: "React does not start at the component that called setState. It starts at the root and bails out of everything that has no overlapping lane.",
    mechanism: "Parents with no work of their own still get visited. If their childLanes include this render’s lanes, the walk continues. Siblings with no lanes are cloned and skipped.",
    source: "renderRootSync → workLoopSync → performUnitOfWork → beginWork. Bailout is attemptEarlyBailoutIfNoScheduledUpdate / bailoutOnAlreadyFinishedWork.",
  },
  {
    where: "Render",
    title: "The component function runs",
    picture: "This is the only moment your function runs for this update. It must be pure. It may run more than once, and the extra runs must not matter.",
    mechanism: "renderWithHooks installs the update dispatcher, processes the queue, and produces elements. Those elements are reconciled into child fibers. Flags are notes, not DOM writes.",
    source: "updateFunctionComponent. memoizedProps is assigned from pendingProps after beginWork returns. Children go through reconcileChildFibers.",
  },
  {
    where: "Render",
    title: "Complete bubbles the notes",
    picture: "On the way back up, React decides whether a host node needs an update payload, and it summarizes the subtree for commit.",
    mechanism: "A changed DOM prop becomes an Update flag only if prepareUpdate returns something. Placement and ChildDeletion are already on the fibers from the child reconciler. Parents accumulate subtreeFlags.",
    source: "completeWork for HostComponent. bubble happens in completeUnitOfWork. If the root completes, finishedWork is that root fiber.",
  },
  {
    where: "Commit",
    title: "Mutation applies the host plan",
    picture: "This is the first moment the DOM changes. It runs to the end. There is no yield in the middle of a commit.",
    mechanism: "Inserts, property updates, and deletions land. The current tree pointer has not flipped yet at the start of the pass. By the end, root.current is the tree that was just finished.",
    source: "commitRoot → commitMutationEffects. Placement, Update, ChildDeletion, Ref, Hydrating, Visibility. Then root.current = finishedWork.",
  },
  {
    where: "Commit",
    title: "Layout effects run before paint",
    picture: "useLayoutEffect can read layout that matches what is about to be painted. It also delays that paint. That is the trade.",
    mechanism: "Refs are attached here. Class didMount and didUpdate run here. If a layout effect calls setState, React renders again before paint, still synchronously. That is a real nested update, and it is why layout effects should be rare.",
    source: "commitLayoutEffects. Passive effects are not in this function. They were collected and scheduled.",
  },
  {
    where: "Paint",
    title: "The browser paints the committed tree",
    picture: "The user sees the result of the click. useEffect has not run.",
    mechanism: "React returns to the event, the event ends, the browser paints. Anything you needed on screen for this frame had to happen in render or in layout, not in a passive effect.",
    source: "There is no React function called paint. The gap is the point. The scheduler’s next macrotask is what lets passive work lose the race to the frame.",
  },
  {
    where: "Passive",
    title: "useEffect runs after paint",
    picture: "Subscriptions, logging, and setting document title from an effect belong here. They are allowed to be late.",
    mechanism: "Cleanups from the previous effect run first, then the new create. If the effect calls setState, that is a new update with its own lane, usually a default or passive-derived one, not a continuation of the click.",
    source: "flushPassive effects, scheduled from commit. The effect objects were pushed during renderWithHooks with the Passive flag and, if deps changed, HookHasEffect. Unchanged deps omit HookHasEffect, so commit skips them.",
  },
];

const MYTHS = [
  {
    claim: "React diffs two virtual DOM trees.",
    fix: "It reconciles a list of elements against a sibling list of fibers, in one pass, with a key heuristic. A general tree diff is not what the code does, and it is not what the keys are for.",
  },
  {
    claim: "It only re-renders components whose props changed.",
    fix: "It re-renders the updated component and keeps walking children unless a bailout says otherwise. memo, the compiler, and unchanged references are what stop the walk. The default is to go.",
  },
  {
    claim: "The virtual DOM is why React is fast.",
    fix: "The expensive part is touching the host. The fiber design pays off by skipping host work, by bailing out, and by being able to throw a render away. Allocating elements is not the trick.",
  },
  {
    claim: "Keys are an optional performance hint.",
    fix: "Keys choose which fiber survives. The wrong key reuses the wrong state and looks like a haunted input. Index keys do that whenever the list reorders or inserts.",
  },
  {
    claim: "useEffect runs before the browser paints.",
    fix: "useLayoutEffect runs before paint. useEffect is passive and runs after. If the screen flickers, the work is in the wrong one.",
  },
  {
    claim: "setState is asynchronous.",
    fix: "Queueing the update is synchronous. Rendering it might be too, for a discrete event, or it might be later, for a transition. “Async” hides the lane.",
  },
  {
    claim: "A deleted component carries a Deletion flag in the new tree.",
    fix: "It is not in the new tree. The parent stores it on deletions and gets ChildDeletion. Old articles say Deletion. React 19.2 does not.",
  },
  {
    claim: "Fiber replaced the virtual DOM.",
    fix: "Elements are still created every render. Fiber replaced the stack reconciler. The element is the description. The fiber is the work. The host node is the screen.",
  },
];

const FILES = [
  { name: "ReactFiber.js", why: "The struct. Read the constructor until the fields feel like a sentence." },
  { name: "ReactWorkTags.js", why: "The switch values. You need these before beginWork’s cases mean anything." },
  { name: "ReactFiberFlags.js", why: "The notes commit will read. Learn Placement, Update, ChildDeletion, Passive, Visibility." },
  { name: "ReactChildFiber.js", why: "Keys, the prefix walk, the map, placeChild, deletions. The lab on this page is this file." },
  { name: "ReactFiberBeginWork.js", why: "Dispatch by tag, bailout, and the call into renderWithHooks or the host update." },
  { name: "ReactFiberCompleteWork.js", why: "Where the host config creates instances and prepares updates." },
  { name: "ReactFiberWorkLoop.js", why: "Now read performUnitOfWork, the two work loops, and commitRoot. Ignore the rest until you need it." },
  { name: "ReactFiberHooks.js", why: "The dispatcher, the hook list, the circular update queue, effect tags. Only after the loop is clear." },
  { name: "ReactFiberThrow.js", why: "How a thenable becomes a suspend, and how a real error finds a boundary." },
  { name: "ReactFiberLane.js", why: "Last. The bitmask, entanglement, and transition-lane allocation. Read it with a specific update in mind." },
  { name: "scheduler", why: "shouldYield and the frame budget. A different package. The reconciler calls it. It does not know about fibers." },
];

const GLOSSARY: { term: string; meaning: string }[] = [
  { term: "Alternate", meaning: "The other fiber in the double buffer. current.alternate is the work-in-progress twin, and the reverse." },
  { term: "Bailout", meaning: "Skipping a component’s render and reusing its child fibers because no props, lane, or context changed." },
  { term: "ChildDeletion", meaning: "The flag on a parent that still has fibers to unmount. The deleted fibers live on parent.deletions." },
  { term: "Commit", meaning: "The synchronous pass that applies host changes and runs layout effects. It is not interruptible." },
  { term: "Current", meaning: "The fiber tree root.current points at. It matches what the user is seeing." },
  { term: "Discrete update", meaning: "An update from a click or similar event. It takes SyncLane and usually flushes before paint." },
  { term: "Dispatcher", meaning: "The object of hook implementations React installs before calling a function component. Mount and update are different objects." },
  { term: "Element", meaning: "The immutable description JSX produces. It is not a fiber and it is not a DOM node." },
  { term: "Entangle", meaning: "Marking lanes that must flush together because they came from the same event or transition." },
  { term: "Fiber", meaning: "One unit of work: a component, a host node, a fragment, a suspense boundary, or the root." },
  { term: "Host config", meaning: "The object a renderer passes to react-reconciler. It is the only place that knows what a node is." },
  { term: "Hydration", meaning: "Attaching a fiber tree to DOM that already exists from the server, instead of creating nodes." },
  { term: "Lane", meaning: "One bit of priority. A fiber can have many. The render includes some of them and leaves the rest pending." },
  { term: "lastPlacedIndex", meaning: "The cursor that decides whether a reused child moved. If its old index is lower, it needs Placement." },
  { term: "Passive effect", meaning: "useEffect. Scheduled after paint. Not useLayoutEffect." },
  { term: "Placement", meaning: "This fiber’s host node needs to be inserted. New nodes, and nodes that moved backwards." },
  { term: "Render phase", meaning: "beginWork and completeWork. Pure with respect to the visible host. May be restarted." },
  { term: "Return pointer", meaning: "The parent fiber. The walk follows it when a sibling list runs out." },
  { term: "Thenable", meaning: "A promise-like object. Thrown during render, it suspends. Thrown as an Error, it hits an error boundary." },
  { term: "Transition", meaning: "An update on a transition lane. Interruptible. What startTransition, useTransition, and Actions request." },
  { term: "Work in progress", meaning: "The fiber the loop is on, and more loosely the hidden tree being built." },
];

function Glossary() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = GLOSSARY.filter(
    (item) => item.term.toLowerCase().includes(needle) || item.meaning.toLowerCase().includes(needle),
  );

  return (
    <div className="mt-4">
      <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase">
        Glossary
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter terms"
          className="min-h-11 rounded-md border border-line bg-raised px-3 font-mono text-sm text-paper placeholder:text-mist"
        />
      </label>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-mist">No term matches. Try fiber, lane, or commit.</p>
      ) : (
        <dl className="mt-3 flex flex-col gap-3">
          {rows.map((item) => (
            <div key={item.term} className="border-t border-line pt-3">
              <dt className="font-serif text-lg text-paper">{item.term}</dt>
              <dd className="mt-1 text-sm text-mist">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
