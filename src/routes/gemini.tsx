import { createFileRoute } from "@tanstack/react-router";
import { GeminiPage } from "@/components/gemini/gemini-page";

export const Route = createFileRoute("/gemini")({
  head: () => ({
    meta: [
      { title: "Gemini · React Reconciler Deep-Dive · Begin Work" },
      {
        name: "description",
        content:
          "An interactive React reconciler simulator: Fiber double buffering, the scheduler and lanes, child diffing, and interview flashcards.",
      },
    ],
  }),
  component: GeminiPage,
});
