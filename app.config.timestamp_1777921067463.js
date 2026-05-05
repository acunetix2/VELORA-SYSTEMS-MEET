// app.config.ts
import { createApp } from "vinxi";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "url";
import path from "path";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var app_config_default = createApp({
  server: {
    preset: "vercel"
  },
  routers: [
    {
      name: "public",
      type: "static",
      dir: "./public",
      base: "/"
    },
    {
      name: "client",
      type: "client",
      handler: "./src/entry-client.tsx",
      target: "browser",
      plugins: () => [
        tsconfigPaths(),
        tailwindcss(),
        ...tanstackStart(),
        viteReact()
      ]
    },
    {
      name: "ssr",
      type: "http",
      handler: "./src/entry-server.tsx",
      target: "server",
      link: {
        client: "client"
      },
      plugins: () => [
        tsconfigPaths(),
        tailwindcss(),
        ...tanstackStart(),
        viteReact()
      ]
    }
  ],
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    }
  }
});
export {
  app_config_default as default
};
