import type {
  ProductSuggestion,
  PurchaseItemInput,
  PurchaseUnit,
} from "@/features/purchases/types/purchase";

export type ReceiptSource = "amazon" | "nesto" | "generic" | "unknown";

export type ParsedReceipt = {
  source: ReceiptSource;
  items: PurchaseItemInput[];
  tax?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  warnings: string[];
};

const inlineAmountPattern = /(?:AED|DHS?|د\.إ)\s*(-?\d+(?:[.,]\d{1,2})?)|(-?\d+(?:[.,]\d{1,2})?)\s*(?:AED|DHS?|د\.إ)/i;
const exactAmountPattern = /^(?:AED|DHS?|د\.إ)\s*(-?\d+(?:[.,]\d{1,2})?)$/i;
const plainNumberPattern = /^-?\d+(?:[.,]\d{1,2})?$/;
const asinPattern = /^B[A-Z0-9]{9}$/i;
const barcodePattern = /^\d{11,20}$/;
const arabicPattern = /[\u0600-\u06ff]/;
const nestoQuantityPattern = /^Qty\s+(\d+(?:[.,]\d+)?)\s+(EA|KG|PAC|PACK|PCS?|BOX)\s*[×x]\s*(?:AED\s*)?(\d+(?:[.,]\d+)?)/i;

function numberFrom(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function inlineAmountFrom(line: string): number | undefined {
  const match = line.match(inlineAmountPattern);
  return numberFrom(match?.[1] ?? match?.[2]);
}

function exactAmountFrom(line: string): number | undefined {
  const match = line.match(exactAmountPattern);
  return numberFrom(match?.[1]);
}

function normalizeUnit(raw: string | undefined): PurchaseUnit | null {
  switch (raw?.trim().toLowerCase()) {
    case "ea":
    case "pc":
    case "pcs":
    case "piece":
    case "pieces":
    case "unit":
    case "units":
      return "piece";
    case "pac":
    case "pack":
      return "pack";
    case "box":
      return "box";
    case "kg":
      return "kg";
    case "g":
    case "gm":
    case "gms":
      return "g";
    case "ml":
      return "ml";
    case "l":
    case "lt":
    case "ltr":
    case "litre":
    case "liter":
      return "l";
    default:
      return null;
  }
}

function looksLikeSummary(line: string): boolean {
  return /(bill\s*summary|items?\s*total|subtotal|delivery|discount|offer|you\s*pay|grand\s*total|order\s*total|total\s*paid|payment|\b(?:tax|vat|gst)\b|inclusive\s+of\s+taxes|invoice\s+no|terms\s*&\s*conditions)/i.test(line);
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

function cleanProductName(value: string): string {
  return value
    .replace(/\s*\(Taxable\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function extractPackageDetails(value: string): {
  packageSize: number | null;
  packageUnit: PurchaseUnit | null;
} {
  const normalized = value.replace(/,/g, " ").replace(/\s+/g, " ");

  // 2x200g / 3 x 54 gm / 330ml x 6 => store the total package content.
  const multiplied = normalized.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|gm|ml|l|litre|liter)\b/i)
    ?? normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|ml|l|litre|liter)\s*[x×]\s*(\d+(?:\.\d+)?)/i);

  if (multiplied) {
    const firstFormat = /[x×]\s*\d+(?:\.\d+)?\s*(kg|g|gm|ml|l|litre|liter)/i.test(multiplied[0]);
    const count = numberFrom(firstFormat ? multiplied[1] : multiplied[3]);
    const size = numberFrom(firstFormat ? multiplied[2] : multiplied[1]);
    const unit = normalizeUnit(firstFormat ? multiplied[3] : multiplied[2]);

    if (count && size && unit) {
      return { packageSize: count * size, packageUnit: unit };
    }
  }

  // Avoid guessing from ranges such as 120/110gm or 300-350g.
  if (/\d+\s*[\/-]\s*\d+\s*(kg|g|gm|ml|l)\b/i.test(normalized)) {
    return { packageSize: null, packageUnit: null };
  }

  const sizeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|ml|l|litre|liter)\b/i);
  if (sizeMatch) {
    return {
      packageSize: numberFrom(sizeMatch[1]) ?? null,
      packageUnit: normalizeUnit(sizeMatch[2]),
    };
  }

  const piecesMatch = normalized.match(/(?:pack\s+of\s+|\b)(\d+(?:\.\d+)?)\s*(pcs?|pieces?)\b/i);
  if (piecesMatch) {
    return {
      packageSize: numberFrom(piecesMatch[1]) ?? null,
      packageUnit: "piece",
    };
  }

  return { packageSize: null, packageUnit: null };
}

function parseDelimitedLine(line: string, products: ProductSuggestion[]): PurchaseItemInput | null {
  const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : null;
  if (!delimiter) return null;

  const parts = line.split(delimiter).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const finalAmount = inlineAmountFrom(parts.at(-1) ?? "") ?? numberFrom(parts.at(-1));
  if (finalAmount === undefined) return null;

  const name = cleanProductName(parts[0]);
  const quantity = numberFrom(parts[1]) ?? 1;
  const existing = productDefaults(name, products);
  const packageDetails = extractPackageDetails(name);

  return {
    clientId: crypto.randomUUID(),
    name,
    quantity,
    unit: existing?.default_unit ?? "piece",
    packageSize: packageDetails.packageSize,
    packageUnit: packageDetails.packageUnit,
    unitPrice: finalAmount / quantity,
    categoryId: existing?.default_category_id ?? "",
  };
}

function buildAmazonItem(
  name: string,
  details: string,
  lineTotal: number,
  products: ProductSuggestion[],
): PurchaseItemInput {
  const quantityMatch = details.match(/\b(\d+(?:[.,]\d+)?)\s+units?\b/i);
  const quantity = numberFrom(quantityMatch?.[1]) ?? 1;
  const packageDetails = extractPackageDetails(`${name} ${details}`);
  const cleanedName = cleanProductName(name);
  const existing = productDefaults(cleanedName, products);

  return {
    clientId: crypto.randomUUID(),
    name: cleanedName,
    quantity,
    unit: existing?.default_unit ?? "piece",
    packageSize: packageDetails.packageSize,
    packageUnit: packageDetails.packageUnit,
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

    items.push(buildAmazonItem(name, details, Math.abs(lineTotal), products));
    index = cursor - 1;
  }

  return items;
}

function isNestoNoise(line: string): boolean {
  return (
    !line
    || line === "."
    || arabicPattern.test(line)
    || /^\d{1,2}$/.test(line)
    || barcodePattern.test(line)
    || /^\(Taxable\)$/i.test(line)
    || exactAmountFrom(line) !== undefined
    || nestoQuantityPattern.test(line)
    || looksLikeSummary(line)
  );
}

function findNestoName(lines: string[], quantityIndex: number, previousQuantityIndex: number): string | null {
  for (let index = quantityIndex - 1; index > previousQuantityIndex; index -= 1) {
    const line = lines[index];
    if (isNestoNoise(line)) continue;
    if (!/[A-Za-z]/.test(line)) continue;

    // Some names have (Taxable) on a separate line, or wrap over two English lines.
    const previous = lines[index - 1];
    const combined = previous
      && index - 1 > previousQuantityIndex
      && !isNestoNoise(previous)
      && /[A-Za-z]/.test(previous)
      ? `${previous} ${line}`
      : line;

    return cleanProductName(combined);
  }

  return null;
}

function findNestoLineTotal(
  lines: string[],
  quantityIndex: number,
  nextQuantityIndex: number,
): number | undefined {
  for (let index = quantityIndex + 1; index < nextQuantityIndex; index += 1) {
    const line = lines[index];
    if (looksLikeSummary(line)) break;

    const amount = exactAmountFrom(line);
    if (amount !== undefined) return Math.abs(amount);
  }

  return undefined;
}

function parseNestoBlocks(lines: string[], products: ProductSuggestion[]): PurchaseItemInput[] {
  const items: PurchaseItemInput[] = [];
  const quantityIndexes = lines
    .map((line, index) => (nestoQuantityPattern.test(line) ? index : -1))
    .filter((index) => index >= 0);

  quantityIndexes.forEach((quantityIndex, position) => {
    const quantityLine = lines[quantityIndex];
    const quantityMatch = quantityLine.match(nestoQuantityPattern);
    if (!quantityMatch) return;

    const previousQuantityIndex = position > 0 ? quantityIndexes[position - 1] : -1;
    const nextQuantityIndex = position + 1 < quantityIndexes.length
      ? quantityIndexes[position + 1]
      : lines.length;
    const name = findNestoName(lines, quantityIndex, previousQuantityIndex);
    if (!name) return;

    const receiptQuantity = numberFrom(quantityMatch[1]) ?? 1;
    const rawUnit = quantityMatch[2];
    const receiptUnitPrice = numberFrom(quantityMatch[3]);
    const receiptUnit = normalizeUnit(rawUnit) ?? "piece";
    if (receiptUnitPrice === undefined) return;

    const printedLineTotal = findNestoLineTotal(lines, quantityIndex, nextQuantityIndex);
    const existing = productDefaults(name, products);

    // Nesto uses KG as the sold weight. In Masroufi, Qty means how many
    // products/packs were bought, while the weight belongs in Package size.
    // Example: Qty 0.55 KG × AED 7 with line total AED 3.82 becomes:
    // Qty 1, Package size 550 g, Price each 3.82 AED.
    const isWeightedItem = receiptUnit === "kg";
    const quantity = isWeightedItem ? 1 : receiptQuantity;
    const unit: PurchaseUnit = isWeightedItem ? "piece" : receiptUnit;
    const packageDetails = isWeightedItem
      ? {
          packageSize: Math.round(receiptQuantity * 1000 * 1000) / 1000,
          packageUnit: "g" as PurchaseUnit,
        }
      : extractPackageDetails(name);
    const unitPrice = isWeightedItem
      ? printedLineTotal ?? roundMoney(receiptQuantity * receiptUnitPrice)
      : receiptUnitPrice;

    items.push({
      clientId: crypto.randomUUID(),
      name,
      quantity,
      unit,
      packageSize: packageDetails.packageSize,
      packageUnit: packageDetails.packageUnit,
      unitPrice,
      categoryId: existing?.default_category_id ?? "",
    });
  });

  return items;
}

function detectSource(lines: string[]): ReceiptSource {
  const joined = lines.join("\n");

  if (
    /NESTO\s+HYPERMARKET/i.test(joined)
    || /Subtotal\s*\(excl\.\s*GST\)/i.test(joined)
    || /Total\s+Paid\s+(?:AED|DHS?)/i.test(joined)
    || lines.some((line) => nestoQuantityPattern.test(line))
  ) {
    return "nesto";
  }

  if (
    lines.some((line) => asinPattern.test(line))
    || (/bill\s*summary/i.test(joined) && /you\s*pay/i.test(joined))
  ) {
    return "amazon";
  }

  return lines.length ? "generic" : "unknown";
}

function parseGeneric(lines: string[], products: ProductSuggestion[]): PurchaseItemInput[] {
  const items: PurchaseItemInput[] = [];

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
      if (extractPackageDetails(previous).packageSize !== null) {
        details = previous;
        name = beforePrevious;
      } else {
        name = previous;
      }
    }

    if (!name || looksLikeSummary(name) || asinPattern.test(name) || amount < 0) continue;
    items.push(buildAmazonItem(name, details, Math.abs(amount), products));
  }

  return items;
}

export function parseReceiptText(text: string, products: ProductSuggestion[]): ParsedReceipt {
  const lines = text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const source = detectSource(lines);
  const warnings: string[] = [];
  let items: PurchaseItemInput[] = [];

  for (const line of lines) {
    const delimited = parseDelimitedLine(line, products);
    if (delimited) items.push(delimited);
  }

  if (!items.length && source === "nesto") {
    items = parseNestoBlocks(lines, products);
  }

  if (!items.length && source === "amazon") {
    items = parseAmazonBlocks(lines, products);
  }

  if (!items.length) {
    items = parseGeneric(lines, products);
  }

  if (!items.length) {
    warnings.push("No items were detected. Paste the full Amazon or Nesto receipt text, or use one item per line: Product | quantity | price");
  }

  if (source === "generic" && items.length) {
    warnings.push("This receipt format was parsed using the generic importer. Review the detected items before saving.");
  }

  const discount = source === "nesto"
    ? undefined
    : findSummaryAmount(lines, /(discount|offers?)/i);

  const deliveryLabelIndex = lines.findIndex((line) => /delivery/i.test(line));
  const deliveryFee = source === "nesto"
    ? undefined
    : deliveryLabelIndex >= 0 && /free/i.test(lines[deliveryLabelIndex + 1] ?? "")
      ? 0
      : findSummaryAmount(lines, /delivery/i);

  const tax = source === "nesto"
    ? findSummaryAmount(lines, /(VAT\/GST|VAT|GST)/i)
    : findSummaryAmount(lines, /^(tax|vat)$/i);

  const total = source === "nesto"
    ? findSummaryAmount(lines, /total\s*paid/i)
    : findSummaryAmount(lines, /(you\s*pay|grand\s*total|order\s*total|amount\s*paid)/i);

  return { source, items, discount, deliveryFee, tax, total, warnings };
}
