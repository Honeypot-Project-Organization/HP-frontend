/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#020604",
        panel: "#07110B",
        raised: "#0D1B13",
        line: "#1B3A28",
        signal: "#00FF88",
        threat: "#FF4D4D",
        ink: "#D5F5DF",
        mute: "#6F9A82",
        ok: "#9DFF4A",
        warn: "#FFC83D",
      },
      fontFamily: {
        display: ['"Chakra Petch"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { DEFAULT: "0" },
    },
  },
  plugins: [],
};
