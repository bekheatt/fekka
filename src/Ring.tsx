import React from 'react';
import { View } from 'react-native';

// Circular progress ring drawn with plain Views (no extra library needed).
// Two clipped halves; each holds a half-coloured circle that rotates into view.
export default function Ring({ size, stroke, value, color, track, children }:
  { size: number; stroke: number; value: number; color: string; track: string; children?: React.ReactNode }) {
  const p = Math.max(0, Math.min(1, value));
  const half = (rot: number) => ({
    position: 'absolute' as const, width: size, height: size, borderRadius: size / 2, borderWidth: stroke,
    borderTopColor: color, borderRightColor: color, borderBottomColor: 'transparent', borderLeftColor: 'transparent',
    transform: [{ rotate: `${rot}deg` }],
  });
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: track }} />
      {/* right side: 0 → 50% */}
      <View style={{ position: 'absolute', left: size / 2, width: size / 2, height: size, overflow: 'hidden' }}>
        <View style={[half(-135 + 360 * Math.min(p, 0.5)), { left: -size / 2 }]} />
      </View>
      {/* left side: 50 → 100% */}
      <View style={{ position: 'absolute', left: 0, width: size / 2, height: size, overflow: 'hidden' }}>
        <View style={half(45 + 360 * Math.max(0, p - 0.5))} />
      </View>
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}
