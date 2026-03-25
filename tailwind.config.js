/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 👈 THIS LINE IS ESSENTIAL
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        display: ['"Poppins"', "sans-serif"],
      },
      screens: {
        xs: "475px", // Extra small devices
        sm: "640px", // Small devices (default)
        md: "768px", // Medium devices (default)
        lg: "1024px", // Large devices (default)
        xl: "1280px", // Extra large devices (default)
        "2xl": "1536px", // 2X large devices (default)
      },
      fontSize: {
        // Custom responsive font sizes
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
      },
      spacing: {
        // Custom spacing for better mobile/tablet layouts
        18: "4.5rem", // 72px
        88: "22rem", // 352px
        128: "32rem", // 512px
      },
    },
  },
  plugins: [],
};
