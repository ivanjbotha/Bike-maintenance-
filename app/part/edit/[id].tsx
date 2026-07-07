import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function EditPartScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="bodyMedium" style={{ padding: 20, color: '#6b7280' }}>Edit part (coming soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
