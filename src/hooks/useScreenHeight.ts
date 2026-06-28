import { useWindowDimensions, Platform } from 'react-native';

const TAB_BAR_HEIGHT = 60;

/**
 * On web, flex-1 cascading is unreliable. This returns the explicit pixel
 * height available to a tab screen (viewport minus the tab bar). On native,
 * returns undefined so flex-1 takes over.
 */
export function useScreenHeight(): number | undefined {
  const { height } = useWindowDimensions();
  if (Platform.OS !== 'web') return undefined;
  return height - TAB_BAR_HEIGHT;
}
