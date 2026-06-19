/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        teal: 'rgb(var(--teal) / <alpha-value>)',
        purple: 'rgb(var(--purple) / <alpha-value>)',
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
      },
      borderRadius: {
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      fontFamily: {
        // Geist — one family per weight (RN can't synthesize weights)
        sans: ['Geist_400Regular'],
        'sans-medium': ['Geist_500Medium'],
        'sans-semibold': ['Geist_600SemiBold'],
        'sans-bold': ['Geist_700Bold'],
      },
    },
  },
  plugins: [],
};
