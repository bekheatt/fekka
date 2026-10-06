import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { C, themed } from './theme';
import { fontFor } from './fonts';
import Logo from './Logo';
import { t } from './i18n';
import { APP_NAME } from './brand';

export default function Splash({ onDone }: { onDone: () => void }) {
  const text = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(text, { toValue: 1, duration: 400, delay: 450, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(out, { toValue: 0, duration: 250, useNativeDriver: true }).start(onDone);
    }, 1600); // about 1.8 seconds in total: long enough for the coins, the shine and the name
    return () => clearTimeout(t);
  }, []);

  const rise = { opacity: text, transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };

  return (
    <Animated.View style={[s.wrap, { opacity: out }]}>
      <View style={[s.ring, { width: 520, height: 520, borderRadius: 260, opacity: 0.08 }]} />
      <View style={[s.ring, { width: 360, height: 360, borderRadius: 180, opacity: 0.12 }]} />
      <Logo size={140} animated />
      <Animated.Text style={[s.name, { fontFamily: fontFor('700') }, rise]}>{APP_NAME}</Animated.Text>
      <Animated.Text style={[s.tag, { fontFamily: fontFor('400') }, rise]}>{t('Every pound, in its place.')}</Animated.Text>
    </Animated.View>
  );
}

const s = themed(() => StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  ring: { position: 'absolute', borderWidth: 2, borderColor: C.sky },
  name: { color: '#fff', fontSize: 42, letterSpacing: -0.5, marginTop: 22 },
  tag: { color: C.pale, fontSize: 16, marginTop: 6 },
}));
