# Purchase Import v1.2 — Amazon + Nesto

- Automatically detects Amazon and Nesto copied receipt text.
- Uses an isolated parser for each store format.
- Nesto support includes EA, PAC/PACK, BOX, PCS and weighted KG products.
- Reads Nesto VAT/GST and Total Paid values.
- Extracts package sizes such as 2.5Kg, 420ml, 2x200g and 3x54g.
- Keeps loose KG products as weighted quantities without multiplying package size.
- Shows the detected receipt source in the import preview.
- Keeps the generic parser only as a fallback.

No database migration is required.
