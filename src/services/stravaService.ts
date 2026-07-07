import * as SecureStore from 'expo-secure-store';
import { StravaActivity } from '../types';

const CLIENT_ID = ''; // Set your Strava client ID here
const CLIENT_SECRET = ''; // Set your Strava client secret here
const REDIRECT_URI = 'bikeservice://redirect';

const KEYS = {
  accessToken: 'strava_access_token',
  refreshToken: 'strava_refresh_token',
  expiresAt: 'strava_expires_at',
  athleteId: 'strava_athlete_id',
  lastSync: 'strava_last_sync',
};

export function getStravaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  });
  return `https://www.strava.com/oauth/mobile/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<boolean> {
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });
    const data = await res.json();
    if (!data.access_token) return false;
    await saveTokens(data);
    return true;
  } catch {
    return false;
  }
}

export async function refreshTokenIfNeeded(): Promise<boolean> {
  const expiresAt = await SecureStore.getItemAsync(KEYS.expiresAt);
  if (!expiresAt) return false;
  if (Date.now() / 1000 < Number(expiresAt) - 300) return true;

  const refreshToken = await SecureStore.getItemAsync(KEYS.refreshToken);
  if (!refreshToken) return false;
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    if (!data.access_token) return false;
    await saveTokens(data);
    return true;
  } catch {
    return false;
  }
}

export async function fetchNewActivities(): Promise<StravaActivity[]> {
  const ok = await refreshTokenIfNeeded();
  if (!ok) return [];

  const accessToken = await SecureStore.getItemAsync(KEYS.accessToken);
  if (!accessToken) return [];

  const lastSync = await SecureStore.getItemAsync(KEYS.lastSync);
  const after = lastSync ?? '0';

  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];

  const activities: StravaActivity[] = await res.json();
  await SecureStore.setItemAsync(KEYS.lastSync, String(Math.floor(Date.now() / 1000)));
  return activities.filter(
    (a) => a.sport_type === 'Ride' || a.sport_type === 'VirtualRide' || a.type === 'Ride'
  );
}

export async function isStravaConnected(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(KEYS.accessToken);
  return !!token;
}

export async function disconnectStrava(): Promise<void> {
  for (const key of Object.values(KEYS)) {
    await SecureStore.deleteItemAsync(key);
  }
}

async function saveTokens(data: {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
}): Promise<void> {
  await SecureStore.setItemAsync(KEYS.accessToken, data.access_token);
  await SecureStore.setItemAsync(KEYS.refreshToken, data.refresh_token);
  await SecureStore.setItemAsync(KEYS.expiresAt, String(data.expires_at));
  if (data.athlete?.id) {
    await SecureStore.setItemAsync(KEYS.athleteId, String(data.athlete.id));
  }
}
