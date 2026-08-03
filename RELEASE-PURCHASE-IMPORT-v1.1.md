# Purchase Import v1.1

- Parses Amazon copied order text where currency and amount are on separate lines.
- Detects ASIN product blocks, quantity, package size, discount, delivery and final total.
- Simplifies item rows to Item, Qty, Price each, Total, and optional Package size.
- Removes per-item category and "Sold as" controls from the UI.
- Adds Total only mode so a receipt can be saved now and itemized later.
- Migration 028 updates create/update purchase RPCs to allow zero purchase items.
