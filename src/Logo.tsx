import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { C } from './theme';

/**
 * Fakka logo — a stack of three coins ("fakka" = small change).
 * Back coins in sky & pale blue, front coin white with a navy "ف" mark.
 * animated=true: coins drop in one by one, then a shine sweeps the front coin.
 */
export default function Logo({ size = 120, animated = false }: { size?: number; animated?: boolean }) {
  const coin = size * 0.62;
  const a = [useRef(new Animated.Value(animated ? 0 : 1)).current, useRef(new Animated.Value(animated ? 0 : 1)).current, useRef(new Animated.Value(animated ? 0 : 1)).current];
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    Animated.sequence([
      Animated.stagger(160, a.map(v => Animated.spring(v, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }))),
      Animated.timing(shine, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const drop = (v: Animated.Value) => ({
    opacity: v,
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.5, 0] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
    ],
  });

  const Coin = ({ bg, rim, style, anim, children }: any) => (
    <Animated.View style={[{ position: 'absolute', width: coin, height: coin, borderRadius: coin / 2, backgroundColor: bg,
      borderWidth: coin * 0.06, borderColor: rim, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style, drop(anim)]}>
      <View style={{ position: 'absolute', width: coin * 0.72, height: coin * 0.72, borderRadius: coin, borderWidth: 1.5, borderColor: rim, opacity: 0.6 }} />
      {children}
    </Animated.View>
  );

  return (
    <View style={{ width: size, height: size }}>
      {/* soft glow */}
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: C.accent, opacity: 0.18 }} />
      <Coin bg={C.pale} rim={C.sky} anim={a[0]} style={{ left: size * 0.04, top: size * 0.08 }} />
      <Coin bg={C.sky} rim={C.accent} anim={a[1]} style={{ left: size * 0.34, top: size * 0.06 }} />
      <Coin bg="#FFFFFF" rim={C.primary} anim={a[2]} style={{ left: size * 0.19, top: size * 0.32, shadowColor: C.navy, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
        <Text style={{ color: C.navy, fontSize: coin * 0.5, fontWeight: '900', marginTop: -coin * 0.06 }}>ف</Text>
        <Animated.View pointerEvents="none" style={[s.shine, { width: coin * 0.28, height: coin * 1.6,
          transform: [{ rotate: '25deg' }, { translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-coin, coin] }) }] }]} />
      </Coin>
    </View>
  );
}

const s = StyleSheet.create({
  shine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.75)' },
});
