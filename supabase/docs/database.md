# Masroufi Database

## Migration rules

- Every database change must have a numbered SQL migration file.
- Migration files are never edited after they have been executed.
- Any fix or change must be added as a new migration.
- SQL is written in the project first, then executed in Supabase.
- Do not run experimental SQL without saving it.

## Migrations

### 001_initial_accounts.sql
Creates accounts and account-related database objects.

### 002_create_transactions_core.sql
Creates the transactions database structure.

### 003_create_default_categories.sql
Creates the default transaction categories.

### 004_create_people_and_balances.sql
Creates:

- `people`
- `person_balance_entries`
- `person_entry_type`
- `person_current_balances`
- RLS policies
- indexes and triggers

### 005_grant_people_permissions.sql
Grants the authenticated role access to the People tables and balances view.

## People balance rule

- Positive balance: the person owes the user.
- Negative balance: the user owes the person.
- Zero balance: settled.