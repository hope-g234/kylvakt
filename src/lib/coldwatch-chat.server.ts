import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import data from "@/data/coldwatch.json";

const RUN = "X-Lovable-AIG-Run-ID";

export async function handleColdWatchChat(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("AI is not configured", { status: 500 });
  const body = (await request.json()) as { messages: UIMessage[]; week?: string };
  const week = body.week && (data.leaks as Record<string, unknown>)[body.week] ? body.week : (data.weeks[data.weeks.length - 1] ?? "");
  const leaks = (data.leaks as Record<string, unknown[]>)[week];
  const plantWeek = data.plant.filter((d) => d.d >= week && d.d < addDays(week, 7));

  let runId = request.headers.get(RUN)?.trim() || undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const h = new Headers(init?.headers);
      if (runId && !h.has(RUN)) h.set(RUN, runId);
      const res = await fetch(input, { ...init, headers: h });
      runId ??= res.headers.get(RUN)?.trim() || undefined;
      return res;
    },
  });

  const system = `You are Kylvakt, a refrigeration triage assistant for a grocery store manager at store ${data.store}.
Speak plainly, short answers, no jargon. Plain text only: no markdown, no asterisks; use simple "- " bullets. Refer to units by English name (e.g. Mejerikyl = Dairy fridge, Frysö = Freezer island, Frysskåp = Freezer cabinet). Always cite evidence: signal IDs (e.g. S003), numbers, and the baseline you compare against.
Money is in EUR. Assumptions: ${JSON.stringify(data.assumptions)}.
Baselines are each unit's own trailing 5-week median; plant baseline is a regression on outdoor temperature, store temperature, opening hours and time of day (weather- and hours-adjusted).
If data doesn't support an answer, say so. Never invent signals.
Selected week starting ${week}.
Ranked issues this week (JSON): ${JSON.stringify(leaks)}
Plant daily energy (kWh actual vs baseline, outdoor °C, €/kWh): ${JSON.stringify(plantWeek)}`;

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system,
    messages: await convertToModelMessages(body.messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return result.toUIMessageStreamResponse({
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429")) return "Too many requests right now — try again in a moment.";
      if (msg.includes("402")) return "AI credits are used up for this workspace.";
      return "The assistant couldn't answer. Please try again.";
    },
  });
}

function addDays(d: string, n: number) {
  const x = new Date(d + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}
