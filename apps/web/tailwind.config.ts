import type { Config } from 'tailwindcss'

const config = {
  content: [
    './apps/web/src/**/*.{ts,tsx}',
    './packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [],
} satisfies Config

export default config
