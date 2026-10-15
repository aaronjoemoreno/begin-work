import { useEffect, useRef, useState, type FormEvent } from "react";
import { Layer } from "@/components/guide/depth";
import { Button, Panel } from "@/components/guide/ui";
import { cubic, formatCount } from "@/lib/interview-sim";
import { cn } from "@/lib/cn";

const SIZES = [10, 100, 1000, 5000, 10000];

/** Q3 · Why React does not run a general tree diff. */
export function ComplexityMeter() {
  const [pick, setPick] = useState(2);
  const n = SIZES[pick];
  const general = cubic(n);
  const logMax = Math.log10(cubic(SIZES[SIZES.length - 1]));

  return (
    <Panel>
      <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase">
        Elements in the tree · {n.toLocaleString("en-US")}
        <input
          type="range"
          min={0}
          max={SIZES.length - 1}
          value={pick}
          onChange={(e) => setPick(Number(e.target.value))}
        />
      </label>
      <div className="mt-4 flex flex-col gap-3">
        <Row
          label="General tree diff · O(n³)"
          value={general}
          width={(Math.log10(general) / logMax) * 100}
          tone="bg-mist"
        />
        <Row
          label="React’s heuristic · O(n)"
          value={n}
          width={(Math.log10(n) / logMax) * 100}
          tone="bg-copper"
        />
      </div>
      <p className="mt-3 font-mono text-xs text-mist">
        Bars are on a log scale. Linear would not fit on the screen.
      </p>
    </Panel>
  );
}

function Row({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: number;
  width: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex justify-between gap-3 font-mono text-xs">
        <span className="text-paper">{label}</span>
        <span className="text-copper">{formatCount(value)} ops</span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-sm bg-ink" aria-hidden="true">
        <div
          className={cn("h-full transition-[width] duration-500", tone)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/** Render can stop. Commit cannot. */
export function TwoPhases() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-dashed border-copper px-4 py-4">
        <p className="font-mono text-xs tracking-widest text-copper uppercase">
          Render phase · may pause
        </p>
        <p className="mt-2 text-sm text-paper">
          Call components, reconcile children with keys, mark flags. Pure. Can be thrown away and
          restarted.
        </p>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={cn("h-3 flex-1 rounded-[2px] bg-copper", i % 2 === 1 && "opacity-40")}
            />
          ))}
        </div>
      </div>
      <div className="rounded-md border border-paper px-4 py-4">
        <p className="font-mono text-xs tracking-widest text-paper uppercase">
          Commit phase · synchronous
        </p>
        <p className="mt-2 text-sm text-paper">
          Apply the flags to the DOM, run layout effects, swap trees. One pass, no yield. Then the
          browser paints.
        </p>
        <div className="mt-3 h-3 rounded-[2px] bg-paper" aria-hidden="true" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heuristic 1, live: a different type throws the subtree away         */
/* ------------------------------------------------------------------ */

export function TypeChangeDemo() {
  const [asForm, setAsForm] = useState(true);
  const [mounts, setMounts] = useState(0);
  const Wrapper = asForm ? "form" : "section";

  return (
    <Panel>
      <p className="font-mono text-xs tracking-widest text-mist uppercase">
        Live React · heuristic 1
      </p>
      <p className="mt-1 text-sm text-paper">
        Type something, then swap the wrapper’s element type. Same child component, same position.
      </p>
      <Wrapper
        className="mt-3 rounded-md border border-line p-3"
        onSubmit={(event: FormEvent) => event.preventDefault()}
      >
        <p className="font-mono text-xs text-copper">{`<${Wrapper}>`}</p>
        <Field onMount={() => setMounts((value) => value + 1)} />
        <p className="font-mono text-xs text-copper">{`</${Wrapper}>`}</p>
      </Wrapper>
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <Button type="button" variant="solid" onClick={() => setAsForm((value) => !value)}>
          Change {`<${Wrapper}>`} to {asForm ? "<section>" : "<form>"}
        </Button>
        <p className="font-mono text-xs text-mist" aria-live="polite">
          Field mounted {mounts} {mounts === 1 ? "time" : "times"}
        </p>
      </div>
    </Panel>
  );
}

function Field({ onMount }: { onMount: () => void }) {
  const [text, setText] = useState("");
  const mounted = useRef(onMount);
  useEffect(() => {
    mounted.current();
  }, []);
  return (
    <label className="my-2 flex flex-col gap-1 font-mono text-xs text-mist">
      Field state
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="type here"
        className="min-h-11 rounded-md border border-line bg-ink px-3 font-mono text-sm text-paper placeholder:text-mist"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Heuristic 2, live: keys are identity                                */
/* ------------------------------------------------------------------ */

const FRUIT = [
  { id: "a", name: "Apple" },
  { id: "b", name: "Banana" },
  { id: "c", name: "Cherry" },
  { id: "d", name: "Date" },
  { id: "e", name: "Elderberry" },
];

export function KeysDemo() {
  const [strategy, setStrategy] = useState<"index" | "id">("index");
  const [items, setItems] = useState(FRUIT);
  const [round, setRound] = useState(0);

  function reset(next?: "index" | "id") {
    if (next) setStrategy(next);
    setItems(FRUIT);
    setRound((value) => value + 1);
  }

  return (
    <Panel>
      <p className="font-mono text-xs tracking-widest text-mist uppercase">
        Live React · heuristic 2
      </p>
      <p className="mt-1 text-sm text-paper">
        Each row keeps a note in its own useState, initialised from its fruit on mount. Delete a row
        near the top and see whose note survives.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Key strategy">
        {(["index", "id"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={strategy === item}
            onClick={() => reset(item)}
            className={cn(
              "min-h-11 rounded-md border px-2 font-mono text-sm",
              strategy === item ? "border-copper bg-copper text-ink" : "border-line text-paper",
            )}
          >
            key={item === "index" ? "{index}" : "{item.id}"}
          </button>
        ))}
      </div>
      <ul key={round} className="mt-3 flex flex-col gap-2">
        {items.map((item, index) => (
          <FruitRow
            key={strategy === "index" ? index : item.id}
            name={item.name}
            reactKey={strategy === "index" ? String(index) : item.id}
            onDelete={() => setItems((list) => list.filter((other) => other.id !== item.id))}
          />
        ))}
      </ul>
      <div className="mt-3">
        <Button type="button" onClick={() => reset()}>
          Restore all rows
        </Button>
      </div>
    </Panel>
  );
}

function FruitRow({
  name,
  reactKey,
  onDelete,
}: {
  name: string;
  reactKey: string;
  onDelete: () => void;
}) {
  const [note] = useState(() => `note for ${name}`);
  const wrong = note !== `note for ${name}`;
  return (
    <li
      className={cn(
        "grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-3 py-2",
        wrong ? "border-copper" : "border-line",
      )}
    >
      <span className="font-mono text-xs text-mist">key {reactKey}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm text-paper">{name}</span>
        <span
          className={cn("block truncate font-mono text-xs", wrong ? "text-copper" : "text-mist")}
        >
          {note}
          {wrong ? " ← stale state" : ""}
        </span>
      </span>
      <Button type="button" variant="quiet" onClick={onDelete} aria-label={`Delete ${name}`}>
        Delete
      </Button>
    </li>
  );
}

export function DiffNotes() {
  return (
    <>
      <Layer id="picture">
        <p>
          React never compares two arbitrary trees. It assumes two things and walks children in one
          pass: a different type means a different subtree, so throw it away and build fresh; and
          among siblings, the key says who is who. Both assumptions are cheap to check and almost
          always true. When you break them, you get the bugs on this page.
        </p>
      </Layer>
      <Layer id="mechanism">
        <p>
          With index keys, deleting Banana makes the row that used to be Cherry receive key 1. React
          sees key 1 and the same component type, so it keeps the fiber that was Banana’s, state and
          all, and hands it Cherry’s props. The labels look right because they are props. The notes
          are wrong because they are state. Stable ids fix it: key c follows Cherry wherever it
          goes.
        </p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          Type check: updateElement / reconcileSingleElement compare element.type with
          current.elementType; a mismatch means deleteChild + createFiberFromElement. Keys:
          reconcileChildrenArray, the prefix walk, then mapRemainingChildren (a Map keyed by key, or
          by index when key is null) and placeChild with lastPlacedIndex. The O(n³) figure is from
          the old React docs’ reconciliation page; the shipped child reconciler is linear in the
          number of children.
        </p>
      </Layer>
    </>
  );
}
