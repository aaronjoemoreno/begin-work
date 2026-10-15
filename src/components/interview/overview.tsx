import type { ReactNode } from "react";
import { Code } from "@/components/interview/shared";

/**
 * Overview tab: Aaron's "React Reconciliation & Fiber Notes", rendered verbatim.
 * The same text lives in docs/reconciliation-fiber-notes.md.
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
  { id: "ov-gibbon", label: "React (Standard) vs React Gibbon", level: 2 },
  { id: "ov-implications", label: "Practical Implications", level: 2 },
  { id: "ov-references", label: "References / Further Reading", level: 2 },
];

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
          A practical summary of how React’s reconciler works, the role of heuristics and async
          work, and how it compares to Netflix’s React Gibbon.
        </p>
      </header>

      <H2 id="ov-core">Core Ideas</H2>
      <P>
        React’s reconciler does <strong>not</strong> perform a full general tree diff (which is{" "}
        <BigO power={3} />
        ).
        <br />
        It uses a <strong>heuristic</strong> <BigO /> algorithm based on two assumptions that hold
        for almost all real UIs:
      </P>
      <OL>
        <li>
          Elements of different types produce different trees → React tears down the old tree and
          builds a new one.
        </li>
        <li>
          The developer can hint at stable children with a <C>key</C> prop so React can match them
          across renders.
        </li>
      </OL>
      <P>
        A <strong>heuristic</strong> is a practical shortcut that is “good enough” and fast, even if
        it isn’t guaranteed to be optimal. React’s diff is a classic example.
      </P>

      <H2 id="ov-async">Async vs Synchronous in Fiber</H2>
      <UL>
        <li>
          <strong>Render phase</strong> (<C>beginWork</C> → <C>completeWork</C>): Can be{" "}
          <strong>asynchronous / interruptible</strong>. React can pause, abort, or reprioritize
          work.
        </li>
        <li>
          <strong>Commit phase</strong>: Must be <strong>synchronous</strong>. Once React starts
          applying changes to the host (DOM, native views, etc.), it finishes so the UI stays
          consistent.
        </li>
      </UL>
      <P>This split is why React can do concurrent rendering without tearing.</P>

      <H2 id="ov-loop">Fiber Work Loop (Simplified)</H2>
      <Code>{`
while (there is work) {
  performUnitOfWork(fiber)   // beginWork + completeWork for one fiber
}`}</Code>

      <H3 id="ov-beginwork-short">beginWork</H3>
      <P>
        Walks <strong>down</strong> the tree. For each fiber it:
      </P>
      <UL>
        <li>Creates or reuses the fiber</li>
        <li>Determines whether it can bail out (props/state unchanged)</li>
        <li>Recurses into children</li>
        <li>Returns the next child to process (or null)</li>
      </UL>
      <P>This is where most of the “diff” decisions start.</P>

      <H3 id="ov-completework">completeWork</H3>
      <P>
        Walks <strong>back up</strong>. Prepares the host instance (creates DOM nodes, sets props,
        etc.) but does not yet commit them.
      </P>

      <H3 id="ov-commit">commit</H3>
      <P>Applies the prepared changes to the host environment in a single synchronous pass.</P>

      <H2 id="ov-heuristics">The Diff Heuristics (What Actually Happens)</H2>
      <Table
        head={["Situation", "React’s Behavior"]}
        rows={[
          ["Same type + same key", "Update in place (props, text, children)"],
          ["Different type", "Unmount old tree, mount new tree"],
          ["List reordering with keys", "Move existing nodes"],
          ["No keys / index as key", "Often recreates nodes unnecessarily"],
          ["Component bails out", "Skips the subtree entirely"],
        ]}
      />

      <H3 id="ov-child-diff">Conceptual child diff</H3>
      <P>When comparing children of the same parent:</P>
      <OL>
        <li>
          Build a map of old children by <C>key</C>.
        </li>
        <li>
          Walk the new children:
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>Key exists → reuse fiber, move if position changed.</li>
            <li>Key missing → insert new fiber.</li>
          </ul>
        </li>
        <li>Any leftover old keys → delete.</li>
      </OL>

      <H2 id="ov-beginwork">beginWork in More Detail</H2>
      <P>
        <C>beginWork</C> is the function that processes a single fiber during the downward pass.
        Rough responsibilities:
      </P>
      <UL>
        <li>Check if the fiber can bail out (memoization / pure component / unchanged props).</li>
        <li>
          If not, call the component (for function/class components) or prepare the host instance.
        </li>
        <li>
          Reconcile children (<C>reconcileChildren</C> / <C>reconcileChildFibers</C>).
        </li>
        <li>Return the next unit of work (usually the first child).</li>
      </UL>
      <P>
        Because Fiber is a linked list of units of work, <C>beginWork</C> can return early and the
        scheduler can interleave other work. This is the foundation of concurrent features.
      </P>

      <H2 id="ov-gibbon">React (Standard) vs React Gibbon</H2>
      <P>
        <strong>React Gibbon</strong> was Netflix’s custom React renderer (2015–2016) for TVs, smart
        TVs, PS4, and very low-power devices. It was <strong>not</strong> a different reconciler. It
        was a different <strong>host renderer</strong>.
      </P>
      <Table
        head={["Aspect", "Standard React (DOM / Fiber)", "React Gibbon (Netflix)"]}
        rows={[
          ["Reconciler", "Fiber", "Same Fiber reconciler"],
          ["Diff algorithm", "Type + key heuristics", "Same heuristics"],
          [
            "Host environment",
            "Browser DOM or React Native",
            "Custom lightweight widget system (Gibbon)",
          ],
          ["Goal", "General web / mobile", "60 fps on extremely constrained devices"],
          [
            "Architecture",
            "Mutation or persistent mode",
            "Bridge-style (similar to early React Native)",
          ],
          ["Markup", "JSX → DOM elements", "JSX → Gibbon widgets (simple boxes, text, images)"],
        ]}
      />
      <aside
        role="note"
        aria-label="Note on React Gibbon and Fiber"
        className="max-w-2xl rounded-md border border-l-4 border-copper bg-raised px-4 py-3"
      >
        <p className="font-mono text-xs tracking-widest text-copper uppercase">Note · timeline</p>
        <p className="mt-1 text-sm leading-relaxed text-paper">
          React Gibbon (2015–2016) predates Fiber, which shipped in React 16 in 2017. So at the time
          it ran on React’s stack reconciler, not on Fiber. The point of the table still holds: the
          same type + key heuristics drove the diff — it was the reconciler implementation
          underneath that differed. “Fiber” in the table above reads best as “React’s reconciler.”
        </p>
      </aside>
      <P>
        <strong>Key takeaway</strong>: The reconciliation / diff logic stayed the same. Netflix only
        replaced the host config — the part that actually creates, updates, and removes real UI
        elements — with a much lighter custom rendering backend. This avoided the cost of a full
        browser DOM/CSS engine on devices with slow single-core CPUs and tiny caches.
      </P>
      <P>
        Gibbon (the rendering platform) existed first. React Gibbon was the React renderer written
        on top of it, later aligned with React Native’s architecture.
      </P>

      <H2 id="ov-implications">Practical Implications</H2>
      <UL>
        <li>
          Stable, unique <C>key</C>s on lists are the single biggest way to help the reconciler.
        </li>
        <li>
          Changing an element’s type (or a component’s identity) forces a full unmount/remount.
        </li>
        <li>
          Most of the time you describe the UI you want; React computes the minimal host updates.
        </li>
        <li>
          Concurrent features (Suspense, transitions, etc.) rely on the render phase being
          interruptible while the commit phase stays atomic.
        </li>
      </UL>

      <H2 id="ov-references">References / Further Reading</H2>
      <UL>
        <li>React docs: Reconciliation</li>
        <li>React Fiber architecture talks (Andrew Clark, Sebastian Markbåge)</li>
        <li>Netflix React Conf talks on Gibbon (2015–2016) — custom renderer for TV devices</li>
        <li>
          <C>react-reconciler</C> package (for building custom renderers)
        </li>
      </UL>

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
