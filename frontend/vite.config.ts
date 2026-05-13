import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),

    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "Eco Adventure",
        short_name: "EcoAdventure",
        description: "Eco Adventure booking and management platform",

        theme_color: "#ffffff",
        background_color: "#ffffff",

        display: "standalone",

        orientation: "portrait",

        scope: "/",
        start_url: "/",

        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },

          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },

          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },

          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
      },

      workbox: {
        navigateFallback: "/index.html",
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});