import { CircularProgress } from "@mui/material";
import { LocalShippingOutlined as Truck } from "@mui/icons-material";

export function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center rounded-[2rem] border border-border/70 bg-card/90 px-8 py-10 text-center shadow-xl backdrop-blur-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Truck className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">SCV + Flexibase</p>
        <h2 className="mt-3 text-xl font-semibold text-foreground">Carregando modulo</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Estamos preparando a proxima tela para manter a navegacao mais leve.
        </p>
        <CircularProgress size={28} className="mt-6" />
      </div>
    </div>
  );
}
