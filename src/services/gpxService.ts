import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';

export interface ParsedActivity {
  distanceKm: number;
  date: number;
  name: string;
}

export async function pickAndParseGpxFile(): Promise<ParsedActivity | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!asset.name?.toLowerCase().endsWith('.gpx')) {
    throw new Error('Please select a .gpx file');
  }

  const content = await readAsStringAsync(asset.uri, { encoding: 'utf8' });

  return parseGpxContent(content, asset.name?.replace('.gpx', '') ?? 'GPX Ride');
}

function parseGpxContent(xml: string, fallbackName: string): ParsedActivity {
  const nameMatch = xml.match(/<name>([^<]*)<\/name>/);
  const name = nameMatch?.[1] ?? fallbackName;

  const timeMatch = xml.match(/<time>([^<]*)<\/time>/);
  const date = timeMatch?.[1] ? new Date(timeMatch[1]).getTime() : Date.now();

  const trkptRegex = /<trkpt\s+lat="([\d.-]+)"\s+lon="([\d.-]+)"/g;
  const points: { lat: number; lon: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = trkptRegex.exec(xml)) !== null) {
    points.push({ lat: parseFloat(m[1]), lon: parseFloat(m[2]) });
  }

  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(points[i - 1], points[i]);
  }

  if (distanceKm === 0) {
    throw new Error('Could not calculate distance from GPX file');
  }

  return { distanceKm: Math.round(distanceKm * 100) / 100, date, name };
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
