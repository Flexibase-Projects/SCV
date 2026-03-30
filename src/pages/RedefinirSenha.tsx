import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowBackOutlined as ArrowBack,
  LockResetOutlined as LockReset,
} from "@mui/icons-material";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const RECOVERY_HINT_KEYS = ["access_token", "refresh_token", "type=recovery", "token_hash"];

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const { session, isLoading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryFlowReady, setIsRecoveryFlowReady] = useState(false);

  const hasRecoveryHint = useMemo(() => {
    const currentLocation = `${window.location.search}${window.location.hash}`;
    return RECOVERY_HINT_KEYS.some((key) => currentLocation.includes(key));
  }, []);

  useEffect(() => {
    if (session) {
      setIsRecoveryFlowReady(true);
      return;
    }

    if (isLoading || !hasRecoveryHint) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsRecoveryFlowReady(false);
    }, 1200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [hasRecoveryHint, isLoading, session]);

  useEffect(() => {
    if (session) {
      setIsRecoveryFlowReady(true);
    }
  }, [session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 6) {
      setErrorMessage("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("A confirmação da senha precisa ser idêntica à nova senha.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(password);
      setSuccessMessage("Senha atualizada com sucesso. Você já pode voltar ao login.");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível atualizar a senha agora.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell contentClassName="overflow-y-auto">
      {isLoading || (hasRecoveryHint && !isRecoveryFlowReady && !session) ? (
        <div className="flex h-full flex-col justify-center">
          <div className="max-w-xl rounded-[2rem] border border-border/70 bg-card/70 p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Validação do link</p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">Preparando a redefinição</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Estamos confirmando a validade do seu link de recuperação para liberar a troca de senha.
            </p>
          </div>
        </div>
      ) : null}

      {!isLoading && !session && !(hasRecoveryHint && !isRecoveryFlowReady) ? (
        <div className="flex h-full flex-col justify-center">
          <div className="max-w-xl rounded-[2rem] border border-border/70 bg-card/70 p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Link inválido</p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">Não foi possível validar este acesso</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              O link pode ter expirado, já ter sido usado ou não estar associado a uma sessão válida do Supabase.
            </p>
            <Button
              type="button"
              className="mt-8 rounded-2xl"
              onClick={() => {
                startTransition(() => navigate("/login", { replace: true }));
              }}
            >
              Voltar ao login
            </Button>
          </div>
        </div>
      ) : null}

      {!isLoading && session ? (
        <div className="flex h-full flex-col justify-center">
          <div className="max-w-xl">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => {
                startTransition(() => navigate("/login", { replace: true }));
              }}
            >
              <ArrowBack className="h-4 w-4" />
              Voltar ao login
            </button>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Troca de senha</p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground md:text-4xl">Defina uma nova senha</h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
              Escolha uma nova senha para retomar o acesso ao SCV com segurança.
            </p>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nova senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-2xl border-border/80 bg-card/70 px-4"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-12 rounded-2xl border-border/80 bg-card/70 px-4"
                  required
                />
              </div>

              {errorMessage ? (
                <Alert variant="destructive" className="rounded-2xl">
                  <AlertTitle>Falha na redefinição</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              {successMessage ? (
                <Alert className="rounded-2xl border-emerald-500/25 bg-emerald-500/8">
                  <AlertTitle className="text-emerald-700 dark:text-emerald-300">Senha atualizada</AlertTitle>
                  <AlertDescription className="text-emerald-700/90 dark:text-emerald-200/90">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" size="lg" className="h-12 w-full rounded-2xl text-base" disabled={isSubmitting}>
                <LockReset className="h-4 w-4" />
                {isSubmitting ? "Atualizando..." : "Salvar nova senha"}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </AuthPageShell>
  );
}
