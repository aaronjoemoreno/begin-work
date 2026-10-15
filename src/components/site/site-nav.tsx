import { Link } from "@tanstack/react-router";

/** The app's three top-level pages, shared by every page header. */
export const SITE_PAGES = [
  { to: "/", label: "Field guide" },
  { to: "/overview", label: "Overview" },
  { to: "/interview", label: "Interview drill" },
  { to: "/gemini", label: "Gemini" },
] as const;

export function SiteNav({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {SITE_PAGES.map((page) => (
          <li key={page.to}>
            <Link
              to={page.to}
              activeOptions={{ exact: true, includeSearch: false, includeHash: false }}
              activeProps={{ className: "text-copper" }}
              inactiveProps={{ className: "text-mist hover:text-paper" }}
              className="inline-flex min-h-9 items-center font-mono text-xs"
            >
              {page.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
