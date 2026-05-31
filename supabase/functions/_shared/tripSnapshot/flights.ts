export interface FlightOption {
  price: number;
  airline: string;
  stops: number;
  duration: string;
  cabin?: string;
}

export interface FlightPreview {
  cheapest: FlightOption | null;
  fastest: FlightOption | null;
  premium: FlightOption | null;
  avgPrice: number;
  currency: string;
}

function durationToMinutes(duration: string): number {
  const h = duration.match(/(\d+)h/);
  const m = duration.match(/(\d+)m/);
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
}

function pickDistinct(
  offers: FlightOption[],
  used: Set<string>,
  selector: (list: FlightOption[]) => FlightOption | undefined,
): FlightOption | null {
  const key = (o: FlightOption) => `${o.airline}|${o.price}|${o.duration}|${o.stops}`;
  const primary = selector(offers);
  if (primary && !used.has(key(primary))) {
    used.add(key(primary));
    return primary;
  }
  for (const o of offers) {
    const k = key(o);
    if (!used.has(k)) {
      used.add(k);
      return o;
    }
  }
  return primary || offers[0] || null;
}

/** Build cheapest / fastest / premium trio from parsed offers */
export function buildFlightPreview(
  offers: FlightOption[],
  currency: string,
): FlightPreview | null {
  if (offers.length === 0) return null;

  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const byDuration = [...offers].sort(
    (a, b) => durationToMinutes(a.duration) - durationToMinutes(b.duration),
  );
  const byPriceDesc = [...offers].sort((a, b) => b.price - a.price);

  const businessLike = offers.filter((o) =>
    /business|first|premium|suite/i.test(o.cabin || '')
  );
  const premiumPool = businessLike.length > 0 ? businessLike : byPriceDesc;

  const used = new Set<string>();
  const cheapest = pickDistinct(sorted, used, (list) => list[0]);
  const fastest = pickDistinct(byDuration, used, (list) => list[0]);
  const premium = pickDistinct(premiumPool, used, (list) => list[0]);

  const prices = sorted.map((o) => o.price);
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;

  return {
    cheapest,
    fastest,
    premium,
    avgPrice: Math.round(avg),
    currency,
  };
}
