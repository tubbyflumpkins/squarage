import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'neue-haas': ['neue-haas-grotesk', 'sans-serif'],
        'sans': ['neue-haas-grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Colors will be defined later per the migration plan
        cream: '#fffaf4',
        orange: '#ff962d',
        'orange-light': '#f7a24d',
      },
    },
  },
  plugins: [],
}
export default config