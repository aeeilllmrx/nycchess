/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Chess-themed colors
        'chess-light': '#F0D9B5',
        'chess-dark': '#B58863',
        'chess-green': '#769656',
        // Dark mode colors
        dark: {
          bg: '#1a1a2e',
          card: '#232342',
          border: '#363654',
          text: '#e4e4e7',
          muted: '#a1a1aa',
        },
      },
    },
  },
  plugins: [],
};
