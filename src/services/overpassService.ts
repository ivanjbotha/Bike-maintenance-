import { CachedShop } from '../types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function fetchNearbyBikeShops(
  lat: number,
  lon: number,
  radiusMeters = 8000
): Promise<CachedShop[]> {
  const query = `
[out:json][timeout:20];
(
  node["shop"="bicycle"](around:${radiusMeters},${lat},${lon});
  way["shop"="bicycle"](around:${radiusMeters},${lat},${lon});
  node["amenity"="bicycle_repair_station"](around:${radiusMeters},${lat},${lon});
  node["service:bicycle:repair"="yes"](around:${radiusMeters},${lat},${lon});
);
out body center;
  `.trim();

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!response.ok) throw new Error(`Overpass error: ${response.status}`);

  const json = await response.json();
  const now = Date.now();

  return (json.elements as OverpassElement[])
    .filter((el) => el.lat !== undefined || el.center !== undefined)
    .map((el) => {
      const elLat = el.lat ?? el.center!.lat;
      const elLon = el.lon ?? el.center!.lon;
      const tags = el.tags ?? {};
      const address = buildAddress(tags);
      return {
        id: `osm-${el.id}`,
        name: tags.name ?? tags['name:en'] ?? 'Bike Shop',
        lat: elLat,
        lon: elLon,
        address,
        phone: tags.phone ?? tags['contact:phone'] ?? null,
        website: tags.website ?? tags['contact:website'] ?? null,
        openingHours: tags.opening_hours ?? null,
        tags: JSON.stringify(tags),
        userNotes: null,
        cachedAt: now,
      };
    });
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
