import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(
      Object.entries({
        auth: 8084,
        reports: 8083,
        data: 8082,
        collector: 8081,
      }).map(([name, port]) => [
        `/backend/${name}`,
        {
          target: `http://127.0.0.1:${port}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(`/backend/${name}`, ""),
        },
      ]),
    ),
  },
});
