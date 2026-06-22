import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance, Platform } from 'react-native';
import { colorScheme as nwColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setThemeScheme } from './theme';
import { setUnitsValue } from './units';
import { getTelegramWebApp } from './telegram';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Units = 'mi' | 'km';
export type Locale = 'en' | 'ru';

type SettingsValue = {
  theme: ThemeMode;
  scheme: 'light' | 'dark'; // resolved (system → device/Telegram)
  units: Units;
  locale: Locale;
  onboarded: boolean;
  appLock: boolean;
  setTheme: (m: ThemeMode) => void;
  setUnits: (u: Units) => void;
  setLocale: (l: Locale) => void;
  setOnboarded: (v: boolean) => void;
  setAppLock: (v: boolean) => void;
};

const Ctx = createContext<SettingsValue | null>(null);

const KEYS = {
  theme: 'huntms.theme',
  units: 'huntms.units',
  locale: 'huntms.locale',
  onboarded: 'huntms.onboarded',
  appLock: 'huntms.applock',
} as const;

// Web reads synchronously from localStorage (no flash); native starts on the
// fallback and hydrates from AsyncStorage right after mount (see effect below).
function load<T extends string>(key: string, fallback: T): T {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return fallback;
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {}
    return;
  }
  // native: persist across cold launches
  AsyncStorage.setItem(key, value).catch(() => {});
}

function systemScheme(): 'light' | 'dark' {
  // Telegram tells us its theme; otherwise fall back to the OS/browser.
  const tg = getTelegramWebApp();
  if (tg && (tg as { colorScheme?: string }).colorScheme) {
    return (tg as { colorScheme?: string }).colorScheme === 'dark' ? 'dark' : 'light';
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => load<ThemeMode>(KEYS.theme, 'system'));
  const [units, setUnitsState] = useState<Units>(() => load<Units>(KEYS.units, 'mi'));
  const [locale, setLocaleState] = useState<Locale>(() => load<Locale>(KEYS.locale, 'en'));
  const [onboarded, setOnboardedState] = useState<boolean>(() => load(KEYS.onboarded, '') === '1');
  const [appLock, setAppLockState] = useState<boolean>(() => load(KEYS.appLock, '') === '1');
  const [sysScheme, setSysScheme] = useState<'light' | 'dark'>(() =>
    Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android' ? systemScheme() : 'light',
  );

  const scheme: 'light' | 'dark' = theme === 'system' ? sysScheme : theme;

  // Keep module-level helpers in sync DURING render (not in an effect) so the
  // values are correct on the very render that the scheme changes. The `C` color
  // proxy reads getThemeScheme(); if we only set it in an effect, inline C.*
  // colors (e.g. the Switch thumb/track) lag one render behind on theme switch
  // and never catch up — every consumer renders before the effect runs.
  setThemeScheme(scheme);
  setUnitsValue(units);

  // Native: hydrate persisted settings from AsyncStorage on mount (web already
  // read them synchronously above). Runs once; completes well before the splash
  // timer in index.tsx routes on `onboarded`.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(KEYS));
        if (cancelled) return;
        const map = Object.fromEntries(entries) as Record<string, string | null>;
        const t = map[KEYS.theme];
        if (t === 'light' || t === 'dark' || t === 'system') setThemeState(t);
        const u = map[KEYS.units];
        if (u === 'mi' || u === 'km') setUnitsState(u);
        const l = map[KEYS.locale];
        if (l === 'en' || l === 'ru') setLocaleState(l);
        if (map[KEYS.onboarded] != null) setOnboardedState(map[KEYS.onboarded] === '1');
        if (map[KEYS.appLock] != null) setAppLockState(map[KEYS.appLock] === '1');
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track OS theme changes while on "system"
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => setSysScheme(systemScheme()));
    return () => sub.remove();
  }, []);

  // Apply the resolved scheme everywhere
  useEffect(() => {
    setThemeScheme(scheme);
    // Pass the *resolved* scheme — NativeWind's web set('system') would strip the
    // dark class even when the OS is dark.
    try {
      nwColorScheme.set(scheme);
    } catch {}
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', scheme === 'dark');
      const bg = scheme === 'dark' ? '#0a0a0b' : '#ffffff';
      const tg = getTelegramWebApp();
      try {
        (tg as { setBackgroundColor?: (c: string) => void })?.setBackgroundColor?.(bg);
        (tg as { setHeaderColor?: (c: string) => void })?.setHeaderColor?.(bg);
      } catch {}
    }
  }, [scheme, theme]);

  const setTheme = (m: ThemeMode) => {
    setThemeState(m);
    save(KEYS.theme, m);
  };
  const setUnits = (u: Units) => {
    setUnitsState(u);
    save(KEYS.units, u);
  };
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    save(KEYS.locale, l);
  };
  const setOnboarded = (v: boolean) => {
    setOnboardedState(v);
    save(KEYS.onboarded, v ? '1' : '');
  };
  const setAppLock = (v: boolean) => {
    setAppLockState(v);
    save(KEYS.appLock, v ? '1' : '');
  };

  return (
    <Ctx.Provider
      value={{
        theme,
        scheme,
        units,
        locale,
        onboarded,
        appLock,
        setTheme,
        setUnits,
        setLocale,
        setOnboarded,
        setAppLock,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
