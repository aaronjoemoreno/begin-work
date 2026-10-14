import { FrameLab, type Frame } from "@/components/guide/frame-lab";
import { Panel } from "@/components/guide/ui";

const FRAMES: Frame[] = [
  {
    kicker: "Render",
    title: "The primary child starts rendering",
    picture: "Suspense does not fetch. It is a boundary around a child that might not be ready to commit.",
    mechanism: "The boundary is a SuspenseComponent fiber. Its child is the primary tree. The fallback is the other child, kept for when the primary suspends.",
    source: "updateSuspenseComponent in ReactFiberBeginWork.js. The fiber's memoizedState records whether the boundary is showing fallback.",
  },
  {
    kicker: "Throw",
    title: "The child suspends",
    picture: "A component reads a promise that is not ready, usually through use() or a framework cache. Rendering that component stops.",
    mechanism: "The promise is thrown. This is control flow, not an error. React catches it inside the work loop, the same way it catches a real error, and then classifies the thrown value.",
    source: "throwException in ReactFiberThrow.js. A thenable takes the suspend path. A real error looks for an error boundary instead.",
  },
  {
    kicker: "Unwind",
    title: "Walk return pointers to the nearest boundary",
    picture: "Everything between the suspended component and the boundary is incomplete. Those fibers are not committed as the primary UI.",
    mechanism: "The walk marks the path, finds the Suspense fiber, and prepares to render its fallback on the work-in-progress tree. The primary attempt can be kept offscreen so its state is not thrown away.",
    source: "unwindWork. The boundary gets a flag. Incomplete fibers get the Incomplete flag so the rest of this attempt is not treated as a finished tree.",
  },
  {
    kicker: "Commit",
    title: "The fallback commits",
    picture: "The user sees the fallback. The suspended content is not a half-rendered hole in the DOM.",
    mechanism: "Commit is still synchronous. The host shows the fallback. If the primary tree had already been shown and then suspended again, React can hide it with the Visibility flag instead of destroying it.",
    source: "Visibility is how Offscreen and a hidden primary tree avoid unmounting. hideInstance / unhideInstance come from the host config.",
  },
  {
    kicker: "Ping",
    title: "The promise resolves",
    picture: "Nothing re-renders at the moment of the throw. The promise's then callback is what wakes React.",
    mechanism: "When the thenable fulfills, React pings the boundary. A ping is an update on a retry lane, not a brand-new default update from your component.",
    source: "attachPingListener. The retry is scheduled with a RetryLane so several suspended trees do not all stampede on DefaultLane.",
  },
  {
    kicker: "Retry",
    title: "Render the primary child again",
    picture: "React tries the real UI again. If the data is ready, the fallback is replaced. If not, the fallback stays.",
    mechanism: "This retry is a normal render of that subtree at the retry lane. It can still be interrupted by a click. The fallback remains the current tree until the retry commits.",
    source: "Selective hydration is the related idea for SSR: a click marks that dehydrated boundary with SelectiveHydrationLane so it hydrates before quieter siblings.",
  },
  {
    kicker: "Activity",
    title: "Hiding is not the same as unmounting",
    picture: "Activity, and the older Offscreen idea under it, can keep a tree alive while the user is not looking at it.",
    mechanism: "The fiber stays mounted. State and DOM can be retained. The host is told to hide the instance. Revealing it is a visibility change, not a fresh mount, unless the tree was actually deleted.",
    source: "React 19.2 work tags: OffscreenComponent is 22, ActivityComponent is 31. Activity is the public component. Offscreen is still the internal mode for hidden work, including Suspense fallbacks.",
  },
];

function Visual({ index }: { index: number }) {
  const showFallback = index === 3 || index === 4;
  const unwinding = index === 2;
  const restored = index === 5 || index === 6;
  const label = showFallback ? "Loading profile" : restored ? "Profile" : index === 1 ? "Profile threw a promise" : "Profile";

  return (
    <Panel>
      <p className="font-mono text-xs tracking-widest text-mist uppercase">Suspense boundary</p>
      <div className={`mt-3 rounded-md border px-4 py-6 ${unwinding ? "border-copper" : "border-line"}`}>
        <p className="font-serif text-2xl text-paper">{label}</p>
        <p className="mt-2 font-mono text-xs text-mist">
          {index === 0 && "Primary child rendering"}
          {index === 1 && "Thenable in flight. Render of this child stops."}
          {index === 2 && "Unwind along return, looking for this boundary."}
          {index === 3 && "Fallback committed. Primary kept off to the side."}
          {index === 4 && "Waiting for ping. The screen does not spin inside render."}
          {index === 5 && "Retry committed. Fallback is gone."}
          {index === 6 && "Hidden trees can stay mounted. This one is visible."}
        </p>
      </div>
    </Panel>
  );
}

export function SuspenseLab() {
  return <FrameLab frames={FRAMES} renderVisual={(index) => <Visual index={index} />} />;
}
