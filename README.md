# Begin Work

A field guide to the React 19.2 reconciler: fibers, the work loop, keys, lanes, and commit.

```bash
npm install
npm run dev
```

## Overview

`/overview` is the fact-checked "React Reconciliation & Fiber Notes" on their own page: work loop, beginWork,
completeWork, commit, the diff heuristics, and React-Gibbon, with inline citations, a Sources section, and a list of
what changed from the original notes. Component: `src/components/interview/overview.tsx`; the same text is in
`docs/reconciliation-fiber-notes.md`. Old `/interview?tab=overview` and `/interview#ov-*` links redirect there.

## Interview drill

`/interview` walks through theSeniorDev’s video
[React Interview Questions Senior Level (React Fiber, Reconciliation, Virtual DOM)](https://youtu.be/XU6O4ASQoWs)
in order, with step-through labs, corrections against the React 19.2 source, quick checks, and notes for
low-memory TV targets (Preact, Inferno). Source: `src/components/interview/`, models in `src/lib/interview-sim.ts`.
