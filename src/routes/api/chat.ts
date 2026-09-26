import { createFileRoute } from "@tanstack/react-router";
import { handleColdWatchChat } from "@/lib/coldwatch-chat.server";

export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: ({ request }) => handleColdWatchChat(request) } },
});
