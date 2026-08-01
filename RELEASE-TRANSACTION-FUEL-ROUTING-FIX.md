# Transaction → Fuel edit routing fix

## Fixed
- Transactions linked to `fuel_entries` are now recognized as fuel-managed transactions.
- Clicking Edit from Transaction History now redirects to `/fuel/[fuelId]/edit` instead of opening the generic transaction editor.
- Existing routing for purchases, bills, and subscriptions remains unchanged.

## Database
- No Supabase migration is required.
