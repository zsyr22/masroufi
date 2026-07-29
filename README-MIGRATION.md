# Applying this release

1. Back up the project folder and Supabase database.
2. Replace the existing `src` and `supabase` folders with this release.
3. In Supabase SQL Editor:
   - If `013_create_bills.sql` failed previously, run the corrected `013_create_bills.sql` again.
   - Then run `014_stabilize_bills_after_partial_013.sql`.
4. Run:

```bash
npm run build
npm run dev
```

The corrected migration explicitly casts `income` and `expense` to `public.transaction_type`, fixing PostgreSQL error `42804`.
