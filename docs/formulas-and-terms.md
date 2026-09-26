# Kylvakt — Formulas, terms and why we chose them

This document is the reference for every number Kylvakt calculates: the exact formula, the words we use for it, and the reason we chose that method over an alternative. `docs/dashboard.md` explains the dashboard in plain language; this file is the maths behind it.

---

## 1. Why the system is built this way

**Transparent statistics instead of black-box AI.** A refrigeration technician has to act on what the system says. If a model cannot be explained, it will not be trusted, and it cannot be challenged when it is wrong. Every figure here can be recomputed with a spreadsheet and verified on site with a thermometer, a clamp meter or a manifold gauge.

**No new hardware.** Kylvakt reads telemetry that commercial refrigeration controllers already record: cooling duty, product and setpoint temperature, defrost state, collective alarms, and the store's electricity sub-meters. Nothing needs to be installed in the store.

**Cheap to run at scale.** All of the work is rolling medians, standard deviations and one least-squares line per unit. The cost grows linearly with the number of cabinets, so thousands of units across many stores can be processed in seconds on modest hardware.

**No cross-store or cross-unit calibration.** Every cabinet is judged against its own history and its own store's opening calendar. A new store can be added without anyone tuning thresholds by hand.

**Measured facts stay separate from hypotheses.** Duty, temperature, alarms and energy are measurements. "Worn gasket", "iced evaporator", "low refrigerant" are candidate explanations for a technician to confirm or rule out. The two are never merged.

---

## 2. Glossary

| Term | Meaning |
| --- | --- |
| **Cooling duty (%)** | Share of time the cabinet is actively calling for cooling. 40–50% is comfortable; 100% means it never stops. |
| **Rolling 5-week baseline** | The median of the unit's previous five weekly duty values — its own definition of normal. |
| **Z-score** | How many standard deviations this week sits above the baseline. |
| **Variance floor (σ_min)** | A minimum spread of 2.0 percentage points applied before computing a z-score. |
| **Saturation** | Duty at 100%: cooling runs continuously with no reserve for defrost, door openings or hot weather. |
| **Slope (m)** | Least-squares rate of change of duty, expressed in percentage points per week. |
| **Weeks to saturation (W_sat)** | Extrapolated number of weeks until duty reaches 100%. |
| **is_open** | Store-state flag: open 08:00–21:59 Mon–Sat; closed from 22:00, closed Sundays and Lower Saxony public holidays. Paired with `hours_since_opening` and `hours_until_closing`. |
| **Group allocation share** | A unit's share of its refrigeration pack's metered electricity, in proportion to its duty. |
| **Stock at risk** | Estimated value of product lost if the cabinet fails: €3,200 freezer, €1,600 fridge. |
| **Cost of waiting 4 weeks** | Estimated cost of leaving the fault alone for four weeks, compared against a €380 service visit. |

---

## 3. The formulas

### 3.1 Unit baseline — rolling 5-week median

\[
\mu_{\text{base}} = \operatorname{median}\left(d_{w-5},\, d_{w-4},\, d_{w-3},\, d_{w-2},\, d_{w-1}\right)
\]

where \(d_w\) is the mean cooling duty of week \(w\).

**Why the median, not the mean:** one week containing a stuck defrost or a propped-open door would pull a mean baseline upward and hide the following week's fault. The median ignores a single outlier week.

### 3.2 Variance floor and z-score

\[
\sigma_{\text{adj}} = \max\bigl(\operatorname{std}(d_{w-5..w-1}),\, 2.0\%\bigr), \qquad
Z = \frac{d_w - \mu_{\text{base}}}{\sigma_{\text{adj}}}
\]

Flagged at \(Z \ge 1.5\).

**Why the floor:** a cabinet whose duty barely moves has a near-zero standard deviation, and a harmless 0.5-point drift would divide into a huge z-score. The 2.0-point floor makes the test insensitive to noise on very stable units.

### 3.3 Temperature drift

\[
\Delta T = \bigl(T_{\text{actual}} - T_{\text{set}}\bigr)_w - \operatorname{median}\bigl((T_{\text{actual}} - T_{\text{set}})_{w-5..w-1}\bigr)
\]

Flagged at \(\Delta T \ge +0.8\,^\circ\mathrm{C}\).

**Why it matters:** it separates two very different faults. High duty while temperature holds points at heat leaking in (door seal, night blinds, ambient). High duty while temperature *rises* points at lost cooling capacity (iced evaporator, restricted airflow, low refrigerant) — a more urgent case.

### 3.4 Trend line and weeks to saturation

Ordinary least squares over roughly six weeks (\(n \approx 42\) daily points):

\[
m = \frac{\sum_{i}(t_i - \bar{t})(d_i - \bar{d})}{\sum_{i}(t_i - \bar{t})^2} \times 7
\qquad (\text{percentage points per week})
\]

\[
W_{\text{sat}} = \frac{100\% - d_w}{m} \quad \text{when } m > 0.3\%/\text{week}
\]

A unit with \(W_{\text{sat}} < 6\) weeks is raised even if the z-score and temperature look acceptable.

**Why six weeks and a straight line:** mechanical degradation — fouling condensers, gradual refrigerant loss, ice building across defrost cycles — is close to linear over weeks. Six weeks is long enough to average out weather and trading patterns, short enough to still be current. A curve fitted to this much noise would over-claim precision.

**Why 0.3%/week:** below that, the slope is indistinguishable from seasonal drift, and the extrapolation would produce a false deadline.

### 3.5 Energy allocation per unit

\[
E_{\text{unit},w} = E_{\text{pack},w} \times \frac{d_{\text{unit},w}}{\sum_{u \in \text{group}} d_{u,w}}
\]

Chillers and freezers are separate groups with separate meters.

**Why allocate:** individual cabinets are almost never sub-metered, but compressor work is roughly proportional to cooling duty. This gives a defensible per-unit number — always labelled as an estimate, never as a meter reading.

### 3.6 Excess energy and excess cost

\[
E_{\text{excess}} = \max\!\left(0,\; E_{\text{unit},w} \times \frac{d_w - \mu_{\text{base}}}{d_w}\right)
\qquad
C_{\text{excess},4w} = 4.33 \times E_{\text{excess}} \times \bar{P}_{\text{elec}}
\]

**Why this shape:** only the portion of duty above the unit's own normal is charged as waste, so a cabinet that has always run hard is not billed for its design load. 4.33 converts a week to an average month.

### 3.7 Failure risk

\[
R_{\text{fail}} = \min\!\Bigl(0.90,\; 0.10 + 0.08\max(0,Z) + 0.10\max(0,\Delta T) + 0.30\,[\,W_{\text{sat}} < 6\,]\Bigr)
\]

**Why capped at 0.90:** no statistical model on this data can honestly claim certainty of failure. The cap keeps the wording defensible and keeps the cost ranking from being dominated by one unit.

**Why additive:** each term maps to an independent physical signal — strain, thermal loss, trajectory. An additive form stays readable, and a technician can see which term drove the score.

### 3.8 Cost of waiting and the decision rule

\[
C_{\text{wait},4w} = C_{\text{excess},4w} + 0.50 \times \text{StockAtRisk} \times R_{\text{fail}}
\]

Work is ordered by \(C_{\text{wait},4w}\) against a €380 service visit.

**Why the 0.50 factor:** a failure rarely spoils a full cabinet — some product is moved, some is within tolerance, some fails outside trading hours and is caught. Halving the exposure keeps the estimate conservative.

### 3.9 Store-wide baseline: calendar month × opening state

Expected load is modelled per calendar month \(m\), hour of day \(h\), and open/closed state:

\[
\hat{E}(m, h, \text{open}) \quad\text{with residual spread}\quad \sigma(m, h, \text{open})
\]

An hour is unusual when

\[
E_{\text{actual}}(t) - \hat{E}\bigl(m(t), h(t), \text{open}(t)\bigr) > 2.0 \times \sigma\bigl(m(t), h(t), \text{open}(t)\bigr)
\]

**Why per calendar month:** cooling load in August and December are not comparable. A single annual baseline would flag every summer hour and miss every winter fault.

**Why split open and closed:** heavy cooling at 14:00 in a busy store is expected — doors open, warm air enters, product is restocked. The same load at 03:00 on a closed Sunday has no legitimate cause, so closed-hour exceedances carry far more diagnostic weight.

**Why 2σ, not 1.5σ as for units:** store totals aggregate 39 cabinets and are therefore smoother; a tighter threshold would generate noise alerts on ordinary trading variation.

### 3.10 Price model

\[
P_{\text{elec}}(t) = 0.14\ \text{€/kWh} \times \text{shape}(t)
\]

with a modelled German day-ahead hourly shape, so waste during expensive hours is costed higher than the same kWh overnight. This is a modelled assumption, not a store-confirmed tariff.

---

## 4. What we deliberately do not do

- **No unit-vs-unit comparison.** A freezer that always runs at 60% duty is not sicker than a fridge at 40%; only deviation from its own history counts.
- **No machine learning on this dataset.** There are not enough labelled failures to train or validate a model, and an unvalidated model would make claims we cannot defend.
- **No gap filling.** Missing hours are excluded from averages rather than interpolated, and coverage is reported honestly from 20 February, when measurement began.
- **No unevidenced predictions.** Every trend warning states that it is an extrapolation of a straight line, with the slope and current duty visible.

---

## 5. Known limits

- The cost assumptions (€0.14/kWh, €380 visit, stock-at-risk values) are modelled. Real store figures would sharpen every euro amount.
- Per-unit temperature baselines do not yet account for day of week or hour of day.
- The opening-hours baseline currently drives store-wide energy only; the unit priority list still uses each unit's own weekly history.
