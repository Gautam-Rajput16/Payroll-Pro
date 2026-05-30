/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          dark: '#4338CA', // Indigo 700
        },
        secondary: '#F9FAFB', // Gray 50
        success: '#10B981', // Emerald 500
        warning: '#F59E0B', // Amber 500
        danger: '#EF4444', // Red 500
        'text-dark': '#111827', // Gray 900
        'text-mid': '#6B7280', // Gray 500
        border: '#E5E7EB', // Gray 200
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
