# Masroufi architecture

Masroufi uses a feature-first structure. Route files should stay thin and only compose data and feature components.

## Boundaries

- `src/app`: routing, layouts, and page composition only.
- `src/features/<feature>`: business logic owned by one feature.
- `src/components/ui`: low-level reusable UI primitives.
- `src/components/shared`: cross-feature product components.
- `src/lib`: infrastructure such as Supabase clients and generic helpers.
- `supabase/migrations`: ordered, idempotent database changes.

## Feature structure

Each feature may contain:

- `actions`: server actions and mutation orchestration.
- `components`: UI owned by the feature.
- `schemas`: Zod validation.
- `services`: database reads and external access.
- `types`: domain types.
- `utils`: pure calculations and formatting.

Do not create an empty folder merely to satisfy the template. Add a folder when the feature needs it.

## Financial source of truth

Account balances and reports continue to derive from `transactions`.

- Purchases create one expense transaction and keep receipt item details separately.
- Bills create one expense transaction per recorded payment.
- Subscriptions create linked transactions when paid.
- Transfers remain a dedicated module and affect balances separately.

## UI identity

Each module has an accent color. The accent appears in icons, subtle borders, and low-opacity background gradients. Avoid strong full-card colors so financial information stays readable.
