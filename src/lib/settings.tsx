import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance, Platform } from 'react-native';
import { colorScheme as nwColorScheme } from 'nativewind';

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
  setTheme: (m: ThemeMode) => void;
  setUnits: (u: Units) => void;
  setLocale: (l: Locale) => void;
};

const Ctx = createContext<SettingsValue | null>(null);

const KEYS = { theme: 'huntms.theme', units: 'huntms.units', locale: 'huntms.locale' } as const;

function load<T extends string>(key: string, fallback: T): T {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return fallback;
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: string) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {}
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
  const [sysScheme, setSysScheme] = useState<'light' | 'dark'>(() =>
    Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android' ? systemScheme() : 'light',
  );

  const scheme: 'light' | 'dark' = theme === 'system' ? sysScheme : theme;

  // Keep the module-level units in sync for context-less helpers (route/map).
  setUnitsValue(units);

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

  return (
    <Ctx.Provider value={{ theme, scheme, units, locale, setTheme, setUnits, setLocale }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
