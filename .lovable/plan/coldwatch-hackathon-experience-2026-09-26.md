# ColdWatch hackathon experience

## Goal
Rebuild the current dashboard into a polished operational product that turns the supplied refrigeration data into a clear decision flow: **detect → investigate → act → verify**. The visual direction will be restrained industrial software, not a generic AI dashboard.

## What will change
- Add a responsive command-center shell with a compact sidebar for Overview, Energy, Refrigeration, Issues, Actions, Reports, Settings, and Data quality.
- Make the opening view immediately answer store health, current energy use, and the three decisions worth attention.
- Turn the ranked leak list into three concise priority cases with measured facts, cautious explanations, estimated cost, and clear next actions.
- Add an investigation view that opens from an issue and shows actual versus expected behavior, the anomalous interval, evidence chain, recommended checks, cost assumptions, and intervention verification.
- Add useful Energy and Refrigeration views using the existing 2015 data, while keeping deeper detail progressively disclosed.
- Keep Ask ColdWatch secondary in a side panel and preserve its existing evidence-grounded responses.
- Add responsive behavior for the current mobile-sized preview, including a compact navigation control and readable charts/tables.

## Visual direction
- Off-white working canvas with charcoal navigation, crisp borders, restrained cyan, amber, red, and green status colors.
- Editorial hierarchy, compact operational labels, clean data typography, and minimal decoration.
- No gradients, glowing effects, oversized marketing copy, chatbot-first framing, or decorative “AI” visuals.
- Motion is limited to view transitions, expanding evidence, and chart rendering.

## Technical details
- Keep the current static bundled dataset and calculations; no database or authentication will be added.
- Reuse the existing charting, assistant, evidence, and UI controls; reorganize them into focused ColdWatch components.
- Navigation will switch between product views within the main application while preserving the existing week selector.
- All fault language will distinguish measured observations from possible explanations and recommendations.
- Verify the main demo path on desktop and mobile: Overview → issue → evidence → action → verification, plus assistant opening.
