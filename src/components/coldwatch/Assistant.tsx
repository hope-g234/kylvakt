import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { Snowflake, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGEST = ["What should I fix first this week and why?", "Is the energy spike this week weather or waste?", "Which unit is closest to failing?"];

export function Assistant({ week }: { week: string }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: () => ({ week }) }), [week]);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";
  const send = (t: string) => { if (!t.trim() || busy) return; sendMessage({ text: t }); setInput(""); };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Ask about this week's issues. Every answer cites the sensor signals behind it.</p>
            {SUGGEST.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent">{s}</button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" : "flex gap-2 text-sm"}>
            {m.role === "assistant" && <Snowflake className="mt-0.5 size-4 shrink-0 text-primary" />}
            <div className="whitespace-pre-wrap leading-relaxed">
              {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
            </div>
          </div>
        ))}
        {status === "submitted" && <p className="text-xs text-muted-foreground">Reading the sensors…</p>}
        {error && <p className="text-sm text-destructive">{error.message || "Something went wrong."}</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-border p-3">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Kylvakt…" rows={2} className="resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}
