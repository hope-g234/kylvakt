import data from "@/data/coldwatch.json";
import unitsDaily from "@/data/units-daily.json";

export type Leak = {
  unit: string; name: string; area: string; freezer: boolean; cause: string; action: string;
  eurWeek: number; eurMonth: number; excessKwh: number; duty: number; baseDuty: number; z: number;
  tempDev: number; baseTempDev: number; alarmHours: number; defrost: number; baseDefrost: number;
  slopePerWeek: number; weeksToSaturation: number | null; failureRisk: number;
  costOfWaiting4w: number; serviceCost: number; score: number;
  signals: Record<string, string | null>;
};
export type UnitDay = { d: string; duty: number | null; cpt: number | null; sp: number | null; kwh: number | null; de: number | null };

export const store = data.store;
export const weeks: string[] = data.weeks;
export const leaksByWeek = data.leaks as unknown as Record<string, Leak[]>;
export type PlantDay = { d: string; kwh: number; base: number; out: number; price: number; kwhOpen?: number; kwhClosed?: number; baseOpen?: number; baseClosed?: number; anomOpen?: number; anomClosed?: number };
export type HourRow = { h: number; open: boolean; kwh: number; base: number; anom: number };
export type MonthRow = { m: string; kwh: number; base: number; openAvg: number; closedAvg: number; anomOpen: number; anomClosed: number };
export const plant = data.plant as PlantDay[];
export const assumptions = data.assumptions;
export const hourly = data.hourly as unknown as Record<string, HourRow[]>;
export const monthly = data.monthly as MonthRow[];
export const openingHours = data.openingHours as { open: number; close: number; closedDays: string };
export const daily = unitsDaily as unknown as Record<string, UnitDay[]>;

const svName: Record<string, string> = {
  "Mejerikyl": "Dairy fridge", "Frukt- och grönsakskyl": "Fruit & veg fridge", "Kylrum för frukt och grönt": "Fruit & veg cold room",
  "Kylrum för mejerivaror": "Dairy cold room", "Ostdisk": "Cheese counter", "Charkdisk": "Deli counter", "Köttdisk": "Meat counter",
  "Kylrum för chark": "Deli cold room", "Kylrum för kött": "Meat cold room", "Köttberedning": "Meat prep room", "Frysrum": "Freezer room",
  "Frysskåp": "Freezer cabinet", "Frysö, gavel": "Freezer island end", "Frysö": "Freezer island",
};
export function englishName(sv: string) {
  for (const [k, v] of Object.entries(svName).sort((a, b) => b[0].length - a[0].length)) if (sv.startsWith(k)) return sv.replace(k, v);
  return sv;
}

export function addDays(d: string, n: number) {
  const x = new Date(d + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

export function plantWeek(week: string) {
  const rows = plant.filter((p) => p.d >= week && p.d < addDays(week, 7));
  const kwh = rows.reduce((a, r) => a + r.kwh, 0);
  const base = rows.reduce((a, r) => a + r.base, 0);
  const eur = rows.reduce((a, r) => a + (r.kwh - r.base) * r.price, 0);
  const cost = rows.reduce((a, r) => a + r.kwh * r.price, 0);
  return { rows, kwh, base, eur, cost };
}

export const eur = (n: number) => `€${Math.round(n).toLocaleString("en")}`;
export const fmtWeek = (w: string) => new Date(w + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
