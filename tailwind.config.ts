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
        cream: '#fffaf4',
        'squarage-white': '#fffaf4',
        orange: '#ff962d',
        'orange-light': '#f7a24d',
        'brown-dark': '#333',
        'brown-medium': '#666',
        'brown-light': '#999',
        'squarage-green': '#4A9B4E',
        'squarage-orange': '#F7901E',
        'squarage-blue': '#01BAD5',
        'squarage-red': '#F04E23',
        'squarage-yellow': '#F5B74C',
        'squarage-black': '#333333',
      },
    },
  },
  plugins: [],
}
export default config