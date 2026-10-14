import { createFileRoute } from "@tanstack/react-router";
import { Guide } from "@/components/guide/guide";

export const Route = createFileRoute("/")({ component: Guide });
