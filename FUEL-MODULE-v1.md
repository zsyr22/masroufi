# Fuel Module v1

Implemented:

- Dedicated Fuel sidebar route
- Fuel history and monthly summary
- Quick-add form with smart three-value calculator
- Details, edit, and delete flows
- Optional odometer tracking
- Linked expense transaction and automatic account balance updates
- RLS-protected `fuel_entries` table
- Secure create/update RPCs

## Apply database migration

Run migration:

`supabase/migrations/025_create_fuel_entries.sql`

Then start the app and open `/fuel`.

## Validation note

The source was reviewed locally. A full `npm run build` could not run in the sandbox because the configured package registry returned a 404 for `zod-validation-error@4.0.2` during `npm ci`.
