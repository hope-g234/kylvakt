import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronDown, Gauge, MessageSquare, Snowflake, Thermometer, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Evidence } from "@/components/coldwatch/Evidence";
import { Assistant } from "@/components/coldwatch/Assistant";
import { addDays, assumptions, englishName, eur, fmtWeek, leaksByWeek, plantWeek, store, weeks, type Leak } from "@/lib/coldwatch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cold Watch — Store refrigeration triage" },
      { name: "description", content: "Ranked money leaks and failure warnings for supermarket refrigeration, with the sensor evidence behind every claim." },
      { property: "og:title", content: "Cold Watch — Store refrigeration triage" },
      { property: "og:description", content: "Top money leaks this week, what to do about each, and which units will fail next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [week, setWeek] = useState<string>(weeks[weeks.length - 5] ?? weeks[0] ?? "");
  const [chat, setChat] = useState(false);
  const leaks = leaksByWeek[week] ?? [];
  const top = leaks.slice(0, 5);
  const pw = plantWeek(week);
  const unitMonthly = top.reduce((a, l) => a + l.eurMonth, 0);
  const radar = leaks.filter((l) => l.weeksToSaturation != null || l.failureRisk >= 0.3).sort((a, b) => b.failureRisk - a.failureRisk);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Snowflake className="size-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Cold Watch</h1>
              <p className="text-xs text-muted-foreground">Store {store} · 39 refrigeration units · 451 sensors</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={week} onValueChange={setWeek}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{weeks.map((w) => <SelectItem key={w} value={w}>Week of {fmtWeek(w)}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => setChat(true)}><MessageSquare /> Ask Cold Watch</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-4">
          <Stat label="Top 5 leaks, per month" value={eur(unitMonthly)} tone="warn" />
          <Stat label="Store waste vs expected this week" value={eur(Math.max(0, pw.eur))} sub={`${Math.round(pw.kwh - pw.base)} kWh over weather-adjusted baseline`} tone={pw.eur > 0 ? "bad" : "ok"} />
          <Stat label="Refrigeration energy bill this week" value={eur(pw.cost)} sub={`${Math.round(pw.kwh).toLocaleString("en")} kWh`} />
          <Stat label="Units flagged for service" value={String(radar.length)} tone={radar.length ? "warn" : "ok"} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">Top 5 money leaks this week</h2>
          <p className="mb-4 text-sm text-muted-foreground">Each unit is compared with its own last 5 weeks. Open a card to see the sensor evidence.</p>
          <div className="space-y-3">
            {top.length === 0 && <p className="text-muted-foreground">Nothing unusual this week.</p>}
            {top.map((l, i) => <LeakCard key={l.unit} leak={l} rank={i + 1} week={week} />)}
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Gauge className="size-5 text-primary" /> Maintenance radar</h2>
          <p className="mb-4 text-sm text-muted-foreground">Units working harder every week. Compare the cost of waiting 4 weeks with a service visit now.</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground">
                <tr><th className="p-3">Unit</th><th className="p-3">Duty trend</th><th className="p-3">Full load in</th><th className="p-3">Failure risk</th><th className="p-3">Wait 4 weeks</th><th className="p-3">Service now</th><th className="p-3">Verdict</th></tr>
              </thead>
              <tbody>
                {radar.length === 0 && <tr><td colSpan={7} className="p-4 text-muted-foreground">No units trending toward failure.</td></tr>}
                {radar.map((l) => {
                  const go = l.costOfWaiting4w > l.serviceCost;
                  return (
                    <tr key={l.unit} className="border-t border-border">
                      <td className="p-3 font-medium">{englishName(l.name)}<div className="font-mono text-xs text-muted-foreground">{l.signals.duty}</div></td>
                      <td className="p-3 font-mono">{l.slopePerWeek > 0 ? "+" : ""}{l.slopePerWeek} pts/wk</td>
                      <td className="p-3 font-mono">{l.weeksToSaturation != null ? `${l.weeksToSaturation} wks` : "—"}</td>
                      <td className="p-3 font-mono">{Math.round(l.failureRisk * 100)}%</td>
                      <td className="p-3 font-mono">{eur(l.costOfWaiting4w)}</td>
                      <td className="p-3 font-mono">{eur(l.serviceCost)}</td>
                      <td className="p-3">{go ? <span className="rounded bg-destructive/20 px-2 py-0.5 text-xs text-destructive">Book service</span> : <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">Monitor</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Thermometer className="size-5 text-primary" /> Normal use vs waste</h2>
          <p className="mb-4 text-sm text-muted-foreground">Expected energy is modelled from outdoor temperature, store temperature, opening hours, holidays and time of day. The gap above it is waste.</p>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={plantWeek(addDays(week, -21)).rows.concat(plantWeek(addDays(week, -14)).rows, plantWeek(addDays(week, -7)).rows, pw.rows)}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                  <YAxis yAxisId="k" stroke="var(--muted-foreground)" fontSize={11} width={40} />
                  <YAxis yAxisId="t" orientation="right" stroke="var(--muted-foreground)" fontSize={11} width={32} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
                  <Area yAxisId="k" dataKey="kwh" name="Actual kWh/day" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.2} />
                  <Line yAxisId="k" dataKey="base" name="Expected kWh/day" stroke="var(--chart-1)" strokeDasharray="4 4" dot={false} />
                  <Line yAxisId="t" dataKey="out" name="Outdoor °C" stroke="var(--chart-5)" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">Signals S442 + S443 (cooling + freezer kW), S377 outdoor temp, S438 store temp · Price: {assumptions.tariff} · Hours: {assumptions.hours}</p>
          </div>
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          Data: Ambidex hourly refrigeration data 2015. Energy per unit is estimated by splitting the measured cooling and freezer power by each unit's share of cooling time. Electricity prices are a modelled 2015 profile, not real invoices.
        </footer>
      </main>

      <Sheet open={chat} onOpenChange={setChat}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border p-4"><SheetTitle className="flex items-center gap-2"><Snowflake className="size-4 text-primary" /> Cold Watch · week of {fmtWeek(week)}</SheetTitle></SheetHeader>
          <div className="min-h-0 flex-1"><Assistant key={week} week={week} /></div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" | "bad" | "ok" }) {
  const c = tone === "bad" ? "text-destructive" : tone === "warn" ? "text-warning" : tone === "ok" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-semibold ${c}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function LeakCard({ leak, rank, week }: { leak: Leak; rank: number; week: string }) {
  const [open, setOpen] = useState(rank === 1);
  const warm = leak.tempDev - leak.baseTempDev >= 0.8;
  return (
    <div className="rounded-lg border border-border bg-card">
      <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-4 p-4 text-left">
        <span className="font-mono text-2xl font-semibold text-muted-foreground">{rank}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{englishName(leak.name)}</span>
            {warm && <span className="flex items-center gap-1 rounded bg-destructive/20 px-2 py-0.5 text-xs text-destructive"><AlertTriangle className="size-3" /> Food safety</span>}
            {leak.weeksToSaturation != null && <span className="flex items-center gap-1 rounded bg-warning/20 px-2 py-0.5 text-xs text-warning"><Wrench className="size-3" /> Wearing out</span>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{leak.cause}</p>
          <p className="mt-2 text-sm"><span className="text-primary">Do:</span> {leak.action}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl font-semibold text-warning">~{eur(leak.eurMonth)}<span className="text-xs text-muted-foreground">/mo</span></p>
          <p className="font-mono text-xs text-muted-foreground">{leak.excessKwh} kWh extra/wk</p>
          <ChevronDown className={`ml-auto mt-2 size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-4">
          <div className="grid grid-cols-2 gap-2 font-mono text-xs md:grid-cols-4">
            <Fact k="Cooling duty" v={`${leak.duty}% (usual ${leak.baseDuty}%)`} />
            <Fact k="Deviation" v={`${leak.z}σ from own baseline`} />
            <Fact k="Alarm hours" v={`${leak.alarmHours} h`} />
            <Fact k="Defrost" v={`${leak.defrost}% (usual ${leak.baseDefrost}%)`} />
          </div>
          <Evidence leak={leak} week={week} />
        </div>
      )}
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <div className="rounded border border-border px-2 py-1.5"><p className="text-muted-foreground">{k}</p><p>{v}</p></div>;
}
