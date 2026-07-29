# Masroufi v2.4

## Fixed
- Bills dropdowns now display bill and account names instead of UUID values.
- Purchase item category displays the category name instead of its UUID.
- Purchase item fields use one aligned desktop grid and consistent 40px controls.

## Added
- Online purchases include a delivery fee, defaulting to 0.
- Delivery fee participates in receipt validation and the generated expense total.
- Existing products are loaded as searchable browser autocomplete suggestions.
- Selecting an existing product restores its saved default unit and category.
- Migration `015_purchase_delivery_fee.sql` updates the purchases table and RPC.

## Install
1. Replace `src` and `supabase` with this release.
2. Run `supabase/migrations/015_purchase_delivery_fee.sql` in Supabase SQL Editor.
3. Restart the development server.
