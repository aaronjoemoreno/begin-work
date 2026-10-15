import { Link } from "@tanstack/react-router";
import GeminiApp from "@/components/gemini/gemini";
import { SiteNav } from "@/components/site/site-nav";

/**
 * /gemini: Aaron's single-file "React Reconciler Deep-Dive" app (gemini.tsx), kept with its own
 * full-page layout. Only the site's main nav is added above it; the bar scrolls away so the
 * app's own sticky header stays on top.
 */
export function GeminiPage() {
  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="border-b border-line bg-ink">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3 sm:px-6">
          <Link to="/" className="font-mono text-sm tracking-widest text-paper uppercase">
            Begin Work
          </Link>
          <SiteNav />
        </div>
      </div>
      <GeminiApp />
    </div>
  );
}
