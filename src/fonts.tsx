// IBM Plex everywhere: English uses IBM Plex Sans, Arabic uses IBM Plex Sans Arabic (which also has Latin
// letters and numbers, so mixed text stays in one family). Custom fonts ship one file per weight, so these
// wrappers turn fontWeight into the right font file instead of letting the phone fake bold.
import React, { forwardRef } from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet, TextProps, TextInputProps, TextStyle } from 'react-native';
import {
  IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { getLang } from './i18n';
import { isRefined } from './theme';

export const FONTS = {
  IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
  IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold,
  Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, // English in the New design
};

const WEIGHT: Record<string, string> = {
  '100': '400Regular', '200': '400Regular', '300': '400Regular', '400': '400Regular', normal: '400Regular',
  '500': '500Medium', '600': '600SemiBold', '700': '700Bold', bold: '700Bold', '800': '700Bold', '900': '700Bold',
};

export const fontFor = (weight?: TextStyle['fontWeight']) =>
  (getLang() === 'ar' ? 'IBMPlexSansArabic_' : isRefined() ? 'Outfit_' : 'IBMPlexSans_') + (WEIGHT[String(weight ?? '400')] ?? '400Regular');

const withFont = (style: any) => {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style; // an explicit family (e.g. icons) wins
  return [style, { fontFamily: fontFor(flat.fontWeight), fontWeight: 'normal' as const }];
};

export const Text = forwardRef<RNText, TextProps>((p, ref) => <RNText ref={ref} {...p} style={withFont(p.style)} />);
// Number boxes show thousands separators while you type (10,000 vs 100,000).
// The app reads amounts with num() in ui.tsx, which ignores the commas.
export const withCommas = (text?: string) => {
  if (text == null) return text;
  const clean = String(text)
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))   // Arabic digits ١٢٣ → 123
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))   // Persian-style digits
    .replace(/٫/g, '.')                                          // Arabic decimal point
    .replace(/[^\d.]/g, '');
  if (!clean) return '';
  const [whole, ...rest] = clean.split('.');
  const grouped = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return rest.length ? `${grouped || '0'}.${rest.join('')}` : grouped;
};
const NUMERIC = ['numeric', 'decimal-pad', 'number-pad'];

export const TextInput = forwardRef<RNTextInput, TextInputProps>((p, ref) => {
  if (!NUMERIC.includes(p.keyboardType as string)) return <RNTextInput ref={ref} {...p} style={withFont(p.style)} />;
  return (
    <RNTextInput ref={ref} {...p} style={withFont(p.style)}
      value={p.value === undefined ? undefined : withCommas(p.value)}
      defaultValue={p.defaultValue === undefined ? undefined : withCommas(p.defaultValue)}
      onChangeText={p.onChangeText ? v => p.onChangeText!(withCommas(v) ?? '') : undefined} />
  );
});
