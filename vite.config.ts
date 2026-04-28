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
        target: "http://31.128.43.149:8040",
        changeOrigin: true,
        secure: false,
      },
      // serve backend media files in dev
      "/media": {
        target: "http://31.128.43.149:8040",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
