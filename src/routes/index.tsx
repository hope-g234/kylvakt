import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line,
  Pie, PieChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Bell, Bot,
  Check, CheckCircle2, ChevronRight, ClipboardCheck, Database, FileText,
  Gauge, HelpCircle, LayoutDashboard, Lightbulb, Menu, MessageSquare, PackageCheck,
  PanelLeftClose, Search, Settings, Snowflake, Thermometer, Wrench, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Assistant } from "@/components/coldwatch/Assistant";
import { Evidence } from "@/components/coldwatch/Evidence";
import { addDays, assumptions, englishName, eur, fmtWeek, leaksByWeek, plantWeek, store, weeks, type Leak } from "@/lib/coldwatch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kylvakt — Wettbergen operations command center" },
      { name: "description", content: "Prioritized refrigeration and energy decisions for Wettbergen Store, backed by measured evidence." },
      { property: "og:title", content: "Kylvakt — Wettbergen operations command center" },
      { property: "og:description", content: "From 451 store signals to the few energy and refrigeration decisions that matter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type View = "overview" | "energy" | "refrigeration" | "issues" | "actions" | "reports" | "settings" | "quality";

const defaultWeek = [...weeks].sort((a, b) => weekScore(b) - weekScore(a))[0] ?? "";
function weekScore(w: string) { return (leaksByWeek[w] ?? []).slice(0, 5).reduce((sum, leak) => sum + leak.eurMonth, 0); }

const nav = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "energy" as const, label: "Energy", icon: Zap },
  { id: "refrigeration" as const, label: "Refrigeration", icon: Snowflake },
  { id: "issues" as const, label: "Issues", icon: AlertTriangle },
  { id: "actions" as const, label: "Actions", icon: ClipboardCheck },
  { id: "reports" as const, label: "Reports", icon: FileText },
];

function Index() {
  const [week, setWeek] = useState(defaultWeek);
  const [view, setView] = useState<View>("overview");
  const [selected, setSelected] = useState<Leak | null>(null);
  const [chat, setChat] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [darkTheme, setDarkTheme] = useState(true);
  const leaks = leaksByWeek[week] ?? [];
  const pw = plantWeek(week);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("kylvakt-theme") ?? window.localStorage.getItem("coldwatch-theme");
    const shouldUseDark = savedTheme !== "light";
    setDarkTheme(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
    document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    const nextDarkTheme = !darkTheme;
    setDarkTheme(nextDarkTheme);
    document.documentElement.classList.toggle("dark", nextDarkTheme);
    document.documentElement.style.colorScheme = nextDarkTheme ? "dark" : "light";
    window.localStorage.setItem("kylvakt-theme", nextDarkTheme ? "dark" : "light");
  };

  const changeView = (next: View) => { setSelected(null); setView(next); setMobileNav(false); };
  const title = selected ? "Issue investigation" : nav.find((item) => item.id === view)?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-sidebar lg:flex lg:flex-col">
        <Brand />
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Primary navigation">
          {nav.map((item) => <NavItem key={item.id} item={item} active={!selected && view === item.id} onClick={() => changeView(item.id)} />)}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <NavItem item={{ id: "settings", label: "Settings", icon: Settings }} active={view === "settings"} onClick={() => changeView("settings")} />
          <NavItem item={{ id: "quality", label: "Data quality", icon: Database }} active={view === "quality"} onClick={() => changeView("quality")} />
          <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-secondary/60 p-3">
            <div className="relative grid size-8 place-items-center rounded-md bg-panel text-info"><Database className="size-4" /><span className="absolute -right-1 -top-1 size-2 rounded-full bg-success" /></div>
            <div><p className="text-xs font-semibold">451 signals online</p><p className="text-[10px] text-muted-foreground">Hourly coverage · 84%</p></div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></Button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-info">Wettbergen store</p>
              <p className="truncate text-sm font-semibold">{title}</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Select value={week} onValueChange={setWeek}>
                <SelectTrigger className="h-9 w-48 bg-secondary/70"><SelectValue /></SelectTrigger>
                <SelectContent>{weeks.map((w) => <SelectItem key={w} value={w}>Week of {fmtWeek(w)}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" size="icon" aria-label="Notifications"><Bell /></Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label={darkTheme ? "Switch to light theme" : "Switch to dark theme"}
              aria-pressed={!darkTheme}
              title={darkTheme ? "Switch to light theme" : "Switch to dark theme"}
            >
              <Lightbulb className={darkTheme ? "text-muted-foreground" : "fill-warning/25 text-warning"} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setChat(true)}><MessageSquare /> <span className="hidden sm:inline">Ask Kylvakt</span></Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
          {selected ? <Investigation leak={selected} week={week} onBack={() => setSelected(null)} /> : null}
          {!selected && view === "overview" ? <Overview week={week} leaks={leaks} onInvestigate={setSelected} onView={changeView} /> : null}
          {!selected && view === "energy" ? <Energy week={week} /> : null}
          {!selected && view === "refrigeration" ? <Refrigeration leaks={leaks} onInvestigate={setSelected} /> : null}
          {!selected && view === "issues" ? <Issues leaks={leaks} onInvestigate={setSelected} /> : null}
          {!selected && view === "actions" ? <Actions leaks={leaks} onInvestigate={setSelected} /> : null}
          {!selected && view === "reports" ? <Reports week={week} leaks={leaks} /> : null}
          {!selected && view === "settings" ? <SettingsView /> : null}
          {!selected && view === "quality" ? <DataQuality /> : null}
        </main>
      </div>

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-72 p-0"><Brand /><nav className="space-y-1 p-3">{nav.map((item) => <NavItem key={item.id} item={item} active={view === item.id} onClick={() => changeView(item.id)} />)}</nav><div className="border-t border-border p-3"><NavItem item={{ id: "quality", label: "Data quality", icon: Database }} active={view === "quality"} onClick={() => changeView("quality")} /></div></SheetContent>
      </Sheet>
      <Sheet open={chat} onOpenChange={setChat}>
        <SheetContent className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border p-4"><SheetTitle className="flex items-center gap-2"><Bot className="size-4 text-info" /> Ask Kylvakt</SheetTitle></SheetHeader>
          <div className="min-h-0 flex-1"><Assistant key={week} week={week} /></div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Brand() {
  return <div className="flex h-16 items-center gap-3 border-b border-border px-5"><div className="grid size-9 place-items-center rounded-md border border-info/25 bg-info/10 text-info"><Snowflake className="size-5" /></div><div><p className="text-base font-bold">Kylvakt<span className="text-info">.</span></p><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Operations intelligence</p></div></div>;
}

function NavItem({ item, active, onClick }: { item: { id: View; label: string; icon: typeof Activity }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <Button variant="ghost" className={`h-10 w-full justify-start px-3 ${active ? "bg-accent text-foreground" : "text-muted-foreground"}`} onClick={onClick}><Icon className={active ? "text-info" : ""} />{item.label}{active ? <span className="ml-auto h-4 w-0.5 rounded-full bg-info" /> : null}</Button>;
}

function PageHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <div className="mb-6"><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-info">{eyebrow}</p><h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{body}</p></div>;
}

function Overview({ week, leaks, onInvestigate, onView }: { week: string; leaks: Leak[]; onInvestigate: (l: Leak) => void; onView: (v: View) => void }) {
  const pw = plantWeek(week);
  const urgent = leaks.filter((l) => l.failureRisk >= 0.3).length;
  const top = leaks.slice(0, 2);
  const waste = Math.max(0, pw.kwh - pw.base);
  return <>
    <PageHeading eyebrow={`Status · ${fmtWeek(week)}`} title="Good morning, Wettbergen" body="The store is stable, but three decisions deserve attention. Start with the highest avoidable impact." />
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-5" aria-label="Store health summary">
      <Metric label="Energy health" value={waste > pw.base * .08 ? "Attention" : "Stable"} tone={waste > pw.base * .08 ? "warning" : "success"} sub="vs own baseline" />
      <Metric label="Electricity" value={`${Math.round(pw.kwh / 7)} kWh`} sub="daily average" />
      <Metric label="Cooling" value={`${Math.round(pw.kwh * .61 / 7)} kWh`} sub="daily average" tone="info" />
      <Metric label="Freezing" value={`${Math.round(pw.kwh * .27 / 7)} kWh`} sub="daily average" />
      <Metric label="Active issues" value={String(urgent)} sub={`${leaks.length} under review`} tone="critical" className="col-span-2 xl:col-span-1" />
    </section>

    <section className="mt-8 grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
      <div>
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prioritized by impact, duration and confidence</p><h2 className="mt-1 text-xl font-semibold">What needs attention?</h2></div><Button variant="ghost" size="sm" onClick={() => onView("issues")}>All issues <ArrowRight /></Button></div>
        <div className="space-y-3">
          {top.map((leak, i) => <PriorityCard key={leak.unit} leak={leak} rank={i + 1} onClick={() => onInvestigate(leak)} />)}
          <NormalCard />
        </div>
      </div>
      <aside className="space-y-4">
        <DecisionPanel leaks={leaks} onInvestigate={onInvestigate} />
        <div className="panel p-5"><div className="flex items-start justify-between"><div><p className="label">Data confidence</p><p className="mt-2 text-2xl font-semibold">84%</p></div><Database className="size-5 text-info" /></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[84%] bg-info" /></div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">451 hourly signals reviewed. Missing readings are excluded from comparisons.</p><Button variant="ghost" size="sm" className="mt-3 px-0 text-info" onClick={() => onView("quality")}>Review data quality <ChevronRight /></Button></div>
      </aside>
    </section>
  </>;
}

function Metric({ label, value, sub, tone, className = "" }: { label: string; value: string; sub: string; tone?: "success" | "warning" | "critical" | "info"; className?: string }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "critical" ? "text-destructive" : tone === "info" ? "text-info" : "text-foreground";
  return <div className={`panel min-h-28 p-4 ${className}`}><p className="label">{label}</p><p className={`mt-3 font-mono text-xl font-semibold sm:text-2xl ${toneClass}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{sub}</p></div>;
}

function PriorityCard({ leak, rank, onClick }: { leak: Leak; rank: number; onClick: () => void }) {
  const critical = leak.failureRisk >= .33;
  return <article className="group panel overflow-hidden transition-colors hover:border-info/40">
    <div className={`h-0.5 w-full ${critical ? "bg-destructive" : "bg-warning"}`} />
    <div className="p-4 sm:p-5"><div className="flex gap-3"><div className={`grid size-9 shrink-0 place-items-center rounded-md border font-mono text-xs font-bold ${critical ? "border-destructive/25 bg-destructive/10 text-destructive" : "border-warning/25 bg-warning/10 text-warning"}`}>{String(rank).padStart(2, "0")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`status ${critical ? "text-destructive" : "text-warning"}`}>{critical ? "High priority" : "Monitor"}</span><span className="text-xs text-muted-foreground">{leak.area}</span></div><h3 className="mt-2 text-base font-semibold">{englishName(leak.name)}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Cooling demand rose without a matching temperature gain.</p><div className="mt-4 grid grid-cols-3 gap-2"><MiniFact label="Cooling duty" value={`${leak.duty}%`} /><MiniFact label="Own baseline" value={`${leak.baseDuty}%`} /><MiniFact label="Estimate" value={`${eur(leak.eurMonth)}/mo`} /></div></div></div><div className="mt-4 flex items-center justify-between border-t border-border pt-4"><p className="text-xs text-muted-foreground"><span className="text-foreground">Measured:</span> {leak.z}σ from its own recent behavior</p><Button variant="ghost" size="sm" className="text-info" onClick={onClick}>Investigate <ArrowRight /></Button></div></div>
  </article>;
}

function NormalCard() { return <article className="panel flex items-center gap-4 p-4 sm:p-5"><div className="grid size-9 shrink-0 place-items-center rounded-md border border-success/25 bg-success/10 text-success"><Check className="size-4" /></div><div className="flex-1"><div className="status text-success">Normal</div><h3 className="mt-1 text-sm font-semibold">Store temperature remains within its operating range</h3><p className="mt-1 text-xs text-muted-foreground">No sustained store-level temperature anomaly in this review window.</p></div></article>; }
function MiniFact({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-secondary/70 p-2"><p className="text-[9px] uppercase text-muted-foreground">{label}</p><p className="mt-1 font-mono text-xs font-semibold">{value}</p></div>; }

function DecisionPanel({ leaks, onInvestigate }: { leaks: Leak[]; onInvestigate: (l: Leak) => void }) {
  const first = leaks[0]; if (!first) return null;
  return <div className="panel-strong overflow-hidden"><div className="border-b border-border p-5"><div className="flex items-center justify-between"><p className="label text-info">Next decision</p><Gauge className="size-5 text-info" /></div><p className="mt-3 text-lg font-semibold">Inspect {englishName(first.name).toLowerCase()}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Waiting four weeks is estimated to cost {eur(first.costOfWaiting4w)}, compared with a {eur(first.serviceCost)} service visit.</p></div><div className="p-5"><div className="mb-4 flex items-center gap-2 text-xs"><span className="size-2 rounded-full bg-success" />Evidence sufficient for inspection</div><Button className="w-full" onClick={() => onInvestigate(first)}>Open work brief <ArrowRight /></Button></div></div>;
}

function Investigation({ leak, week, onBack }: { leak: Leak; week: string; onBack: () => void }) {
  const excessPct = Math.max(0, Math.round(((leak.duty - leak.baseDuty) / Math.max(leak.baseDuty, 1)) * 100));
  return <>
    <Button variant="ghost" size="sm" className="mb-5 px-0" onClick={onBack}><ArrowLeft /> Back to overview</Button>
    <PageHeading eyebrow="High priority · Investigation" title={englishName(leak.name)} body={`Cooling behavior anomaly · Week of ${fmtWeek(week)}. Measured evidence is separated from possible explanations.`} />
    <section className="grid gap-3 md:grid-cols-4"><Metric label="Actual cooling duty" value={`${leak.duty}%`} sub={`Signal ${leak.signals["duty"]}`} tone="critical" /><Metric label="Expected duty" value={`${leak.baseDuty}%`} sub="own 5-week baseline" /><Metric label="Deviation" value={`+${(leak.duty - leak.baseDuty).toFixed(1)} pts`} sub={`${excessPct}% above expected`} tone="warning" /><Metric label="Potential impact" value={`~${eur(leak.eurMonth)}/mo`} sub="estimate, not guaranteed" tone="info" /></section>
    <section className="mt-6 panel p-4 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="label">Timeline · 7-week context</p><h2 className="mt-1 text-xl font-semibold">Something changed here</h2></div><div className="flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-info" />Measured</span><span className="flex items-center gap-2"><i className="h-px w-4 border-t border-dashed border-muted-foreground" />Expected</span></div></div><Evidence leak={leak} week={week} /></section>
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
      <div className="panel p-5 sm:p-6"><p className="label">Why are we showing this?</p><h2 className="mt-2 text-xl font-semibold">Evidence chain</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><EvidenceItem icon={Activity} tag="Observed" title="Energy behavior" body={`Cooling duty measured ${leak.duty}%, compared with a ${leak.baseDuty}% recent baseline.`} tone="info" /><EvidenceItem icon={Thermometer} tag="Observed" title="Temperature response" body={`Average deviation was ${leak.tempDev}°C versus a ${leak.baseTempDev}°C baseline.`} tone="info" /><EvidenceItem icon={AlertTriangle} tag="Supporting signal" title="Alarm activity" body={`${leak.alarmHours} alarm hours were recorded. No missing value is treated as an alarm.`} tone="warning" /><EvidenceItem icon={HelpCircle} tag="Possible explanation" title="What could cause it" body={leak.cause} tone="warning" /></div></div>
      <div className="panel-strong p-5 sm:p-6"><p className="label text-success">Recommended next step</p><h2 className="mt-3 text-xl font-semibold">{leak.action}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The evidence supports an inspection, not a confirmed component diagnosis.</p><div className="mt-5 space-y-2 text-sm"><CheckRow text="Check door seals and night covers" /><CheckRow text="Inspect evaporator and condenser condition" /><CheckRow text="Review maintenance activity in this period" /></div><Button className="mt-6 w-full"><Wrench /> Create inspection task</Button></div>
    </section>
    <section className="mt-6 panel p-5 sm:p-6"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><div><p className="label">Close the loop</p><h2 className="mt-2 text-xl font-semibold">Verify the intervention</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">After service, compare the same signals against this baseline. A lower duty cycle without warmer product temperatures confirms improvement.</p></div><div className="grid grid-cols-4 gap-2">{["Detect", "Inspect", "Fix", "Verify"].map((step, i) => <div key={step} className={`relative rounded-md border p-3 text-center ${i === 0 ? "border-success/30 bg-success/10" : "border-border bg-secondary/60"}`}><div className={`mx-auto mb-2 grid size-6 place-items-center rounded-full text-[10px] font-bold ${i === 0 ? "bg-success text-primary-foreground" : "bg-panel text-muted-foreground"}`}>{i === 0 ? <Check className="size-3" /> : i + 1}</div><p className="text-xs font-semibold">{step}</p>{i < 3 ? <ChevronRight className="absolute -right-3 top-6 z-10 size-4 text-muted-foreground" /> : null}</div>)}</div></div></section>
  </>;
}

function EvidenceItem({ icon: Icon, tag, title, body, tone }: { icon: typeof Activity; tag: string; title: string; body: string; tone: "info" | "warning" }) { return <div className="rounded-md border border-border bg-secondary/45 p-4"><div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${tone === "info" ? "text-info" : "text-warning"}`}><Icon className="size-3.5" />{tag}</div><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p></div>; }
function CheckRow({ text }: { text: string }) { return <div className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /><span>{text}</span></div>; }

function Energy({ week }: { week: string }) {
  const rows = useMemo(() => plantWeek(addDays(week, -21)).rows.concat(plantWeek(addDays(week, -14)).rows, plantWeek(addDays(week, -7)).rows, plantWeek(week).rows), [week]);
  const pw = plantWeek(week);
  return <><PageHeading eyebrow="Actual vs expected" title="Store energy" body="Measured electricity is compared with the store's weather- and schedule-adjusted baseline." /><section className="grid gap-3 md:grid-cols-3"><Metric label="Four-week electricity" value={`${Math.round(rows.reduce((a, r) => a + r.kwh, 0)).toLocaleString()} kWh`} sub="measured" /><Metric label="This week's expected" value={`${Math.round(pw.base).toLocaleString()} kWh`} sub="model baseline" tone="info" /><Metric label="Potential waste" value={eur(Math.max(0, pw.eur))} sub="estimated this week" tone="warning" /></section><section className="mt-6 panel p-5"><h2 className="text-lg font-semibold">Daily load profile</h2><p className="mt-1 text-xs text-muted-foreground">Actual electricity, expected baseline and outdoor temperature.</p><div className="mt-5 h-80"><ResponsiveContainer><ComposedChart data={rows}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(d) => d.slice(5)} /><YAxis yAxisId="k" stroke="var(--muted-foreground)" fontSize={10} /><YAxis yAxisId="t" orientation="right" stroke="var(--muted-foreground)" fontSize={10} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} /><Area yAxisId="k" dataKey="kwh" name="Actual kWh" stroke="var(--info)" fill="var(--info)" fillOpacity={.12} /><Line yAxisId="k" dataKey="base" name="Expected kWh" stroke="var(--success)" strokeDasharray="5 5" dot={false} /><Line yAxisId="t" dataKey="out" name="Outdoor °C" stroke="var(--warning)" dot={false} /></ComposedChart></ResponsiveContainer></div></section><p className="mt-4 text-xs text-muted-foreground">Model inputs: outdoor temperature, store temperature, opening hours and holidays. {assumptions.tariff}.</p></>;
}

function Refrigeration({ leaks, onInvestigate }: { leaks: Leak[]; onInvestigate: (l: Leak) => void }) { return <><PageHeading eyebrow="39 monitored units" title="Refrigeration systems" body="Compare current state, cooling effort, temperature behavior, alarms and anomaly status without opening raw sensor feeds." /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{leaks.slice(0, 12).map((leak) => <article key={leak.unit} className="panel p-4"><div className="flex items-start justify-between"><div className="grid size-9 place-items-center rounded-md bg-info/10 text-info"><Snowflake className="size-4" /></div><span className={`size-2 rounded-full ${leak.failureRisk >= .3 ? "bg-warning" : "bg-success"}`} /></div><h2 className="mt-4 text-sm font-semibold">{englishName(leak.name)}</h2><p className="text-xs text-muted-foreground">{leak.area}</p><div className="mt-4 grid grid-cols-2 gap-2"><MiniFact label="Cooling duty" value={`${leak.duty}%`} /><MiniFact label="Temperature dev." value={`${leak.tempDev}°C`} /><MiniFact label="Alarm" value={`${leak.alarmHours} h`} /><MiniFact label="Anomaly" value={`${leak.z}σ`} /></div><Button variant="ghost" size="sm" className="mt-3 w-full text-info" onClick={() => onInvestigate(leak)}>View evidence <ArrowRight /></Button></article>)}</div></>; }
function Issues({ leaks, onInvestigate }: { leaks: Leak[]; onInvestigate: (l: Leak) => void }) { return <><PageHeading eyebrow={`${leaks.length} findings`} title="Prioritized issues" body="Only sustained, actionable deviations are shown. Every issue is ranked against the unit's own recent behavior." /><div className="space-y-3">{leaks.map((leak, i) => <PriorityCard key={leak.unit} leak={leak} rank={i + 1} onClick={() => onInvestigate(leak)} />)}</div></>; }
function Actions({ leaks, onInvestigate }: { leaks: Leak[]; onInvestigate: (l: Leak) => void }) { return <><PageHeading eyebrow="Maintenance queue" title="Actions" body="Inspection work is ordered by the estimated cost of waiting versus a service visit." /><div className="panel overflow-hidden"><div className="divide-y divide-border">{leaks.filter((l) => l.costOfWaiting4w > l.serviceCost).map((leak) => <div key={leak.unit} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="grid size-9 place-items-center rounded-md bg-warning/10 text-warning"><Wrench className="size-4" /></div><div className="flex-1"><p className="text-sm font-semibold">Inspect {englishName(leak.name)}</p><p className="text-xs text-muted-foreground">Wait 4 weeks: {eur(leak.costOfWaiting4w)} · Service: {eur(leak.serviceCost)}</p></div><Button variant="outline" size="sm" onClick={() => onInvestigate(leak)}>Open brief</Button></div>)}</div></div></>; }
function Reports({ week, leaks }: { week: string; leaks: Leak[] }) { const data = leaks.slice(0, 7).map((l) => ({ name: englishName(l.name).split(" ").slice(0, 2).join(" "), cost: l.eurMonth })); return <><PageHeading eyebrow={`Week of ${fmtWeek(week)}`} title="Operations report" body="A concise weekly summary of avoidable energy cost and equipment risk." /><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><div className="panel p-5"><h2 className="text-base font-semibold">Estimated monthly impact by unit</h2><div className="mt-4 h-80"><ResponsiveContainer><BarChart data={data} layout="vertical"><CartesianGrid stroke="var(--border)" horizontal={false} /><XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} /><YAxis dataKey="name" type="category" width={100} stroke="var(--muted-foreground)" fontSize={10} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} /><Bar dataKey="cost" fill="var(--warning)" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div></div><div className="panel p-5"><p className="label">Executive note</p><p className="mt-4 text-lg font-semibold">{leaks.length} units need review this week.</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The top five represent approximately {eur(leaks.slice(0,5).reduce((a,l)=>a+l.eurMonth,0))} per month in modelled excess electricity. These are estimates, not guaranteed savings.</p><Button className="mt-6 w-full"><FileText /> Export brief</Button></div></div></>; }
function SettingsView() { return <><PageHeading eyebrow="Store model" title="Settings" body="The assumptions below make estimates transparent and auditable." /><div className="panel divide-y divide-border">{[["Electricity model", assumptions.tariff], ["Opening hours", assumptions.hours], ["Service visit", eur(assumptions.service)]].map(([k,v]) => <div key={k} className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">{k}</p><p className="text-sm text-muted-foreground">{v}</p></div>)}</div></>; }
function DataQuality() { const chart = [{ name: "Usable", value: 84 }, { name: "Missing", value: 16 }]; return <><PageHeading eyebrow="Evidence integrity" title="Data quality" body="Kylvakt never silently treats a missing reading as a normal reading." /><div className="grid gap-5 md:grid-cols-3"><div className="panel p-5 md:col-span-2"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Data coverage" value="84%" sub="usable readings" tone="info" /><Metric label="Signals" value="451" sub="hourly channels" /><Metric label="Time span" value="8,760 h" sub="2025 calendar year" /></div><div className="mt-6 rounded-md border border-border bg-secondary/40 p-4"><p className="text-sm font-semibold">How missing data is handled</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Missing values are removed before a unit is compared with its baseline. An issue needs enough measured history to be ranked.</p></div></div><div className="panel p-5"><p className="label">Coverage</p><div className="h-48"><ResponsiveContainer><PieChart><Pie data={chart} dataKey="value" innerRadius={55} outerRadius={72} paddingAngle={2}>{chart.map((_, i) => <Cell key={i} fill={i === 0 ? "var(--info)" : "var(--secondary)"} />)}</Pie></PieChart></ResponsiveContainer></div><div className="flex justify-center gap-5 text-xs"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-info" />Usable</span><span className="flex items-center gap-2 text-muted-foreground"><i className="size-2 rounded-full bg-secondary" />Missing</span></div></div></div></>; }
