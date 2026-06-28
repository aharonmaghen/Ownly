import { I18nManager } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

export interface RTLHelpers {
  isRTL: boolean;
  /** Flex direction that respects RTL */
  row: 'row' | 'row-reverse';
  /** Text alignment */
  textAlign: 'left' | 'right';
  /** Start margin (left in LTR, right in RTL) */
  marginStart: 'marginLeft' | 'marginRight';
  /** End margin */
  marginEnd: 'marginRight' | 'marginLeft';
  /** Padding start */
  paddingStart: 'paddingLeft' | 'paddingRight';
  /** Flip chevron for back button */
  backIcon: 'chevron-back' | 'chevron-forward';
}

export function useRTL(): RTLHelpers {
  const isRTL = useSettingsStore((s) => s.settings.isRTL);
  return {
    isRTL,
    row: isRTL ? 'row-reverse' : 'row',
    textAlign: isRTL ? 'right' : 'left',
    marginStart: isRTL ? 'marginRight' : 'marginLeft',
    marginEnd: isRTL ? 'marginLeft' : 'marginRight',
    paddingStart: isRTL ? 'paddingRight' : 'paddingLeft',
    backIcon: isRTL ? 'chevron-forward' : 'chevron-back',
  };
}
