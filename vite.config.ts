import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar .env para o config; senão VITE_HMR_DISABLED no .env é ignorado e HMR fica ativo → reload em loop
  const env = loadEnv(mode, process.cwd(), "");
  const hmrDisabled = env.VITE_HMR_DISABLED === "1" || env.VITE_HMR_DISABLED === "true";

  let hmrOption: false | { host: string; port: number; protocol: string } = false;
  if (!hmrDisabled) {
    let hmrPort = 8080;
    if (env.VITE_HMR_PORT) hmrPort = Number(env.VITE_HMR_PORT);
    let hmrProtocol = "ws";
    if (env.VITE_HMR_PROTOCOL === "wss") hmrProtocol = "wss";
    hmrOption = {
      host: env.VITE_HMR_HOST || "scv.flexibase.com",
      port: hmrPort,
      protocol: hmrProtocol,
    };
  }

  let devPort = 8080;
  if (env.VITE_DEV_PORT) {
    devPort = Number(env.VITE_DEV_PORT);
  }

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
