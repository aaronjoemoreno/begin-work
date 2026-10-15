import type { ReactNode } from "react";
import { Code } from "@/components/interview/shared";

/**
 * Overview tab: Aaron's "React Reconciliation & Fiber Notes", fact-checked against the
 * React 19.2 source (tag v19.2.0), the React docs, and Netflix's own posts and talks.
 * The same text lives in docs/reconciliation-fiber-notes.md. Bracketed tags ([S1], [N1]...)
 * point at the Sources section.
 */

export const OVERVIEW_TOC: { id: string; label: string; level: 2 | 3 }[] = [
  { id: "ov-core", label: "Core Ideas", level: 2 },
  { id: "ov-async", label: "Async vs Synchronous in Fiber", level: 2 },
  { id: "ov-loop", label: "Fiber Work Loop (Simplified)", level: 2 },
  { id: "ov-beginwork-short", label: "beginWork", level: 3 },
  { id: "ov-completework", label: "completeWork", level: 3 },
  { id: "ov-commit", label: "commit", level: 3 },
  { id: "ov-heuristics", label: "The Diff Heuristics (What Actually Happens)", level: 2 },
  { id: "ov-child-diff", label: "Conceptual child diff", level: 3 },
  { id: "ov-beginwork", label: "beginWork in More Detail", level: 2 },
  { id: "ov-gibbon", label: "React (Standard) vs React-Gibbon", level: 2 },
  { id: "ov-implications", label: "Practical Implications", level: 2 },
  { id: "ov-sources", label: "Sources", level: 2 },
  { id: "ov-changes", label: "What changed from the original notes", level: 2 },
];

const GH = "https://github.com/facebook/react/blob/v19.2.0/packages";
const WL = `${GH}/react-reconciler/src/ReactFiberWorkLoop.js`;
const BW = `${GH}/react-reconciler/src/ReactFiberBeginWork.js`;
const CW = `${GH}/react-reconciler/src/ReactFiberCompleteWork.js`;
const CF = `${GH}/react-reconciler/src/ReactChildFiber.js`;

type Link = { label: ReactNode; href: string };
type Source = { id: string; links: Link[]; note?: ReactNode };

const SOURCE_GROUPS: { title: string; sources: Source[] }[] = [
  {
    title: "React source, tag v19.2.0",
    sources: [
      {
        id: "S1",
        note: "ReactFiberWorkLoop.js",
        links: [
          { label: "workLoopSync", href: `${WL}#L2681` },
          { label: "workLoopConcurrentByScheduler", href: `${WL}#L2982` },
          { label: "performUnitOfWork", href: `${WL}#L2990` },
          { label: "completeUnitOfWork", href: `${WL}#L3273` },
        ],
      },
      {
        id: "S2a",
        note: "ReactFiberBeginWork.js",
        links: [
          { label: "beginWork", href: `${BW}#L4091` },
          { label: "reconcileChildren", href: `${BW}#L341` },
        ],
      },
      {
        id: "S3",
        note: "ReactFiberCompleteWork.js",
        links: [
          { label: "completeWork", href: `${CW}#L1049` },
          { label: "updateHostComponent", href: `${CW}#L453` },
        ],
      },
      {
        id: "S4",
        note: "ReactFiberWorkLoop.js",
        links: [
          { label: "commitRoot", href: `${WL}#L3416` },
          { label: "flushPassiveEffects", href: `${WL}#L4452` },
        ],
      },
      {
        id: "S6",
        note: "Scheduler",
        links: [
          { label: "shouldYieldToHost", href: `${GH}/scheduler/src/forks/Scheduler.js#L447` },
          { label: "frameYieldMs = 5", href: `${GH}/scheduler/src/SchedulerFeatureFlags.js` },
        ],
      },
      {
        id: "S7",
        note: "ReactChildFiber.js",
        links: [
          { label: "reconcileChildrenArray", href: `${CF}#L1124` },
          { label: "placeChild", href: `${CF}#L492` },
          { label: "mapRemainingChildren", href: `${CF}#L463` },
        ],
      },
      {
        id: "S8",
        note: "React Native Fabric host config",
        links: [
          {
            label: "supportsPersistence = true",
            href: `${GH}/react-native-renderer/src/ReactFiberConfigFabric.js#L445`,
          },
        ],
      },
      {
        id: "S14",
        note: "for building custom renderers",
        links: [
          {
            label: "react-reconciler package",
            href: "https://github.com/facebook/react/tree/v19.2.0/packages/react-reconciler",
          },
        ],
      },
    ],
  },
  {
    title: "React docs and design notes",
    sources: [
      {
        id: "S2",
        note: "legacy React docs",
        links: [
          { label: "Reconciliation", href: "https://legacy.reactjs.org/docs/reconciliation.html" },
        ],
      },
      {
        id: "S5",
        note: "Andrew Clark, 2016",
        links: [
          {
            label: "React Fiber Architecture",
            href: "https://github.com/acdlite/react-fiber-architecture",
          },
        ],
      },
      {
        id: "S9",
        note: "react.dev",
        links: [
          { label: "useTransition", href: "https://react.dev/reference/react/useTransition" },
        ],
      },
      {
        id: "S10",
        note: "react.dev",
        links: [
          { label: "Rendering Lists: keys", href: "https://react.dev/learn/rendering-lists" },
        ],
      },
      {
        id: "S11",
        note: "react.dev",
        links: [
          {
            label: "Preserving and Resetting State",
            href: "https://react.dev/learn/preserving-and-resetting-state",
          },
        ],
      },
      {
        id: "S12",
        note: "React 18 Working Group; react.dev",
        links: [
          { label: "What is tearing?", href: "https://github.com/reactwg/react-18/discussions/69" },
          {
            label: "useSyncExternalStore",
            href: "https://react.dev/reference/react/useSyncExternalStore",
          },
        ],
      },
      {
        id: "S13",
        note: "September 26, 2017 — the first release built on Fiber",
        links: [
          {
            label: "React v16.0",
            href: "https://legacy.reactjs.org/blog/2017/09/26/react-v16.0.html",
          },
        ],
      },
    ],
  },
  {
    title: "Talks",
    sources: [
      {
        id: "T1",
        note: "Jafar Husain, React.js Conf 2015",
        links: [
          {
            label: "Beyond the DOM: How Netflix plans to enhance your television experience",
            href: "https://www.youtube.com/watch?v=eNC0mRYGWgc",
          },
          { label: "schedule", href: "https://conf2015.reactjs.org/schedule.html" },
        ],
      },
      {
        id: "T2",
        note: "Steve McGuire (Netflix), React.js Conf 2016",
        links: [
          {
            label: "Performance Without Compromise",
            href: "https://www.youtube.com/watch?v=kDARP5QZ6nU",
          },
          { label: "abstract", href: "https://conf2016.reactjs.org/schedule.html" },
        ],
      },
      {
        id: "T3",
        note: "Lin Clark, React Conf 2017",
        links: [
          {
            label: "A Cartoon Intro to Fiber",
            href: "https://www.youtube.com/watch?v=ZCuYPiUIONs",
          },
        ],
      },
      {
        id: "T4",
        note: "Andrew Clark, ReactNext 2016",
        links: [
          { label: "What’s Next for React", href: "https://www.youtube.com/watch?v=aV1271hd9ew" },
        ],
      },
      {
        id: "T5",
        note: "Sebastian Markbåge, React Conf 2017",
        links: [
          {
            label: "React Performance End to End (React Fiber)",
            href: "https://www.youtube.com/watch?v=bvFpe5j9-zQ",
          },
        ],
      },
    ],
  },
  {
    title: "Netflix Tech Blog",
    sources: [
      {
        id: "N1",
        note: "January 12, 2017",
        links: [
          {
            label: "Crafting a high-performance TV user interface using React",
            href: "https://netflixtechblog.com/crafting-a-high-performance-tv-user-interface-using-react-3350e5a6ad3b",
          },
        ],
      },
      {
        id: "N2",
        note: "November 18, 2013",
        links: [
          {
            label: "Building the New Netflix Experience for TV",
            href: "https://netflixtechblog.com/building-the-new-netflix-experience-for-tv-920d71d875de",
          },
        ],
      },
      {
        id: "N3",
        note: "December 16, 2013",
        links: [
          {
            label: "Pioneering application design on TVs & TV-connected devices",
            href: "https://netflixtechblog.com/pioneering-application-design-on-tvs-tv-connected-devices-e361dbe02f66",
          },
        ],
      },
    ],
  },
];

const CHANGES: ReactNode[] = [
  "O(n³) is now attributed to the general tree-edit algorithms the React docs cite, with the “1,000 elements ≈ a billion comparisons” example.",
  "The render phase is interruptible only for concurrent work; sync and default updates don’t yield.",
  "“Commit must be synchronous” became “uninterruptible”, with passive effects called out as running afterwards.",
  "“Without tearing” was reworded: in React, tearing means something narrower (external-store reads), handled by useSyncExternalStore.",
  "The work loop now matches the source: performUnitOfWork runs beginWork and only calls completeUnitOfWork when there is no child; one unit is not “beginWork + completeWork for one fiber”.",
  "beginWork doesn’t recurse or create its own fiber; it reconciles and returns child fibers.",
  "completeWork: mutation mode creates instances on mount but defers update diffs to commit in React 19; persistent mode clones.",
  "Diff table: index keys reuse nodes by position (wrong state, extra updates) rather than recreating them; unstable keys are what recreate; bailouts still descend when a child has work.",
  "Child diff now describes the linear first pass, the Map fallback, and lastPlacedIndex.",
  "“Fiber is a linked list” became a tree linked by child/sibling/return pointers; yielding happens between units, not inside beginWork.",
  "Gibbon: dates, devices, and 60 fps are now sourced; “Same Fiber reconciler” corrected (pre-Fiber); “bridge-style” and “later aligned with React Native” removed as unverifiable; “tiny caches” removed (not in the sources).",
  "References replaced with real talk titles and links; a Sources section added.",
];

/** Small citation: [S1, N1] linking into the Sources section. */
function Cite({ ids }: { ids: string[] }) {
  return (
    <span className="ml-1 whitespace-nowrap font-mono text-[0.7em] text-mist">
      [
      {ids.map((id, index) => (
        <span key={id}>
          {index > 0 ? ", " : null}
          <a href={`#ov-src-${id.toLowerCase()}`} className="text-copper hover:underline">
            {id}
          </a>
        </span>
      ))}
      ]
    </span>
  );
}

/** Inline math: O(n^3), O(n). */
function BigO({ power }: { power?: number }) {
  return (
    <span
      className="font-serif whitespace-nowrap text-paper"
      role="math"
      aria-label={power ? `O of n to the ${power}` : "O of n"}
    >
      <span className="italic">O</span>(<span className="italic">n</span>
      {power ? <sup className="text-[0.7em]">{power}</sup> : null})
    </span>
  );
}

function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm border border-line bg-raised px-1 py-0.5 font-mono text-[0.85em] text-copper">
      {children}
    </code>
  );
}

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-64 border-t border-line pt-10 font-serif text-3xl text-paper md:text-4xl xl:scroll-mt-32"
    >
      {children}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-64 pt-2 font-serif text-2xl text-paper xl:scroll-mt-32">
      {children}
    </h3>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="max-w-2xl text-base leading-relaxed text-paper md:text-lg">{children}</p>;
}

function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-paper marker:text-copper md:text-lg">
      {children}
    </ul>
  );
}

function OL({ children }: { children: ReactNode }) {
  return (
    <ol className="flex max-w-2xl list-decimal flex-col gap-2 pl-5 text-base leading-relaxed text-paper marker:font-mono marker:text-copper md:text-lg">
      {children}
    </ol>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-md border border-line">
      <table
        className={`w-full border-collapse text-left text-sm ${head.length > 2 ? "min-w-[34rem]" : ""}`}
      >
        <thead className="bg-raised">
          <tr>
            {head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className="border-b border-line px-4 py-3 font-mono text-xs tracking-widest text-copper uppercase"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-line first:border-t-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={
                    j === 0
                      ? "px-4 py-3 align-top font-mono text-xs text-paper sm:text-sm"
                      : "px-4 py-3 align-top text-paper"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Overview() {
  return (
    <article className="flex flex-col gap-5 pb-8">
      <header className="flex flex-col gap-4 py-12 md:py-16">
        <p className="font-mono text-xs tracking-widest text-copper uppercase">Overview · notes</p>
        <h1 className="max-w-3xl font-serif text-4xl text-paper md:text-6xl">
          React Reconciliation &amp; Fiber Notes
        </h1>
        <p className="max-w-2xl text-lg text-mist">
          A practical summary of how React’s reconciler works, the role of heuristics and
          interruptible rendering, and how it compares to Netflix’s React-Gibbon. Checked against
          the React 19.2 source (tag <C>v19.2.0</C>) and the{" "}
          <a href="#ov-sources" className="text-copper hover:underline">
            sources at the end
          </a>
          .
        </p>
      </header>

      <H2 id="ov-core">Core Ideas</H2>
      <P>
        React’s reconciler does <strong>not</strong> perform a full general tree diff. The
        best-known general algorithms for turning one tree into another are on the order of{" "}
        <BigO power={3} /> — for 1,000 elements, roughly a billion comparisons.
        <Cite ids={["S2"]} />
        <br />
        Instead it uses a <strong>heuristic</strong> <BigO /> algorithm based on two assumptions
        that hold for almost all real UIs:
        <Cite ids={["S2"]} />
      </P>
      <OL>
        <li>
          Elements of different types produce different trees → React tears down the old subtree
          (and its state) and builds a new one.
        </li>
        <li>
          The developer can hint at which children are stable across renders with a <C>key</C> prop,
          so React can match them.
        </li>
      </OL>
      <P>
        A <strong>heuristic</strong> is a practical shortcut that is “good enough” and fast, even if
        it isn’t guaranteed to be optimal. React’s diff is a classic example: it never tries to
        notice that a subtree moved to a different parent, or that two different component types
        render similar output.
        <Cite ids={["S2"]} />
      </P>

      <H2 id="ov-async">Async vs Synchronous in Fiber</H2>
      <UL>
        <li>
          <strong>Render phase</strong> (<C>beginWork</C> → <C>completeWork</C>, driven by{" "}
          <C>performUnitOfWork</C>): <strong>interruptible</strong> when React renders concurrently
          (transitions, <C>useDeferredValue</C>, Suspense retries). React can yield between fibers,
          throw away an unfinished render, and restart it at a different priority. Sync and
          default-priority updates render without yielding.
          <Cite ids={["S1", "S9"]} />
        </li>
        <li>
          <strong>Commit phase</strong>: <strong>uninterruptible</strong>. Once React starts
          applying changes to the host (DOM, native views, etc.), it runs the before-mutation,
          mutation, and layout steps in one synchronous pass, so the screen never shows a
          half-applied update. Passive effects (<C>useEffect</C>) are not part of that pass: they
          run afterwards, as a separately scheduled task, or at the end of commit when the render
          was synchronous.
          <Cite ids={["S4"]} />
        </li>
      </UL>
      <P>
        This split is what makes concurrent rendering safe: an unfinished render can be discarded at
        no visible cost, because nothing reaches the screen until commit. (React uses the word{" "}
        <strong>tearing</strong> for a narrower problem — components reading different values from
        an external mutable store during one concurrent render — which <C>useSyncExternalStore</C>{" "}
        exists to prevent.
        <Cite ids={["S12"]} />)
      </P>

      <H2 id="ov-loop">Fiber Work Loop (Simplified)</H2>
      <Code>{`
// ReactFiberWorkLoop.js (React 19.2)
while (workInProgress !== null && !shouldYield()) {  // workLoopSync omits shouldYield()
  performUnitOfWork(workInProgress)
}

performUnitOfWork(fiber):
  next = beginWork(fiber)         // work on this fiber; returns its first child or null
  if (next !== null) workInProgress = next
  else completeUnitOfWork(fiber)  // complete it, then move to a sibling or climb to the parent`}</Code>
      <P>
        One unit of work is one <C>beginWork</C> call. <C>completeWork</C> runs later, from{" "}
        <C>completeUnitOfWork</C>, once a fiber has no child left to begin: it completes that fiber,
        moves on to its sibling if there is one, and otherwise climbs to the parent and completes
        that too. <C>shouldYield()</C> comes from the scheduler package and returns true after about
        5 ms of work in the current slice.
        <Cite ids={["S1", "S6"]} />
      </P>

      <H3 id="ov-beginwork-short">beginWork</H3>
      <P>
        Works <strong>down</strong> the tree, one fiber per call. For the fiber it is given, it:
      </P>
      <UL>
        <li>
          Determines whether it can bail out (same props object, no pending update in this render’s
          lanes, no context change)
        </li>
        <li>
          If not, renders it (calls the function component or class <C>render</C>) or prepares a
          host component’s children
        </li>
        <li>
          Reconciles the result against the current children, creating or reusing the{" "}
          <strong>child</strong> fibers
        </li>
        <li>Returns the first child to process next (or null)</li>
      </UL>
      <P>
        It does not recurse; the work loop moves on to the child it returns. This is where most of
        the “diff” decisions are made.
        <Cite ids={["S2a"]} />
      </P>

      <H3 id="ov-completework">completeWork</H3>
      <P>
        Runs on the way <strong>back up</strong>. For host components in mutation mode (the DOM), on
        mount it creates the instance (<C>createInstance</C>), appends the already-completed child
        instances, and sets initial props (<C>finalizeInitialChildren</C>) — all on nodes that are
        not attached to the document yet. On update it only marks the fiber with an <C>Update</C>{" "}
        flag when its props changed; React 19 applies the actual prop diff during commit (
        <C>commitUpdate</C>). In persistent mode (used by React Native’s Fabric renderer) it clones
        host instances instead of mutating them. It also bubbles <C>flags</C> and{" "}
        <C>subtreeFlags</C> up the tree so commit can skip untouched subtrees.
        <Cite ids={["S3", "S8"]} />
      </P>

      <H3 id="ov-commit">commit</H3>
      <P>
        Applies the prepared changes to the host environment in one synchronous, uninterruptible
        pass: before-mutation, mutation, then <C>root.current = finishedWork</C>, then layout
        effects. Passive effects follow later.
        <Cite ids={["S4"]} />
      </P>

      <H2 id="ov-heuristics">The Diff Heuristics (What Actually Happens)</H2>
      <Table
        head={["Situation", "React’s Behavior"]}
        rows={[
          [
            "Same type + same key",
            "Reuse the fiber and host node; update props/text, then reconcile its children",
          ],
          [
            "Different type (same position)",
            "Unmount the old subtree (state lost), mount a new one",
          ],
          [
            "List reordering with stable keys",
            <>
              Reuse the fibers; move only the nodes that need it (<C>Placement</C>)
            </>,
          ],
          [
            "Index as key (or no keys, which means index)",
            "Matches by position: each slot’s fiber and DOM node are reused for whatever item now sits there, so items get unnecessary updates and state (e.g. input text) can end up on the wrong item after an insert, delete, or reorder",
          ],
          [
            <>
              Unstable keys (e.g. <C>Math.random()</C>)
            </>,
            "Keys never match, so components and DOM nodes are recreated every render and their state is lost",
          ],
          [
            "Component bails out",
            "Skips calling the component; its subtree is skipped too unless something inside has pending work",
          ],
        ]}
      />
      <p className="text-sm text-mist">
        Sources for the table:
        <Cite ids={["S2", "S10", "S11", "S7"]} />
      </p>

      <H3 id="ov-child-diff">Conceptual child diff</H3>
      <P>
        What <C>reconcileChildrenArray</C> in <C>ReactChildFiber.js</C> does for the children of one
        parent:
        <Cite ids={["S7"]} />
      </P>
      <OL>
        <li>
          <strong>Linear first pass.</strong> Walk old and new children side by side while their
          keys match. Matching fibers are reused (or replaced if the type changed). Stop at the
          first key mismatch.
        </li>
        <li>
          If the new list ran out, delete the remaining old children. If the old list ran out,
          create the remaining new children.
        </li>
        <li>
          Otherwise <strong>fall back to a Map</strong> of the remaining old children, keyed by{" "}
          <C>key</C> (or by index for children without a key), and walk the rest of the new
          children:
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>Key found → reuse that fiber and remove it from the map.</li>
            <li>Key missing → create a new fiber.</li>
          </ul>
        </li>
        <li>
          Any old children left in the map → delete (the parent gets a <C>ChildDeletion</C> flag).
        </li>
      </OL>
      <P>
        Moves come down to one number, <C>lastPlacedIndex</C> (in <C>placeChild</C>): a reused child
        whose old index is lower than <C>lastPlacedIndex</C> is marked <C>Placement</C> (it moves);
        otherwise it stays put and <C>lastPlacedIndex</C> becomes its old index. New children are
        always <C>Placement</C>. So moving the first item to the end moves one node, while moving
        the last item to the front marks every other item as moved. React does not search from both
        ends; the source says fibers have no back-pointers for that.
        <Cite ids={["S7"]} />
      </P>

      <H2 id="ov-beginwork">beginWork in More Detail</H2>
      <P>
        <C>beginWork</C> is the function that processes a single fiber during the downward pass.
        Rough responsibilities:
        <Cite ids={["S2a"]} />
      </P>
      <UL>
        <li>
          Check whether the fiber can bail out early: same props object, no legacy context change,
          and no scheduled update or context change for this render’s lanes (
          <C>checkScheduledUpdateOrContext</C>). <C>memo</C>, <C>PureComponent</C>, and{" "}
          <C>shouldComponentUpdate</C> add a props comparison on top.
        </li>
        <li>If not, call the component (function/class) or prepare a host component’s children.</li>
        <li>
          Reconcile children (<C>reconcileChildren</C>, which calls <C>mountChildFibers</C> on mount
          and <C>reconcileChildFibers</C> on update).
        </li>
        <li>Return the next unit of work: the first child, or null.</li>
      </UL>
      <P>
        Fibers form a tree linked by <C>child</C>, <C>sibling</C>, and <C>return</C> pointers; each
        list of siblings is a singly linked list.
        <Cite ids={["S5"]} /> Because the work loop walks that tree with a single{" "}
        <C>workInProgress</C> pointer instead of the JavaScript call stack, React can stop{" "}
        <strong>between</strong> fibers — after any <C>beginWork</C> or complete step — and the
        scheduler can run other work before it continues. A <C>beginWork</C> call itself always runs
        to completion. This is the foundation of concurrent features.
        <Cite ids={["S1", "S5"]} />
      </P>

      <H2 id="ov-gibbon">React (Standard) vs React-Gibbon</H2>
      <P>
        <strong>React-Gibbon</strong> is Netflix’s custom React renderer for its TV app. Netflix
        began the React rewrite of its TV UI in 2015 and wrote about React-Gibbon in January 2017.
        The app runs on hundreds of devices, from game consoles like the PS4 Pro to budget devices
        with sub-GHz single-core CPUs, little memory, limited graphics acceleration, and an older
        non-JIT JavaScriptCore.
        <Cite ids={["N1"]} /> React-Gibbon targets Netflix’s Gibbon rendering layer instead of the
        DOM: a different <strong>host renderer</strong>, with an API that Netflix says feels
        familiar to React-DOM users.
        <Cite ids={["N1"]} /> Netflix calls it “our own flavor of React” and does not say how
        much of React’s reconciler code it reused, so “not a different reconciler” is a fair reading
        of the design, not a documented fact.
        <Cite ids={["N1"]} />
      </P>
      <Table
        head={["Aspect", "Standard React (DOM)", "React-Gibbon (Netflix)"]}
        rows={[
          [
            "Reconciler",
            "Fiber since React 16 (Sep 26, 2017); the stack reconciler before that",
            "Built from 2015, before Fiber, so it started on React’s stack-era reconciler. Whether it later moved to Fiber has not been published",
          ],
          [
            "Diff algorithm",
            "Type + key heuristics",
            <>
              Same component model and keys; React-Gibbon adds its own widget style diffing (e.g. a
              memoized <C>staticStyle</C>, a Babel-generated <C>__update__</C> function)
            </>,
          ],
          [
            "Host environment",
            "Browser DOM (react-dom) or native views (React Native)",
            "Gibbon: Netflix’s own JS + native graphics framework that renders a tree of graphics objects",
          ],
          [
            "Goal",
            "General web / mobile",
            "Responsive 60 fps UI on constrained TV devices (2016 talk: 100 ms key input and 60 fps on 600 MHz single-core devices)",
          ],
          [
            "Architecture",
            "Host config in mutation mode (react-dom) or persistent mode (React Native Fabric)",
            "Not publicly documented",
          ],
          [
            "Markup",
            "JSX → DOM elements",
            <>
              JSX → a single <C>Widget</C> drawing primitive with inline styles (text, images,
              boxes)
            </>,
          ],
        ]}
      />
      <p className="text-sm text-mist">
        Sources for the table:
        <Cite ids={["S13", "N1", "N2", "N3", "T2", "S8"]} />
      </p>
      <aside
        role="note"
        aria-label="Note on React-Gibbon and Fiber"
        className="max-w-2xl rounded-md border border-l-4 border-copper bg-raised px-4 py-3"
      >
        <p className="font-mono text-xs tracking-widest text-copper uppercase">Note · timeline</p>
        <p className="mt-1 text-sm leading-relaxed text-paper">
          React-Gibbon (built from 2015, described in January 2017) predates Fiber, which shipped as
          React 16.0 on September 26, 2017. So it was built on React’s earlier stack reconciler. The
          type + key heuristics were the same — the legacy reconciliation page describes them in the
          stack era — but the implementation underneath was different: a recursive walk, not a fiber
          work loop. Netflix hasn’t published whether React-Gibbon later moved to Fiber.
          <Cite ids={["S13", "S2", "N1"]} />
        </p>
      </aside>
      <P>
        <strong>Key takeaway</strong>: React’s component model, keys, and reconciliation heuristics
        carried over. What Netflix replaced was the host layer — the part that actually creates,
        updates, and removes real UI elements — with Gibbon, a much lighter rendering backend than a
        full browser DOM/CSS engine. That matters on devices with sub-GHz single-core CPUs and a
        non-JIT JavaScript engine.
        <Cite ids={["N1"]} /> (Today that host layer is the host config you pass to the{" "}
        <C>react-reconciler</C> package.
        <Cite ids={["S14"]} />)
      </P>
      <P>
        Gibbon (the rendering platform) existed first: Netflix described its custom JS + native
        graphics framework for TVs in 2013, and the 2017 post names that rendering layer Gibbon.
        React-Gibbon was written on top of it starting in 2015.
        <Cite ids={["N2", "N3", "N1"]} />
      </P>

      <H2 id="ov-implications">Practical Implications</H2>
      <UL>
        <li>
          Stable, unique <C>key</C>s on lists that can change are the single biggest way to help the
          reconciler — and they are about correctness (state stays with the right item), not just
          speed.
          <Cite ids={["S10"]} />
        </li>
        <li>
          Changing an element’s type (or a component’s identity — a new <C>key</C>, or a component
          defined inside another component’s render) forces a full unmount/remount.
          <Cite ids={["S11"]} />
        </li>
        <li>
          Most of the time you describe the UI you want; React works out the host updates. They are
          usually close to minimal, but not guaranteed minimal — that is the heuristic trade-off.
          <Cite ids={["S2"]} />
        </li>
        <li>
          Concurrent features (transitions, <C>useDeferredValue</C>, Suspense) rely on the render
          phase being interruptible while the commit phase stays atomic.
          <Cite ids={["S9"]} />
        </li>
      </UL>

      <H2 id="ov-sources">Sources</H2>
      {SOURCE_GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <H3>{group.title}</H3>
          <ul className="flex max-w-2xl flex-col gap-2 text-sm leading-relaxed text-paper md:text-base">
            {group.sources.map((source) => (
              <li
                key={source.id}
                id={`ov-src-${source.id.toLowerCase()}`}
                className="scroll-mt-64 xl:scroll-mt-32"
              >
                <span className="mr-2 font-mono text-xs text-copper">[{source.id}]</span>
                {source.links.map((link, index) => (
                  <span key={link.href}>
                    {index > 0 ? ", " : null}
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="break-words text-paper underline decoration-line underline-offset-4 hover:text-copper"
                    >
                      {link.label}
                    </a>
                  </span>
                ))}
                {source.note ? <span className="text-mist"> — {source.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="max-w-2xl text-sm text-mist">
        The Netflix posts are on Medium, which refuses automated link checkers; their titles, dates,
        and contents were confirmed through search indexes and a published translation. No public
        React-Gibbon repository or changelog was found.
      </p>

      <H2 id="ov-changes">What changed from the original notes</H2>
      <details className="max-w-2xl rounded-md border border-line bg-raised px-4 py-3">
        <summary className="cursor-pointer font-mono text-xs tracking-widest text-copper uppercase">
          Show the {CHANGES.length} corrections
        </summary>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-paper marker:text-copper">
          {CHANGES.map((change, index) => (
            <li key={index}>{change}</li>
          ))}
        </ul>
      </details>

      <hr className="mt-6 border-line" />
      <p className="max-w-2xl text-sm text-mist italic">
        Drop this file next to your Fiber / beginWork related code so the mental model stays nearby
        while reading the source.
      </p>
      <p className="font-mono text-xs text-mist">
        Also saved as docs/reconciliation-fiber-notes.md in this repo.
      </p>
    </article>
  );
}
