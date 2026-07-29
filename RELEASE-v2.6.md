# Masroufi v2.6 — Bills management and delete safety

- Fixed the `selectedAccount is not defined` crash in Manage fixed bills.
- Added bill editing for name, provider, default account, frequency, due day, and expected amount.
- Added safe bill removal. Removing a fixed bill hides it from future payments while preserving old payment history and transactions.
- Added confirmation dialogs to bill, store, and purchase deletion.
- Existing transaction, transfer, account, and subscription delete flows already use confirmation dialogs.
- No new database migration is required.
