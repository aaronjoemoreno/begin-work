import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Select } from "@/components/guide/ui";
import { OVERVIEW_TOC, Overview } from "@/components/interview/overview";
import { SiteNav } from "@/components/site/site-nav";

/** /overview: the fact-checked reconciliation & Fiber notes on their own, with no drill content. */
export function OverviewPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max <= 0 ? 0 : root.scrollTop / max);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="fixed inset-x-0 top-0 z-30 h-1 bg-line" aria-hidden="true">
        <div
          className="h-full origin-left bg-copper"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <header className="sticky top-0 z-20 border-b border-line bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <Link to="/" className="font-mono text-sm tracking-widest text-paper uppercase">
              Begin Work
            </Link>
            <SiteNav />
          </div>
          <label className="flex flex-col gap-2 font-mono text-xs tracking-widest text-mist uppercase xl:hidden">
            On this page
            <Select
              aria-label="Jump to a section"
              defaultValue=""
              onChange={(event) => jumpTo(event.target.value)}
            >
              <option value="" disabled>
                Section
              </option>
              {OVERVIEW_TOC.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.level === 3 ? "\u00a0\u00a0· " : ""}
                  {item.label}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 xl:grid-cols-[14rem_minmax(0,1fr)]">
        <nav className="sticky top-20 hidden h-fit pt-12 xl:block" aria-label="On this page">
          <p className="font-mono text-xs tracking-widest text-copper uppercase">On this page</p>
          <ol className="mt-2 flex flex-col border-l border-line">
            {OVERVIEW_TOC.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`flex min-h-9 items-center font-mono text-xs hover:text-paper ${
                    item.level === 3 ? "pl-6 text-mist/80" : "pl-3 text-mist"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-col border-t border-line pt-3">
            <Link
              to="/"
              className="flex min-h-11 items-center font-mono text-xs text-mist hover:text-paper"
            >
              ← Field guide
            </Link>
            <Link
              to="/interview"
              className="flex min-h-11 items-center font-mono text-xs text-copper hover:text-paper"
            >
              Interview drill →
            </Link>
            <Link
              to="/gemini"
              className="flex min-h-11 items-center font-mono text-xs text-copper hover:text-paper"
            >
              Gemini simulator →
            </Link>
          </div>
        </nav>

        <main className="min-w-0 pb-24">
          <Overview />
        </main>
      </div>
    </div>
  );
}

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}
