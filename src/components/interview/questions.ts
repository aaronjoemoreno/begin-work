import type { Question } from "@/components/interview/shared";

export const Q_FIBER: Question[] = [
  {
    id: "fiber-1",
    prompt: "What is the one capability fiber added that the stack reconciler could not offer?",
    options: [
      "A faster diffing algorithm",
      "Rendering work that can stop between components and continue later",
      "Removing the virtual DOM",
      "Rendering on a Web Worker",
    ],
    answer: 1,
    why: "The video’s headline: fiber reconciliation can be paused. Each component becomes a unit of work, so the next step is a pointer, not a frame on the call stack.",
  },
  {
    id: "fiber-2",
    prompt: "Which React major introduced the fiber architecture?",
    options: ["React 15", "React 16", "React 18", "React 19"],
    answer: 1,
    why: "Fiber shipped in React 16. Concurrent rendering became something apps could opt into with createRoot and transitions in React 18.",
  },
];

export const Q_STACK: Question[] = [
  {
    id: "stack-1",
    prompt: "Why does typing feel frozen while the stack reconciler renders a huge tree?",
    options: [
      "The input element is unmounted during render",
      "The call stack is busy with recursive render calls, so the browser cannot run the key handler or paint",
      "React debounces input events by design",
      "The virtual DOM blocks the network",
    ],
    answer: 1,
    why: "One synchronous recursion owns the main thread until it returns. Events queue and the next paint waits.",
  },
  {
    id: "stack-2",
    prompt: "Which of these is not a field on a fiber?",
    options: ["memoizedState", "sibling", "child", "parentDOMNode"],
    answer: 3,
    why: "Fibers link with return, child, and sibling. Host fibers keep their DOM node in stateNode. There is no parentDOMNode field.",
  },
];

export const Q_WHY: Question[] = [
  {
    id: "why-1",
    prompt: "While React builds the work-in-progress tree, what does the user see?",
    options: [
      "A half-updated page",
      "The current tree — the last committed UI — unchanged",
      "A loading spinner",
      "Nothing until the render finishes",
    ],
    answer: 1,
    why: "Render writes to the hidden twin. The screen still reflects root.current until commit swaps them.",
  },
  {
    id: "why-2",
    prompt: "How often does React’s scheduler check whether to yield in React 19?",
    options: [
      "About every 5 ms of work",
      "Every 50 ms, from requestIdleCallback",
      "Once per frame, in requestAnimationFrame",
      "Never — it only yields between renders",
    ],
    answer: 0,
    why: "shouldYield compares elapsed time to frameYieldMs, 5 ms. The 50 ms figure in the video is the idle-callback cap in the browser spec.",
  },
];

export const Q_MEMORY: Question[] = [
  {
    id: "memory-1",
    prompt: "A memo’d row with unchanged props. What does React skip?",
    options: [
      "The row’s fiber is deleted to save memory",
      "Calling the row component and walking its subtree, if nothing below has work",
      "Committing the parent",
      "Nothing — memo only affects the DOM",
    ],
    answer: 1,
    why: "The fiber stays. React bails out of the function call and clones or skips the children. That is the “keep a reference to the previous one” in the video.",
  },
];

export const Q_PRIORITY: Question[] = [
  {
    id: "priority-1",
    prompt:
      "A transition render is interrupted by a click. What happens to its half-built tree in React 18/19?",
    options: [
      "It is saved and resumed from the same fiber",
      "It is discarded; the transition’s lanes stay pending and it restarts later",
      "It is committed partially",
      "It is merged into the click’s render",
    ],
    answer: 1,
    why: "prepareFreshStack throws away the work-in-progress tree. Only the lanes survive. Bailouts make the restart cheaper than it sounds.",
  },
  {
    id: "priority-2",
    prompt: "In React’s terms, the video’s top priority — click or type — maps to:",
    options: ["IdleLane", "TransitionLane", "SyncLane", "DefaultLane"],
    answer: 2,
    why: "Discrete events map to SyncLane. Scroll and pointer moves are InputContinuousLane.",
  },
];

export const Q_DIFF: Question[] = [
  {
    id: "diff-1",
    prompt:
      "A <form> becomes a <section> around the same child. What happens to the child’s state?",
    options: [
      "Kept, because the child type did not change",
      "Lost: the subtree is unmounted and mounted fresh",
      "Kept, but effects re-run",
      "React throws an error",
    ],
    answer: 1,
    why: "Heuristic one: different type, different tree. Everything under it is rebuilt from scratch.",
  },
  {
    id: "diff-2",
    prompt: "Why are array indexes bad keys for a list that can delete or reorder?",
    options: [
      "They are numbers, and keys must be strings",
      "They identify a position, not an item, so state follows the slot instead of the item",
      "React warns and refuses to render",
      "They make the diff O(n³)",
    ],
    answer: 1,
    why: "After a delete, every later item gets a new index. React matches by key, so it reuses the wrong fiber and its state.",
  },
  {
    id: "diff-3",
    prompt: "Which phase is allowed to pause?",
    options: ["Commit", "Render", "Both", "Neither"],
    answer: 1,
    why: "Render may yield and be restarted. Commit applies DOM changes in one synchronous pass.",
  },
];

export const Q_DEPTH: Question[] = [
  {
    id: "depth-1",
    prompt: "According to the video, how deep should a senior full-stack engineer go on fiber?",
    options: [
      "Read all of ReactFiberWorkLoop.js",
      "Know the motivation and the top-level API",
      "Skip it entirely",
      "Write a custom renderer",
    ],
    answer: 1,
    why: "The guest’s split: full-stack → motivation and API; senior React or frontend → go deep, because it is your specialty.",
  },
];

export const Q_APIS: Question[] = [
  {
    id: "apis-1",
    prompt: "What does React’s scheduler use in browsers to schedule its next slice of work?",
    options: ["requestIdleCallback", "requestAnimationFrame", "MessageChannel", "setInterval"],
    answer: 2,
    why: "A MessageChannel post queues a macrotask without setTimeout’s minimum delay. requestIdleCallback is the idea; MessageChannel is the mechanism.",
  },
];

export const ALL_QUESTIONS = [
  ...Q_FIBER,
  ...Q_STACK,
  ...Q_WHY,
  ...Q_MEMORY,
  ...Q_PRIORITY,
  ...Q_DIFF,
  ...Q_DEPTH,
  ...Q_APIS,
];
