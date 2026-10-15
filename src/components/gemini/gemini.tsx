// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- see the @ts-nocheck note below
// @ts-nocheck -- integration edit: the file is untyped (JS-style props); kept as-is, so skip type-checking it.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Cpu,
  GitCompare,
  Clock,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Zap,
  Sparkles,
  Terminal,
  Layers,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  CornerDownRight,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Activity,
  ShieldAlert,
  RefreshCw,
  HelpCircle,
  Code2,
  Eye,
  Database,
  Flame
} from 'lucide-react';

// ============================================================================
// DATA & CONSTANTS FOR SIMULATORS
// ============================================================================

const INITIAL_FIBERS = [
  {
    id: 'root',
    name: 'HostRoot',
    tag: 3,
    tagName: 'HostRoot (3)',
    type: 'FiberRootNode',
    key: null,
    child: 'app',
    sibling: null,
    return: null,
    x: 220,
    y: 45,
    memoizedState: 'RootState { element: <App /> }',
    pendingProps: '{}',
    lanes: '0b0000000000000000000000000000000',
    flags: 'NoFlags (0b0)',
    subtreeFlags: 'NoFlags (0b0)',
    eli5Role: 'The Master Flipbook Binder that holds whichever page is currently shown on screen.'
  },
  {
    id: 'app',
    name: '<App />',
    tag: 0,
    tagName: 'FunctionComponent (0)',
    type: 'fn App()',
    key: null,
    child: 'header',
    sibling: null,
    return: 'root',
    x: 220,
    y: 135,
    memoizedState: 'Hook { memoizedState: count = 1, queue: {...} }',
    pendingProps: '{}',
    lanes: '0b0000000000000000000000000000001 (SyncLane)',
    flags: 'PerformedWork (0b1)',
    subtreeFlags: 'Update (0b100)',
    eli5Role: 'The Boss Lego Blueprint where the counter number lives.'
  },
  {
    id: 'header',
    name: '<Header />',
    tag: 5,
    tagName: 'HostComponent (5)',
    type: '"header"',
    key: null,
    child: null,
    sibling: 'main',
    return: 'app',
    x: 110,
    y: 235,
    memoizedState: 'null',
    pendingProps: '{ title: "React Internals" }',
    lanes: '0b0000000000000000000000000000000',
    flags: 'Bailout / Cloned',
    subtreeFlags: 'NoFlags (0b0)',
    eli5Role: 'The top banner brick. It did not change, so React skips rebuilding it!'
  },
  {
    id: 'main',
    name: '<Counter />',
    tag: 0,
    tagName: 'FunctionComponent (0)',
    type: 'fn Counter()',
    key: null,
    child: 'btn',
    sibling: null,
    return: 'app',
    x: 330,
    y: 235,
    memoizedState: 'null',
    pendingProps: '{ count: 2 }',
    lanes: '0b0000000000000000000000000000001 (SyncLane)',
    flags: 'PerformedWork (0b1)',
    subtreeFlags: 'Update (0b100)',
    eli5Role: 'The scoreboard display that receives the new count number.'
  },
  {
    id: 'btn',
    name: '<button>',
    tag: 5,
    tagName: 'HostComponent (5)',
    type: '"button"',
    key: '"increment-btn"',
    child: null,
    sibling: 'span',
    return: 'main',
    x: 245,
    y: 340,
    memoizedState: 'null',
    pendingProps: '{ onClick: fn, children: "Clicks: 2" }',
    lanes: '0b0000000000000000000000000000000',
    flags: 'Update (0b00000000000000000000000100)',
    subtreeFlags: 'NoFlags (0b0)',
    eli5Role: 'The physical button on screen whose text changes from "1" to "2".'
  },
  {
    id: 'span',
    name: '<Status />',
    tag: 5,
    tagName: 'HostComponent (5)',
    type: '"span"',
    key: null,
    child: null,
    sibling: null,
    return: 'main',
    x: 405,
    y: 340,
    memoizedState: 'null',
    pendingProps: '{ className: "badge", children: "Active" }',
    lanes: '0b0000000000000000000000000000000',
    flags: 'NoFlags (0b0)',
    subtreeFlags: 'NoFlags (0b0)',
    eli5Role: 'A little status sticker next to the button.'
  }
];

// Step-by-step traversal order for the Fiber WorkLoop simulator
const FIBER_TRAVERSAL_STEPS = [
  {
    step: 0,
    phase: 'IDLE',
    activeId: 'app',
    action: 'scheduleUpdateOnFiber()',
    pointerUsed: 'none',
    builtNodes: [],
    completedNodes: [],
    isCommitted: false,
    eli5Desc: 'You clicked the button! React marks the <App /> blueprint with a glowing sticker saying "Needs Update" and prepares a secret scratchpad page (workInProgress) so the user never sees a half-drawn screen.',
    coreDesc: 'dispatchSetState() enqueues an Update on fiber.updateQueue.shared.pending, calls markUpdateLaneFromFiberToRoot(fiber, SyncLane) bubbling childLanes up to HostRoot, and schedules ensureRootIsScheduled(root).'
  },
  {
    step: 1,
    phase: 'RENDER: beginWork',
    activeId: 'root',
    action: 'beginWork(current, workInProgress, renderLanes)',
    pointerUsed: 'createWorkInProgress(root.current)',
    builtNodes: ['root'],
    completedNodes: [],
    isCommitted: false,
    eli5Desc: 'React starts at the top of the secret scratchpad page (HostRoot). It checks if any children below need updates. Since <App /> has a sticker, React clones the top container and moves down.',
    coreDesc: 'performUnitOfWork(unitOfWork) invokes beginWork() on HostRoot. Since (current.childLanes & renderLanes) !== NoLanes, it clones the child Fiber via createWorkInProgress(current.child, pendingProps) and links the .alternate pointers.'
  },
  {
    step: 2,
    phase: 'RENDER: beginWork',
    activeId: 'app',
    action: 'updateFunctionComponent(App)',
    pointerUsed: 'root.child -> app',
    builtNodes: ['root', 'app'],
    completedNodes: [],
    isCommitted: false,
    eli5Desc: 'Walking down the ".child" arrow to <App />! React runs your App function, calculates the new count (1 -> 2), and asks: "What do your children look like now?"',
    coreDesc: 'Follows .child pointer to <App />. Calls renderWithHooks() to process the Hook updateQueue (count becomes 2). Runs reconcileChildren() to diff returned JSX elements against current.child.'
  },
  {
    step: 3,
    phase: 'RENDER: beginWork (Bailout!)',
    activeId: 'header',
    action: 'attemptEarlyBailoutIfNoScheduledUpdate(Header)',
    pointerUsed: 'app.child -> header',
    builtNodes: ['root', 'app', 'header'],
    completedNodes: [],
    isCommitted: false,
    eli5Desc: 'React steps down to <Header />. Wait—its props did not change and it has no update sticker! React takes a shortcut ("Bailout") and immediately finishes it.',
    coreDesc: 'Follows .child to <Header />. In beginWork(), oldProps === newProps and !includesSomeLane(renderLanes, workInProgress.lanes | workInProgress.childLanes). Calls bailoutOnAlreadyFinishedWork()—skipping subtree render!'
  },
  {
    step: 4,
    phase: 'RENDER: completeWork',
    activeId: 'header',
    action: 'completeUnitOfWork(Header)',
    pointerUsed: 'header.child === null -> completeWork',
    builtNodes: ['root', 'app', 'header'],
    completedNodes: ['header'],
    isCommitted: false,
    eli5Desc: 'Since <Header /> has no children below it, React stamps it "Complete!" and looks sideways along the ".sibling" arrow to visit <Counter /> next.',
    coreDesc: 'beginWork() returned null (no next child). Enters completeUnitOfWork(): calls completeWork(), bubbles subtreeFlags, and checks unitOfWork.sibling. Finds <Counter />, setting workInProgress = siblingFiber.'
  },
  {
    step: 5,
    phase: 'RENDER: beginWork',
    activeId: 'main',
    action: 'updateFunctionComponent(Counter)',
    pointerUsed: 'header.sibling -> main',
    builtNodes: ['root', 'app', 'header', 'main'],
    completedNodes: ['header'],
    isCommitted: false,
    eli5Desc: 'Moved sideways via ".sibling" to <Counter />! Its count prop changed to 2, so React runs Counter() and prepares its child bricks (<button> and <Status />).',
    coreDesc: 'Traverses .sibling pointer to <Counter />. oldProps.count !== newProps.count (1 !== 2), so it cannot bail out. Executes renderWithHooks() and reconcileChildren() for its child fibers.'
  },
  {
    step: 6,
    phase: 'RENDER: beginWork',
    activeId: 'btn',
    action: 'updateHostComponent(button)',
    pointerUsed: 'main.child -> btn',
    builtNodes: ['root', 'app', 'header', 'main', 'btn'],
    completedNodes: ['header'],
    isCommitted: false,
    eli5Desc: 'Steps down ".child" to <button>. React sees the text changed from "Clicks: 1" to "Clicks: 2" and puts an orange "Update" sticky note (Flag) on this brick.',
    coreDesc: 'Follows .child to HostComponent <button>. Marks workInProgress.flags |= Update (0b100) because pendingProps.children ("Clicks: 2") differs from memoizedProps.children ("Clicks: 1").'
  },
  {
    step: 7,
    phase: 'RENDER: completeWork',
    activeId: 'btn',
    action: 'completeWork(button) -> diffProperties()',
    pointerUsed: 'btn.child === null -> completeWork',
    builtNodes: ['root', 'app', 'header', 'main', 'btn'],
    completedNodes: ['header', 'btn'],
    isCommitted: false,
    eli5Desc: '<button> has no child fibers, so React finishes it! Notice it has not touched the real browser screen yet—it just prepared the change list in secret.',
    coreDesc: 'completeWork() on HostComponent prepares the updatePayload or marks the fiber with Update flag. Then transitions across .sibling pointer from <button> to <Status />.'
  },
  {
    step: 8,
    phase: 'RENDER: beginWork & completeWork',
    activeId: 'span',
    action: 'updateHostComponent(Status) -> completeWork',
    pointerUsed: 'btn.sibling -> span',
    builtNodes: ['root', 'app', 'header', 'main', 'btn', 'span'],
    completedNodes: ['header', 'btn', 'span'],
    isCommitted: false,
    eli5Desc: 'Moves sideways via ".sibling" to <Status />. Nothing changed on it! And since <Status /> has no more siblings, React climbs back UP the ".return" arrow to <Counter />.',
    coreDesc: 'Processes <Status /> via .sibling, sees no prop diff, and runs completeWork(). Because span.sibling === null, completeUnitOfWork() walks UP the .return pointer to parent <Counter />.'
  },
  {
    step: 9,
    phase: 'RENDER: Bubble Up (completeWork)',
    activeId: 'main',
    action: 'bubbleProperties(Counter) -> return to App',
    pointerUsed: 'span.return -> main -> app -> root',
    builtNodes: ['root', 'app', 'header', 'main', 'btn', 'span'],
    completedNodes: ['header', 'btn', 'span', 'main', 'app', 'root'],
    isCommitted: false,
    eli5Desc: 'Climbing back up the ".return" arrows all the way to the top! As React climbs up, each parent collects a summary ("subtreeFlags") of which children below it have sticky notes.',
    coreDesc: 'completeUnitOfWork() walks up .return pointers (Counter -> App -> HostRoot). In bubbleProperties(), each parent aggregates child.flags | child.subtreeFlags into its own workInProgress.subtreeFlags in O(1) bitmask OR operations!'
  },
  {
    step: 10,
    phase: 'COMMIT PHASE (Pointer Swap!)',
    activeId: 'root',
    action: 'commitRoot(root) -> root.current = finishedWork',
    pointerUsed: 'fiberRoot.current = workInProgress',
    builtNodes: ['root', 'app', 'header', 'main', 'btn', 'span'],
    completedNodes: ['header', 'btn', 'span', 'main', 'app', 'root'],
    isCommitted: true,
    eli5Desc: 'BAM! The secret flipbook page is 100% ready. React updates the single button text on screen and instantly flips the master binder pointer (fiberRoot.current) to the new tree in one atomic step!',
    coreDesc: 'Synchronous Commit Phase! 1) commitBeforeMutationEffects, 2) commitMutationEffects (mutates DOM textNode for <button> using subtreeFlags), 3) root.current = finishedWork (Double Buffer pointer swap!), 4) commitLayoutEffects (useLayoutEffect).'
  }
];

// Preset priorities for Tab 2: Scheduler & Lanes
const LANE_PRIORITIES = [
  {
    id: 'sync',
    name: 'DiscreteEvent (User Click)',
    laneName: 'SyncLane',
    bitmask: '0b0000000000000000000000000000001',
    shortMask: '0b00001 (1)',
    schedulerPriority: 'ImmediatePriority (1)',
    timeoutOffset: -1,
    workUnits: 2,
    color: 'rose',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    eli5Desc: 'Ambulance with sirens! You clicked a button or typed a letter—React drops background work immediately to handle this right now.',
    coreDesc: 'SyncLane (bit 0). Bypasses time-slicing or uses ImmediatePriority (timeout: -1ms, sortIndex = startTime - 1). Preempts any concurrent workInProgress render.'
  },
  {
    id: 'continuous',
    name: 'ContinuousEvent (Scroll / Drag)',
    laneName: 'InputContinuousLane',
    bitmask: '0b0000000000000000000000000000100',
    shortMask: '0b00100 (4)',
    schedulerPriority: 'UserBlockingPriority (2)',
    timeoutOffset: 250,
    workUnits: 3,
    color: 'amber',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    eli5Desc: 'Fast-track express lane! Moving your mouse or scrolling needs to feel smooth within 250ms.',
    coreDesc: 'InputContinuousLane (bit 2). Maps to UserBlockingPriority with 250ms expiration timeout (sortIndex = startTime + 250). Interrupts Default/Transition lanes.'
  },
  {
    id: 'default',
    name: 'DefaultEvent (Network Fetch)',
    laneName: 'DefaultLane',
    bitmask: '0b0000000000000000000000000010000',
    shortMask: '0b10000 (16)',
    schedulerPriority: 'NormalPriority (3)',
    timeoutOffset: 5000,
    workUnits: 4,
    color: 'sky',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    eli5Desc: 'Regular delivery truck. A network request came back with data; important, but can pause if you click something.',
    coreDesc: 'DefaultLane (bit 4). Maps to NormalPriority with 5000ms expiration timeout (sortIndex = startTime + 5000).'
  },
  {
    id: 'transition',
    name: 'startTransition (Heavy Search UI)',
    laneName: 'TransitionLane1',
    bitmask: '0b0000000000000000000000001000000',
    shortMask: '0b1000000 (64)',
    schedulerPriority: 'Normal/Low Transition (4)',
    timeoutOffset: 10000,
    workUnits: 6,
    color: 'purple',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    eli5Desc: 'Big Lego sculpture built in 5ms slices! If an ambulance (User Click) arrives halfway through, React pauses this and lets the click go first.',
    coreDesc: 'TransitionLanes (bits 6–21). Sliced into 5ms chunks via performConcurrentWorkOnRoot() and shouldYieldToHost(). Can be preempted and restarted/rebased.'
  }
];

// Scenarios for Tab 3: Diffing Algorithm (reconcileChildrenArray)
const DIFF_SCENARIOS = {
  keyedReorder: {
    id: 'keyedReorder',
    title: '1. Keyed List Reorder (The lastPlacedIndex Two-Pass Algorithm)',
    subtitle: 'Moving [A, B, C, D] -> [A, C, D, B] with only 1 DOM move!',
    oldList: [
      { key: 'A', type: 'li', text: 'Item A', oldIndex: 0 },
      { key: 'B', type: 'li', text: 'Item B', oldIndex: 1 },
      { key: 'C', type: 'li', text: 'Item C', oldIndex: 2 },
      { key: 'D', type: 'li', text: 'Item D', oldIndex: 3 }
    ],
    newList: [
      { key: 'A', type: 'li', text: 'Item A' },
      { key: 'C', type: 'li', text: 'Item C' },
      { key: 'D', type: 'li', text: 'Item D' },
      { key: 'B', type: 'li', text: 'Item B' }
    ],
    steps: [
      {
        pass: 'PASS 1: Linear Scan (Idx 0)',
        newIdx: 0,
        oldIdx: 0,
        lastPlacedIndex: 0,
        mapKeys: [],
        statuses: {
          A: { action: 'REUSE IN PLACE', flag: 'Update (No Move)', detail: 'oldFiber.key ("A") === newChild.key ("A"). oldIndex(0) >= lastPlacedIndex(0) -> lastPlacedIndex = 0' }
        },
        eli5: 'Pass 1 checks bricks from left to right. Slot 0: Old is "A", New is "A". Perfect match! Keep "A" right where it is. Highest old position seen so far (lastPlacedIndex) is 0.',
        core: 'Pass 1 while-loop in reconcileChildrenArray(): compares oldFiber (key="A", index=0) with newChildren[0] (key="A"). Keys match! Calls updateSlot() -> placeChild(newFiber, lastPlacedIndex=0, newIdx=0). Since oldIndex (0) >= lastPlacedIndex (0), returns lastPlacedIndex = 0 without setting Placement flag.'
      },
      {
        pass: 'PASS 1: Key Mismatch! Break Loop (Idx 1)',
        newIdx: 1,
        oldIdx: 1,
        lastPlacedIndex: 0,
        mapKeys: ['B (oldIdx: 1)', 'C (oldIdx: 2)', 'D (oldIdx: 3)'],
        statuses: {
          A: { action: 'REUSE IN PLACE', flag: 'NoFlags', detail: 'Kept at index 0' },
          B: { action: 'MOVED TO MAP', flag: 'Pending Lookup', detail: 'Mismatch at idx 1: oldFiber("B") !== newChild("C"). Breaks Pass 1!' }
        },
        eli5: 'Hold on! At Slot 1, the old brick is "B" but the new list wants "C". Pass 1 stops immediately and tosses the remaining old bricks (B, C, D) into a fast lookup box (Map) so we can find them instantly by name!',
        core: 'At newIdx = 1, oldFiber.key ("B") !== newChild.key ("C"). updateSlot() returns null, breaking Pass 1! React now executes mapRemainingChildren(returnFiber, oldFiber), inserting remaining old fibers { B: idx 1, C: idx 2, D: idx 3 } into an O(1) JavaScript Map.'
      },
      {
        pass: 'PASS 2: Map Lookup for "C" (Idx 1)',
        newIdx: 1,
        oldIdx: null,
        lastPlacedIndex: 2,
        mapKeys: ['B (oldIdx: 1)', 'D (oldIdx: 3)'],
        statuses: {
          A: { action: 'REUSE IN PLACE', flag: 'NoFlags', detail: 'oldIndex: 0' },
          C: { action: 'REUSE IN PLACE', flag: 'NoFlags (Stays!)', detail: 'Found in Map (oldIndex=2). Since 2 >= lastPlacedIndex(0), NO DOM MOVE! lastPlacedIndex becomes 2.' }
        },
        eli5: 'We pull "C" out of the lookup box! Its old spot was 2, which is further right than our marker (lastPlacedIndex = 0). That means "C" was already after "A", so it does NOT move in the DOM! Marker updates to 2.',
        core: 'updateFromMap() finds "C" in existingChildren Map (oldIndex = 2) and deletes "C" from the Map. Calls placeChild(fiberC, lastPlacedIndex=0, newIdx=1): since oldIndex (2) >= lastPlacedIndex (0), C does NOT get Placement flag! Updates lastPlacedIndex = max(0, 2) = 2.'
      },
      {
        pass: 'PASS 2: Map Lookup for "D" (Idx 2)',
        newIdx: 2,
        oldIdx: null,
        lastPlacedIndex: 3,
        mapKeys: ['B (oldIdx: 1)'],
        statuses: {
          A: { action: 'REUSE IN PLACE', flag: 'NoFlags', detail: 'oldIndex: 0' },
          C: { action: 'REUSE IN PLACE', flag: 'NoFlags', detail: 'oldIndex: 2' },
          D: { action: 'REUSE IN PLACE', flag: 'NoFlags (Stays!)', detail: 'Found in Map (oldIndex=3). Since 3 >= lastPlacedIndex(2), NO DOM MOVE! lastPlacedIndex becomes 3.' }
        },
        eli5: 'Next is "D". We find "D" in the box! Its old spot was 3, which is >= our marker (2). So "D" was already after "C"! It stays put too, and our marker updates to 3.',
        core: 'updateFromMap() retrieves "D" (oldIndex = 3). In placeChild(fiberD, lastPlacedIndex=2, newIdx=2): since oldIndex (3) >= lastPlacedIndex (2), no Placement flag is added! Updates lastPlacedIndex = 3.'
      },
      {
        pass: 'PASS 2: Map Lookup for "B" -> Placement! (Idx 3)',
        newIdx: 3,
        oldIdx: null,
        lastPlacedIndex: 3,
        mapKeys: [],
        statuses: {
          A: { action: 'REUSE IN PLACE', flag: 'NoFlags', detail: 'oldIndex: 0' },
          C: { action: 'REUSE IN PLACE', flag: 'NoFlags', detail: 'oldIndex: 2' },
          D: { action: 'REUSE IN PLACE', flag: 'NoFlags', detail: 'oldIndex: 3' },
          B: { action: 'DOM MOVE!', flag: 'Placement (0b10)', detail: 'Found in Map (oldIndex=1). Since oldIndex(1) < lastPlacedIndex(3), mark Placement!' }
        },
        eli5: 'Finally, "B"! We find "B" in the box with old spot 1. Wait: 1 is LESS than our marker (3)! That proves "B" used to be to the left of C and D, so React marks ONLY "B" with a Move sticker (Placement) to shift it to the end!',
        core: 'updateFromMap() retrieves "B" (oldIndex = 1). In placeChild(fiberB, lastPlacedIndex=3, newIdx=3): CRITICAL CHECK -> oldIndex (1) < lastPlacedIndex (3)! Sets newFiber.flags |= Placement (0b00000000000000000000000010) and leaves lastPlacedIndex = 3. Only ONE DOM insertBefore/appendChild occurs!'
      }
    ]
  },
  unkeyedPrepend: {
    id: 'unkeyedPrepend',
    title: '2. Unkeyed List Insertion at Top (The Index-Key Anti-Pattern)',
    subtitle: 'Inserting "Z" at the top of [A, B, C] without keys mutates EVERY node!',
    oldList: [
      { key: 'null (idx 0)', type: 'li', text: 'Item A', oldIndex: 0 },
      { key: 'null (idx 1)', type: 'li', text: 'Item B', oldIndex: 1 },
      { key: 'null (idx 2)', type: 'li', text: 'Item C', oldIndex: 2 }
    ],
    newList: [
      { key: 'null (idx 0)', type: 'li', text: 'Item Z (NEW)' },
      { key: 'null (idx 1)', type: 'li', text: 'Item A' },
      { key: 'null (idx 2)', type: 'li', text: 'Item B' },
      { key: 'null (idx 3)', type: 'li', text: 'Item C' }
    ],
    steps: [
      {
        pass: 'PASS 1: Slot 0 (null === null)',
        newIdx: 0,
        oldIdx: 0,
        lastPlacedIndex: 0,
        mapKeys: [],
        statuses: {
          'null (idx 0)': { action: 'MUTATED TEXT!', flag: 'Update (0b100)', detail: 'key is null === null! Reuses <li("A")> fiber and overwrites its text to "Item Z"!' }
        },
        eli5: 'Without keys, React is blind to names and only looks at slot numbers! At Slot 0, it sees an <li> and overwrites "Item A" into "Item Z" instead of realizing Z is a brand new brick.',
        core: 'In updateSlot(), oldFiber.key === null && newChild.key === null! React assumes the element at index 0 is the exact same instance, reusing the Fiber for "A" and marking an Update flag to mutate its DOM textContent to "Item Z".'
      },
      {
        pass: 'PASS 1: Slots 1 & 2 (Cascading Mutations!)',
        newIdx: 2,
        oldIdx: 2,
        lastPlacedIndex: 2,
        mapKeys: [],
        statuses: {
          'null (idx 0)': { action: 'MUTATED (A -> Z)', flag: 'Update (0b100)', detail: 'DOM text mutated from A to Z' },
          'null (idx 1)': { action: 'MUTATED (B -> A)', flag: 'Update (0b100)', detail: 'DOM text mutated from B to A' },
          'null (idx 2)': { action: 'MUTATED (C -> B)', flag: 'Update (0b100)', detail: 'DOM text mutated from C to B' }
        },
        eli5: 'Disaster! Because every slot shifted down by one, React repaints Slot 1 from "B" to "A", and repaints Slot 2 from "C" to "B". Every single brick gets repainted!',
        core: 'Pass 1 never breaks because null === null at every index! Both index 1 and index 2 fail prop comparison ("B" !== "A", "C" !== "B"), triggering O(n) DOM text mutations and breaking uncontrolled component state.'
      },
      {
        pass: 'POST-PASS 1: oldFiber === null -> Mount New Node at End',
        newIdx: 3,
        oldIdx: null,
        lastPlacedIndex: 2,
        mapKeys: [],
        statuses: {
          'null (idx 0)': { action: 'MUTATED (A -> Z)', flag: 'Update (0b100)', detail: 'Mutated in place' },
          'null (idx 1)': { action: 'MUTATED (B -> A)', flag: 'Update (0b100)', detail: 'Mutated in place' },
          'null (idx 2)': { action: 'MUTATED (C -> B)', flag: 'Update (0b100)', detail: 'Mutated in place' },
          'null (idx 3)': { action: 'NEW MOUNT ("C")', flag: 'Placement (0b10)', detail: 'oldFiber ran out! Creates brand new Fiber for "Item C" at the end.' }
        },
        eli5: 'At the end, React runs out of old bricks and builds a brand new brick for "Item C" at the bottom. 3 repaints + 1 new brick instead of 1 simple insert!',
        core: 'When oldFiber === null and newIdx < newChildren.length, React enters the creation loop: calls createChild() for index 3 ("Item C") with Placement flag. Total cost: 3 DOM Updates + 1 DOM Insertion!'
      }
    ]
  },
  typeChange: {
    id: 'typeChange',
    title: '3. Element Type Change (Heuristic #1: Destructive Unmount)',
    subtitle: 'Changing <div key="box"> to <section key="box"> destroys the entire subtree!',
    oldList: [
      { key: 'box', type: 'div', text: '<div> (<Counter state=99 />)', oldIndex: 0 }
    ],
    newList: [
      { key: 'box', type: 'section', text: '<section> (<Counter state=0 />)' }
    ],
    steps: [
      {
        pass: 'PASS 1: Same Key ("box"), Different ElementType!',
        newIdx: 0,
        oldIdx: 0,
        lastPlacedIndex: 0,
        mapKeys: [],
        statuses: {
          box: { action: 'DELETE OLD + MOUNT NEW', flag: 'ChildDeletion + Placement', detail: 'oldFiber.elementType ("div") !== element.type ("section"). Full subtree unmount!' }
        },
        eli5: 'Even though both bricks have the exact same name tag (key="box"), changing the brick shape from a <div> to a <section> makes React smash the entire old <div> castle and build a brand new <section> from scratch (losing Counter state=99)!',
        core: 'In updateElement(), key matches ("box" === "box"), so it checks if (current.elementType === element.type). Since "div" !== "section", it calls deleteChild(returnFiber, current) (pushing to returnFiber.deletions and setting ChildDeletion flag) and creates a brand new Fiber via createFiberFromElement() with Placement flag.'
      }
    ]
  }
};

// Interview Flashcards for Tab 4
const INTERVIEW_CARDS = [
  {
    id: 'q1',
    category: 'Scheduler & Event Loop',
    question: 'Why does React Scheduler use MessageChannel instead of setTimeout(fn, 0) or requestAnimationFrame for 5ms time-slicing?',
    eli5Answer: 'requestAnimationFrame only runs right before the monitor paints (60 times a second = every 16.6ms), which wastes time if React finishes a 5ms slice early. And browsers secretly slow down nested setTimeout(0) calls by adding a forced 4ms penalty! MessageChannel is like a direct walkie-talkie that lets the browser check for clicks and immediately call React back with zero delay.',
    coreAnswer: '1) Nested setTimeout(..., 0) calls (>5 levels deep) are throttled to a minimum 4ms clamping delay by the HTML5 spec, destroying 5ms frame slicing. 2) requestAnimationFrame is tied to vsync (~16.6ms at 60Hz), preventing React from executing multiple 5ms work slices inside a single frame. 3) Microtasks (Promise.resolve) never yield to the browser event loop (starving I/O & user input). MessageChannel.port1.postMessage() schedules a macrotask with ~0ms overhead right after browser input/paint events.'
  },
  {
    id: 'q2',
    category: 'Fiber & Concurrency',
    question: 'Why did React replace the single expirationTime integer with the 31-bit Lane bitmask model in React 18?',
    eli5Answer: 'With a single timestamp number, React could only say "do everything more urgent than 5:00 PM together." It could not easily separate two different tasks that happened to have similar deadlines! With 31 switches on a switchboard (Lanes), React can turn individual lanes on or off, group related updates into batches, and pull a fast task out without dragging slow tasks along.',
    coreAnswer: 'expirationTime coupled Two distinct concepts: Task Priority (is Task A more urgent than B?) and Task Batching (does Task A belong in the same render pass as B?). With an integer expirationTime, checking `taskTime >= currentCutoff` forced all tasks within that range to batch together—making it impossible to isolate a Suspense boundary or CPU-bound Transition from an I/O-bound update of similar priority. 31-bit Lanes allow O(1) bitwise operations (`lanes & renderLanes`, `lanes |= newLane`, `getHighestPriorityLane(lanes) = lanes & -lanes`) to independently represent priority AND arbitrary batch subsets.'
  },
  {
    id: 'q3',
    category: 'Reconciler Architecture',
    question: 'How does Fiber Double Buffering work, and why can the Render phase be interrupted while the Commit phase cannot?',
    eli5Answer: 'During the Render phase, React is drawing on a hidden scratchpad page (workInProgress) in memory—the user cannot see it, so React can pause, erase, or throw it away anytime! During the Commit phase, React actually updates the visible screen and flips the pointer. If React paused halfway through painting the real screen, the user would see a broken, half-updated UI!',
    coreAnswer: 'Each mounted component has at most two Fiber nodes linked via `.alternate`: `current` (representing the flushed DOM) and `workInProgress` (constructed in memory during the Render phase). Because `beginWork` and `completeWork` only mutate the detached `workInProgress` tree and compute `flags`/`subtreeFlags`, yielding to the host leaves the visible DOM untouched. In contrast, `commitRoot` mutates live host DOM nodes and swaps `fiberRoot.current = finishedWork`, which must execute synchronously in a single macrotask to guarantee UI consistency and prevent visual tearing.'
  },
  {
    id: 'q4',
    category: 'Diffing Algorithm',
    question: 'Why doesn’t React use a Doubly Linked List or full Edit Distance algorithm to diff children arrays?',
    eli5Answer: 'A full mathematical comparison of two trees takes O(n³) steps—for just 1,000 bricks, that is 1 BILLION checks (freezing your browser for seconds!). By assuming same-named bricks stay in mostly similar order and using a single forward-then-Map pass, React finishes 1,000 bricks in just ~1,000 steps!',
    coreAnswer: 'State-of-the-art general tree edit distance algorithms are O(n³). React achieves O(n) via two heuristics and a single-linked list (`child` -> `sibling`): 1) Different `elementType` tears down the subtree; 2) Stable `key` props identify moved siblings. In `reconcileChildrenArray`, fibers only have forward `.sibling` pointers (saving memory on every Fiber struct across the entire app by omitting `.prevSibling`). Thus React cannot do a two-pointer inward scan like Vue; instead it uses Pass 1 (forward linear scan) + Pass 2 (`existingChildren` Map + `lastPlacedIndex` watermark).'
  },
  {
    id: 'q5',
    category: 'Starvation & Lanes',
    question: 'How does React prevent low-priority TransitionLanes from being starved forever by continuous high-priority clicks?',
    eli5Answer: 'Every time a low-priority task gets skipped, React checks a stopwatch on it. If that task has been waiting too long (for example, 5 or 10 seconds), React promotes it to "Emergency Uninterruptible Mode" so it is guaranteed to finish!',
    coreAnswer: 'Inside `markStarvedLanesAsExpired(root, currentTime)` (called on every schedule/work-loop entry), React iterates through the active `root.pendingLanes` bitmask. Each lane slot in `root.expirationTimes[index]` is initialized on first schedule (`currentTime + timeout`). If `currentTime >= expirationTime`, React sets that bit in `root.expiredLanes |= lane`. Once a lane is marked in `expiredLanes`, React forces it to render synchronously (`renderRootSync`) without yielding until committed.'
  }
];

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Global Persona Mode: 'eli5' (5th Grader) vs 'core' (React Core Member)
  const [persona, setPersona] = useState('core');
  // Active Simulator Tab
  const [activeTab, setActiveTab] = useState('fiber');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col">
      {/* Top Header & Global Persona Switcher */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  React Reconciler Deep-Dive
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  v18/19 Fiber + Lanes
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive Staff/Senior Frontend Interview Simulator • Fiber • Scheduler Min-Heap • O(n) Diffing
              </p>
            </div>
          </div>

          {/* Global Persona Mode Toggle */}
          <div className="flex items-center self-start lg:self-auto bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setPersona('eli5')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                persona === 'eli5'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>5th Grader Mode</span>
              <span className="hidden md:inline text-[10px] opacity-80 font-mono">(ELI5 Metaphors)</span>
            </button>
            <button
              onClick={() => setPersona('core')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                persona === 'core'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>React Core Member</span>
              <span className="hidden md:inline text-[10px] opacity-90 font-mono">(Structs & Bitmasks)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar border-t border-slate-900/80">
          {[
            {
              id: 'fiber',
              label: '1. Fiber & Double Buffering',
              sub: 'current vs workInProgress',
              icon: Layers
            },
            {
              id: 'scheduler',
              label: '2. Scheduler & 31-Bit Lanes',
              sub: 'Min-Heap & 5ms Time-Slicing',
              icon: Clock
            },
            {
              id: 'diffing',
              label: '3. O(n) Diffing Algorithm',
              sub: 'reconcileChildrenArray',
              icon: GitCompare
            },
            {
              id: 'interview',
              label: '4. Staff Q&A + Vercel Export',
              sub: 'Flashcards & Deploy Guide',
              icon: BookOpen
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2.5 px-4 py-3 border-b-2 text-left whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <div>
                  <div className="text-xs sm:text-sm font-semibold">{tab.label}</div>
                  <div className="text-[10px] font-mono text-slate-500 hidden sm:block">{tab.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* Active Persona Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          {persona === 'eli5' ? (
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>5th Grader Mode Active:</strong> Explaining internals using Secret Flipbooks (Double Buffering), ER Ambulance Triage (Lanes), and Master Lego Builders (Diffing).
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-cyan-300 font-mono">
              <Terminal className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>
                <strong>React Core Mode Active:</strong> Inspecting actual <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">ReactFiberWorkLoop.js</code> pointers (<code className="text-emerald-300">.child/.sibling/.return/.alternate</code>), 31-bit Lane masks, and <code className="text-amber-300">SchedulerMinHeap.js</code>.
              </span>
            </div>
          )}
          <span className="text-[11px] text-slate-400">
            Tip: Toggle modes anytime to compare the metaphor with the exact C-style struct internals!
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'fiber' && <FiberSimulator persona={persona} />}
        {activeTab === 'scheduler' && <SchedulerSimulator persona={persona} />}
        {activeTab === 'diffing' && <DiffingSimulator persona={persona} />}
        {activeTab === 'interview' && <InterviewAndDeployTab persona={persona} />}
      </main>
    </div>
  );
}

// ============================================================================
// TAB 1: FIBER TREE & DOUBLE BUFFERING SIMULATOR
// ============================================================================

function FiberSimulator({ persona }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedFiberId, setSelectedFiberId] = useState('app');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const currentStep = FIBER_TRAVERSAL_STEPS[stepIdx];
  const selectedFiber = INITIAL_FIBERS.find((f) => f.id === selectedFiberId) || INITIAL_FIBERS[1];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= FIBER_TRAVERSAL_STEPS.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        const next = prev + 1;
        setSelectedFiberId(FIBER_TRAVERSAL_STEPS[next].activeId);
        return next;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleStepNext = () => {
    setIsAutoPlaying(false);
    const next = (stepIdx + 1) % FIBER_TRAVERSAL_STEPS.length;
    setStepIdx(next);
    setSelectedFiberId(FIBER_TRAVERSAL_STEPS[next].activeId);
  };

  const handleReset = () => {
    setIsAutoPlaying(false);
    setStepIdx(0);
    setSelectedFiberId('app');
  };

  return (
    <div className="space-y-6">
      {/* Top Explanation & Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                STEP {stepIdx} / {FIBER_TRAVERSAL_STEPS.length - 1}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${
                  currentStep.isCommitted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : stepIdx === 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                {currentStep.phase}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-2 font-mono">
              {currentStep.action}
            </h2>
          </div>

          {/* Step Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStepNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm transition shadow-lg shadow-cyan-500/20"
            >
              <StepForward className="w-4 h-4" />
              <span>Step Next (performUnitOfWork)</span>
            </button>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border transition ${
                isAutoPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isAutoPlaying ? 'Pause Loop' : 'Auto-Play'}</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dynamic Persona Commentary Box */}
        <div
          className={`mt-4 p-4 rounded-xl border ${
            persona === 'eli5'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
              : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {persona === 'eli5' ? (
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Code2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
              <div className="font-bold uppercase tracking-wider text-[11px] opacity-75">
                {persona === 'eli5'
                  ? '5th Grader Metaphor (The Secret Flipbook)'
                  : `ReactFiberWorkLoop.js • Pointer: ${currentStep.pointerUsed}`}
              </div>
              <p>{persona === 'eli5' ? currentStep.eli5Desc : currentStep.coreDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Dual Tree Graph (Left 7 cols) + Fiber Memory Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Double Buffered Trees */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Double Buffering Visualizer (`current` vs `workInProgress`)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Click any Fiber node below to inspect its C-style memory struct & pointers on the right.
              </p>
            </div>

            {/* FiberRoot.current pointer indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">fiberRoot.current ➔</span>
              {currentStep.isCommitted ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tree B (Swapped!)
                </span>
              ) : (
                <span className="text-cyan-400 font-bold">Tree A (Flushed DOM)</span>
              )}
            </div>
          </div>

          {/* Two Side-by-Side Trees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TREE A: CURRENT TREE */}
            <FiberTreeCanvas
              title={currentStep.isCommitted ? 'Tree A (Old alternate)' : 'Tree A: current (On Screen)'}
              subtitle={
                persona === 'eli5'
                  ? 'Page currently visible to the user (count = 1)'
                  : 'Connected to fiberRoot.current during render'
              }
              isWipTree={false}
              currentStep={currentStep}
              selectedFiberId={selectedFiberId}
              onSelectFiber={setSelectedFiberId}
            />

            {/* TREE B: WORK IN PROGRESS TREE */}
            <FiberTreeCanvas
              title={
                currentStep.isCommitted
                  ? 'Tree B: NEW current (Committed!)'
                  : 'Tree B: workInProgress (In Memory)'
              }
              subtitle={
                persona === 'eli5'
                  ? 'Secret scratchpad page being drawn (count = 2)'
                  : 'Constructed via beginWork() / completeWork()'
              }
              isWipTree={true}
              currentStep={currentStep}
              selectedFiberId={selectedFiberId}
              onSelectFiber={setSelectedFiberId}
            />
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span> .child (Down)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400 inline-block"></span> .sibling (Right)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-emerald-400 inline-block"></span> .return (Up)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> beginWork
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> completeWork
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Fiber Node Memory Inspector */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                  Live Fiber Struct Inspector
                </span>
                <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
                  <span>{selectedFiber.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                    id: {selectedFiber.id}
                  </span>
                </h3>
              </div>
              <Database className="w-5 h-5 text-cyan-400" />
            </div>

            {/* ELI5 Role Card */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>What is this node doing?</span>
              </div>
              {selectedFiber.eli5Role}
            </div>

            {/* Struct Fields Table */}
            <div className="mt-4 space-y-2.5 font-mono text-xs">
              <StructField
                label="tag"
                value={selectedFiber.tagName}
                explain={
                  persona === 'eli5'
                    ? 'Type of Lego brick (Function vs HTML tag)'
                    : 'WorkTag enum in ReactWorkTags.js'
                }
              />
              <StructField
                label="type"
                value={selectedFiber.type}
                explain={
                  persona === 'eli5'
                    ? 'The function or HTML tag name'
                    : 'Function reference or Host tag string'
                }
              />
              <StructField
                label="key"
                value={String(selectedFiber.key)}
                explain={
                  persona === 'eli5'
                    ? 'Unique name sticker for list diffing'
                    : 'Used by reconcileChildren to match siblings'
                }
              />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                  <div className="text-[10px] text-cyan-400">.child ➔</div>
                  <div className="font-bold text-white truncate">{selectedFiber.child || 'null'}</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30">
                  <div className="text-[10px] text-amber-400">.sibling ➔</div>
                  <div className="font-bold text-white truncate">{selectedFiber.sibling || 'null'}</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400">.return ➔</div>
                  <div className="font-bold text-white truncate">{selectedFiber.return || 'null'}</div>
                </div>
              </div>
              <StructField
                label="alternate"
                value={`<-> FiberNode(${selectedFiber.name})`}
                highlight="text-purple-300"
                explain={
                  persona === 'eli5'
                    ? 'Secret tunnel connecting the current page to the scratchpad page!'
                    : 'Bidirectional pointer between current & workInProgress Fiber'
                }
              />
              <StructField
                label="memoizedState"
                value={selectedFiber.memoizedState}
                explain={
                  persona === 'eli5'
                    ? 'Saved memory (like useState count)'
                    : 'Linked list of Hook objects (memoizedState -> next)'
                }
              />
              <StructField
                label="flags"
                value={selectedFiber.flags}
                highlight={selectedFiber.flags.includes('Update') ? 'text-amber-300' : 'text-slate-300'}
                explain={
                  persona === 'eli5'
                    ? 'Sticky note telling Commit Phase what to change on screen'
                    : 'Bitmask in ReactFiberFlags.js (Placement, Update, etc.)'
                }
              />
              <StructField
                label="subtreeFlags"
                value={selectedFiber.subtreeFlags}
                highlight={selectedFiber.subtreeFlags.includes('Update') ? 'text-emerald-300' : 'text-slate-400'}
                explain={
                  persona === 'eli5'
                    ? 'Tells React if ANY child below has a sticky note (so it can skip whole branches!)'
                    : 'Bitwise OR of all descendant flags bubbled during completeWork'
                }
              />
            </div>
          </div>

          {/* Mini Interview Callout */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200">
            <strong className="text-indigo-300 block mb-0.5">💡 Interview Gold: Why Singly-Linked Tree?</strong>
            By replacing the React 15 recursive call stack with <code className="text-white">.child</code>, <code className="text-white">.sibling</code>, and <code className="text-white">.return</code> pointers on heap-allocated Fiber structs, React can pause traversal at any node, save a single global <code className="text-white">workInProgress</code> pointer, yield to the browser, and resume later!
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component to render either the Current or WIP Fiber tree SVG + Nodes
function FiberTreeCanvas({ title, subtitle, isWipTree, currentStep, selectedFiberId, onSelectFiber }) {
  return (
    <div
      className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
        isWipTree && currentStep.isCommitted
          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
          : !isWipTree && !currentStep.isCommitted
          ? 'bg-slate-950/90 border-cyan-500/40'
          : 'bg-slate-950/60 border-slate-800'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">{title}</div>
          <div className="text-[10px] text-slate-400">{subtitle}</div>
        </div>
        {isWipTree ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {currentStep.isCommitted ? 'FLUSHED' : 'BACK BUFFER'}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {currentStep.isCommitted ? 'OLD BUFFER' : 'FRONT BUFFER'}
          </span>
        )}
      </div>

      {/* SVG Graph Container */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-lg border border-slate-900 overflow-hidden">
        <svg viewBox="0 0 460 400" className="w-full h-full">
          <defs>
            <marker id="arrow-child" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
            </marker>
            <marker id="arrow-sibling" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#fbbf24" />
            </marker>
          </defs>

          {/* Pointer Edges */}
          {INITIAL_FIBERS.map((node) => {
            const elements = [];
            // .child edge
            if (node.child) {
              const target = INITIAL_FIBERS.find((n) => n.id === node.child);
              if (target) {
                elements.push(
                  <line
                    key={`child-${node.id}`}
                    x1={node.x}
                    y1={node.y + 22}
                    x2={target.x}
                    y2={target.y - 24}
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeOpacity={isWipTree && !currentStep.builtNodes.includes(target.id) ? 0.18 : 0.75}
                    markerEnd="url(#arrow-child)"
                  />
                );
              }
            }
            // .sibling edge
            if (node.sibling) {
              const target = INITIAL_FIBERS.find((n) => n.id === node.sibling);
              if (target) {
                elements.push(
                  <line
                    key={`sibling-${node.id}`}
                    x1={node.x + 48}
                    y1={node.y}
                    x2={target.x - 48}
                    y2={target.y}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeOpacity={isWipTree && !currentStep.builtNodes.includes(target.id) ? 0.18 : 0.75}
                    markerEnd="url(#arrow-sibling)"
                  />
                );
              }
            }
            // .return edge (dashed offset)
            if (node.return) {
              const target = INITIAL_FIBERS.find((n) => n.id === node.return);
              if (target) {
                elements.push(
                  <line
                    key={`return-${node.id}`}
                    x1={node.x + 12}
                    y1={node.y - 22}
                    x2={target.x + 12}
                    y2={target.y + 22}
                    stroke="#34d399"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    strokeOpacity={isWipTree && !currentStep.completedNodes.includes(node.id) ? 0.15 : 0.55}
                  />
                );
              }
            }
            return elements;
          })}

          {/* Fiber Nodes */}
          {INITIAL_FIBERS.map((node) => {
            const isBuilt = !isWipTree || currentStep.builtNodes.includes(node.id);
            const isCompleted = isWipTree && currentStep.completedNodes.includes(node.id);
            const isActive = currentStep.activeId === node.id;
            const isSelected = selectedFiberId === node.id;
            const hasUpdateFlag = node.id === 'btn' && isWipTree && isBuilt;

            let strokeColor = '#334155';
            let fillColor = '#0f172a';

            if (!isBuilt) {
              strokeColor = '#1e293b';
              fillColor = '#090d16';
            } else if (isActive && isWipTree) {
              strokeColor = '#38bdf8';
              fillColor = '#1e1b4b';
            } else if (isCompleted) {
              strokeColor = '#10b981';
              fillColor = '#064e3b';
            } else if (isBuilt && isWipTree) {
              strokeColor = '#6366f1';
              fillColor = '#1e1b4b';
            }

            if (isSelected) {
              strokeColor = '#f43f5e';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectFiber(node.id)}
                className="cursor-pointer transition-opacity"
                style={{ opacity: isBuilt ? 1 : 0.35 }}
              >
                {/* Pulsing ring if active unitOfWork */}
                {isActive && isWipTree && (
                  <rect
                    x="-54"
                    y="-26"
                    width="108"
                    height="52"
                    rx="12"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}

                <rect
                  x="-48"
                  y="-20"
                  width="96"
                  height="40"
                  rx="8"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '2.5' : '1.8'}
                />

                <text
                  x="0"
                  y="-3"
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.name}
                </text>

                <text
                  x="0"
                  y="11"
                  textAnchor="middle"
                  fill={isCompleted ? '#6ee7b7' : '#94a3b8'}
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {node.id === 'btn'
                    ? isWipTree && isBuilt
                      ? '"Clicks: 2"'
                      : '"Clicks: 1"'
                    : isCompleted
                    ? '✓ complete'
                    : `tag: ${node.tag}`}
                </text>

                {/* Update Flag Badge */}
                {hasUpdateFlag && (
                  <g transform="translate(36, -20)">
                    <circle r="8" fill="#f59e0b" />
                    <text x="0" y="3" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">
                      U
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function StructField({ label, value, explain, highlight = 'text-cyan-200' }) {
  return (
    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-400">.{label}:</span>
        <span className={`font-semibold truncate ${highlight}`}>{value}</span>
      </div>
      <div className="text-[10px] text-slate-500 font-sans mt-0.5">{explain}</div>
    </div>
  );
}

// ============================================================================
// TAB 2: THE SCHEDULER & 31-BIT LANE PRIORITY ENGINE (MIN-HEAP & TIME SLICING)
// ============================================================================

function SchedulerSimulator({ persona }) {
  const [clockMs, setClockMs] = useState(1000);
  const [frameSliceMs, setFrameSliceMs] = useState(0);
  const [taskIdCounter, setTaskIdCounter] = useState(3);
  const [preemptionAlert, setPreemptionAlert] = useState(null);

  // Initial Min-Heap tasks so the user immediately sees a realistic queue
  const [taskQueue, setTaskQueue] = useState([
    {
      id: 1,
      name: 'startTransition (Heavy Search UI)',
      laneName: 'TransitionLane1',
      bitmask: '0b0000000000000000000000001000000',
      shortMask: '0b1000000 (64)',
      color: 'purple',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      startTime: 1000,
      timeoutOffset: 10000,
      sortIndex: 11000,
      remainingSlices: 4,
      totalSlices: 6,
      isExpired: false
    },
    {
      id: 2,
      name: 'DefaultEvent (Network Fetch)',
      laneName: 'DefaultLane',
      bitmask: '0b0000000000000000000000000010000',
      shortMask: '0b10000 (16)',
      color: 'sky',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      startTime: 1000,
      timeoutOffset: 5000,
      sortIndex: 6000,
      remainingSlices: 3,
      totalSlices: 4,
      isExpired: false
    }
  ]);

  const [executionLog, setExecutionLog] = useState([
    {
      time: '1000ms',
      event: 'MessageChannel port1.onmessage -> workLoopConcurrent()',
      detail: 'TransitionLane1 (sortIndex 11000) & DefaultLane (sortIndex 6000) queued in Scheduler Min-Heap.'
    }
  ]);

  // Maintain valid binary Min-Heap sorted by sortIndex (expirationTime)
  const sortedHeap = useMemo(() => {
    return [...taskQueue].sort((a, b) => a.sortIndex - b.sortIndex);
  }, [taskQueue]);

  const activePeekTask = sortedHeap[0] || null;

  // Inject a new task with a specific Lane & Priority
  const injectTask = (preset) => {
    const newId = taskIdCounter;
    setTaskIdCounter((prev) => prev + 1);
    const expirationTime = clockMs + preset.timeoutOffset;

    const newTask = {
      id: newId,
      name: preset.name,
      laneName: preset.laneName,
      bitmask: preset.bitmask,
      shortMask: preset.shortMask,
      color: preset.color,
      badgeClass: preset.badgeClass,
      startTime: clockMs,
      timeoutOffset: preset.timeoutOffset,
      sortIndex: expirationTime,
      remainingSlices: preset.workUnits,
      totalSlices: preset.workUnits,
      isExpired: preset.timeoutOffset < 0
    };

    // Check if this preempts a currently running lower-priority task
    if (activePeekTask && expirationTime < activePeekTask.sortIndex) {
      setPreemptionAlert(
        persona === 'eli5'
          ? `🚨 PREEMPTION! Your urgent "${preset.name}" jumped to the top of the Min-Heap ahead of "${activePeekTask.name}", pausing the slower task mid-render!`
          : `🚨 PREEMPTION in ensureRootIsScheduled(): New task (${preset.laneName}, sortIndex=${expirationTime}) < peek(taskQueue) (${activePeekTask.laneName}, sortIndex=${activePeekTask.sortIndex}). Sifts up to heap[0] and interrupts in-progress concurrent render!`
      );
    } else {
      setPreemptionAlert(null);
    }

    setTaskQueue((prev) => [...prev, newTask]);
    setExecutionLog((prev) => [
      {
        time: `${clockMs}ms`,
        event: `unstable_scheduleCallback(${preset.laneName})`,
        detail: `Pushed Task #${newId} into Min-Heap with sortIndex = ${expirationTime}ms.`
      },
      ...prev.slice(0, 7)
    ]);
  };

  // Run one 1ms micro-unit of work inside the 5ms time slice budget
  const stepOneMsSlice = () => {
    if (!activePeekTask) return;

    const nextClock = clockMs + 1;
    const nextSlice = frameSliceMs + 1;
    setClockMs(nextClock);

    // If 5ms slice reached, yield to host!
    if (nextSlice >= 5 && !activePeekTask.isExpired) {
      setFrameSliceMs(0);
      setExecutionLog((prev) => [
        {
          time: `${nextClock}ms`,
          event: `shouldYieldToHost() === true (5ms budget reached!)`,
          detail: `React pauses workLoopConcurrent(), yields to browser main thread for paint/input, and posts MessageChannel macrotask.`
        },
        ...prev.slice(0, 7)
      ]);
    } else {
      setFrameSliceMs(nextSlice >= 5 ? 0 : nextSlice);
    }

    // Decrement remainingSlices on the top task in the Min-Heap
    setTaskQueue((prev) => {
      const updated = prev
        .map((t) => {
          if (t.id === activePeekTask.id) {
            return { ...t, remainingSlices: t.remainingSlices - 1 };
          }
          return t;
        })
        .filter((t) => t.remainingSlices > 0);
      return updated;
    });
  };

  // Fast-forward time by +6000ms to demonstrate Starvation Prevention
  const triggerStarvationFastForward = () => {
    const jumpedClock = clockMs + 6000;
    setClockMs(jumpedClock);
    setFrameSliceMs(0);

    setTaskQueue((prev) =>
      prev.map((t) => {
        if (jumpedClock >= t.sortIndex) {
          return {
            ...t,
            isExpired: true,
            sortIndex: -1 // Promoted to urgent top of heap
          };
        }
        return t;
      })
    );

    setPreemptionAlert(
      persona === 'eli5'
        ? `⏱️ STARVATION PREVENTION! Time jumped +6000ms. Low-priority tasks waited past their deadline, so React promoted them to Emergency Uninterruptible Mode!`
        : `⏱️ markStarvedLanesAsExpired(root, ${jumpedClock}ms): currentTime >= expirationTime! Moves lanes into root.expiredLanes bitmask and forces synchronous non-yielding execution.`
    );

    setExecutionLog((prev) => [
      {
        time: `${jumpedClock}ms`,
        event: `markStarvedLanesAsExpired() -> EXPIRED!`,
        detail: `Tasks with sortIndex <= ${jumpedClock}ms marked expired (didUserCallbackTimeout = true) to prevent starvation.`
      },
      ...prev.slice(0, 7)
    ]);
  };

  // Compute combined pendingLanes bitmask across all queued tasks
  const activeLaneNames = new Set(taskQueue.map((t) => t.laneName));

  return (
    <div className="space-y-6">
      {/* Top Injection & Time-Slicing Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>The Scheduler Min-Heap & 31-Bit Lane Priority Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject tasks with different priorities below while the work loop is running to see <strong>Preemption</strong>, <strong>5ms Time-Slicing</strong>, and <strong>Starvation Prevention</strong>.
            </p>
          </div>

          {/* Step / Yield Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={stepOneMsSlice}
              disabled={!activePeekTask}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-semibold text-xs sm:text-sm transition shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4" />
              <span>Execute 1ms Work Slice</span>
            </button>
            <button
              onClick={triggerStarvationFastForward}
              disabled={taskQueue.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-300 border border-amber-500/40 font-semibold text-xs sm:text-sm transition"
            >
              <Flame className="w-4 h-4" />
              <span>Fast-Forward +6000ms (Starvation Test)</span>
            </button>
          </div>
        </div>

        {/* Task Injection Buttons */}
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            Inject Live Update into Scheduler (`scheduleUpdateOnFiber` ➔ `unstable_scheduleCallback`):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {LANE_PRIORITIES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => injectTask(preset)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-600 text-left transition group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${preset.badgeClass}`}>
                    {preset.laneName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    +{preset.timeoutOffset}ms
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                  + {preset.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {persona === 'eli5' ? preset.eli5Desc : preset.coreDesc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preemption or Starvation Banner */}
        {preemptionAlert && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3">
            <span>{preemptionAlert}</span>
            <button
              onClick={() => setPreemptionAlert(null)}
              className="text-xs font-mono underline text-rose-300 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 31-Bit Lane Bitmask Register & 5ms Frame Budget Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5ms Frame Budget & MessageChannel Visualizer (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                ReactFiberWorkLoop.js • Time Slicing
              </span>
              <h3 className="text-base font-bold text-white">
                5ms Frame Yield Budget (`shouldYieldToHost()`)
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300">
              Clock: {clockMs}ms
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {persona === 'eli5'
              ? 'To keep your screen running at a buttery-smooth 60 frames per second (16.6ms per frame), React only works for 5 milliseconds at a time! Every 5ms, it stops and checks if you clicked or scrolled.'
              : 'Inside workLoopConcurrent(), React checks shouldYieldToHost() before each Fiber unitOfWork: `performance.now() - startTime >= frameInterval (5ms)`. When true, it yields control back to the browser event loop via MessageChannel.'}
          </p>

          {/* 5ms Visual Progress Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Current 5ms Slice Elapsed:</span>
              <span className={frameSliceMs >= 4 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {frameSliceMs}ms / 5ms ({frameSliceMs >= 4 ? 'Yield on next step!' : 'Working...'})
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((ms) => (
                <div
                  key={ms}
                  className={`h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold border transition-all ${
                    frameSliceMs >= ms
                      ? ms === 5
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-900 text-slate-600 border-slate-800'
                  }`}
                >
                  {ms}ms
                </div>
              ))}
            </div>
            <div className="text-[11px] font-mono text-slate-400 pt-1">
              16.6ms Browser Frame = [5ms React Slice] ➔ [Browser Input/Paint] ➔ [5ms React Slice]
            </div>
          </div>

          {/* 31-Bit Lane Bitmask Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">root.pendingLanes (31-bit mask):</span>
              <span className="text-cyan-400">getHighestPriorityLane(lanes & -lanes)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { name: 'SyncLane', bit: '0b0000001', active: activeLaneNames.has('SyncLane') },
                { name: 'InputContinuous', bit: '0b0000100', active: activeLaneNames.has('InputContinuousLane') },
                { name: 'DefaultLane', bit: '0b0010000', active: activeLaneNames.has('DefaultLane') },
                { name: 'TransitionLane1', bit: '0b1000000', active: activeLaneNames.has('TransitionLane1') }
              ].map((lane) => (
                <div
                  key={lane.name}
                  className={`p-2 rounded-lg border flex items-center justify-between ${
                    lane.active
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{lane.name}</span>
                  <span className="font-bold">{lane.active ? '1' : '0'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scheduler Min-Heap Binary Tree & Queue (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                SchedulerMinHeap.js • Priority Queue (`taskQueue`)
              </span>
              <h3 className="text-base font-bold text-white">
                Binary Min-Heap (`peek(taskQueue)` = lowest `sortIndex`)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {sortedHeap.length} {sortedHeap.length === 1 ? 'task' : 'tasks'} in heap
            </span>
          </div>

          {sortedHeap.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-950/60 rounded-xl border border-slate-800">
              🎉 Min-Heap is empty! Click any of the 4 priority buttons above to inject tasks.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Visual Top of Heap (heap[0]) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/50 to-indigo-950/40 border border-cyan-500/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400 text-slate-950">
                      heap[0] • EXECUTING NOW
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sortedHeap[0].badgeClass}`}>
                      {sortedHeap[0].laneName}
                    </span>
                    {sortedHeap[0].isExpired && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-white">
                        EXPIRED (SYNC MODE)
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    sortIndex: {sortedHeap[0].sortIndex}ms
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm font-bold text-white">
                    Task #{sortedHeap[0].id}: {sortedHeap[0].name}
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Slices left: {sortedHeap[0].remainingSlices} / {sortedHeap[0].totalSlices}
                  </div>
                </div>
              </div>

              {/* Remaining Heap Nodes */}
              {sortedHeap.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sortedHeap.slice(1).map((task, idx) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                        <span className="text-slate-400">
                          heap[{idx + 1}] ({idx + 1 <= 2 ? 'child of heap[0]' : 'leaf'})
                        </span>
                        <span className="text-amber-300">sortIndex: {task.sortIndex}ms</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                        Task #{task.id}: {task.name}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{task.laneName}</span>
                        <span>
                          {task.remainingSlices}/{task.totalSlices} slices
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Scheduler Event Log */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Scheduler Execution Trace:
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 font-mono text-[11px]">
              {executionLog.map((item, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-slate-950/90 border border-slate-800/80 flex items-start gap-2"
                >
                  <span className="text-cyan-400 shrink-0">[{item.time}]</span>
                  <div>
                    <span className="text-white font-semibold">{item.event}</span>
                    <span className="text-slate-400 block">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 3: THE O(n) DIFFING ALGORITHM (reconcileChildrenArray)
// ============================================================================

function DiffingSimulator({ persona }) {
  const [scenarioKey, setScenarioKey] = useState('keyedReorder');
  const [stepIdx, setStepIdx] = useState(0);

  const scenario = DIFF_SCENARIOS[scenarioKey];
  const currentStep = scenario.steps[stepIdx] || scenario.steps[0];

  const handleSelectScenario = (key) => {
    setScenarioKey(key);
    setStepIdx(0);
  };

  return (
    <div className="space-y-6">
      {/* Scenario Selector Pills */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cyan-400" />
              <span>The O(n) Diffing Algorithm (`ReactChildFiber.js` • `reconcileChildrenArray`)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step through Pass 1 (Linear Scan) and Pass 2 (`existingChildren` Map + `lastPlacedIndex` watermark) to see why keys matter.
            </p>
          </div>

          {/* Step Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStepIdx((prev) => Math.max(0, prev - 1))}
              disabled={stepIdx === 0}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200 border border-slate-700"
            >
              ← Prev Step
            </button>
            <span className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300">
              Step {stepIdx + 1} / {scenario.steps.length}
            </span>
            <button
              onClick={() => setStepIdx((prev) => (prev + 1) % scenario.steps.length)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm transition"
            >
              <span>Next Diff Step</span>
              <StepForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scenario Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.values(DIFF_SCENARIOS).map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectScenario(item.id)}
              className={`p-3.5 rounded-xl border text-left transition ${
                scenarioKey === item.id
                  ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-xs sm:text-sm font-bold text-white">{item.title}</div>
              <div className="text-[11px] text-slate-400 mt-1">{item.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Live Pointers & Persona Explanation Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
          <div className="lg:col-span-5 grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">newIdx</div>
              <div className="text-lg font-bold text-cyan-400">{currentStep.newIdx}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">oldFiber.index</div>
              <div className="text-lg font-bold text-amber-400">
                {currentStep.oldIdx !== null ? currentStep.oldIdx : 'null (Map)'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/40">
              <div className="text-[10px] text-indigo-300">lastPlacedIndex</div>
              <div className="text-lg font-bold text-indigo-400">{currentStep.lastPlacedIndex}</div>
            </div>
          </div>

          <div
            className={`lg:col-span-7 p-3.5 rounded-xl border text-xs sm:text-sm ${
              persona === 'eli5'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-100'
            }`}
          >
            <div className="font-mono font-bold text-xs uppercase tracking-wider mb-1 text-white">
              {currentStep.pass}
            </div>
            <p>{persona === 'eli5' ? currentStep.eli5 : currentStep.core}</p>
          </div>
        </div>
      </div>

      {/* Visual Lists Comparison & Map State */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Old Fibers vs New Children Array (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
          {/* Row 1: Old Fiber Linked List */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Current Fiber Linked List (`oldFiber` ➔ `.sibling`)</span>
              <span>Before Update</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {scenario.oldList.map((node, idx) => {
                const isPointerHere = currentStep.oldIdx === idx;
                return (
                  <div
                    key={node.key}
                    className={`p-3 rounded-xl border font-mono transition ${
                      isPointerHere
                        ? 'bg-amber-500/15 border-amber-400 shadow-md'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 font-bold">key: {node.key}</span>
                      <span className="text-slate-400">oldIdx: {node.oldIndex}</span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1.5">{node.text}</div>
                    <div className="text-[10px] text-slate-500 mt-1">&lt;{node.type}&gt;</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2: New JSX Children Array & Resulting Flags */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2.5 flex items-center justify-between">
              <span>New JSX Elements (`newChildren[newIdx]`) & Fiber Flags</span>
              <span>Resulting WorkInProgress Fibers</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {scenario.newList.map((node, idx) => {
                const status = currentStep.statuses[node.key];
                const isActiveIdx = currentStep.newIdx === idx;
                const isPlacement = status?.flag?.includes('Placement');
                const isMutated = status?.action?.includes('MUTATED') || status?.action?.includes('DELETE');

                return (
                  <div
                    key={node.key}
                    className={`p-3 rounded-xl border font-mono transition flex flex-col justify-between ${
                      isActiveIdx
                        ? 'ring-2 ring-cyan-400 bg-slate-900 border-cyan-400'
                        : status
                        ? 'bg-slate-950 border-slate-700'
                        : 'bg-slate-950/40 border-slate-900 opacity-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-cyan-300 font-bold">key: {node.key}</span>
                        <span className="text-slate-400">newIdx: {idx}</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1.5">{node.text}</div>
                    </div>

                    {status ? (
                      <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isMutated
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isPlacement
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {status.action}
                        </span>
                        <div className="text-[10px] text-slate-300 font-sans leading-snug">
                          {status.detail}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-600">
                        Waiting for scan...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: existingChildren Map & Core Formula Card (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">
                Pass 2 Lookup Structure
              </span>
              <h3 className="text-base font-bold text-white font-mono">
                existingChildren: Map&lt;Key, Fiber&gt;
              </h3>
            </div>

            {currentStep.mapKeys.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono text-center">
                Map is currently empty (populated only when Pass 1 hits a key mismatch).
              </div>
            ) : (
              <div className="space-y-2">
                {currentStep.mapKeys.map((entry) => (
                  <div
                    key={entry}
                    className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/40 font-mono text-xs text-purple-200 flex items-center justify-between"
                  >
                    <span>Map Entry:</span>
                    <span className="font-bold text-white">{entry}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Core placeChild() Formula Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
              <div className="text-cyan-400 font-bold">// placeChild() in ReactChildFiber.js</div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`if (oldIndex < lastPlacedIndex) {
  // Moved right! Needs DOM insert
  newFiber.flags |= Placement;
  return lastPlacedIndex;
} else {
  // Stays in place! Update watermark
  return oldIndex;
}`}
              </pre>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            <strong>⚠️ Known Caveat for Interviews:</strong> Because <code className="text-white">lastPlacedIndex</code> only tracks the furthest right index seen so far, moving the <em>last</em> item to the <em>very front</em> (<code className="text-white">[A,B,C,D] ➔ [D,A,B,C]</code>) immediately sets <code className="text-white">lastPlacedIndex = 3</code>, causing A, B, and C to all get <code className="text-white">Placement</code> flags!
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 4: STAFF INTERVIEW FLASHCARDS & VERCEL EXPORT GUIDE
// ============================================================================

function InterviewAndDeployTab({ persona }) {
  const [openCardId, setOpenCardId] = useState('q1');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const deploySnippet = `# 1. Scaffold a lightning-fast Vite + React + Tailwind project
npm create vite@latest react-reconciler-visualizer -- --template react
cd react-reconciler-visualizer
npm install lucide-react

# 2. Replace src/App.jsx with this single-file application
# 3. Deploy directly to Vercel in one command:
npx vercel --prod`;

  const handleCopy = () => {
    navigator.clipboard.writeText(deploySnippet);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Interactive Staff/Senior Interview Q&A Flashcards (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Staff / Senior Engineer Reconciler Flashcards</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Each card automatically switches between the <strong>5th Grader Analogy</strong> (great for clear communication) and the <strong>React Core Deep-Dive</strong> (exact function names & trade-offs).
          </p>

          <div className="mt-4 space-y-3">
            {INTERVIEW_CARDS.map((card) => {
              const isOpen = openCardId === card.id;
              return (
                <div
                  key={card.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenCardId(isOpen ? null : card.id)}
                    className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-900/60 transition"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        {card.category}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white mt-1.5">
                        {card.question}
                      </h3>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 space-y-3 text-xs sm:text-sm leading-relaxed">
                      <div
                        className={`p-3 rounded-xl border ${
                          persona === 'eli5'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-1">
                          5th Grader Pitch (Communication Clarity):
                        </div>
                        {card.eli5Answer}
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${
                          persona === 'core'
                            ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-100'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
                          React Core Answer (Source-Level Depth):
                        </div>
                        {card.coreAnswer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Render vs Commit Phase Cheat Sheet & Vercel Deployment Guide (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Render vs Commit Lifecycle Comparison */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Cheat Sheet: Render Phase vs. Commit Phase</span>
          </h3>

          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
              <div className="font-mono font-bold text-indigo-300">
                1. RENDER PHASE (`beginWork` / `completeWork`)
              </div>
              <ul className="mt-1.5 space-y-1 text-slate-300 list-disc list-inside">
                <li><strong>Asynchronous & Interruptible</strong> (in Concurrent Mode).</li>
                <li>Operates purely in memory on the <code className="text-white">workInProgress</code> Fiber tree.</li>
                <li>Computes <code className="text-white">flags</code> & bubbles <code className="text-white">subtreeFlags</code>. Zero DOM mutations!</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="font-mono font-bold text-emerald-300">
                2. COMMIT PHASE (`commitRoot` • 3 Sub-Phases)
              </div>
              <ul className="mt-1.5 space-y-1 text-slate-300 list-disc list-inside">
                <li><strong>Always Synchronous & Uninterruptible</strong> (prevents UI tearing).</li>
                <li><strong>BeforeMutation:</strong> Reads DOM before changes (<code className="text-white">getSnapshotBeforeUpdate</code>).</li>
                <li><strong>Mutation:</strong> Applies DOM insertions/updates/deletions; swaps <code className="text-white">root.current = finishedWork</code>!</li>
                <li><strong>Layout:</strong> Runs <code className="text-white">useLayoutEffect</code> synchronously <em>before</em> browser paint; schedules <code className="text-white">useEffect</code> asynchronously via Scheduler.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* One-Click Vercel Deployment Guide */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                Deploy to Production
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Vercel Export Guide (Zero-Config)
              </h3>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd ? 'Copied!' : 'Copy Commands'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            This entire application is self-contained inside a single <code className="text-slate-200">App.jsx</code> file with only <code className="text-slate-200">lucide-react</code> and Tailwind CSS.
          </p>

          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto leading-relaxed">
            {deploySnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
