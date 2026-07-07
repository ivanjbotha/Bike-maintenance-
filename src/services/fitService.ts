import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import FitParser from 'fit-file-parser';

export interface ParsedActivity {
  distanceKm: number;
  date: number;
  name: string;
}

export async function pickAndParseFitFile(): Promise<ParsedActivity | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!asset.name?.toLowerCase().endsWith('.fit')) {
    throw new Error('Please select a .fit file');
  }

  const base64 = await readAsStringAsync(asset.uri, { encoding: 'base64' });

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Promise((resolve, reject) => {
    const parser = new FitParser({ force: true, mode: 'cascade' });
    parser.parse(bytes.buffer, (err: any, data: any) => {
      if (err) return reject(new Error(`Failed to parse FIT file: ${String(err)}`));
      try {
        const session = data?.activity?.sessions?.[0];
        const sport = session?.sport ?? '';
        if (sport && !['cycling', 'biking', 'virtual_activity'].includes(sport.toLowerCase())) {
          return reject(new Error(`Not a cycling activity (sport: ${sport})`));
        }
        const distanceM = session?.total_distance ?? 0;
        const startTime = data?.activity?.timestamp ?? new Date();
        resolve({
          distanceKm: distanceM / 1000,
          date: new Date(startTime).getTime(),
          name: asset.name?.replace('.fit', '') ?? 'FIT Ride',
        });
      } catch (e: any) {
        reject(new Error('Could not read activity data from FIT file'));
      }
    });
  });
}
