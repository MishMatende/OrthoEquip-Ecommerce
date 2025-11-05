/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      cursor: {
        "zoom-in": "zoom-in",
        "zoom-out": "zoom-out",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
