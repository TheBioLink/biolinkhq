/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 🔥 enable dark mode via class="dark"

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      // Optional: cleaner dark palette
      colors: {
        dark: {
          DEFAULT: '#0b0f14',
          card: 'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.10)',
          muted: 'rgba(229,231,235,0.75)',
        },
      },
    },
  },

  plugins: [],
};
