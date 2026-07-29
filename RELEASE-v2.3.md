# Masroufi v2.3

## Bills workflow
- Fixed bills are created once and reused.
- The main Bills action is now **Record bill payment**.
- Select DEWA / du / e& from a dropdown.
- Enter the real paid amount, payment account, and date.
- Saving creates the expense transaction automatically through `pay_bill`.
- The payment appears in a dedicated bill payment history.
- Account available balances, dashboard, transactions, and reports update through the generated transaction.

## UI spirit
- Transactions: emerald surfaces.
- Accounts: blue surfaces.
- Categories: orange surfaces.
- People: pink surfaces.
- Subscriptions: violet surfaces.
- Transfers: cyan surfaces.
- Reports: emerald surfaces.
- Bills: sky surfaces.

## Purchases
- Item, quantity, unit, unit price, and line total controls now share the same 40px height and top alignment.

No new database migration is required for this release. Existing migrations 013 and 014 are sufficient.
