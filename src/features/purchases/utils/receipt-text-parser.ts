import type {
  ProductSuggestion,
  PurchaseItemInput,
  PurchaseUnit,
} from "@/features/purchases/types/purchase";

export type ParsedReceipt = {
  items: PurchaseItemInput[];
  tax?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  warnings: string[];
};

const inlineAmountPattern = /(?:AED|DHS?|د\.إ)\s*(-?\d+(?:[.,]\d{1,2})?)|(-?\d+(?:[.,]\d{1,2})?)\s*(?:AED|DHS?|د\.إ)/i;
const plainNumberPattern = /^-?\d+(?:[.,]\d{1,2})?$/;
const sizePattern = /(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|litre|liter)\b/i;
const countPattern = /(\d+(?:[.,]\d+)?)\s*(?:units?|pcs?|pieces?)\b/i;
const packPattern = /pack\s+of\s+(\d+(?:[.,]\d+)?)/i;
const asinPattern = /^B[A-Z0-9]{9}$/i;

function numberFrom(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inlineAmountFrom(line: string): number | undefined {
  const match = line.match(inlineAmountPattern);
  return numberFrom(match?.[1] ?? match?.[2]);
}

function normalizeUnit(raw: string | undefined): PurchaseUnit | null {
  switch (raw?.toLowerCase()) {
    case "kg": return "kg";
    case "g": return "g";
    case "ml": return "ml";
    case "l":
    case "litre":
    case "liter": return "l";
    default: return null;
  }
}

function looksLikeSummary(line: string): boolean {
  return /(bill\s*summary|items?\s*total|subtotal|delivery|discount|offer|you\s*pay|grand\s*total|order\s*total|tax|vat|inclusive\s+of\s+taxes)/i.test(line);
}

function amountAtOrAfter(lines: string[], startIndex: number, maxLookAhead = 3): number | undefined {
  for (let offset = 0; offset <= maxLookAhead; offset += 1) {
    const line = lines[startIndex + offset];
    if (!line) break;

    const inline = inlineAmountFrom(line);
    if (inline !== undefined) return inline;

    if (/^(?:AED|DHS?|د\.إ)$/i.test(line)) {
      const next = lines[startIndex + offset + 1];
      if (next && plainNumberPattern.test(next)) return numberFrom(next);
    }

    if (plainNumberPattern.test(line) && offset > 0) {
      const previous = lines[startIndex + offset - 1];
      if (/^(?:AED|DHS?|د\.إ)$/i.test(previous)) return numberFrom(line);
    }
  }

  return undefined;
}

function findSummaryAmount(lines: string[], pattern: RegExp): number | undefined {
  for (let index = 0; index < lines.length; index += 1) {
    if (!pattern.test(lines[index])) continue;
    const value = amountAtOrAfter(lines, index, 4);
    if (value !== undefined) return Math.abs(value);
  }
  return undefined;
}

function productDefaults(name: string, products: ProductSuggestion[]) {
  const normalized = name.trim().toLocaleLowerCase();
  return products.find((product) => product.name.trim().toLocaleLowerCase() === normalized);
}

function parseDelimitedLine(line: string, products: ProductSuggestion[]): PurchaseItemInput | null {
  const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : null;
  if (!delimiter) return null;
  const parts = line.split(delimiter).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const finalAmount = inlineAmountFrom(parts.at(-1) ?? "") ?? numberFrom(parts.at(-1));
  if (finalAmount === undefined) return null;

  const name = parts[0];
  const quantity = numberFrom(parts[1]) ?? 1;
  const existing = productDefaults(name, products);

  return {
    clientId: crypto.randomUUID(),
    name,
    quantity,
    unit: existing?.default_unit ?? "piece",
    packageSize: null,
    packageUnit: null,
    unitPrice: finalAmount / quantity,
    categoryId: existing?.default_category_id ?? "",
  };
}

function buildItem(
  name: string,
  details: string,
  lineTotal: number,
  products: ProductSuggestion[],
): PurchaseItemInput {
  const sizeMatch = details.match(sizePattern);
  const countMatch = details.match(countPattern);
  const packMatch = details.match(packPattern);
  const quantity = numberFrom(countMatch?.[1]) ?? 1;
  const packageSize = numberFrom(sizeMatch?.[1]) ?? numberFrom(packMatch?.[1]) ?? null;
  const packageUnit = sizeMatch ? normalizeUnit(sizeMatch[2]) : packMatch ? "piece" : null;
  const existing = productDefaults(name, products);

  return {
    clientId: crypto.randomUUID(),
    name: name.trim(),
    quantity,
    unit: existing?.default_unit ?? "piece",
    packageSize,
    packageUnit,
    unitPrice: Math.round((lineTotal / quantity) * 10000) / 10000,
    categoryId: existing?.default_category_id ?? "",
  };
}

function parseAmazonBlocks(lines: string[], products: ProductSuggestion[]): PurchaseItemInput[] {
  const items: PurchaseItemInput[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!asinPattern.test(lines[index])) continue;

    const name = lines[index + 1];
    if (!name || looksLikeSummary(name) || asinPattern.test(name)) continue;

    const block: string[] = [];
    let cursor = index + 2;

    while (
      cursor < lines.length
      && !asinPattern.test(lines[cursor])
      && !/^bill\s*summary$/i.test(lines[cursor])
    ) {
      block.push(lines[cursor]);
      cursor += 1;
    }

    const amountIndex = block.findIndex((line, blockIndex) =>
      inlineAmountFrom(line) !== undefined
      || (/^(?:AED|DHS?|د\.إ)$/i.test(line) && plainNumberPattern.test(block[blockIndex + 1] ?? "")),
    );
    const lineTotal = amountIndex >= 0 ? amountAtOrAfter(block, amountIndex, 1) : undefined;
    if (lineTotal === undefined) continue;

    const details = block
      .slice(0, amountIndex >= 0 ? amountIndex : block.length)
      .filter((line) => line !== ".")
      .join(" · ");

    items.push(buildItem(name, details, Math.abs(lineTotal), products));
    index = cursor - 1;
  }

  return items;
}

export function parseReceiptText(text: string, products: ProductSuggestion[]): ParsedReceipt {
  const lines = text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const warnings: string[] = [];
  const items: PurchaseItemInput[] = [];

  for (const line of lines) {
    const delimited = parseDelimitedLine(line, products);
    if (delimited) items.push(delimited);
  }

  if (!items.length) {
    items.push(...parseAmazonBlocks(lines, products));
  }

  if (!items.length) {
    for (let index = 0; index < lines.length; index += 1) {
      const amount = amountAtOrAfter(lines, index, 1);
      const line = lines[index];
      if (amount === undefined || looksLikeSummary(line) || /^(?:AED|DHS?|د\.إ)$/i.test(line)) continue;

      const nameOnSameLine = line.replace(inlineAmountPattern, "").trim().replace(/[•·|\-–—]+$/, "").trim();
      let name = nameOnSameLine;
      let details = "";

      if (!name || plainNumberPattern.test(name)) {
        const previous = lines[index - 1] ?? "";
        const beforePrevious = lines[index - 2] ?? "";
        if (sizePattern.test(previous) || countPattern.test(previous) || packPattern.test(previous)) {
          details = previous;
          name = beforePrevious;
        } else {
          name = previous;
        }
      }

      if (!name || looksLikeSummary(name) || asinPattern.test(name) || amount < 0) continue;
      items.push(buildItem(name, details, Math.abs(amount), products));
    }
  }

  if (!items.length) {
    warnings.push("No items were detected. Paste the full order text, or use one item per line: Product | quantity | price");
  }

  const discount = findSummaryAmount(lines, /(discount|offers?)/i);
  const deliveryLabelIndex = lines.findIndex((line) => /delivery/i.test(line));
  const deliveryFee = deliveryLabelIndex >= 0 && /free/i.test(lines[deliveryLabelIndex + 1] ?? "")
    ? 0
    : findSummaryAmount(lines, /delivery/i);
  const tax = findSummaryAmount(lines, /^(tax|vat)$/i);
  const total = findSummaryAmount(lines, /(you\s*pay|grand\s*total|order\s*total|amount\s*paid)/i);

  return { items, discount, deliveryFee, tax, total, warnings };
}
