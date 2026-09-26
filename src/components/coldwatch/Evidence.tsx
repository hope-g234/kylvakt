import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addDays, daily, type Leak } from "@/lib/coldwatch";

const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };

export function Evidence({ leak, week }: { leak: Leak; week: string }) {
  const from = addDays(week, -42), to = addDays(week, 7);
  const rows = (daily[leak.unit] ?? []).filter((r) => r.d >= from && r.d < to).map((r) => ({
    ...r, dev: r.cpt != null && r.sp != null ? +(r.cpt - r.sp).toFixed(2) : null, base: leak.baseDuty,
  }));
  const s = leak.signals;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Chart title={`Cooling duty % — ${s.duty}`} note={`Baseline ${leak.baseDuty}% → now ${leak.duty}%`}>
        <ComposedChart data={rows}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="d" {...axis} tickFormatter={(d) => d.slice(5)} minTickGap={24} />
          <YAxis {...axis} width={32} />
          <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
          <ReferenceArea x1={week} x2={addDays(week, 6)} fill="var(--primary)" fillOpacity={0.08} />
          <Area dataKey="duty" name="Duty %" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} connectNulls />
          <Line dataKey="base" name="Own baseline" stroke="var(--muted-foreground)" strokeDasharray="4 4" dot={false} />
        </ComposedChart>
      </Chart>
      <Chart title={`Temp vs setpoint °C — ${s.cpt} − ${s.sp ?? "median"}`} note={`Avg deviation ${leak.tempDev > 0 ? "+" : ""}${leak.tempDev}°C (baseline ${leak.baseTempDev}°C)`}>
        <ComposedChart data={rows}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="d" {...axis} tickFormatter={(d) => d.slice(5)} minTickGap={24} />
          <YAxis {...axis} width={32} />
          <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
          <ReferenceArea x1={week} x2={addDays(week, 6)} fill="var(--primary)" fillOpacity={0.08} />
          <Line dataKey="dev" name="Above setpoint" stroke="var(--chart-2)" dot={false} connectNulls strokeWidth={2} />
          <Line dataKey="de" name="Defrost %" stroke="var(--chart-5)" dot={false} connectNulls />
        </ComposedChart>
      </Chart>
    </div>
  );
}

function Chart({ title, note, children }: { title: string; note: string; children: React.ReactElement }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-xs text-muted-foreground">{title}</p>
      </div>
      <p className="mb-2 text-xs text-foreground">{note}</p>
      <div className="h-44"><ResponsiveContainer>{children}</ResponsiveContainer></div>
    </div>
  );
}
