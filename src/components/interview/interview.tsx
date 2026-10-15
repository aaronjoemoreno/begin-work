import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DepthProvider, Layer, useDepth, type Depth } from "@/components/guide/depth";
import { Chapter, Kicker, Panel, Select } from "@/components/guide/ui";
import { BrowserApiLab } from "@/components/interview/browser-api-lab";
import {
  ComplexityMeter,
  DiffNotes,
  KeysDemo,
  TwoPhases,
  TypeChangeDemo,
} from "@/components/interview/diff-lab";
import { InterruptLab, PRIORITY_LADDER } from "@/components/interview/interrupt-lab";
import { MainThreadLab } from "@/components/interview/main-thread-lab";
import {
  ALL_QUESTIONS,
  Q_APIS,
  Q_DEPTH,
  Q_DIFF,
  Q_FIBER,
  Q_MEMORY,
  Q_PRIORITY,
  Q_STACK,
  Q_WHY,
} from "@/components/interview/questions";
import { ReuseMeter } from "@/components/interview/reuse-meter";
import {
  Code,
  Correction,
  ModelAnswer,
  QuickCheck,
  QuizProvider,
  Quote,
  useQuiz,
  Watch,
} from "@/components/interview/shared";
import { SliceLab } from "@/components/interview/slice-lab";
import { videoAt } from "@/lib/interview-sim";

const VIDEO = {
  title: "React Interview Questions Senior Level (React Fiber, Reconciliation, Virtual DOM)",
  channel: "theSeniorDev",
  url: videoAt(0).replace("?t=0", ""),
  length: "17:15",
  date: "July 2024",
};

export const PARTS = [
  ["iv-intro", "00:00", "The brief"],
  ["iv-fiber", "00:26", "Q1 Fiber vs virtual DOM"],
  ["iv-stack", "02:17", "Q2 Reconciliation"],
  ["iv-why", "04:47", "Why fiber at all"],
  ["iv-memory", "07:38", "Memory"],
  ["iv-priority", "08:32", "High priority"],
  ["iv-diff", "10:04", "Q3 Diffing and keys"],
  ["iv-depth", "13:29", "How deep to go"],
  ["iv-apis", "15:09", "Where to start"],
  ["iv-tv", "extra", "On a TV"],
  ["iv-pitfalls", "extra", "Pitfalls and answers"],
] as const;

const DEPTHS: { id: Depth; label: string }[] = [
  { id: "all", label: "All layers" },
  { id: "picture", label: "Picture" },
  { id: "mechanism", label: "Mechanism" },
  { id: "source", label: "Source" },
];

export function Interview() {
  return (
    <DepthProvider>
      <QuizProvider>
        <InterviewBody />
      </QuizProvider>
    </DepthProvider>
  );
}

function InterviewBody() {
  const { depth, setDepth } = useDepth();
  const { picks, reset } = useQuiz();
  const [progress, setProgress] = useState(0);
  const correct = ALL_QUESTIONS.filter((q) => picks[q.id] === q.answer).length;
  const answered = ALL_QUESTIONS.filter((q) => picks[q.id] !== undefined).length;

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
        <div
          className="h-full origin-left bg-copper"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <header className="sticky top-0 z-20 border-b border-line bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <Link to="/" className="font-mono text-sm tracking-widest text-paper uppercase">
              ← Begin Work
            </Link>
            <p className="font-mono text-xs text-mist">
              Interview drill · {correct}/{ALL_QUESTIONS.length} checks
            </p>
          </div>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            role="radiogroup"
            aria-label="Reading depth"
          >
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
              aria-label="Jump to a part"
              defaultValue=""
              onChange={(event) => {
                document
                  .getElementById(event.target.value)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <option value="" disabled>
                Part
              </option>
              {PARTS.map(([id, at, label]) => (
                <option key={id} value={id}>
                  {at} {label}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 xl:grid-cols-[14rem_minmax(0,1fr)]">
        <nav className="sticky top-36 hidden h-fit xl:block" aria-label="Parts">
          <ol className="flex flex-col gap-1">
            {PARTS.map(([id, at, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex min-h-11 items-center gap-2 font-mono text-xs text-mist hover:text-paper"
                >
                  <span className="w-10 shrink-0 text-copper">{at}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
          <Link
            to="/"
            className="mt-4 flex min-h-11 items-center font-mono text-xs text-mist hover:text-paper"
          >
            ← Back to the field guide
          </Link>
        </nav>

        <main id="top" className="min-w-0 pb-24">
          <header className="py-12 md:py-16">
            <Kicker>Interview drill · video companion</Kicker>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl text-paper md:text-6xl">
              Fiber, reconciliation, and the virtual DOM, asked like a senior interview
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-mist">
              Three questions and five follow-ups, in the order the video asks them. Each answer
              gets a working model you can drive, a correction where the spoken answer and the React
              19.2 source part ways, and a quick check.
            </p>
            <Panel className="mt-8 flex flex-col gap-3">
              <p className="font-mono text-xs tracking-widest text-copper uppercase">
                Source and credit
              </p>
              <p className="text-paper">
                <a
                  href={VIDEO.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-copper underline-offset-4"
                >
                  {VIDEO.title}
                </a>{" "}
                by {VIDEO.channel} · {VIDEO.length} · {VIDEO.date}. A mock interview: the host asks,
                a guest engineer answers on a shared diagram board.
              </p>
              <p className="text-sm text-mist">
                Every part links to its timestamp. Quotes are from YouTube’s auto-captions, lightly
                cleaned. The video shows no code; the code here is written for this page. The labs
                are teaching models, not React’s implementation.
              </p>
              <div className="flex flex-wrap gap-2">
                <Watch from={0} label="Watch from" />
                {answered > 0 ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="min-h-11 rounded-md border border-line px-3 font-mono text-xs text-mist hover:text-paper"
                  >
                    Reset {answered} answered checks
                  </button>
                ) : null}
              </div>
            </Panel>
          </header>

          {/* 00 ------------------------------------------------------------ */}
          <Chapter
            id="iv-intro"
            index="00 · 00:00–00:26"
            title="The brief: concurrent React, fiber, reconciliation, virtual DOM"
            lede="The interviewer promises the hard senior questions, plus the mental models behind each answer. The rest of the video is one long trace through the same machinery."
          >
            <Watch from={0} to={26} />
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniCard
                title="Element → fiber → DOM"
                body="Three objects, three jobs. The video keeps saying “virtual DOM” for the first; this guide calls it the element."
              />
              <MiniCard
                title="Render vs commit"
                body="One phase can stop. The other cannot. Most follow-ups are about which is which."
              />
              <MiniCard
                title="Priority"
                body="Why a keystroke can cut in front of a big list without losing it."
              />
            </div>
            <Layer id="picture">
              <p>
                Use this page like a rehearsal. Read the question, try answering out loud, then play
                the lab and compare with the model answer. The field guide chapters go further on
                each piece; links are at the end of each part.
              </p>
            </Layer>
          </Chapter>

          {/* Q1 ------------------------------------------------------------ */}
          <Chapter
            id="iv-fiber"
            index="Q1 · 00:26–02:17"
            title="What is React Fiber, and how is it different from the virtual DOM?"
            lede="Before 16, an update went from elements to the DOM in one synchronous shot. Fiber puts a tree of resumable work units in between."
          >
            <Watch from={26} to={137} />
            <PipelineToggle />
            <Quote at={109}>the fiber reconciliation can be paused</Quote>
            <Layer id="picture">
              <p>
                The guest’s answer: React 16 introduced the fiber node, an intermediate structure
                where all the work of rendering a component happens. Just as there used to be a tree
                of virtual DOM nodes, there is now a fiber tree. The big difference is that work on
                that tree can stop for a higher-priority update and come back — which is what
                “concurrent React” means.
              </p>
            </Layer>
            <Correction
              said="Fiber computes state and lifecycles, then the virtual DOM is computed from the fiber tree and diffed against the old virtual DOM."
              actual={
                <>
                  There is no second tree diff. Components return elements; beginWork reconciles
                  those elements against the current fibers’ children, one sibling list at a time.
                  Flags on fibers are the “diff.” See{" "}
                  <GuideLink hash="objects">02 Three objects</GuideLink> and{" "}
                  <GuideLink hash="myths">13 Models that lie</GuideLink>.
                </>
              }
            />
            <ModelAnswer>
              <p>
                “A fiber is React’s unit of work: a mutable object per component that holds its
                props, state, effects, priority lanes, and child/sibling/return pointers. Before
                React 16 the reconciler recursed on the call stack, so a render had to finish once
                it started. With fiber, the next unit is a pointer, so React can yield between
                components, let the browser handle input, and resume or restart. Elements — what
                people call the virtual DOM — are still created every render; fiber replaced the
                stack reconciler, not the elements.”
              </p>
            </ModelAnswer>
            <QuickCheck questions={Q_FIBER} />
          </Chapter>

          {/* Q2 ------------------------------------------------------------ */}
          <Chapter
            id="iv-stack"
            index="Q2 · 02:17–04:47"
            title="Explain reconciliation, and what fiber changed about it"
            lede="The stack reconciler pushes every render function onto the call stack and cannot let go. Type into a form while it works and nothing appears."
          >
            <Watch from={137} to={287} />
            <MainThreadLab />
            <Quote at={183}>that’s what they call the stack reconciler</Quote>
            <p className="max-w-2xl text-mist">
              At 04:07 the guest zooms into one fiber on the board: a JavaScript object holding the
              state, the new and memoized props, the function that runs it, and its sibling and
              child. Here is that object, trimmed to the fields he names plus the one that makes the
              walk possible:
            </p>
            <Code title="A fiber for the Form component (simplified, React 19.2 field names)">
              {`
const formFiber = {
  tag: 0,                    // FunctionComponent
  type: Form,                // "the function that runs it"
  key: null,
  pendingProps: { onSubmit },   // "the new props"
  memoizedProps: { onSubmit },  // props from the last render
  memoizedState: hook0,         // state: hook0 → hook1 → …
  child: inputFiber,         // first child
  sibling: listFiber,        // next child of the same parent
  return: appFiber,          // parent — the pointer that lets the loop climb back up
  lanes: 0b10,               // pending work on this fiber (SyncLane)
  flags: 0,                  // notes for commit: Placement, Update, …
  alternate: formFiberWIP,   // the twin being built
};`}
            </Code>
            <Code title="Stack vs fiber, as two loops">
              {`
// Stack reconciler (≤ 15): the work list is the JS call stack.
function renderTree(component) {
  const children = component.render();
  children.forEach(renderTree);        // cannot stop until the recursion unwinds
}

// Fiber (16+): the work list is a variable.
let workInProgress = rootFiber;
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);   // returns child, sibling, or climbs via return
  }
}`}
            </Code>
            <ModelAnswer>
              <p>
                “Reconciliation is how React turns new elements into a plan for the host. A state
                change schedules work at the root; React walks the tree, calls components, compares
                each child list with what is mounted using type and key, and marks fibers with
                flags. Then commit applies those flags to the DOM in one pass. The stack reconciler
                did the walk by recursion, so a big tree blocked input and paint. Fiber does the
                same walk as a loop over linked fibers, so concurrent renders can yield between
                units.”
              </p>
            </ModelAnswer>
            <QuickCheck questions={Q_STACK} />
            <GuideLinks
              items={[
                ["fiber", "03 The fiber"],
                ["loop", "04 The work loop"],
              ]}
            />
          </Chapter>

          {/* Follow-up: why ------------------------------------------------ */}
          <Chapter
            id="iv-why"
            index="Follow-up · 04:47–07:38"
            title="Why do we need fiber at all? It adds a layer."
            lede="The interviewer pushes back on the complexity. The answer: fiber works with a priority queue and a scheduler, on a copy of the tree, a budget at a time."
          >
            <Watch from={287} to={458} />
            <SliceLab />
            <Quote at={337}>it works together with a priority queue and a scheduler</Quote>
            <Quote at={430}>I will let you do some work for around 50 milliseconds</Quote>
            <Correction
              said="React calls requestIdleCallback; the browser grants about 50 ms; when the frame budget runs out, React pauses."
              actual={
                <>
                  React’s scheduler does not use requestIdleCallback. It posts MessageChannel
                  messages and yields roughly every 5 ms (frameYieldMs). 50 ms is the cap the
                  browser spec puts on one idle period. The pause-and-repaint idea is right; the API
                  and the number are not React’s.
                </>
              }
            />
            <ModelAnswer>
              <p>
                “Because rendering on a copy is what makes interruption safe. A setState queues an
                update on the hook and marks lanes up to the root. React renders a work-in-progress
                tree — the alternate of each fiber — while root.current stays on screen. In
                concurrent mode it checks shouldYield after each unit, about every 5 ms, and gives
                the main thread back. Only when the whole tree completes does commit swap the two
                trees. The layer exists so render can be thrown away without the user ever seeing
                half a tree.”
              </p>
            </ModelAnswer>
            <QuickCheck questions={Q_WHY} />
            <GuideLinks
              items={[
                ["buffer", "06 Double buffering"],
                ["loop", "04 The work loop"],
              ]}
            />
          </Chapter>

          {/* Follow-up: memory --------------------------------------------- */}
          <Chapter
            id="iv-memory"
            index="Follow-up · 07:38–08:30"
            title="How does all of this stay in memory without leaking?"
            lede="The guest’s answer is reuse: unchanged fibers are kept by reference, and memo’d components with the same props are not re-rendered."
          >
            <Watch from={458} to={510} />
            <ReuseMeter />
            <Code title="What the video means by “maintain a reference to the previous one”">
              {`
const Row = memo(function Row({ item }) {
  return <li>{item.title}</li>;
});

function List({ items, query }) {
  // Stable item objects + memo → Row bails out when only "query" changes.
  const visible = useMemo(() => items.filter((i) => i.title.includes(query)), [items, query]);
  return <ul>{visible.map((item) => <Row key={item.id} item={item} />)}</ul>;
}`}
            </Code>
            <ModelAnswer>
              <p>
                “React keeps at most two fibers per component — current and alternate — and recycles
                the alternate on every render instead of allocating. Bailouts clone child pointers
                rather than re-running components, and memo or useMemo make bailouts succeed more
                often. What still costs memory is the number of mounted components and whatever
                their state and closures hold, so long lists should be virtualized.”
              </p>
            </ModelAnswer>
            <QuickCheck questions={Q_MEMORY} />
          </Chapter>

          {/* Follow-up: priority ------------------------------------------- */}
          <Chapter
            id="iv-priority"
            index="Follow-up · 08:32–10:04"
            title="What is a high-priority update, and what happens to the low one?"
            lede="Rendering a fetched list can wait. A keystroke cannot. React handles the keystroke first, commits it, then goes back."
          >
            <Watch from={512} to={604} />
            <InterruptLab />
            <Quote at={561}>that’s why it’s called concurrent React</Quote>
            <Panel>
              <p className="font-mono text-xs tracking-widest text-mist uppercase">
                The list on the board, mapped to lanes
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {PRIORITY_LADDER.map((row) => (
                  <li
                    key={row.lane}
                    className="grid gap-1 border-t border-line pt-2 sm:grid-cols-[minmax(0,1fr)_12rem]"
                  >
                    <div>
                      <p className="text-sm text-paper">{row.video}</p>
                      <p className="text-xs text-mist">{row.note}</p>
                    </div>
                    <p className="font-mono text-sm text-copper">{row.lane}</p>
                  </li>
                ))}
              </ul>
            </Panel>
            <Correction
              said="React pauses the low-priority render, handles the high-priority one, then goes back to the low-priority update."
              actual={
                <>
                  The interrupted work-in-progress tree is discarded and the low-priority render
                  restarts from the root later (prepareFreshStack). That is why render must be pure.
                  Lanes, not a queue position, carry the priority. See{" "}
                  <GuideLink hash="lanes">08 Lanes</GuideLink>.
                </>
              }
            />
            <Code title="Opting the slow part into a low lane">
              {`
function Search({ items }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState(items);

  return (
    <>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);                     // SyncLane: the letter paints now
          startTransition(() => setResults(filter(items, e.target.value)));  // transition: may restart
        }}
      />
      {isPending ? <Spinner /> : null}
      <ResultList items={results} />
    </>
  );
}`}
            </Code>
            <ModelAnswer>
              <p>
                “Each update gets a lane. Discrete input like a click or keypress is SyncLane;
                scroll is InputContinuous; ordinary updates are Default; startTransition and
                useDeferredValue put work on transition lanes, which render concurrently and can be
                interrupted. If urgent work arrives, React throws away the in-progress transition
                render, renders and commits the urgent one, then restarts the transition. The user
                sees responsive input, and the pending lanes guarantee nothing is dropped.”
              </p>
            </ModelAnswer>
            <QuickCheck questions={Q_PRIORITY} />
          </Chapter>

          {/* Q3 ------------------------------------------------------------ */}
          <Chapter
            id="iv-diff"
            index="Q3 · 10:04–12:50"
            title="What can you tell me about the diffing algorithm and the virtual DOM?"
            lede="Render may pause, but commit is synchronous. Comparing two trees in general is cubic, so React bets on two heuristics: types and keys."
          >
            <Watch from={604} to={770} />
            <TwoPhases />
            <Quote at={658}>the big O for this would be n to the third</Quote>
            <ComplexityMeter />
            <Quote at={695}>if different type then redo</Quote>
            <TypeChangeDemo />
            <Quote at={739}>you should never use array indexes as keys</Quote>
            <KeysDemo />
            <DiffNotes />
            <ModelAnswer>
              <p>
                “A general tree diff is O(n³). React makes it linear with two assumptions. Elements
                of different types produce different trees, so a type change unmounts the old
                subtree and mounts a new one. And among siblings, a stable unique key identifies an
                item across renders, so React can reuse, move, or delete the right fiber. Index keys
                break that when a list inserts, deletes, or reorders: state and DOM follow the slot
                instead of the item. The diff runs during render; commit applies its result
                synchronously.”
              </p>
            </ModelAnswer>
            <QuickCheck questions={Q_DIFF} />
            <GuideLinks
              items={[
                ["children", "05 Children and keys"],
                ["commit", "09 Commit"],
              ]}
            />
          </Chapter>

          {/* How deep ------------------------------------------------------ */}
          <Chapter
            id="iv-depth"
            index="13:29–15:09"
            title="How deep should you go?"
            lede="After a sponsor break (12:50–13:29, skipped here), the interviewer asks the million-dollar question. The answer depends on the role."
          >
            <Watch from={809} to={909} />
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniCard
                title="Senior full-stack"
                body="Learn the React team’s motivation and the top-level API. Time is spread across the stack."
              />
              <MiniCard
                title="Senior React or frontend"
                body="Go deep. It is your specialty, and in a crowded market this depth makes you stand out."
              />
            </div>
            <Quote at={904}>You will not have to interact with the fiber directly</Quote>
            <Layer id="picture">
              <p>
                The guest’s consolation for everyone else: the data structures inside — queues,
                priority heaps, trees — grow your mental model and your vocabulary, so going deep is
                never wasted. For a UI role on constrained devices, assume you are in the second
                column: you will be asked why a render was slow, not just how to write a hook.
              </p>
            </Layer>
            <QuickCheck questions={Q_DEPTH} />
          </Chapter>

          {/* Where to start ------------------------------------------------- */}
          <Chapter
            id="iv-apis"
            index="15:09–16:08 · close 16:08–17:15"
            title="Where to start: the browser APIs concurrent React grew out of"
            lede="requestIdleCallback — “the browser is free, give me work.” requestAnimationFrame — “I’m about to repaint, anything first?” Learn those, and fiber reads as a way to use them."
          >
            <Watch from={909} to={968} />
            <BrowserApiLab />
            <Code title="The idea from the video: a time-sliced loop on requestIdleCallback">
              {`
let next = firstUnit;

function work(deadline) {
  while (next && deadline.timeRemaining() > 1) {
    next = perform(next);          // one small unit at a time
  }
  if (next) requestIdleCallback(work);
  else requestAnimationFrame(commit); // apply everything just before a paint
}
requestIdleCallback(work);`}
            </Code>
            <Code title="Closer to React’s scheduler: MessageChannel and a 5 ms slice">
              {`
const channel = new MessageChannel();
const SLICE_MS = 5;
let next = firstUnit;

channel.port1.onmessage = () => {
  const start = performance.now();
  while (next && performance.now() - start < SLICE_MS) {
    next = perform(next);
  }
  if (next) channel.port2.postMessage(null); // yield, then continue in a new macrotask
  else commit();                              // synchronous, right away
};
channel.port2.postMessage(null);`}
            </Code>
            <Correction
              said="requestAnimationFrame is when React commits high-priority changes, so they show in the next repaint."
              actual={
                <>
                  Commit runs as soon as a render finishes — for a click, inside the same task — and
                  the browser paints afterwards. React does not schedule commits with
                  requestAnimationFrame.
                </>
              }
            />
            <Layer id="picture">
              <p>
                The video closes on fundamentals: browser APIs, JavaScript, the call stack, data
                structures, complexity. Everything above is those, assembled. The advice travels
                well — Preact and Inferno use the same browser and the same ideas, without React’s
                scheduler.
              </p>
            </Layer>
            <QuickCheck questions={Q_APIS} />
          </Chapter>

          {/* TV extras ------------------------------------------------------ */}
          <Chapter
            id="iv-tv"
            index="Extra · not in the video"
            title="On a TV: low memory, slow CPUs, Preact, and Inferno"
            lede="Living-room devices have a fraction of a laptop’s memory and CPU, and input comes from a remote. The video’s concepts apply; the trade-offs shift."
          >
            <ul className="flex flex-col gap-3">
              {TV_NOTES.map((note) => (
                <li key={note.title} className="rounded-md border border-line px-4 py-4">
                  <p className="font-mono text-xs text-copper">{note.tag}</p>
                  <h3 className="mt-1 font-serif text-xl text-paper">{note.title}</h3>
                  <p className="mt-2 text-sm text-mist">{note.body}</p>
                </li>
              ))}
            </ul>
            <Code title="A remote-control keypress, kept cheap">
              {`
function Rail({ items }) {
  const [focus, setFocus] = useState(0);            // focus lives in the rail, not the app root
  const deferredFocus = useDeferredValue(focus);    // React: artwork/details can lag a frame

  useRemoteKeys({
    left: () => setFocus((i) => Math.max(0, i - 1)),
    right: () => setFocus((i) => Math.min(items.length - 1, i + 1)),
  });

  return (
    <VirtualRow items={items} window={7} render={(item, i) => (
      <Tile key={item.id} item={item} focused={i === focus} />   // stable id key, memo'd Tile
    )}>
      <Details item={items[deferredFocus]} />
    </VirtualRow>
  );
}`}
            </Code>
            <Layer id="mechanism">
              <p>
                useRemoteKeys and VirtualRow are placeholders for your app’s input and windowing
                layers. In Preact, useDeferredValue exists in preact/compat but does not interrupt
                anything — there is no lane model — so keep the urgent path small instead.
              </p>
            </Layer>
          </Chapter>

          {/* Pitfalls ------------------------------------------------------- */}
          <Chapter
            id="iv-pitfalls"
            index="Extra · checklist"
            title="Common pitfalls, and the thirty-second answers"
            lede="The mistakes this video’s questions are designed to catch, and how to say the answers without the inaccuracies."
          >
            <ul className="flex flex-col gap-3">
              {PITFALLS.map((item) => (
                <li key={item.claim} className="rounded-md border border-line px-4 py-4">
                  <p className="font-serif text-lg text-paper">{item.claim}</p>
                  <p className="mt-2 text-sm text-mist">{item.fix}</p>
                </li>
              ))}
            </ul>
            <Panel>
              <p className="font-mono text-xs tracking-widest text-copper uppercase">Score</p>
              <p className="mt-1 text-paper">
                {correct} of {ALL_QUESTIONS.length} quick checks right · {answered} answered
              </p>
              <p className="mt-2 text-sm text-mist">Answers are saved in this browser only.</p>
            </Panel>
            <p className="text-sm text-mist">
              Credit: questions, order, and spoken explanations from{" "}
              <a
                href={VIDEO.url}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-copper underline-offset-4"
              >
                {VIDEO.title}
              </a>{" "}
              by {VIDEO.channel}. Labs, code, corrections, and TV notes are this guide’s.
            </p>
          </Chapter>
        </main>
      </div>
    </div>
  );
}

function MiniCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-line px-4 py-3">
      <p className="font-mono text-xs tracking-widest text-copper uppercase">{title}</p>
      <p className="mt-1 text-sm text-paper">{body}</p>
    </div>
  );
}

function GuideLink({ hash, children }: { hash: string; children: string }) {
  return (
    <Link to="/" hash={hash} className="underline decoration-copper underline-offset-4">
      {children}
    </Link>
  );
}

function GuideLinks({ items }: { items: [string, string][] }) {
  return (
    <p className="font-mono text-xs text-mist">
      Go deeper in the field guide:{" "}
      {items.map(([hash, label], index) => (
        <span key={hash}>
          {index > 0 ? " · " : ""}
          <GuideLink hash={hash}>{label}</GuideLink>
        </span>
      ))}
    </p>
  );
}

/** Before 16 / after 16, as an animated pipeline. */
function PipelineToggle() {
  const [fiber, setFiber] = useState(true);
  const steps = fiber
    ? ["setState", "fiber tree (work-in-progress)", "yield? resume", "commit", "DOM"]
    : ["setState", "recursive render on the call stack", "virtual DOM diff", "DOM"];
  return (
    <Panel>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="React version">
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            role="radio"
            aria-checked={fiber === value}
            onClick={() => setFiber(value)}
            className={`min-h-11 rounded-md border px-2 font-mono text-sm ${
              fiber === value ? "border-copper bg-copper text-ink" : "border-line text-paper"
            }`}
          >
            {value ? "React 16+ · fiber" : "React ≤ 15 · stack"}
          </button>
        ))}
      </div>
      <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2 sm:flex-1">
            <span
              className={`flex min-h-14 flex-1 items-center justify-center rounded-md border px-2 text-center font-mono text-xs transition-colors ${
                step.includes("yield")
                  ? "border-dashed border-copper text-copper"
                  : "border-line text-paper"
              }`}
              style={{ animation: `iv-pop 320ms ease-out ${index * 90}ms both` }}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="text-mist">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-mist">
        {fiber
          ? "The dashed step is the new capability: between fibers, the loop can give the main thread back."
          : "Once the recursion starts, the next stop is the DOM. Nothing else runs on the main thread in between."}
      </p>
      <style>{`@keyframes iv-pop { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
    </Panel>
  );
}

const TV_NOTES = [
  {
    tag: "Memory",
    title: "Fiber’s price is objects, and you pay it per mounted component",
    body: "Every mounted component has a fiber, and after its first update a twin. Add a hook list and closures each. On a 300-tile home screen that is thousands of objects for things the user cannot see. Window your rails and grids so only on-screen tiles are mounted; that cuts fibers, DOM nodes, and decoded images together.",
  },
  {
    tag: "Input",
    title: "A remote keypress is a discrete event",
    body: "In React, a keydown setState is SyncLane and renders before paint, even with a transition in flight. Keep that urgent render small — focus state local to the rail, memo’d tiles — and push artwork, metadata, and recommendations into a transition or useDeferredValue so they can be interrupted by the next press.",
  },
  {
    tag: "Preact",
    title: "No fiber, no lanes, a smaller runtime",
    body: "Preact diffs the new virtual nodes against the previous ones recursively and synchronously; there is no time slicing and no render to throw away. setState renders are batched and debounced (options.debounceRendering). The heuristics from Q3 apply unchanged: type changes remount, and index keys make state follow the slot.",
  },
  {
    tag: "Inferno",
    title: "Synchronous and tuned for the diff itself",
    body: "Inferno also renders synchronously without a scheduler. Its keyed children algorithm computes a minimal set of moves, and compile-time flags let it skip checks React does at runtime. Fast on a slow CPU, but long work still blocks input, so the same “keep the keypress path small” rule applies.",
  },
  {
    tag: "Scheduling",
    title: "Don’t build your own loop on requestIdleCallback without a fallback",
    body: "Not every embedded browser engine ships requestIdleCallback. Feature-detect and fall back to a MessageChannel or setTimeout loop with a short time budget, the way React’s scheduler does.",
  },
  {
    tag: "Keys",
    title: "Index keys break focus management",
    body: "When a rail is filtered or reordered, focus, hover, and preview state stay on the slot. Users see the highlight jump to a different title. Key tiles by content id.",
  },
  {
    tag: "Types",
    title: "Swapping a wrapper’s element type remounts the tile",
    body: "Rendering a tile as <a> when playable and <div> otherwise unmounts the subtree on every change, dropping image state and refs. Keep the element type stable and toggle attributes.",
  },
];

const PITFALLS = [
  {
    claim: "“Fiber replaced the virtual DOM.”",
    fix: "Fiber replaced the stack reconciler. Elements are still created every render. Element is the description, fiber is the work, the host node is the screen.",
  },
  {
    claim: "“React diffs the new virtual DOM against the old virtual DOM.”",
    fix: "It reconciles new elements against the current fibers’ children, one sibling list at a time, by type and key.",
  },
  {
    claim: "“React uses requestIdleCallback with a 50 ms budget.”",
    fix: "The scheduler uses MessageChannel and yields about every 5 ms. requestIdleCallback is the idea it grew from.",
  },
  {
    claim: "“An interrupted render resumes where it paused.”",
    fix: "It restarts from the root; its lanes stay pending. That is why render must be pure and idempotent.",
  },
  {
    claim: "“Every update is time-sliced in React 18+.”",
    fix: "Only concurrent lanes like transitions yield. Sync and default updates render without yielding.",
  },
  {
    claim: "“memo removes components from memory.”",
    fix: "memo skips calling the component. The fiber stays. Fewer mounted components is what saves memory.",
  },
  {
    claim: "“Index keys are fine as long as the list renders.”",
    fix: "They are fine only for lists that never insert, delete, or reorder. Otherwise state follows the slot.",
  },
  {
    claim: "“The commit phase can be paused too.”",
    fix: "No. Commit is synchronous so the DOM never shows half an update.",
  },
];
