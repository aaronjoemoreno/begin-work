import { useState, type ReactNode } from "react";
import { Layer } from "@/components/guide/depth";
import { Button } from "@/components/guide/ui";

export type Frame = {
  kicker: string;
  title: string;
  picture: string;
  mechanism: string;
  source: string;
};

export function FrameLab({
  frames,
  renderVisual,
}: {
  frames: Frame[];
  renderVisual: (index: number) => ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const frame = frames[index];

  return (
    <div className="flex flex-col gap-4">
      {renderVisual(index)}
      <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase">
        Scrub
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={index}
          onChange={(event) => setIndex(Number(event.target.value))}
          aria-valuetext={`${index + 1} of ${frames.length}: ${frame.title}`}
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" onClick={() => setIndex(0)}>
          Reset
        </Button>
        <Button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
          Back
        </Button>
        <Button
          type="button"
          variant="solid"
          onClick={() => setIndex((value) => Math.min(frames.length - 1, value + 1))}
          disabled={index === frames.length - 1}
        >
          Next
        </Button>
      </div>
      <p className="font-mono text-xs text-mist" aria-live="polite">
        {index + 1} / {frames.length} · {frame.kicker}
      </p>
      <h3 className="font-serif text-2xl text-paper">{frame.title}</h3>
      <Layer id="picture">
        <p>{frame.picture}</p>
      </Layer>
      <Layer id="mechanism">
        <p>{frame.mechanism}</p>
      </Layer>
      <Layer id="source">
        <p className="font-mono text-sm leading-relaxed text-paper">{frame.source}</p>
      </Layer>
    </div>
  );
}
