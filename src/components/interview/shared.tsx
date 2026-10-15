import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { timestamp, videoAt } from "@/lib/interview-sim";
import { cn } from "@/lib/cn";

/** A deep link into the source video, labelled with its time range. */
export function Watch({ from, to, label }: { from: number; to?: number; label?: string }) {
  return (
    <a
      href={videoAt(from)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-line px-3 font-mono text-xs text-paper hover:border-copper"
    >
      <span aria-hidden="true" className="text-copper">
        ▶
      </span>
      {label ?? "Watch"} {timestamp(from)}
      {to !== undefined ? `–${timestamp(to)}` : ""}
    </a>
  );
}

export function Quote({ at, children }: { at: number; children: ReactNode }) {
  return (
    <blockquote className="border-l-2 border-copper pl-4">
      <p className="font-serif text-lg text-paper">“{children}”</p>
      <a
        href={videoAt(at)}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block font-mono text-xs text-mist hover:text-paper"
      >
        {timestamp(at)} · auto-captions
      </a>
    </blockquote>
  );
}

export function Code({ title, children }: { title?: string; children: string }) {
  return (
    <figure className="overflow-hidden rounded-md border border-line bg-raised">
      {title ? (
        <figcaption className="border-b border-line px-4 py-2 font-mono text-xs text-mist">
          {title}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-paper sm:text-sm">
        <code>{children.trim()}</code>
      </pre>
    </figure>
  );
}

/** What the video says next to what React 19.2's source does. */
export function Correction({ said, actual }: { said: string; actual: ReactNode }) {
  return (
    <div className="grid gap-3 rounded-md border border-line p-4 sm:grid-cols-2">
      <div>
        <p className="font-mono text-xs tracking-widest text-mist uppercase">In the video</p>
        <p className="mt-1 text-sm text-paper">{said}</p>
      </div>
      <div>
        <p className="font-mono text-xs tracking-widest text-copper uppercase">React 19.2 source</p>
        <div className="mt-1 text-sm text-paper">{actual}</div>
      </div>
    </div>
  );
}

export function ModelAnswer({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-copper px-4 py-4 md:px-5">
      <p className="font-mono text-xs tracking-widest text-copper uppercase">
        Say it in the interview
      </p>
      <div className="mt-2 text-base leading-relaxed text-paper">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick checks                                                         */
/* ------------------------------------------------------------------ */

export type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  why: string;
};

const QUIZ_KEY = "begin-work-interview-quiz";

type QuizStore = {
  picks: Record<string, number>;
  pick: (id: string, choice: number) => void;
  reset: () => void;
};

const QuizContext = createContext<QuizStore>({ picks: {}, pick: () => {}, reset: () => {} });

export function QuizProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object") setPicks(parsed as Record<string, number>);
      }
    } catch {
      /* private mode or bad JSON */
    }
  }, []);

  function save(next: Record<string, number>) {
    setPicks(next);
    try {
      localStorage.setItem(QUIZ_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  return (
    <QuizContext.Provider
      value={{
        picks,
        pick: (id, choice) => save({ ...picks, [id]: choice }),
        reset: () => save({}),
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  return useContext(QuizContext);
}

export function QuickCheck({ questions }: { questions: Question[] }) {
  const { picks, pick } = useQuiz();
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-copper uppercase">Quick check</p>
      {questions.map((q) => {
        const chosen = picks[q.id];
        const answered = chosen !== undefined;
        return (
          <fieldset key={q.id} className="rounded-md border border-line px-4 py-4">
            <legend className="sr-only">{q.prompt}</legend>
            <p className="font-serif text-lg text-paper" aria-hidden="true">
              {q.prompt}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((option, index) => {
                const right = index === q.answer;
                const mine = chosen === index;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={mine}
                    onClick={() => pick(q.id, index)}
                    className={cn(
                      "min-h-11 rounded-md border px-3 py-2 text-left text-sm",
                      !answered && "border-line text-paper hover:border-mist",
                      answered && right && "border-copper bg-copper text-ink",
                      answered && mine && !right && "border-mist text-mist line-through",
                      answered && !mine && !right && "border-line text-mist",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {answered ? (
              <p className="mt-3 text-sm text-paper" aria-live="polite">
                <span className="font-mono text-xs text-copper">
                  {chosen === q.answer ? "Right. " : "Not quite. "}
                </span>
                {q.why}
              </p>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
