# Fix 025 — Account Details & Balance Ledger

Adds a dedicated account details page that explains exactly how the current balance was calculated.

## Included

- New route: `/accounts/[accountId]`
- Opening balance, money in, money out, and current balance cards
- Transparent balance equation
- Separate breakdown for income, expenses, incoming transfers, and outgoing transfers
- Complete account activity ledger
- Opening balance shown as the account starting point
- Transfers shown in the account ledger without being counted as income or expenses
- “View details” button and clickable account name on every account card

## Install

Copy the `src` folder over the project `src` folder and replace matching files.

No database migration is required.

Then run:

```powershell
npm run lint
npm run build
```
