# React Reconciliation & Fiber Notes

A practical summary of how React’s reconciler works, the role of heuristics and async work, and how it compares to Netflix’s React Gibbon.

## Core Ideas

React’s reconciler does **not** perform a full general tree diff (which is \(O(n^3)\)).  
It uses a **heuristic** \(O(n)\) algorithm based on two assumptions that hold for almost all real UIs:

1. Elements of different types produce different trees → React tears down the old tree and builds a new one.
2. The developer can hint at stable children with a `key` prop so React can match them across renders.

A **heuristic** is a practical shortcut that is “good enough” and fast, even if it isn’t guaranteed to be optimal. React’s diff is a classic example.

## Async vs Synchronous in Fiber

- **Render phase** (`beginWork` → `completeWork`): Can be **asynchronous / interruptible**. React can pause, abort, or reprioritize work.
- **Commit phase**: Must be **synchronous**. Once React starts applying changes to the host (DOM, native views, etc.), it finishes so the UI stays consistent.

This split is why React can do concurrent rendering without tearing.

## Fiber Work Loop (Simplified)

```
while (there is work) {
  performUnitOfWork(fiber)   // beginWork + completeWork for one fiber
}
```

### beginWork
Walks **down** the tree. For each fiber it:

- Creates or reuses the fiber
- Determines whether it can bail out (props/state unchanged)
- Recurses into children
- Returns the next child to process (or null)

This is where most of the “diff” decisions start.

### completeWork
Walks **back up**. Prepares the host instance (creates DOM nodes, sets props, etc.) but does not yet commit them.

### commit
Applies the prepared changes to the host environment in a single synchronous pass.

## The Diff Heuristics (What Actually Happens)

| Situation | React’s Behavior |
|---|---|
| Same type + same key | Update in place (props, text, children) |
| Different type | Unmount old tree, mount new tree |
| List reordering with keys | Move existing nodes |
| No keys / index as key | Often recreates nodes unnecessarily |
| Component bails out | Skips the subtree entirely |

### Conceptual child diff
When comparing children of the same parent:

1. Build a map of old children by `key`.
2. Walk the new children:
   - Key exists → reuse fiber, move if position changed.
   - Key missing → insert new fiber.
3. Any leftover old keys → delete.

## beginWork in More Detail

`beginWork` is the function that processes a single fiber during the downward pass. Rough responsibilities:

- Check if the fiber can bail out (memoization / pure component / unchanged props).
- If not, call the component (for function/class components) or prepare the host instance.
- Reconcile children (`reconcileChildren` / `reconcileChildFibers`).
- Return the next unit of work (usually the first child).

Because Fiber is a linked list of units of work, `beginWork` can return early and the scheduler can interleave other work. This is the foundation of concurrent features.

## React (Standard) vs React Gibbon

**React Gibbon** was Netflix’s custom React renderer (2015–2016) for TVs, smart TVs, PS4, and very low-power devices. It was **not** a different reconciler. It was a different **host renderer**.

| Aspect | Standard React (DOM / Fiber) | React Gibbon (Netflix) |
|---|---|---|
| Reconciler | Fiber | Same Fiber reconciler |
| Diff algorithm | Type + key heuristics | Same heuristics |
| Host environment | Browser DOM or React Native | Custom lightweight widget system (Gibbon) |
| Goal | General web / mobile | 60 fps on extremely constrained devices |
| Architecture | Mutation or persistent mode | Bridge-style (similar to early React Native) |
| Markup | JSX → DOM elements | JSX → Gibbon widgets (simple boxes, text, images) |

**Key takeaway**: The reconciliation / diff logic stayed the same. Netflix only replaced the host config — the part that actually creates, updates, and removes real UI elements — with a much lighter custom rendering backend. This avoided the cost of a full browser DOM/CSS engine on devices with slow single-core CPUs and tiny caches.

Gibbon (the rendering platform) existed first. React Gibbon was the React renderer written on top of it, later aligned with React Native’s architecture.

## Practical Implications

- Stable, unique `key`s on lists are the single biggest way to help the reconciler.
- Changing an element’s type (or a component’s identity) forces a full unmount/remount.
- Most of the time you describe the UI you want; React computes the minimal host updates.
- Concurrent features (Suspense, transitions, etc.) rely on the render phase being interruptible while the commit phase stays atomic.

## References / Further Reading

- React docs: Reconciliation
- React Fiber architecture talks (Andrew Clark, Sebastian Markbåge)
- Netflix React Conf talks on Gibbon (2015–2016) — custom renderer for TV devices
- `react-reconciler` package (for building custom renderers)

---

*Drop this file next to your Fiber / beginWork related code so the mental model stays nearby while reading the source.*
