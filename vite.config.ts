import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar .env para o config; senão VITE_HMR_DISABLED no .env é ignorado e HMR fica ativo → reload em loop
  const env = loadEnv(mode, process.cwd(), "");
  const hmrDisabled = env.VITE_HMR_DISABLED === "1" || env.VITE_HMR_DISABLED === "true";
  const hmrOption = hmrDisabled
    ? false
    : {
        host: env.VITE_HMR_HOST || "scv.flexibase.com",
        port: env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : 8080,
        protocol: (env.VITE_HMR_PROTOCOL as "ws" | "wss") || "ws",
      };

  const devPort = env.VITE_DEV_PORT ? Number(env.VITE_DEV_PORT) : 8080;

  return {
  base: mode === 'production' ? '/Controle-Frotas/' : '/',
  server: {
    host: "::",
    port: devPort,
    allowedHosts: ['scv.flexibase.com'],
    hmr: hmrOption,
    // Evita recarregar por mudanças em arquivos que não são código (ex.: .env, logs)
    watch: {
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/*.log", "**/.env", "**/.env.*", "**/.cursor/**"],
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
};
});
