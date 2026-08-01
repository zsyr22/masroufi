import "server-only";

import type { FuelType } from "@/features/fuel/types/fuel";

export type UaeFuelPrices = Partial<Record<FuelType, number>>;

export type UaeFuelPriceResult = {
  prices: UaeFuelPrices;
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;
};

const SOURCES = [
  {
    name: "ADNOC Distribution",
    url: "https://www.adnocdistribution.ae/en/consumer-fuel",
  },
  {
    name: "ADAD",
    url: "https://adad.ae/fuel-prices",
  },
  {
    name: "Brothers Gas",
    url: "https://www.brothersgas.com/fuel-prices-uae/",
  },
] as const;

const PRICE_MIN = 1;
const PRICE_MAX = 10;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#8211;|&#x2013;/gi, "–")
    .replace(/&#8212;|&#x2014;/gi, "—")
    .replace(/&#58;/gi, ":")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code))
    );
}

function htmlToSearchableText(html: string) {
  // Keep JSON-LD and other script text because some sites publish prices there.
  return decodeHtmlEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\\\//g, "/")
      .replace(/\\n|\\r|\\t/g, " ")
      .replace(/\s+/g, " ")
  ).trim();
}

function isValidPrice(value: number) {
  return Number.isFinite(value) && value >= PRICE_MIN && value <= PRICE_MAX;
}

function findPriceNearLabel(text: string, aliases: string[]) {
  const lowerText = text.toLowerCase();

  for (const alias of aliases) {
    let searchFrom = 0;
    const lowerAlias = alias.toLowerCase();

    while (searchFrom < lowerText.length) {
      const labelIndex = lowerText.indexOf(lowerAlias, searchFrom);

      if (labelIndex === -1) {
        break;
      }

      const start = Math.max(0, labelIndex - 180);
      const end = Math.min(
        text.length,
        labelIndex + alias.length + 180
      );
      const fragment = text.slice(start, end);
      const labelPosition = labelIndex - start;

      const candidates = [
        ...fragment.matchAll(
          /(?:AED|Dhs?|Dh)?\s*(\d+(?:\.\d{1,4})?)\s*(?:AED|Dhs?|Dh|per\s*lit(?:re|er)|\/\s*[lL])?/gi
        ),
      ]
        .map((match) => {
          const value = Number(match[1]);
          const index = match.index ?? 0;

          return {
            value,
            distance: Math.abs(index - labelPosition),
            hasDecimal: match[1].includes("."),
          };
        })
        .filter(
          ({ value, hasDecimal }) => hasDecimal && isValidPrice(value)
        )
        .sort((a, b) => a.distance - b.distance);

      if (candidates[0]) {
        return candidates[0].value;
      }

      searchFrom = labelIndex + lowerAlias.length;
    }
  }

  return undefined;
}

function parseFuelPrices(html: string): UaeFuelPrices {
  const text = htmlToSearchableText(html);

  return {
    super_98: findPriceNearLabel(text, [
      "Super 98",
      'Super "98"',
      "Super “98”",
      "98 Super",
    ]),
    special_95: findPriceNearLabel(text, [
      "Special 95",
      "Super 95",
      'Special "95"',
      "Special “95”",
      "95 Special",
    ]),
    e_plus_91: findPriceNearLabel(text, [
      "E-Plus 91",
      "E Plus 91",
      "E-plus 91",
      'E-Plus "91"',
      "E-Plus “91”",
      "91 E-Plus",
    ]),
    diesel: findPriceNearLabel(text, [
      "Diesel",
      "Diesel price",
      "Gas oil",
    ]),
  };
}

function hasAnyPrice(prices: UaeFuelPrices) {
  return Object.values(prices).some(
    (value) => value !== undefined
  );
}

function mergePrices(
  current: UaeFuelPrices,
  incoming: UaeFuelPrices
): UaeFuelPrices {
  return {
    super_98: current.super_98 ?? incoming.super_98,
    special_95: current.special_95 ?? incoming.special_95,
    e_plus_91: current.e_plus_91 ?? incoming.e_plus_91,
    diesel: current.diesel ?? incoming.diesel,
  };
}

function hasAllPrices(prices: UaeFuelPrices) {
  return (
    prices.super_98 !== undefined &&
    prices.special_95 !== undefined &&
    prices.e_plus_91 !== undefined &&
    prices.diesel !== undefined
  );
}

async function fetchSource(source: (typeof SOURCES)[number]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(source.url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Masroufi/1.0; +https://github.com/zsyr22/masroufi)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(
        `${source.name} returned HTTP ${response.status}`
      );
    }

    const html = await response.text();
    const prices = parseFuelPrices(html);

    if (!hasAnyPrice(prices)) {
      throw new Error("No usable fuel prices were found.");
    }

    return prices;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getCurrentUaeFuelPrices(): Promise<UaeFuelPriceResult | null> {
  let prices: UaeFuelPrices = {};
  const successfulSources: string[] = [];
  const successfulUrls: string[] = [];

  for (const source of SOURCES) {
    try {
      const sourcePrices = await fetchSource(source);

      prices = mergePrices(prices, sourcePrices);
      successfulSources.push(source.name);
      successfulUrls.push(source.url);

      // Stop as soon as we have the complete monthly price set.
      if (hasAllPrices(prices)) {
        break;
      }
    } catch (error) {
      console.warn(
        `[fuel-prices] ${source.name} failed:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Important: partial results are still useful.
  // For example, if Special 95 was found, the form can use it even if
  // another source did not publish Diesel in parseable HTML.
  if (!hasAnyPrice(prices)) {
    return null;
  }

  return {
    prices,
    sourceName: successfulSources.join(" + "),
    sourceUrl: successfulUrls.join(", "),
    fetchedAt: new Date().toISOString(),
  };
}
