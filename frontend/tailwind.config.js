/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12213A",
          soft: "#2C3E5C",
          faint: "#5B6B85",
        },
        paper: {
          DEFAULT: "#F7F3E9",
          line: "#E4DCC5",
          raised: "#FFFDF7",
        },
        brass: {
          DEFAULT: "#B8892B",
          dark: "#8F6A1F",
          light: "#E4C878",
        },
        forest: {
          DEFAULT: "#1E5E45",
          light: "#DCEAE3",
        },
        rust: {
          DEFAULT: "#A63D2F",
          light: "#F3DFDA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        "ruled-paper":
          "repeating-linear-gradient(to bottom, transparent, transparent 27px, #E4DCC5 28px)",
      },
    },
  },
  plugins: [],
};
