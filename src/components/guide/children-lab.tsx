import { useMemo, useState } from "react";
import { reconcile, type Item } from "@/lib/reconcile-children";
import { Layer } from "@/components/guide/depth";
import { Button, Panel, Select } from "@/components/guide/ui";

type Row = {
  uid: string;
  label: string;
  type: "li" | "div";
  state: number;
};

type Mode = "stable" | "index";

const PRESETS: { id: string; label: string; prev: Row[]; next: Row[]; mode: Mode }[] = [
  {
    id: "props",
    label: "Change a label",
    mode: "stable",
    prev: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
      { uid: "c", label: "Cy", type: "li", state: 2 },
    ],
    next: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea Lopez", type: "li", state: 4 },
      { uid: "c", label: "Cy", type: "li", state: 2 },
    ],
  },
  {
    id: "append",
    label: "Append",
    mode: "stable",
    prev: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
    ],
    next: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
      { uid: "d", label: "Di", type: "li", state: 0 },
    ],
  },
  {
    id: "reverse",
    label: "Reverse, stable keys",
    mode: "stable",
    prev: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
      { uid: "c", label: "Cy", type: "li", state: 2 },
    ],
    next: [
      { uid: "c", label: "Cy", type: "li", state: 2 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
      { uid: "a", label: "Ada", type: "li", state: 1 },
    ],
  },
  {
    id: "index",
    label: "Reverse, index as key",
    mode: "index",
    prev: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
      { uid: "c", label: "Cy", type: "li", state: 2 },
    ],
    next: [
      { uid: "c", label: "Cy", type: "li", state: 2 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
      { uid: "a", label: "Ada", type: "li", state: 1 },
    ],
  },
  {
    id: "insert",
    label: "Insert at the head",
    mode: "stable",
    prev: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
    ],
    next: [
      { uid: "z", label: "Zed", type: "li", state: 0 },
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
    ],
  },
  {
    id: "delete",
    label: "Delete the middle",
    mode: "stable",
    prev: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
      { uid: "c", label: "Cy", type: "li", state: 2 },
    ],
    next: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "c", label: "Cy", type: "li", state: 2 },
    ],
  },
  {
    id: "type",
    label: "Change the type",
    mode: "stable",
    prev: [
      { uid: "a", label: "Ada", type: "li", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
    ],
    next: [
      { uid: "a", label: "Ada", type: "div", state: 1 },
      { uid: "b", label: "Bea", type: "li", state: 4 },
    ],
  },
];

function toItems(rows: Row[], mode: Mode): Item[] {
  return rows.map((row, index) => ({
    id: row.uid,
    key: mode === "index" ? String(index) : row.uid,
    type: row.type,
    label: row.label,
    state: row.state,
  }));
}

let seq = 0;

export function ChildrenLab() {
  const [preset, setPreset] = useState(PRESETS[2].id);
  const [prev, setPrev] = useState<Row[]>(PRESETS[2].prev);
  const [next, setNext] = useState<Row[]>(PRESETS[2].next);
  const [mode, setMode] = useState<Mode>(PRESETS[2].mode);

  function load(id: string) {
    const found = PRESETS.find((item) => item.id === id) ?? PRESETS[0];
    setPreset(found.id);
    setPrev(found.prev.map((row) => ({ ...row })));
    setNext(found.next.map((row) => ({ ...row })));
    setMode(found.mode);
  }

  const result = useMemo(() => reconcile(toItems(prev, mode), toItems(next, mode)), [prev, next, mode]);

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const copy = next.slice();
    const [row] = copy.splice(index, 1);
    copy.splice(target, 0, row);
    setNext(copy);
  }

  const stuck = mode === "index" && result.fibers.some((fiber) => fiber.fiberId !== next[fiber.index]?.uid);

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase">
        Preset
        <Select value={preset} onChange={(event) => load(event.target.value)} aria-label="Reconciliation preset">
          {PRESETS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={mode === "stable" ? "solid" : "ghost"} onClick={() => setMode("stable")}>
          key = id
        </Button>
        <Button type="button" variant={mode === "index" ? "solid" : "ghost"} onClick={() => setMode("index")}>
          key = index
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="font-mono text-xs tracking-widest text-mist uppercase">Previous fibers</p>
          <ul className="mt-3 flex flex-col gap-2">
            {prev.map((row, index) => (
              <li key={row.uid} className="rounded-md border border-line px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-paper">{row.label}</span>
                  <span className="font-mono text-xs text-mist">
                    key {mode === "index" ? index : row.uid} · state {row.state}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() =>
                      setPrev((rows) => rows.map((item) => (item.uid === row.uid ? { ...item, state: item.state + 1 } : item)))
                    }
                  >
                    State +
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      setPrev((rows) =>
                        rows.map((item) =>
                          item.uid === row.uid ? { ...item, state: Math.max(0, item.state - 1) } : item,
                        ),
                      )
                    }
                  >
                    State −
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <p className="font-mono text-xs tracking-widest text-mist uppercase">Next elements</p>
          <ul className="mt-3 flex flex-col gap-2">
            {next.map((row, index) => (
              <li key={row.uid} className="rounded-md border border-line px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-paper">{row.label}</span>
                  <span className="font-mono text-xs text-mist">key {mode === "index" ? index : row.uid}</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <Button type="button" onClick={() => move(index, -1)} aria-label={`Move ${row.label} up`}>
                    Up
                  </Button>
                  <Button type="button" onClick={() => move(index, 1)} aria-label={`Move ${row.label} down`}>
                    Down
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      setNext((rows) =>
                        rows.map((item) =>
                          item.uid === row.uid ? { ...item, type: item.type === "li" ? "div" : "li" } : item,
                        ),
                      )
                    }
                  >
                    {row.type}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setNext((rows) => rows.filter((item) => item.uid !== row.uid))}
                    aria-label={`Remove ${row.label}`}
                  >
                    Cut
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            className="mt-3 w-full"
            onClick={() => {
              seq += 1;
              const uid = `n${seq}`;
              setNext((rows) => [...rows, { uid, label: `New ${seq}`, type: "li", state: 0 }]);
            }}
          >
            Add child
          </Button>
        </Panel>
      </div>
      {stuck ? (
        <p className="rounded-md border border-copper px-4 py-3 text-sm text-paper">
          Index keys matched the slot, not the row. State stayed on the position. The label moved underneath it.
          That is the bug people blame on "React being weird."
        </p>
      ) : (
        <p className="text-sm text-mist">
          State rides the reused fiber. With a stable key, the state follows the row. Placement is only for nodes
          that are new or that moved backwards past lastPlacedIndex.
        </p>
      )}
      <Panel>
        <p className="font-mono text-xs tracking-widest text-mist uppercase">Resulting sibling list</p>
        <ul className="mt-3 flex flex-col gap-3">
          {result.fibers.map((fiber) => (
            <li key={`${fiber.index}-${fiber.key}`} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-sm text-paper">
                  {fiber.label}
                  <span className="text-mist"> · {fiber.type}</span>
                </span>
                <span className="font-mono text-xs text-copper">state {fiber.state}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-mist">
                key "{fiber.key}"
                {fiber.placement ? " · Placement" : ""}
                {fiber.update ? " · Update" : ""}
                {fiber.replaced ? " · replace (delete + place)" : ""}
                {!fiber.placement && !fiber.update && !fiber.replaced ? " · no host flag from this match" : ""}
              </p>
              <p className="mt-1 text-sm text-paper">{fiber.reason}</p>
            </li>
          ))}
        </ul>
        {result.deletions.length > 0 ? (
          <div className="mt-4 border-t border-line pt-3">
            <p className="font-mono text-xs tracking-widest text-mist uppercase">parent.deletions</p>
            <ul className="mt-2 flex flex-col gap-2">
              {result.deletions.map((item) => (
                <li key={`${item.id}-${item.oldIndex}`} className="text-sm text-paper">
                  <span className="font-mono text-copper">ChildDeletion</span> · {item.label} · {item.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Panel>
      <Layer id="picture">
        <p>
          React does not search for the smallest edit script. It walks once, reuses a child when the key and type
          match, and flags everything else. Moves are detected with one integer, lastPlacedIndex, not by diffing
          positions.
        </p>
      </Layer>
      <Layer id="mechanism">
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          {result.trace.map((line) => (
            <li key={line.title + line.detail}>
              <span className="text-paper">{line.title}. </span>
              <span className="text-mist">{line.detail}</span>
            </li>
          ))}
        </ol>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed">
          ReactChildFiber.js · reconcileChildrenArray. First loop calls updateSlot and breaks when the key
          mismatches. The rest go through a map keyed by key (or by index when key is null). placeChild sets
          Placement when the fiber is new, or when the old index is lower than lastPlacedIndex. Deletions are stored on the
          parent. There is no Deletion flag left on a fiber in the new tree. The parent gets ChildDeletion
          (bit 4 in React 19.2).
        </p>
      </Layer>
    </div>
  );
}
