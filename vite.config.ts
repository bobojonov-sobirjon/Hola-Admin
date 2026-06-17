import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      // avoid CORS in dev by proxying API requests through Vite
      "/api": {
        // target: "https://apiss.firepole.ru",
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: true,
      },
      // serve backend media files in dev
      "/media": {
        // target: "https://apiss.firepole.ru",
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
