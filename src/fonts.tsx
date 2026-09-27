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
import { getLang } from './i18n';

export const FONTS = {
  IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
  IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold,
};

const WEIGHT: Record<string, string> = {
  '100': '400Regular', '200': '400Regular', '300': '400Regular', '400': '400Regular', normal: '400Regular',
  '500': '500Medium', '600': '600SemiBold', '700': '700Bold', bold: '700Bold', '800': '700Bold', '900': '700Bold',
};

export const fontFor = (weight?: TextStyle['fontWeight']) =>
  (getLang() === 'ar' ? 'IBMPlexSansArabic_' : 'IBMPlexSans_') + (WEIGHT[String(weight ?? '400')] ?? '400Regular');

const withFont = (style: any) => {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style; // an explicit family (e.g. icons) wins
  return [style, { fontFamily: fontFor(flat.fontWeight), fontWeight: 'normal' as const }];
};

export const Text = forwardRef<RNText, TextProps>((p, ref) => <RNText ref={ref} {...p} style={withFont(p.style)} />);
export const TextInput = forwardRef<RNTextInput, TextInputProps>((p, ref) => <RNTextInput ref={ref} {...p} style={withFont(p.style)} />);
