# Financial Health Score

A 0–100 score on the Home screen that sums up how healthy someone's finances are. Tap it to see the breakdown and the top tips to improve it. Full method: `docs/FINANCIAL_HEALTH_SCORE_SPEC.md`.

## Files

- `config.ts`: the on/off switch (`ENABLE_HEALTH_SCORE`)
- `calculator.ts`: works out the score from the app's own data (installments, loans, savings at live rates, income, job type)
- `HealthCard.tsx`: the Home screen card and the detail sheet
- `index.ts`: exports

## Where it touches the rest of the app

Only three small spots, so it's easy to remove:

1. `src/screens/Dashboard.tsx`: one `<HealthCard />` line and its import
2. `src/store.tsx`: optional `scoreHistory` field (one score saved per month for the "▲ 4 since last month" trend)
3. `src/i18n.ts`: Arabic translations under `// financial health score`

## Kill switch

The Health Score is part of the core app. The switch stays as an emergency off button.

## Turn it off / remove it

- **Hide it:** set `ENABLE_HEALTH_SCORE: false` in `config.ts`. The card disappears and nothing is calculated.
- **Remove it:** delete this folder and undo the three spots above.
