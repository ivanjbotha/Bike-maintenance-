import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: { backgroundColor: theme.colors.surface },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <TabIcon name="view-dashboard" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Rides',
          tabBarIcon: ({ color, size }) => <TabIcon name="bike" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bikes"
        options={{
          title: 'Garage',
          tabBarIcon: ({ color, size }) => <TabIcon name="garage" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shops"
        options={{
          title: 'Shops',
          tabBarIcon: ({ color, size }) => <TabIcon name="map-marker" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon name="cog" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
