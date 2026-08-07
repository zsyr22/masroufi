# Purchase Import — Carrefour v1.0

- Added a dedicated Carrefour receipt-text parser.
- The parser used by Paste receipt now follows the selected Store first:
  - Amazon store -> Amazon parser
  - Nesto store -> Nesto parser
  - Carrefour store -> Carrefour parser
- Carrefour table rows are parsed from `Barcode:` blocks and their seven numeric columns.
- Fractional Carrefour quantities are treated as weighed goods: Qty becomes 1 and the measured weight is stored as package size in grams.
- Carrefour item prices use the invoice's VAT-inclusive line total, so VAT is not added twice by the purchase totals calculation.
- Existing Amazon and Nesto parsers remain isolated and unchanged in their store-specific paths.
