import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Button({
  variant = "ghost",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "quiet" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 font-mono text-sm disabled:cursor-not-allowed disabled:opacity-40",
        variant === "solid" && "bg-copper text-ink",
        variant === "ghost" && "border border-line bg-raised text-paper",
        variant === "quiet" && "text-mist",
        className,
      )}
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "min-h-11 w-full rounded-md border border-line bg-raised px-3 font-mono text-sm text-paper",
        props.className,
      )}
    />
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-md border border-line bg-raised p-4", className)}>{children}</div>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs tracking-widest text-copper uppercase">{children}</p>;
}

export function Chapter({
  id,
  index,
  title,
  lede,
  children,
}: {
  id: string;
  index: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-64 border-t border-line py-12 md:py-16 xl:scroll-mt-32">
      <p className="font-mono text-xs tracking-widest text-copper uppercase">{index}</p>
      <h2 className="mt-2 font-serif text-3xl text-paper md:text-4xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-lg text-mist">{lede}</p>
      <div className="mt-8 flex max-w-5xl flex-col gap-4">{children}</div>
    </section>
  );
}

export const CHAPTERS = [
  ["orientation", "01  Orientation"],
  ["objects", "02  Three objects"],
  ["fiber", "03  The fiber"],
  ["loop", "04  The work loop"],
  ["children", "05  Children and keys"],
  ["buffer", "06  Double buffering"],
  ["hooks", "07  Hooks"],
  ["lanes", "08  Lanes"],
  ["commit", "09  Commit"],
  ["suspense", "10  Suspense"],
  ["host", "11  The host config"],
  ["trace", "12  One click"],
  ["myths", "13  Models that lie"],
  ["map", "14  How to read the source"],
] as const;
