import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from '@netlify/vite-plugin-tanstack-start' 
import { tanstackStart } from '@tanstack/start/vite'

export default defineConfig({
  plugins: [
    tanstackStart(),
    netlify(), // ← add this (anywhere in the array is fine)
    viteReact(),
  ],
})
