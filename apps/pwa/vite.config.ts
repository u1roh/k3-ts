import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const repoName = "k3";

export default defineConfig({
  base: "/" + repoName + "/",
  plugins: [
    VitePWA({
      srcDir: "src",
      filename: "sw.ts",
      strategies: "injectManifest",
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "RPN Calculator",
        short_name: "RPN Calc",
        description: "Personal RPN calculator as a PWA",
        theme_color: "#1f2937",
        background_color: "#f3f4f6",
        display: "standalone",
        start_url: "/" + repoName + "/",
        scope: "/" + repoName + "/",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "pwa-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ]
});
