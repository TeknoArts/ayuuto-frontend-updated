// Android: Use Ionicons to match iOS SF Symbols pixel-for-pixel.
// Uses -sharp variant for filled icons to match iOS .fill style.

import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Text, OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// SF Symbol name -> Ionicons name (-sharp = filled, matches iOS .fill style)
const MAPPING: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'house.fill': 'home-sharp',
  'paperplane.fill': 'send-sharp',
  'chevron.left.forwardslash.chevron.right': 'code-sharp',
  'chevron.right': 'chevron-forward',
  'chevron.left': 'chevron-back',
  'flag.fill': 'flag-sharp',
  'plus': 'add',
  'dollarsign.circle.fill': 'cash-sharp', // overridden in render: show $ on Android
  'gearshape.fill': 'settings-sharp',
  'envelope.fill': 'mail-sharp',
  'envelope': 'mail-open',
  'lock.fill': 'lock-closed-sharp',
  'eye.fill': 'eye-sharp',
  'eye.slash.fill': 'eye-off-sharp',
  'person.fill': 'person-sharp',
  'person.badge.plus': 'person-add-sharp',
  'phone.fill': 'phone-portrait-sharp',
  'party.popper.fill': 'gift-sharp',
  'arrow.clockwise': 'refresh',
  'checkmark.circle.fill': 'checkmark-circle-sharp',
  'checkmark': 'checkmark',
  'trash.fill': 'trash-sharp',
  'pencil': 'pencil',
  'dice.fill': 'dice-sharp',
  'clock.fill': 'time',
  'chevron.up': 'chevron-up',
  'chevron.down': 'chevron-down',
  'minus.circle.fill': 'remove-circle-sharp',
  'plus.circle.fill': 'add-circle-sharp',
  'xmark.circle.fill': 'close-circle-sharp',
  'xmark': 'close',
  'info.circle.fill': 'information-circle-sharp',
  'exclamationmark.circle.fill': 'alert-circle-sharp',
  'exclamationmark.triangle.fill': 'warning',
  'square.and.arrow.up': 'share-sharp',
  'trophy.fill': 'trophy-sharp',
  'doc.text.fill': 'document-text',
  'rectangle.portrait.and.arrow.right': 'log-out',
  'globe': 'globe',
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Icon component for Android - uses Ionicons with ios- prefix to match iOS SF Symbols
 * pixel-for-pixel with iOS SF Symbols. Same icon style for consistent cross-platform appearance.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string;
}) {
  // Android: show dollar sign ($) instead of cash icon for savings card
  if (name === 'dollarsign.circle.fill') {
    return (
      <Text
        style={[
          {
            fontSize: size,
            color: color as string,
            fontWeight: '700',
            lineHeight: size,
          },
          style,
        ]}>
        $
      </Text>
    );
  }
  const ioniconName = MAPPING[name] || 'help-circle';
  return (
    <Ionicons
      name={ioniconName}
      size={size}
      color={color as string}
      style={style}
    />
  );
}
