import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";
import { hourly, monthly, openingHours, plantWeek } from "@/lib/coldwatch";

const tip = { background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 };
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;
const monthName = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

export function OpeningHours({ week }: { week: string }) {
  const rows = hourly[week] ?? [];
  const pw = plantWeek(week);
  const anomOpen = pw.rows.reduce((a, r) => a + (r.anomOpen ?? 0), 0);
  const anomClosed = pw.rows.reduce((a, r) => a + (r.anomClosed ?? 0), 0);
  const closedKwh = pw.rows.reduce((a, r) => a + (r.kwhClosed ?? 0), 0);
  const closedBase = pw.rows.reduce((a, r) => a + (r.baseClosed ?? 0), 0);
  const { open, close } = openingHours;

  return (
    <section className="mt-6 space-y-6">
      <div className="panel p-5">
        <p className="label">Opening-hours aware baseline</p>
        <h2 className="mt-1 text-lg font-semibold">When is cooling load normal?</h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Every hour is tagged with <span className="font-mono text-foreground">is_open</span>, <span className="font-mono text-foreground">opening_hour</span> ({hh(open)}), <span className="font-mono text-foreground">closing_hour</span> ({hh(close)}), <span className="font-mono text-foreground">hours_since_opening</span> and <span className="font-mono text-foreground">hours_until_closing</span>. High cooling at 14:00 with a busy store can be normal; the same load at 03:00 is not. Each calendar month gets its own expected profile, because load differs month to month.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Fact label="Anomalous hours · store closed" value={String(anomClosed)} tone={anomClosed > anomOpen ? "text-destructive" : "text-foreground"} />
          <Fact label="Anomalous hours · store open" value={String(anomOpen)} />
          <Fact label="Closed-hours cooling vs expected" value={`${Math.round(closedKwh).toLocaleString()} / ${Math.round(closedBase).toLocaleString()} kWh`} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Anomalous hour = measured cooling more than 2 standard deviations above that month's expected value for the same open/closed state.</p>
        <div className="mt-5 h-72">
          <ResponsiveContainer>
            <ComposedChart data={rows}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="h" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={hh} interval={2} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} width={36} />
              <Tooltip contentStyle={tip} labelFormatter={(h) => `${hh(Number(h))} · ${rows.find((r) => r.h === h)?.open ? "OPEN" : "closed"}`} />
              <ReferenceArea x1={0} x2={open - 1} fill="var(--muted-foreground)" fillOpacity={0.08} />
              <ReferenceArea x1={close} x2={23} fill="var(--muted-foreground)" fillOpacity={0.08} />
              <Area dataKey="kwh" name="Actual kWh/h" stroke="var(--info)" fill="var(--info)" fillOpacity={0.12} />
              <Line dataKey="base" name="Expected kWh/h" stroke="var(--success)" strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Average Mon–Sat hour this week. Shaded = store closed (before {hh(open)}, from {hh(close)}). Sundays and public holidays count as closed all day.</p>
      </div>

      <div className="panel p-5">
        <p className="label">Month-to-month</p>
        <h2 className="mt-1 text-lg font-semibold">Cooling load and anomalies by month</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer>
            <BarChart data={monthly.map((m) => ({ ...m, name: monthName(m.m) }))}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} width={30} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="anomOpen" name="Anomalous hours · open" stackId="a" fill="var(--info)" />
              <Bar dataKey="anomClosed" name="Anomalous hours · closed" stackId="a" fill="var(--warning)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground"><tr className="border-b border-border"><th className="py-2 pr-3 font-medium">Month</th><th className="pr-3 font-medium">Cooling kWh</th><th className="pr-3 font-medium">Avg kWh/h open</th><th className="pr-3 font-medium">Avg kWh/h closed</th><th className="font-medium">Anomalous h (open / closed)</th></tr></thead>
            <tbody className="font-mono">
              {monthly.map((m) => (
                <tr key={m.m} className="border-b border-border/60"><td className="py-1.5 pr-3">{monthName(m.m)}</td><td className="pr-3">{m.kwh.toLocaleString()}</td><td className="pr-3">{m.openAvg}</td><td className="pr-3">{m.closedAvg}</td><td>{m.anomOpen} / {m.anomClosed}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">February starts on the 20th, when measurement began.</p>
      </div>
    </section>
  );
}

function Fact({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-md border border-border bg-secondary/40 p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className={`mt-1 font-mono text-lg font-semibold ${tone}`}>{value}</p></div>;
}
