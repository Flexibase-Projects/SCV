import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function getManualChunk(id: string) {
  const normalizedId = id.replace(/\\/g, "/");

  if (!normalizedId.includes("node_modules")) {
    return undefined;
  }

  if (
    normalizedId.includes("/node_modules/react/") ||
    normalizedId.includes("/node_modules/react-dom/") ||
    normalizedId.includes("/node_modules/scheduler/") ||
    normalizedId.includes("/node_modules/react-router/") ||
    normalizedId.includes("/node_modules/react-router-dom/")
  ) {
    return "react-vendor";
  }

  if (normalizedId.includes("@supabase/")) {
    return "supabase-vendor";
  }

  if (normalizedId.includes("@tanstack/")) {
    return "tanstack-vendor";
  }

  if (normalizedId.includes("@mui/") || normalizedId.includes("@emotion/")) {
    return "mui-vendor";
  }

  if (normalizedId.includes("@radix-ui/") || normalizedId.includes("cmdk") || normalizedId.includes("vaul")) {
    return "radix-vendor";
  }

  if (normalizedId.includes("recharts") || normalizedId.includes("d3-")) {
    return "charts-vendor";
  }

  if (normalizedId.includes("xlsx") || normalizedId.includes("papaparse")) {
    return "import-vendor";
  }

  return undefined;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar .env para o config
  const env = loadEnv(mode, process.cwd(), "");
  const hmrDisabled = env.VITE_HMR_DISABLED === "1" || env.VITE_HMR_DISABLED === "true";

  // HMR: só usa host/port customizados se VITE_HMR_HOST estiver definido (ex.: deploy remoto).
  // Em dev local, usar HMR padrão (mesmo host da página) evita WebSocket em host errado e reload em loop.
  let hmrOption: boolean | { host?: string; port?: number; protocol?: string; clientPort?: number } = true;
  if (hmrDisabled) {
    hmrOption = false;
  } else if (env.VITE_HMR_HOST) {
    const hmrPort = env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : 8080;
    const hmrProtocol = env.VITE_HMR_PROTOCOL === "wss" ? "wss" : "ws";
    hmrOption = {
      host: env.VITE_HMR_HOST,
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
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
