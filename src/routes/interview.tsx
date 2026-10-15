import { createFileRoute } from "@tanstack/react-router";
import { Interview } from "@/components/interview/interview";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Interview drill · Begin Work" },
      {
        name: "description",
        content:
          "Senior React interview questions on fiber, reconciliation, and the virtual DOM, with step-through labs, corrections against the React 19.2 source, and quick checks.",
      },
    ],
  }),
  component: Interview,
});
