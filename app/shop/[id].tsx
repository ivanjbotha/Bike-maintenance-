import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Surface, Button, TextInput, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { getShopById, updateShopNotes } from '../../src/db/queries/shops';
import { CachedShop } from '../../src/types';

export default function ShopDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<CachedShop | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getShopById(id).then((s) => {
      if (s) {
        setShop(s);
        setNotes(s.userNotes ?? '');
      }
    });
  }, [id]);

  async function handleSaveNotes() {
    setSaving(true);
    await updateShopNotes(id, notes);
    setSaving(false);
    Alert.alert('Saved', 'Notes updated.');
  }

  if (!shop) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.header} elevation={2}>
        <MaterialCommunityIcons name="bike" size={40} color={theme.colors.primary} />
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>{shop.name}</Text>
        {shop.address && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
            <Text variant="bodyMedium" style={{ color: '#6b7280', flex: 1 }}>{shop.address}</Text>
          </View>
        )}
        {shop.openingHours && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
            <Text variant="bodyMedium" style={{ color: '#6b7280', flex: 1 }}>{shop.openingHours}</Text>
          </View>
        )}
        <View style={styles.btnRow}>
          {shop.phone && (
            <Button mode="outlined" icon="phone" onPress={() => Linking.openURL(`tel:${shop.phone}`)} compact>
              Call
            </Button>
          )}
          {shop.website && (
            <Button mode="outlined" icon="web" onPress={() => Linking.openURL(shop.website!)} compact>
              Website
            </Button>
          )}
          <Button
            mode="outlined"
            icon="map"
            onPress={() => Linking.openURL(`https://maps.apple.com/?q=${shop.lat},${shop.lon}`)}
            compact
          >
            Directions
          </Button>
        </View>
      </Surface>

      <Divider style={styles.divider} />
      <View style={styles.notesSection}>
        <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 8 }}>
          My Notes
        </Text>
        <Text variant="bodySmall" style={{ color: '#9ca3af', marginBottom: 12 }}>
          Record parts availability, prices, or anything useful.
        </Text>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={6}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Has 11-spd chains in stock. Shimano 105 cassette ~R450."
          style={styles.notesInput}
        />
        <Button mode="contained" onPress={handleSaveNotes} loading={saving} icon="content-save">
          Save Notes
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { margin: 16, borderRadius: 14, padding: 20, gap: 12, alignItems: 'flex-start' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  divider: { marginVertical: 8, marginHorizontal: 16 },
  notesSection: { padding: 16, gap: 4 },
  notesInput: { marginBottom: 12 },
});
