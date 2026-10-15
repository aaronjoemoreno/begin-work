import { createFileRoute, redirect } from "@tanstack/react-router";
import { Interview } from "@/components/interview/interview";

export const Route = createFileRoute("/interview")({
  // The notes moved to /overview. Old /interview?tab=overview links redirect there
  // (old #ov-* hash links are forwarded on the client, see interview.tsx).
  validateSearch: (search: Record<string, unknown>): { tab?: "overview" | "drill" } =>
    search.tab === "overview" || search.tab === "drill" ? { tab: search.tab } : {},
  beforeLoad: ({ search, location }) => {
    if (search.tab === "overview") {
      throw redirect({ to: "/overview", hash: location.hash || undefined, replace: true });
    }
  },
  head: () => ({
    meta: [
      { title: "Interview drill · Begin Work" },
      {
        name: "description",
        content:
          "A senior React interview drill on fiber, reconciliation, and the virtual DOM, with step-through labs and quick checks.",
      },
    ],
  }),
  component: Interview,
});
