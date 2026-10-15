/** A teaching model of ReactChildFiber's array path (React 19.2). */

export type Item = {
  id: string;
  key: string;
  type: string;
  label: string;
  state: number;
};

export type OutFiber = {
  fiberId: string;
  key: string;
  type: string;
  label: string;
  state: number;
  index: number;
  placement: boolean;
  update: boolean;
  replaced: boolean;
  oldIndex: number | null;
  reason: string;
};

export type Deletion = {
  id: string;
  key: string;
  label: string;
  oldIndex: number;
  reason: string;
};

export type TraceLine = {
  title: string;
  detail: string;
};

type Old = Item & { index: number };

export type ReconcileResult = {
  fibers: OutFiber[];
  deletions: Deletion[];
  trace: TraceLine[];
};

export function reconcile(prev: Item[], next: Item[]): ReconcileResult {
  const trace: TraceLine[] = [];
  const olds: Old[] = prev.map((item, index) => ({ ...item, index }));
  const deletions: Deletion[] = [];
  const fibers: OutFiber[] = [];

  let oldIdx = 0;
  let newIdx = 0;
  let lastPlacedIndex = 0;
  let broke = false;

  trace.push({
    title: "Prefix",
    detail: "Walk the old sibling list and the new children together. Continue only while keys match. This is updateSlot.",
  });

  while (oldIdx < olds.length && newIdx < next.length) {
    const old = olds[oldIdx];
    const child = next[newIdx];
    if (old.key !== child.key) {
      trace.push({
        title: `Prefix stops at ${child.label}`,
        detail: `Old key "${old.key}" ≠ new key "${child.key}". updateSlot returns null and the loop breaks without consuming either side.`,
      });
      broke = true;
      break;
    }
    if (old.type !== child.type) {
      deletions.push({
        id: old.id,
        key: old.key,
        label: old.label,
        oldIndex: old.index,
        reason: `Key "${old.key}" matched, but type ${old.type} became ${child.type}. The old fiber is deleted. A new fiber is placed.`,
      });
      const created = makeFiber(child, newIdx, {
        fiberId: child.id,
        placement: true,
        update: false,
        replaced: true,
        oldIndex: old.index,
        state: 0,
        reason: `Type changed under the same key. State on the old fiber does not move across a type change.`,
      });
      fibers.push(created);
      trace.push({
        title: `Replace ${child.label}`,
        detail: `New fiber. Placement is set. lastPlacedIndex stays ${lastPlacedIndex}.`,
      });
    } else {
      const reused = makeFiber(child, newIdx, {
        fiberId: old.id,
        placement: false,
        update: old.label !== child.label,
        replaced: false,
        oldIndex: old.index,
        state: old.state,
        reason: "",
      });
      lastPlacedIndex = placeExisting(reused, old.index, lastPlacedIndex, trace);
      fibers.push(reused);
    }
    oldIdx += 1;
    newIdx += 1;
  }

  if (!broke && newIdx === next.length) {
    while (oldIdx < olds.length) {
      const old = olds[oldIdx];
      deletions.push({
        id: old.id,
        key: old.key,
        label: old.label,
        oldIndex: old.index,
        reason: "The new children ended. This leftover old fiber is pushed onto parent.deletions.",
      });
      oldIdx += 1;
    }
    trace.push({
      title: "Delete the tail",
      detail:
        deletions.length > 0
          ? "Parent is flagged ChildDeletion. The deleted fibers are not left in the new sibling list."
          : "The lists were the same length. Nothing to delete.",
    });
    return { fibers, deletions, trace };
  }

  if (!broke && oldIdx === olds.length) {
    while (newIdx < next.length) {
      const child = next[newIdx];
      fibers.push(
        makeFiber(child, newIdx, {
          fiberId: child.id,
          placement: true,
          update: false,
          replaced: false,
          oldIndex: null,
          state: 0,
          reason: "No old fiber remains. createChild, then Placement. State starts over.",
        }),
      );
      trace.push({
        title: `Place ${child.label}`,
        detail: `Appended child. Placement is set. lastPlacedIndex stays ${lastPlacedIndex}. New nodes do not advance it.`,
      });
      newIdx += 1;
    }
    return { fibers, deletions, trace };
  }

  const map = new Map<string, Old>();
  for (let i = oldIdx; i < olds.length; i += 1) {
    map.set(olds[i].key, olds[i]);
  }
  trace.push({
    title: "Map the remainder",
    detail: `Keys still available: ${[...map.keys()].map((key) => `"${key}"`).join(", ") || "(none)"}. Lookup is by key, not by position.`,
  });

  while (newIdx < next.length) {
    const child = next[newIdx];
    const old = map.get(child.key);
    if (!old) {
      fibers.push(
        makeFiber(child, newIdx, {
          fiberId: child.id,
          placement: true,
          update: false,
          replaced: false,
          oldIndex: null,
          state: 0,
          reason: `Key "${child.key}" was not in the map. New fiber, Placement, state resets.`,
        }),
      );
      trace.push({
        title: `Place ${child.label}`,
        detail: `Map miss. lastPlacedIndex stays ${lastPlacedIndex}.`,
      });
    } else {
      map.delete(child.key);
      if (old.type !== child.type) {
        deletions.push({
          id: old.id,
          key: old.key,
          label: old.label,
          oldIndex: old.index,
          reason: `Map hit on key "${old.key}", but the type changed.`,
        });
        fibers.push(
          makeFiber(child, newIdx, {
            fiberId: child.id,
            placement: true,
            update: false,
            replaced: true,
            oldIndex: old.index,
            state: 0,
            reason: "Matched key, different type. Delete the old fiber and place a new one.",
          }),
        );
        trace.push({
          title: `Replace ${child.label}`,
          detail: `lastPlacedIndex stays ${lastPlacedIndex}.`,
        });
      } else {
        const reused = makeFiber(child, newIdx, {
          fiberId: old.id,
          placement: false,
          update: old.label !== child.label,
          replaced: false,
          oldIndex: old.index,
          state: old.state,
          reason: "",
        });
        lastPlacedIndex = placeExisting(reused, old.index, lastPlacedIndex, trace);
        fibers.push(reused);
      }
    }
    newIdx += 1;
  }

  for (const old of map.values()) {
    deletions.push({
      id: old.id,
      key: old.key,
      label: old.label,
      oldIndex: old.index,
      reason: "Still in the map after the new list was consumed. ChildDeletion on the parent.",
    });
  }
  if ([...map.values()].length > 0) {
    trace.push({
      title: "Delete what the map still holds",
      detail: "Unmatched old fibers are not siblings anymore. Commit will remove their host nodes.",
    });
  }

  return { fibers, deletions, trace };
}

function placeExisting(fiber: OutFiber, oldIndex: number, lastPlacedIndex: number, trace: TraceLine[]) {
  if (oldIndex < lastPlacedIndex) {
    fiber.placement = true;
    fiber.reason = `Reused the fiber from index ${oldIndex}, but ${oldIndex} < lastPlacedIndex ${lastPlacedIndex}. It moved backwards past something already placed, so Placement is set. lastPlacedIndex stays ${lastPlacedIndex}.`;
    trace.push({
      title: `Move ${fiber.label}`,
      detail: fiber.reason,
    });
    return lastPlacedIndex;
  }
  fiber.placement = false;
  fiber.reason = `Reused the fiber from index ${oldIndex}. ${oldIndex} ≥ lastPlacedIndex ${lastPlacedIndex}, so relative order held. No Placement. lastPlacedIndex becomes ${oldIndex}.`;
  if (fiber.update) {
    fiber.reason += " Props changed, so completeWork marks it Update (it only checks whether the props object changed). The prop-by-prop diff happens in commit, inside commitUpdate.";
  }
  trace.push({
    title: `Keep ${fiber.label}`,
    detail: fiber.reason,
  });
  return oldIndex;
}

function makeFiber(
  child: Item,
  index: number,
  extra: {
    fiberId: string;
    placement: boolean;
    update: boolean;
    replaced: boolean;
    oldIndex: number | null;
    state: number;
    reason: string;
  },
): OutFiber {
  return {
    fiberId: extra.fiberId,
    key: child.key,
    type: child.type,
    label: child.label,
    state: extra.state,
    index,
    placement: extra.placement,
    update: extra.update,
    replaced: extra.replaced,
    oldIndex: extra.oldIndex,
    reason: extra.reason,
  };
}
