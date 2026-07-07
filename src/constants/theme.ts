import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const brandGreen = '#22c55e';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandGreen,
    secondary: '#16a34a',
    background: '#f9fafb',
    surface: '#ffffff',
    surfaceVariant: '#f3f4f6',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brandGreen,
    secondary: '#16a34a',
    background: '#111827',
    surface: '#1f2937',
    surfaceVariant: '#374151',
  },
};
