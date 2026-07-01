/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06070b",
        panel: "#11131a",
        accent: "#a855f7", // purple-500
        accentSoft: "#c084fc" // purple-400
      },
      boxShadow: {
        glow: "0 24px 60px rgba(168, 85, 247, 0.18)"
      },
      backgroundImage: {
        "hero-noise":
          "radial-gradient(circle at top left, rgba(168, 85, 247, 0.35), transparent 30%), radial-gradient(circle at 80% 0, rgba(120,119,198,0.15), transparent 24%)"
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s ease-out forwards"
      }
    }
  },
  plugins: []
};
