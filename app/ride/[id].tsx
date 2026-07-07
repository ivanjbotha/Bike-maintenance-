import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';

export default function RideDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="bodyMedium" style={{ padding: 20, color: '#6b7280' }}>Ride {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
