import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/components/interview/overview-page";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Reconciliation & Fiber overview · Begin Work" },
      {
        name: "description",
        content:
          "Fact-checked notes on React reconciliation and Fiber: the work loop, beginWork, completeWork, commit, the diff heuristics, and how Netflix's React-Gibbon fits in, with sources.",
      },
    ],
  }),
  component: OverviewPage,
});
