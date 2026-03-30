import type { PropsWithChildren } from "react";
import { authModuleBadges } from "@/components/auth/authContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { DarkModeOutlined as Moon, LightModeOutlined as Sun } from "@mui/icons-material";

type AuthPageShellProps = PropsWithChildren<{
  contentClassName?: string;
}>;

export function AuthPageShell({ children, contentClassName }: AuthPageShellProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <div className="min-h-screen bg-[#f3f5fa] text-[#0f172a] transition-colors dark:bg-[#0b1530] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden min-h-screen overflow-hidden lg:flex">
          <img
            src="/images/scv-login-hero.webp"
            alt="Vista aerea da Flexibase"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className={cn(
              "absolute inset-0",
              isDark
                ? "bg-[linear-gradient(180deg,rgba(6,14,27,0.78),rgba(8,17,32,0.88)),linear-gradient(90deg,rgba(10,24,46,0.86),rgba(10,24,46,0.44))]"
                : "bg-[linear-gradient(180deg,rgba(15,23,42,0.48),rgba(15,23,42,0.62)),linear-gradient(90deg,rgba(59,82,120,0.46),rgba(59,82,120,0.2))]",
            )}
          />

          <div className="relative z-10 flex h-full w-full items-center justify-center px-14 py-16 text-white">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white xl:text-6xl">
                Central de Tarefas
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-9 text-white/74 xl:text-[1.35rem]">
                Plataforma completa para planejar projetos, acompanhar atividades e executar entregas com
                previsibilidade, colaboracao em equipe e gamificacao orientada a resultados.
              </p>

              <div className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2.5">
                {authModuleBadges.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="rounded-full border-white/18 bg-white/8 px-3.5 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/84 backdrop-blur-sm"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#f7f8fc] transition-colors dark:bg-[#0b1530]">
          <div className="flex items-center justify-between px-5 py-4 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#cfd8e8] bg-white/80 dark:border-white/12 dark:bg-white/8">
                <img src="/logo-flexibase.svg" alt="Flexibase" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5a6a87] dark:text-white/55">Flexibase</p>
                <p className="text-sm font-semibold text-[#0f172a] dark:text-white">Central de Tarefas</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setTheme(nextTheme)}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              className="rounded-full border-[#ccd5e4] bg-white/80 text-[#16213a] hover:bg-white hover:text-[#16213a] dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div
              className={cn(
                "relative flex flex-1 items-center justify-center overflow-hidden px-5 py-8 md:px-10 md:py-10 xl:px-16",
                contentClassName,
              )}
            >
              <div className="absolute right-5 top-6 hidden lg:block xl:right-10 xl:top-8">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(nextTheme)}
                  aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                  className="rounded-full border-[#ccd5e4] bg-white/80 text-[#16213a] backdrop-blur-sm hover:bg-white hover:text-[#16213a] dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>

              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
