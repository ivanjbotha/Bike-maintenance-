export interface GeocodeResult {
  lat: number;
  lon: number;
  label: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function searchLocations(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=jsonv2&limit=5`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Location search failed: ${response.status}`);
  const json = await response.json();
  return (json as any[]).map((r) => ({
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    label: r.display_name as string,
  }));
}
