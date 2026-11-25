# Mini Expense Tracker

A privacy-focused personal finance dashboard for tracking income, expenses, and budgets. It runs entirely in your browser: no account, backend, analytics, or external API is required.

## Live demo

Expected GitHub Pages URL (available after deployment): https://majidramzi.github.io/mini-expense-tracker/

## Screenshots

Screenshot placeholder: add dashboard and mobile screenshots here after deployment. Use **Load sample data** on an empty dashboard to explore the interface without entering personal finances.

## Features

- Add, edit, delete, search and filter income and expenses by type, category, currency and month.
- Predefined categories and user-created categories; descriptions and dates for each transaction.
- Responsive dashboard, transaction list, budgets, reports and settings; light and dark themes.
- Export transactions to CSV and all application data to a JSON backup; import validated backups.
- Local-only browser storage; no registration or external services.

## Dashboard and reports

The dashboard calculates monthly income, spending and savings (income minus expenses), plus the all-time balance for the selected currency. Choose a month and currency to explore category breakdowns and six-month income, expense and net trends. Daily and weekly spending charts show recent activity. Reports include category, monthly and per-currency tables. Totals are derived from your saved transactions; no cross-currency totals are silently combined.

## Budget management

Set a recurring monthly limit and category-specific monthly limits in Budgets. For the chosen month, only expenses matching the budget's currency are counted. Usage is marked **approaching** at 80% and **exceeded** above 100%; remaining amounts may be negative when overspent. Budgets apply to each month, rather than storing separate limits per month.

## Supported currencies

EUR, USD, GBP, SEK, NOK and IRR. Select a default for new transactions and dashboard focus; existing records retain their currencies. Totals and budgets remain separate by currency. Optionally enter your own rates in Settings (default-currency units per one unit of the foreign currency) to see an explicitly labelled converted total on the dashboard. Transactions without rates are excluded and reported. Rates are not fetched or updated automatically. Changing the default currency clears rates to prevent applying rates against the wrong base.

## Installation

Requires Node.js 22 or later and npm.

```sh
git clone https://github.com/majidramzi/mini-expense-tracker.git
cd mini-expense-tracker
npm ci
```

## Development

```sh
npm run dev
```

Open the URL printed by Vite, including the `/mini-expense-tracker/` base path. The app runs client-side and requires no backend.

## Testing

```sh
npm test
```

Vitest covers calculations, monthly aggregation, balance, budget thresholds, currencies, backup validation and local persistence, plus UI smoke tests.

## Build

```sh
npm run build
npm run preview
```

The production files are generated in `dist/`. Vite is configured with `/mini-expense-tracker/` as its base path.

## Deployment

Push this project to the `main` branch of `majidramzi/mini-expense-tracker`. In GitHub repository Settings → Pages, choose **GitHub Actions** as the source. The included workflow installs dependencies, tests, builds and deploys to GitHub Pages. The expected URL is https://majidramzi.github.io/mini-expense-tracker/. If using a different repository name, update the Vite `base` and this URL. No deployment has been performed by this project itself.

## Data storage and privacy

Data is stored in browser localStorage under `mini-expense-tracker:v1`, on the device and origin where you use the app. Nothing is sent to an application server and there is no analytics or API integration. Browser storage is not encrypted by the app. Anyone with access to your browser profile may be able to read it. Clearing site data, private-browsing sessions, storage restrictions or device loss can remove records. Storage can be unavailable or full; the app shows a warning when it cannot save. Export backups regularly and keep them securely.

## Backups

In Settings, choose **Export JSON backup** to save transactions, budgets, settings, categories and rates. **Export CSV** exports transactions only and is useful for spreadsheets; CSV is not a restore format. To restore, choose **Import JSON backup** and confirm replacement. Invalid transactions and unsupported versions are rejected. Missing or invalid optional settings/budgets may be defaulted with a notice. Import and sample data replace current data; export a fresh backup first. **Clear all data** requires typing `CLEAR` and cannot be undone.

## Project structure

```text
src/components/   Shared controls, charts and transaction form
src/views/        Dashboard, transactions, budgets, reports and settings
src/lib/          Calculations, currencies, categories, storage and tests
src/store/        React state and local persistence
src/types.ts      Data model and defaults
.github/workflows/ GitHub Pages deployment
```

## Contributing

Open an issue or pull request describing the change. Run `npm test` and `npm run build` before submitting. Avoid introducing network calls or analytics that compromise local-only privacy.

## License

MIT. See [LICENSE](LICENSE).
