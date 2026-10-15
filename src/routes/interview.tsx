import { createFileRoute } from "@tanstack/react-router";
import { Interview } from "@/components/interview/interview";

export type InterviewTab = "overview" | "drill";

export const Route = createFileRoute("/interview")({
  validateSearch: (search: Record<string, unknown>): { tab?: InterviewTab } =>
    search.tab === "overview" || search.tab === "drill" ? { tab: search.tab } : {},
  head: () => ({
    meta: [
      { title: "Interview drill · Begin Work" },
      {
        name: "description",
        content:
          "React reconciliation and Fiber notes, plus a senior React interview drill on fiber, reconciliation, and the virtual DOM with step-through labs and quick checks.",
      },
    ],
  }),
  component: Interview,
});
