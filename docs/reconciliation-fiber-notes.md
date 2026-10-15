# React Reconciliation & Fiber Notes

A practical summary of how React’s reconciler works, the role of heuristics and interruptible rendering, and how it compares to Netflix’s React-Gibbon. Checked against the React 19.2 source (tag `v19.2.0`) and the sources at the end; bracketed tags like [S1] point to them.

## Core Ideas

React’s reconciler does **not** perform a full general tree diff. The best-known general algorithms for turning one tree into another are on the order of \(O(n^3)\) — for 1,000 elements, roughly a billion comparisons. [S2]
Instead it uses a **heuristic** \(O(n)\) algorithm based on two assumptions that hold for almost all real UIs: [S2]

1. Elements of different types produce different trees → React tears down the old subtree (and its state) and builds a new one.
2. The developer can hint at which children are stable across renders with a `key` prop, so React can match them.

A **heuristic** is a practical shortcut that is “good enough” and fast, even if it isn’t guaranteed to be optimal. React’s diff is a classic example: it never tries to notice that a subtree moved to a different parent, or that two different component types render similar output. [S2]

## Async vs Synchronous in Fiber

- **Render phase** (`beginWork` → `completeWork`, driven by `performUnitOfWork`): **interruptible** when React renders concurrently (transitions, `useDeferredValue`, Suspense retries). React can yield between fibers, throw away an unfinished render, and restart it at a different priority. Sync and default-priority updates render without yielding. [S1, S9]
- **Commit phase**: **uninterruptible**. Once React starts applying changes to the host (DOM, native views, etc.), it runs the before-mutation, mutation, and layout steps in one synchronous pass, so the screen never shows a half-applied update. Passive effects (`useEffect`) are not part of that pass: they run afterwards, as a separately scheduled task, or at the end of commit when the render was synchronous. [S4]

This split is what makes concurrent rendering safe: an unfinished render can be discarded at no visible cost, because nothing reaches the screen until commit. (React uses the word **tearing** for a narrower problem — components reading different values from an external mutable store during one concurrent render — which `useSyncExternalStore` exists to prevent. [S12])

## Fiber Work Loop (Simplified)

```
// ReactFiberWorkLoop.js (React 19.2)
while (workInProgress !== null && !shouldYield()) {  // workLoopSync omits shouldYield()
  performUnitOfWork(workInProgress)
}

performUnitOfWork(fiber):
  next = beginWork(fiber)         // work on this fiber; returns its first child or null
  if (next !== null) workInProgress = next
  else completeUnitOfWork(fiber)  // complete it, then move to a sibling or climb to the parent
```

One unit of work is one `beginWork` call. `completeWork` runs later, from `completeUnitOfWork`, once a fiber has no child left to begin: it completes that fiber, moves on to its sibling if there is one, and otherwise climbs to the parent and completes that too. `shouldYield()` comes from the scheduler package and returns true after about 5 ms of work in the current slice. [S1, S6]

### beginWork
Works **down** the tree, one fiber per call. For the fiber it is given, it:

- Determines whether it can bail out (same props object, no pending update in this render’s lanes, no context change)
- If not, renders it (calls the function component or class `render`) or prepares a host component’s children
- Reconciles the result against the current children, creating or reusing the **child** fibers
- Returns the first child to process next (or null)

It does not recurse; the work loop moves on to the child it returns. This is where most of the “diff” decisions are made. [S2a]

### completeWork
Runs on the way **back up**. For host components in mutation mode (the DOM), on mount it creates the instance (`createInstance`), appends the already-completed child instances, and sets initial props (`finalizeInitialChildren`) — all on nodes that are not attached to the document yet. On update it only marks the fiber with an `Update` flag when its props changed; React 19 applies the actual prop diff during commit (`commitUpdate`). In persistent mode (used by React Native’s Fabric renderer) it clones host instances instead of mutating them. It also bubbles `flags` and `subtreeFlags` up the tree so commit can skip untouched subtrees. [S3, S8]

### commit
Applies the prepared changes to the host environment in one synchronous, uninterruptible pass: before-mutation, mutation, then `root.current = finishedWork`, then layout effects. Passive effects follow later. [S4]

## The Diff Heuristics (What Actually Happens)

| Situation | React’s Behavior |
|---|---|
| Same type + same key | Reuse the fiber and host node; update props/text, then reconcile its children |
| Different type (same position) | Unmount the old subtree (state lost), mount a new one |
| List reordering with stable keys | Reuse the fibers; move only the nodes that need it (`Placement`) |
| Index as key (or no keys, which means index) | Matches by position: each slot’s fiber and DOM node are reused for whatever item now sits there, so items get unnecessary updates and state (e.g. input text) can end up on the wrong item after an insert, delete, or reorder |
| Unstable keys (e.g. `Math.random()`) | Keys never match, so components and DOM nodes are recreated every render and their state is lost |
| Component bails out | Skips calling the component; its subtree is skipped too unless something inside has pending work |

[S2, S10, S11, S7]

### Conceptual child diff
What `reconcileChildrenArray` in `ReactChildFiber.js` does for the children of one parent: [S7]

1. **Linear first pass.** Walk old and new children side by side while their keys match. Matching fibers are reused (or replaced if the type changed). Stop at the first key mismatch.
2. If the new list ran out, delete the remaining old children. If the old list ran out, create the remaining new children.
3. Otherwise **fall back to a Map** of the remaining old children, keyed by `key` (or by index for children without a key), and walk the rest of the new children:
   - Key found → reuse that fiber and remove it from the map.
   - Key missing → create a new fiber.
4. Any old children left in the map → delete (the parent gets a `ChildDeletion` flag).

Moves come down to one number, `lastPlacedIndex` (in `placeChild`): a reused child whose old index is lower than `lastPlacedIndex` is marked `Placement` (it moves); otherwise it stays put and `lastPlacedIndex` becomes its old index. New children are always `Placement`. So moving the first item to the end moves one node, while moving the last item to the front marks every other item as moved. React does not search from both ends; the source says fibers have no back-pointers for that. [S7]

## beginWork in More Detail

`beginWork` is the function that processes a single fiber during the downward pass. Rough responsibilities: [S2a]

- Check whether the fiber can bail out early: same props object, no legacy context change, and no scheduled update or context change for this render’s lanes (`checkScheduledUpdateOrContext`). `memo`, `PureComponent`, and `shouldComponentUpdate` add a props comparison on top.
- If not, call the component (function/class) or prepare a host component’s children.
- Reconcile children (`reconcileChildren`, which calls `mountChildFibers` on mount and `reconcileChildFibers` on update).
- Return the next unit of work: the first child, or null.

Fibers form a tree linked by `child`, `sibling`, and `return` pointers; each list of siblings is a singly linked list. [S5] Because the work loop walks that tree with a single `workInProgress` pointer instead of the JavaScript call stack, React can stop **between** fibers — after any `beginWork` or complete step — and the scheduler can run other work before it continues. A `beginWork` call itself always runs to completion. This is the foundation of concurrent features. [S1, S5]

## React (Standard) vs React-Gibbon

**React-Gibbon** is Netflix’s custom React renderer for its TV app. Netflix began the React rewrite of its TV UI in 2015 and wrote about React-Gibbon in January 2017. The app runs on hundreds of devices, from game consoles like the PS4 Pro to budget devices with sub-GHz single-core CPUs, little memory, limited graphics acceleration, and an older non-JIT JavaScriptCore. [N1] React-Gibbon targets Netflix’s Gibbon rendering layer instead of the DOM: a different **host renderer**, with an API that Netflix says feels familiar to React-DOM users. [N1] Netflix calls it “our own flavor of React” and does not say how much of React’s reconciler code it reused, so “not a different reconciler” is a fair reading of the design, not a documented fact. [N1]

| Aspect | Standard React (DOM) | React-Gibbon (Netflix) |
|---|---|---|
| Reconciler | Fiber since React 16 (Sep 26, 2017); the stack reconciler before that | Built from 2015, before Fiber, so it started on React’s stack-era reconciler. Whether it later moved to Fiber has not been published |
| Diff algorithm | Type + key heuristics | Same component model and keys; React-Gibbon adds its own widget style diffing (e.g. a memoized `staticStyle`, a Babel-generated `__update__` function) |
| Host environment | Browser DOM (react-dom) or native views (React Native) | Gibbon: Netflix’s own JS + native graphics framework that renders a tree of graphics objects |
| Goal | General web / mobile | Responsive 60 fps UI on constrained TV devices (2016 talk: 100 ms key input and 60 fps on 600 MHz single-core devices) |
| Architecture | Host config in mutation mode (react-dom) or persistent mode (React Native Fabric) | Not publicly documented |
| Markup | JSX → DOM elements | JSX → a single `Widget` drawing primitive with inline styles (text, images, boxes) |

[S13, N1, N2, N3, T2, S8]

> **Note · timeline.** React-Gibbon (built from 2015, described in January 2017) predates Fiber, which shipped as React 16.0 on September 26, 2017. So it was built on React’s earlier stack reconciler. The type + key heuristics were the same — the legacy reconciliation page describes them in the stack era — but the implementation underneath was different: a recursive walk, not a fiber work loop. Netflix hasn’t published whether React-Gibbon later moved to Fiber. [S13, S2, N1]

**Key takeaway**: React’s component model, keys, and reconciliation heuristics carried over. What Netflix replaced was the host layer — the part that actually creates, updates, and removes real UI elements — with Gibbon, a much lighter rendering backend than a full browser DOM/CSS engine. That matters on devices with sub-GHz single-core CPUs and a non-JIT JavaScript engine. [N1] (Today that host layer is the host config you pass to the `react-reconciler` package. [S14])

Gibbon (the rendering platform) existed first: Netflix described its custom JS + native graphics framework for TVs in 2013, and the 2017 post names that rendering layer Gibbon. React-Gibbon was written on top of it starting in 2015. [N2, N3, N1]

## Practical Implications

- Stable, unique `key`s on lists that can change are the single biggest way to help the reconciler — and they are about correctness (state stays with the right item), not just speed. [S10]
- Changing an element’s type (or a component’s identity — a new `key`, or a component defined inside another component’s render) forces a full unmount/remount. [S11]
- Most of the time you describe the UI you want; React works out the host updates. They are usually close to minimal, but not guaranteed minimal — that is the heuristic trade-off. [S2]
- Concurrent features (transitions, `useDeferredValue`, Suspense) rely on the render phase being interruptible while the commit phase stays atomic. [S9]

## Sources

React source, tag `v19.2.0`:

- [S1] `ReactFiberWorkLoop.js` — [`workLoopSync`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2681), [`workLoopConcurrentByScheduler`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2982), [`performUnitOfWork`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2990), [`completeUnitOfWork`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L3273)
- [S2a] `ReactFiberBeginWork.js` — [`beginWork`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L4091), [`reconcileChildren`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L341)
- [S3] `ReactFiberCompleteWork.js` — [`completeWork`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberCompleteWork.js#L1049), [`updateHostComponent`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberCompleteWork.js#L453)
- [S4] `ReactFiberWorkLoop.js` — [`commitRoot`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L3416), [`flushPassiveEffects`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L4452)
- [S6] Scheduler — [`shouldYieldToHost`](https://github.com/facebook/react/blob/v19.2.0/packages/scheduler/src/forks/Scheduler.js#L447), [`frameYieldMs = 5`](https://github.com/facebook/react/blob/v19.2.0/packages/scheduler/src/SchedulerFeatureFlags.js)
- [S7] `ReactChildFiber.js` — [`reconcileChildrenArray`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactChildFiber.js#L1124), [`placeChild`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactChildFiber.js#L492), [`mapRemainingChildren`](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactChildFiber.js#L463)
- [S8] React Native Fabric host config — [`supportsPersistence = true`](https://github.com/facebook/react/blob/v19.2.0/packages/react-native-renderer/src/ReactFiberConfigFabric.js#L445)
- [S14] [`react-reconciler` package](https://github.com/facebook/react/tree/v19.2.0/packages/react-reconciler) (for building custom renderers)

React docs and design notes:

- [S2] [Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html) — legacy React docs
- [S5] [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture) — Andrew Clark, 2016
- [S9] [`useTransition`](https://react.dev/reference/react/useTransition) — react.dev
- [S10] [Rendering Lists: keys](https://react.dev/learn/rendering-lists) — react.dev
- [S11] [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) — react.dev
- [S12] [What is tearing?](https://github.com/reactwg/react-18/discussions/69) — React 18 Working Group; [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [S13] [React v16.0](https://legacy.reactjs.org/blog/2017/09/26/react-v16.0.html) — September 26, 2017, the first release built on Fiber

Talks:

- [T1] [Beyond the DOM: How Netflix plans to enhance your television experience](https://www.youtube.com/watch?v=eNC0mRYGWgc) — Jafar Husain, React.js Conf 2015 ([schedule](https://conf2015.reactjs.org/schedule.html))
- [T2] [Performance Without Compromise](https://www.youtube.com/watch?v=kDARP5QZ6nU) — Steve McGuire (Netflix), React.js Conf 2016 ([abstract](https://conf2016.reactjs.org/schedule.html))
- [T3] [A Cartoon Intro to Fiber](https://www.youtube.com/watch?v=ZCuYPiUIONs) — Lin Clark, React Conf 2017
- [T4] [What’s Next for React](https://www.youtube.com/watch?v=aV1271hd9ew) — Andrew Clark, ReactNext 2016
- [T5] [React Performance End to End (React Fiber)](https://www.youtube.com/watch?v=bvFpe5j9-zQ) — Sebastian Markbåge, React Conf 2017

Netflix Tech Blog:

- [N1] [Crafting a high-performance TV user interface using React](https://netflixtechblog.com/crafting-a-high-performance-tv-user-interface-using-react-3350e5a6ad3b) — January 12, 2017
- [N2] [Building the New Netflix Experience for TV](https://netflixtechblog.com/building-the-new-netflix-experience-for-tv-920d71d875de) — November 18, 2013
- [N3] [Pioneering application design on TVs & TV-connected devices](https://netflixtechblog.com/pioneering-application-design-on-tvs-tv-connected-devices-e361dbe02f66) — December 16, 2013

The Netflix posts are on Medium, which refuses automated link checkers; their titles, dates, and contents were confirmed through search indexes and a published translation. No public React-Gibbon repository or changelog was found.

## What changed from the original notes

- O(n³) is now attributed to the general tree-edit algorithms the React docs cite, with the “1,000 elements ≈ a billion comparisons” example.
- The render phase is interruptible only for concurrent work; sync and default updates don’t yield.
- “Commit must be synchronous” became “uninterruptible”, with passive effects called out as running afterwards.
- “Without tearing” was reworded: in React, tearing means something narrower (external-store reads), handled by `useSyncExternalStore`.
- The work loop now matches the source: `performUnitOfWork` runs `beginWork` and only calls `completeUnitOfWork` when there is no child; one unit is not “beginWork + completeWork for one fiber”.
- beginWork doesn’t recurse or create its own fiber; it reconciles and returns child fibers.
- completeWork: mutation mode creates instances on mount but defers update diffs to commit in React 19; persistent mode clones.
- Diff table: index keys reuse nodes by position (wrong state, extra updates) rather than recreating them; unstable keys are what recreate; bailouts still descend when a child has work.
- Child diff now describes the linear first pass, the Map fallback, and `lastPlacedIndex`.
- “Fiber is a linked list” became a tree linked by child/sibling/return pointers; yielding happens between units, not inside `beginWork`.
- Gibbon: dates, devices, and 60 fps are now sourced; “Same Fiber reconciler” corrected (pre-Fiber); “bridge-style” and “later aligned with React Native” removed as unverifiable; “tiny caches” removed (not in the sources).
- References replaced with real talk titles and links; a Sources section added.

---

*Drop this file next to your Fiber / beginWork related code so the mental model stays nearby while reading the source.*
