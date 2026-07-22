import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // sockjs-client references `global`, which Vite leaves undefined in the browser
  // build; alias it to `globalThis` so the STOMP/SockJS connection works.
  define: {
    global: "globalThis",
  },
  server: {
    host: "::",
    // Frontend dev server runs on http://localhost:3000
    port: 3000,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
