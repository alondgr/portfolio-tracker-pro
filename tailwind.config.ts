import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#0F172A',         // Slate 900
          card: '#1E293B',       // Slate 800
          border: '#334155',     // Slate 700
          profit: '#10B981',     // Emerald 500
          loss: '#EF4444',       // Red 500
          text: '#F8FAFC',       // Slate 50
          muted: '#94A3B8',      // Slate 400
          accent: '#3B82F6',     // Blue 500
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
