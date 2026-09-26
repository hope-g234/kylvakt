import { Info } from "lucide-react";

// Informational only. The existing "expected" baseline is temperature-only and not yet
// adjusted for day-of-week or hour-of-day, so these patterns must NOT feed anomaly
// scores, priority labels or evidence panels until that is fixed.
const insights = [
  { title: "Weekday vs. Sunday operating baseline", pattern: "Total power drops ~40% and cooling power flattens to a lower baseline on Sundays, because store-closing hours remove customer and operational heat load while refrigeration keeps running.", why: "Store managers should expect Sunday readings to look different and not treat the drop itself as a fault." },
  { title: "Weak link between cooling power and outdoor temperature", pattern: "Cooling power barely changes across the year (~14-16 kW) despite outdoor temperature swinging ~16°C, so weather is a weak predictor of refrigeration load.", why: "An unexplained cooling spike is more likely a real equipment issue than normal weather variation, which is why Kylvakt trusts these anomalies." },
  { title: "Freezer independence", pattern: "Freezer power shows almost no correlation with store activity, outdoor temperature, or total power, running as a steady, self-contained system.", why: "Freezer alerts are rarer and should be treated as more significant when they do occur." },
  { title: "Early-year data gap", pattern: "January and most of February show 71-100% missing readings before measurement began on Feb 20.", why: "A low year-long \"data coverage\" number reflects startup gaps, not an ongoing quality problem, and should be reported from Feb 20 onward." },
  { title: "Recurring, escalating equipment patterns", pattern: "Some issues (like the Oct 16 condenser anomaly) build gradually across weeks before peaking, rather than appearing as a single event.", why: "Managers should watch for a pattern of small, growing alerts on the same equipment, not just isolated spikes." },
];

const NOTE = "These patterns are shown for context. Folding them into the live anomaly score and priority ranking is a scoped next step, so today's alerts stay based on the current temperature-based model.";

export function StoreInsights({ compact = false }: { compact?: boolean }) {
  return (
    <section className="mt-8">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Context · not alerts</p>
        <h2 className="mt-1 text-xl font-semibold">Store behavior insights</h2>
      </div>
      <div className={`grid gap-3 ${compact ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}>
        {insights.map((it) => (
          <article key={it.title} className="rounded-md border border-dashed border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><Info className="size-3.5" />Pattern</div>
            <h3 className="mt-2 text-sm font-semibold">{it.title}</h3>
            {!compact && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{it.pattern}</p>}
            <p className="mt-2 text-xs leading-relaxed"><span className="font-semibold text-info">Why it matters: </span><span className="text-muted-foreground">{it.why}</span></p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs italic text-muted-foreground">{NOTE}</p>
    </section>
  );
}
