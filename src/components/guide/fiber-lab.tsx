import { useState } from "react";
import { Layer } from "@/components/guide/depth";
import { Panel } from "@/components/guide/ui";

const FIELDS: {
  group: string;
  name: string;
  value: string;
  picture: string;
  mechanism: string;
  source: string;
}[] = [
  {
    group: "Identity",
    name: "tag",
    value: "FunctionComponent = 0",
    picture: "What kind of thing this is. The work loop switches on it.",
    mechanism: "Same switch in beginWork and completeWork. A function component renders. A host component talks to the DOM. A fragment is only a grouping.",
    source: "ReactWorkTags.js. In 19.2: FunctionComponent 0, ClassComponent 1, HostRoot 3, HostComponent 5, HostText 6, SuspenseComponent 13, MemoComponent 14, OffscreenComponent 22, ActivityComponent 31.",
  },
  {
    group: "Identity",
    name: "key",
    value: '"row-12"',
    picture: "Identity among siblings. Not a performance hint.",
    mechanism: "Matching uses the key first. Same key and same type means reuse the fiber, including its state. A new key means a new fiber.",
    source: "Set from the element. Null when you omit key. The child map then uses the index as the map key, which is why index-as-key sticks state to the slot.",
  },
  {
    group: "Identity",
    name: "type",
    value: "Row",
    picture: "The function, class, or host tag this fiber represents.",
    mechanism: "elementType is what the element said (maybe a lazy or memo wrapper). type is what beginWork will actually run. They differ for lazy and memo.",
    source: "createFiberFromTypeAndProps resolves the tag from type. A string type becomes HostComponent. A function becomes FunctionComponent unless it is a simple memo.",
  },
  {
    group: "Pointers",
    name: "return",
    value: "→ App",
    picture: "The parent. The name is return, not parent.",
    mechanism: "When a fiber has no sibling left, the loop follows return and completes the parent. That is the 'up' of the depth-first walk.",
    source: "Fiber.return. The root's return is null. completeUnitOfWork stops there and the render phase ends.",
  },
  {
    group: "Pointers",
    name: "child",
    value: "→ header",
    picture: "The first child, not the list of children.",
    mechanism: "beginWork's return value is this pointer. One link is enough, because the rest of the children are siblings of that first child.",
    source: "A parent array would force the work loop to keep an index on the stack. A linked child lets the loop hold a single workInProgress fiber.",
  },
  {
    group: "Pointers",
    name: "sibling",
    value: "→ List",
    picture: "The next child of the same parent.",
    mechanism: "After a fiber completes, the loop tries sibling before it tries return. That is why Header finishes before List begins.",
    source: "Siblings form the list reconcileChildrenArray just built. Order is the order of the new children.",
  },
  {
    group: "Pointers",
    name: "index",
    value: "1",
    picture: "This fiber's position among its siblings on the previous commit.",
    mechanism: "Move detection compares this number to lastPlacedIndex. It is not used as the React key.",
    source: "placeChild writes newFiber.index = newIndex, then decides Placement from the alternate's old index.",
  },
  {
    group: "State",
    name: "pendingProps",
    value: "{ title: 'Now' }",
    picture: "What the latest element asked for. Not yet committed.",
    mechanism: "beginWork compares pendingProps to the current fiber's memoizedProps. If they are the same reference and nothing is scheduled, it can bail out.",
    source: "After beginWork, performUnitOfWork copies pendingProps onto memoizedProps. That is the 'I accept these props' line.",
  },
  {
    group: "State",
    name: "memoizedProps",
    value: "{ title: 'Before' }",
    picture: "The props from the last finished render of this fiber.",
    mechanism: "They live on the fiber, not on the element. Elements are thrown away. The fiber remembers.",
    source: "Bailout and memo compare against this. Host updates diff pending props against it inside prepareUpdate.",
  },
  {
    group: "State",
    name: "memoizedState",
    value: "hook → hook → hook",
    picture: "Where the component's memory actually is.",
    mechanism: "For a function component this is the first hook. For a class it is this.state. For a host root it is the element to render. For Suspense it is the boundary state.",
    source: "Hooks are { memoizedState, baseState, baseQueue, queue, next }. The next render must call hooks in the same order or it walks the wrong node.",
  },
  {
    group: "State",
    name: "updateQueue",
    value: "circular list",
    picture: "Work that has been requested but not rendered.",
    mechanism: "Class setState and root updates queue here. Effects also form a queue on the fiber. Hook setStates queue on the hook, not on this field.",
    source: "ReactFiberClassUpdateQueue.js for classes. Hook queues live on hook.queue: { pending, dispatch, lastRenderedState }. Pending is circular so append is O(1).",
  },
  {
    group: "Effects",
    name: "flags",
    value: "Placement | Update",
    picture: "Notes to the commit phase. Nothing here touches the DOM yet.",
    mechanism: "Render only sets bits. Commit reads them and does the irreversible work. A fiber with no flags and no subtreeFlags is skipped.",
    source: "ReactFiberFlags.js, React 19.2: PerformedWork bit 0, Placement bit 1, Update bit 2, ChildDeletion bit 4, Ref, Snapshot, Passive, Hydrating, Visibility. Old blog posts say Deletion. That flag was renamed. The parent owns ChildDeletion.",
  },
  {
    group: "Effects",
    name: "subtreeFlags",
    value: "Passive",
    picture: "A summary of the children, so commit does not walk a quiet subtree.",
    mechanism: "Bubbled during complete, not during begin. If a parent has an empty subtreeFlags and empty flags, its whole branch is done.",
    source: "completeUnitOfWork ORs child.flags and child.subtreeFlags into parent.subtreeFlags, and merges child lanes into childLanes.",
  },
  {
    group: "Effects",
    name: "deletions",
    value: "[ old row ]",
    picture: "Fibers that existed last time and will not exist after this commit.",
    mechanism: "They are not in the new child list, so they cannot carry their own flag through the walk. The parent holds them.",
    source: "deleteChild pushes onto returnFiber.deletions and sets ChildDeletion. Commit removes the host nodes, runs destroy functions, and detaches refs.",
  },
  {
    group: "Schedule",
    name: "lanes",
    value: "SyncLane",
    picture: "Which priorities of work are waiting on this fiber.",
    mechanism: "An update ORs a lane in. A render picks the highest lane and may ignore the others. They stay pending.",
    source: "A lane is one bit. getHighestPriorityLane keeps the lowest set bit. In 19.2 that makes SyncHydrationLane (bit 0) higher than SyncLane (bit 1).",
  },
  {
    group: "Schedule",
    name: "childLanes",
    value: "TransitionLane",
    picture: "Work waiting somewhere below, even if this fiber itself is quiet.",
    mechanism: "This is how a parent bails out of rendering but still walks down to a child that has an update.",
    source: "bailoutOnAlreadyFinishedWork clones the child fibers, then continues into them only if childLanes overlaps the render lanes.",
  },
  {
    group: "Buffer",
    name: "alternate",
    value: "↔ current twin",
    picture: "The other copy of this fiber. One is on screen. One is being built.",
    mechanism: "They swap roles at commit. The next render recycles the tree that just left the screen instead of allocating every node again.",
    source: "root.current points at the committed tree. workInProgress is the clone. After commitRoot, root.current = finishedWork.",
  },
  {
    group: "Buffer",
    name: "stateNode",
    value: "DOM node or instance",
    picture: "The real thing, if this fiber has one.",
    mechanism: "Host components store the DOM node here. Class components store the instance. Function components leave it null. Their memory is memoizedState.",
    source: "Created in completeWork via the host config's createInstance. Mutations in commit read it back.",
  },
];

export function FiberLab() {
  const [name, setName] = useState("alternate");
  const field = FIELDS.find((item) => item.name === name) ?? FIELDS[0];
  const groups = [...new Set(FIELDS.map((item) => item.group))];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="font-mono text-xs tracking-widest text-mist uppercase">Fiber · {field.name}</p>
        <p className="mt-2 font-mono text-sm text-copper">{field.value}</p>
        <div className="mt-4 flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="font-mono text-xs text-mist">{group}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FIELDS.filter((item) => item.group === group).map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    aria-pressed={item.name === field.name}
                    onClick={() => setName(item.name)}
                    className={`min-h-11 rounded-md border px-3 font-mono text-sm ${
                      item.name === field.name ? "border-copper bg-copper text-ink" : "border-line text-paper"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Layer id="picture">
        <p>{field.picture}</p>
      </Layer>
      <Layer id="mechanism">
        <p>{field.mechanism}</p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">{field.source}</p>
      </Layer>
    </div>
  );
}
