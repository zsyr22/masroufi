# Masroufi Nesto Import Fix

Fixes Nesto receipts where product names contain `(Taxable)` on the same line.

Expected result for the supplied receipt:
- Nesto detected
- 29 items detected
- VAT/GST: 11.65 AED
- Total Paid: 244.63 AED

The parser also prefers Nesto's printed line total for weighted KG products so rounding does not cause the receipt total to mismatch.

No database migration is required.
