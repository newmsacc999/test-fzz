import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Payments run as Vercel serverless functions (api/*.js). For local testing of
  // the Cashfree endpoints, use `vercel dev` instead of `npm run dev`.
});
