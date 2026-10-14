import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Depth = "all" | "picture" | "mechanism" | "source";

const KEY = "begin-work-depth";

const DepthContext = createContext<{
  depth: Depth;
  setDepth: (depth: Depth) => void;
}>({ depth: "all", setDepth: () => {} });

export function DepthProvider({ children }: { children: ReactNode }) {
  const [depth, setDepth] = useState<Depth>("all");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored === "all" || stored === "picture" || stored === "mechanism" || stored === "source") {
        setDepth(stored);
      }
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, depth);
    } catch {
      /* ignore */
    }
  }, [depth]);

  return <DepthContext.Provider value={{ depth, setDepth }}>{children}</DepthContext.Provider>;
}

export function useDepth() {
  return useContext(DepthContext);
}

const LABEL: Record<Exclude<Depth, "all">, string> = {
  picture: "Picture",
  mechanism: "Mechanism",
  source: "Source",
};

export function Layer({
  id,
  children,
}: {
  id: "picture" | "mechanism" | "source";
  children: ReactNode;
}) {
  const { depth } = useDepth();
  if (depth !== "all" && depth !== id) return null;

  const tone =
    id === "picture"
      ? "border-line"
      : id === "mechanism"
        ? "border-copper"
        : "border-line bg-raised";

  return (
    <div className={`rounded-md border ${tone} px-4 py-4 md:px-5`}>
      <p className="font-mono text-xs tracking-widest text-copper uppercase">{LABEL[id]}</p>
      <div className="mt-2 text-base leading-relaxed text-paper">{children}</div>
    </div>
  );
}
