/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem", // Common default padding
          sm: "1.5rem", // Slightly larger for small screens
          md: "2rem", // Comfortable for medium screens
          lg: "2rem", // Consistent for large screens
          xl: "2rem", // Maintains balance for extra-large
          "2xl": "2rem", // Keeps content readable on wide screens
        },
        screens: {
          sm: "640px", // Common small screen max-width
          md: "768px", // Standard medium screen
          lg: "1024px", // Widely used for large screens
          xl: "1280px", // Common for extra-large screens
          "2xl": "1536px", // Standard for very wide screens
        },
      },
      colors: {
        primary: {
          black: "#1E1E1E",
          white: "#F5F5F5",
          gray: "#B0B0B0",
        },
        secondary: {
          black: "#2D2D2D",
          gray: "#3C3C3C",
        },
        accent: "#CFC8B8",
      },
      spacing: {
        "2xl": "128px",
        xl: "64px",
        lg: "32px",
        md: "16px",
        sm: "8px",
        xs: "4px",
      },
      backgroundImage: {
        "primary-black-vertical":
          "linear-gradient(to bottom, #2D2D2D, #121212)",
        "primary-black-horizontal":
          "linear-gradient(to right, #121212, #3B3B3B)",
        "accent-vertical": "linear-gradient(to bottom, #CFC8B8, #8E897E)",
        "accent-horizontal": "linear-gradient(to right, #CFC8B8, #8E897E)",
      },
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};
