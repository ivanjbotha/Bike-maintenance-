import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, List } from 'react-native-paper';
import { searchLocations, GeocodeResult } from '../../services/geocodingService';
import { useAppStore } from '../../store/appStore';

export function LocationPicker() {
  const { searchLocation, setSearchLocation } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const found = await searchLocations(query);
      setResults(found);
      if (found.length === 0) setError('No matches found. Try a different search.');
    } catch (e: any) {
      setError(e.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(result: GeocodeResult) {
    setSearchLocation(result);
    setResults([]);
    setQuery('');
  }

  return (
    <View style={styles.wrapper}>
      {searchLocation && (
        <View style={styles.current}>
          <Text variant="bodyMedium" style={{ fontWeight: '600' }} numberOfLines={2}>
            📍 {searchLocation.label}
          </Text>
          <Button compact mode="text" onPress={() => setSearchLocation(null)}>
            Use device location instead
          </Button>
        </View>
      )}

      <View style={styles.searchRow}>
        <TextInput
          mode="outlined"
          dense
          placeholder="Search a city or address, e.g. Ho Chi Minh City"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          style={styles.input}
        />
        <Button mode="contained" onPress={handleSearch} loading={loading} compact style={styles.searchBtn}>
          Search
        </Button>
      </View>

      {error && (
        <Text variant="bodySmall" style={styles.error}>
          {error}
        </Text>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      {results.map((r, i) => (
        <List.Item
          key={`${r.lat}-${r.lon}-${i}`}
          title={r.label}
          titleNumberOfLines={2}
          left={(props) => <List.Icon {...props} icon="map-marker" />}
          onPress={() => handleSelect(r)}
          style={styles.resultItem}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  current: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1 },
  searchBtn: { alignSelf: 'stretch', justifyContent: 'center' },
  error: { color: '#ef4444' },
  resultItem: { paddingHorizontal: 0, marginHorizontal: -8 },
});
