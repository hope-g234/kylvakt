# Kylvakt — Dashboard guide

Kylvakt watches the refrigeration and energy use of the Wettbergen grocery store. It turns sensor readings into a short list of decisions: **detect → investigate → act → verify**.

Kylvakt keeps two kinds of statements apart:
- **Measured:** what the sensors actually recorded, like energy used, temperatures and alarms.
- **Possible explanation:** a likely cause that someone needs to check on site. It is never presented as fact.

All money figures are estimates in euros. They are not guaranteed savings.

---

## What data it uses

- **Store refrigeration data:** hourly readings for a full year. They cover about 39 fridges, freezers and cold rooms, plus total store electricity, cooling electricity, freezer electricity, the heat pump, and outdoor and indoor temperature.
- Each unit has its target temperature, actual temperature, cooling effort (how hard it is working), defrost activity and alarms.
- Measurement began on 20 February. January and most of February are largely empty.

## Store opening hours

- The store is open **08:00 to 22:00, Monday to Saturday**. So 07:00 is closed, 08:00 to 21:00 is open, and 22:00 is closed again.
- It is closed on **Sundays and public holidays in Lower Saxony**.
- Every hour is marked as open or closed. Kylvakt also knows how long the store has been open and how long until it closes.
- **Why this matters:** heavy cooling at 14:00 in a busy store can be normal. The same load at 03:00, when the store is closed, is suspicious.

---

## The pages

### Overview
- A greeting with the store's overall health, this week's energy use and cost.
- **Priority cases:** the top issues that need a decision, plus units running normally.
- **Next decision:** the single most valuable action. It compares the estimated cost of waiting four weeks with the cost of a service visit.
- **Data confidence:** how complete the readings are.
- **Store behavior insights (compact):** background patterns. These are context, not alerts.

### Energy
- Actual versus expected daily energy use.
- **Opening-hours aware baseline:** an hourly chart for an average day. Closed hours are shaded, and expected use is shown as a dashed line.
- Counts of unusual hours when the store was open and when it was closed.
- **Month-to-month:** cooling energy and unusual hours for each month, because normal load changes month to month.
- **Store behavior insights (full)**.

### Refrigeration
- A card for every unit, showing how hard it is working, how far it is from its target temperature, its alarm hours and how unusual this week is.

### Issues
- Every flagged unit for the selected week, ranked by priority.

### Investigation (opened from an issue)
- Measured cooling effort compared with what is expected, plus the deviation and cost impact.
- A seven-week chart showing when the unusual period started.
- **Evidence chain:** energy behavior (measured), temperature response (measured), alarm activity (measured), then the possible explanation.
- A recommended checklist of actions.
- **Verify the intervention:** after a fix, the next weeks' readings show whether the unit went back to normal.

### Actions
- A maintenance queue. Jobs are ordered by how much waiting would cost compared with the service cost.

### Reports
- Monthly impact chart and a short summary for managers.

### Settings
- The cost assumptions used (see below).

### Data quality
- How much data is present or missing, and how gaps are handled.

### Ask Kylvakt (side panel)
- An assistant for questions about the selected week. Its answers use only this week's computed findings, and each answer cites the sensor numbers behind it. If the data doesn't support an answer, it says so.

### Other controls
- **Week selector:** every page follows the chosen week.
- **Bulb button (top right):** switches between light and dark themes. Your choice is remembered.

---

## What issues it detects

| Issue | What we look at | Why it matters |
|---|---|---|
| Unit working harder than usual | Cooling effort this week vs the unit's own last 5 weeks | Often an early sign of a dirty condenser, a failing door seal or low refrigerant |
| Temperature drifting from target | Actual vs target temperature | Food safety risk and wasted energy |
| Alarm activity | Hours in alarm this week | A direct warning from the equipment |
| Defrost problems | Defrost activity vs normal | Icing reduces cooling efficiency |
| Slowly worsening trend | Week-over-week rise in effort | Estimates the weeks left before the unit can't keep up |
| Store-wide excess energy | Actual vs expected energy for that month, open/closed state and time of day | Separates normal busy-hour load from waste |
| Unusual load while closed | Night and Sunday cooling above expected | Stronger sign of a fault than daytime peaks |

## How it flags issues

1. **Compare with the unit's own normal.** Each unit is compared with its own recent history (the typical value over the last 5 weeks), not with other units.
2. **Measure how unusual it is.** The bigger and more consistent the difference, the stronger the flag.
3. **Add supporting signals.** Temperature drift, alarms and defrost changes make a case more credible.
4. **Put a cost on it.** Extra energy multiplied by the electricity price gives a weekly and monthly cost. A worsening trend adds the risk of failure and lost stock.
5. **Rank.** Issues are ordered by the cost of waiting four weeks compared with a service visit, so the most worthwhile fixes come first.
6. **Label with care.** The measurements are stated as facts. Causes are labeled "possible explanation" and come with checks to do on site.

For the whole store, an hour counts as **unusual** when cooling use is more than 2 standard deviations above what is normal for that month, for the same open or closed state.

---

## Cost assumptions (modeled, not store-confirmed)

- Electricity: about €0.14/kWh, following a typical German day-ahead price profile.
- Service visit: €380.
- Stock at risk if a unit fails: €3,200 for a freezer and €1,600 for a fridge.

Replacing these with the store's real figures would make every estimate more accurate.

## Known limits

- The early-year data gap means the year-long coverage figure looks low. Coverage is reported from 20 February onward.
- Store behavior insights are shown for context only. They don't change the alerts yet.
- The opening-hours baseline is used for store-wide energy. The unit priority list still uses each unit's own history.

---

## Change log

- **Initial build:** operations dashboard with Overview, Energy, Refrigeration, Issues, Investigation, Actions, Reports, Settings, Data quality and Ask assistant.
- Added the light/dark theme bulb button.
- Renamed ColdWatch to Kylvakt and moved displayed dates to 2025.
- Added the Store behavior insights section on Overview (compact) and Energy (full).
- Added the opening-hours aware energy baseline and month-by-month cooling analysis.
- Added this guide.
