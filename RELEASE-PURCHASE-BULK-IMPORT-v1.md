# Purchase Bulk Import v1

## Included

- Paste receipt text importer for long Amazon/Carrefour-style orders.
- Preview detected items before adding them to the form.
- Detect item names, quantities, package sizes, prices, discount, delivery fee, tax, and final total when present.
- Pipe/tab format fallback: `Product | quantity | unit | line price`.
- Existing product names reuse their saved default category and unit.
- Correct package-size model:
  - `Count` controls price multiplication.
  - `Size` + `Size unit` describe package contents only.
  - Example: one 250 g bag costing AED 8 = Count 1, Size 250 g, Price each 8, Line total 8.
- Purchase details now display package size.

## Database

Migration 027 adds nullable `package_size` and `package_unit` columns and updates purchase RPCs.
