import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // depending on your application, base can also be "/"
  base: "",
  plugins: [react()],
  server: {
    open: true,
    port: 3000,
  },
  esbuild: {
    include: /\.js$/,
    exclude: [],
    loader: "jsx",
  },
});
