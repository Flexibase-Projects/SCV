import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import type { Location } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowBackOutlined as ArrowBack,
  InfoOutlined as Info,
  KeyOutlined as Key,
  LocalShippingOutlined as Truck,
  LockOutlined as Lock,
  MailOutlineOutlined as Mail,
} from "@mui/icons-material";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { authFaqItems, authSystemModules } from "@/components/auth/authContent";
import { clearRememberedEmail, loadRememberedEmail, saveRememberedEmail } from "@/components/auth/loginRemember";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

type LoginMode = "login" | "about" | "recovery";
type AuthLocationState = {
  from?: Pick<Location, "pathname" | "search" | "hash">;
};

const LOGIN_ROUTE = "/login";
const RESET_ROUTE = "/redefinir-senha";
const LOGIN_INPUT_CLASS =
  "h-14 rounded-2xl border border-[#d6ddea] bg-white px-5 text-base text-[#14213d] placeholder:text-[#70809d] focus-visible:ring-[#7b8fb5] focus-visible:ring-offset-0 dark:border-white/14 dark:bg-[#101c35] dark:text-white dark:placeholder:text-[#8798bd]";
const MODULE_ICON_CLASS =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e9edf5] text-[#17223b] dark:bg-white/8 dark:text-white";

const getRedirectTarget = (state: unknown) => {
  const routeState = state as AuthLocationState | undefined;
  const from = routeState?.from;

  if (!from?.pathname) {
    return "/";
  }

  const target = `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;

  if (target === LOGIN_ROUTE || target.startsWith(RESET_ROUTE)) {
    return "/";
  }

  return target;
};

const getFriendlyAuthMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }

  const normalizedMessage = error.message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "E-mail ou senha invalidos. Confira os dados e tente novamente.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Sua conta ainda precisa confirmar o e-mail antes do acesso.";
  }

  return error.message;
};

const getModuleIcon = (title: string) => {
  if (title === "Entregas") return <Truck className="h-5 w-5" />;
  if (title === "Abastecimento") return <Mail className="h-5 w-5" />;
  if (title === "Manutencao") return <Key className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading, signInWithPassword, sendPasswordResetEmail } = useAuth();
  const [mode, setMode] = useState<LoginMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState("");

  const redirectTarget = useMemo(() => getRedirectTarget(location.state), [location.state]);

  useEffect(() => {
    const rememberedEmail = loadRememberedEmail();

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    if (isLoading || !session) {
      return;
    }

    startTransition(() => {
      navigate(redirectTarget, { replace: true });
    });
  }, [isLoading, navigate, redirectTarget, session]);

  const handleModeChange = (nextMode: LoginMode) => {
    setErrorMessage("");
    setRecoverySuccessMessage("");
    setMode(nextMode);
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setRecoverySuccessMessage("");
    setIsSubmitting(true);

    try {
      await signInWithPassword(email.trim(), password);

      if (rememberEmail) {
        saveRememberedEmail(email);
      } else {
        clearRememberedEmail();
      }

      setPassword("");
      startTransition(() => {
        navigate(redirectTarget, { replace: true });
      });
    } catch (error) {
      setErrorMessage(getFriendlyAuthMessage(error, "Nao foi possivel entrar no sistema agora."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setRecoverySuccessMessage("");
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(email.trim());
      setRecoverySuccessMessage(
        "Se o e-mail estiver cadastrado, voce recebera um link para redefinir a senha em instantes.",
      );
    } catch (error) {
      setErrorMessage(getFriendlyAuthMessage(error, "Nao foi possivel enviar o e-mail de recuperacao agora."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell contentClassName={mode === "about" ? "overflow-hidden" : "overflow-y-auto"}>
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center">
        {mode === "login" ? (
          <div className="flex w-full justify-center">
            <div className="w-full max-w-md py-8 text-[#0f172a] dark:text-white">
              <div className="text-center">
                <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[#0f172a] dark:text-white md:text-[2.8rem]">
                  Bem-vindo(a)
                </h1>
                <p className="mt-3 text-base text-[#5c6d8a] dark:text-[#9caed1] md:text-lg">Acesse sua conta para continuar</p>
              </div>

              <form className="mt-12 space-y-5" onSubmit={handleLoginSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="sr-only">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="E-mail *"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={LOGIN_INPUT_CLASS}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="sr-only">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Senha *"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={LOGIN_INPUT_CLASS}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-medium text-[#586987] transition-colors hover:text-[#0f172a] dark:text-[#a8b6d3] dark:hover:text-white"
                    onClick={() => handleModeChange("recovery")}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {errorMessage ? (
                  <Alert variant="destructive" className="rounded-2xl border-red-500/35 bg-red-500/10 text-white">
                    <AlertTitle className="text-white">Falha no acesso</AlertTitle>
                    <AlertDescription className="text-red-100/90">{errorMessage}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-[#38445d] text-base font-semibold text-white hover:bg-[#44516b] dark:bg-[#38445d] dark:hover:bg-[#44516b]"
                  disabled={isSubmitting}
                >
                  <Lock className="h-4 w-4" />
                  {isSubmitting ? "Entrando..." : "Acessar sistema"}
                </Button>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Checkbox
                    id="remember-email"
                    checked={rememberEmail}
                    onCheckedChange={(checked) => setRememberEmail(checked === true)}
                    className="h-5 w-5 rounded-md border-[#aab7cd] data-[state=checked]:border-[#6d82ad] data-[state=checked]:bg-[#6d82ad] data-[state=checked]:text-white dark:border-white/28"
                  />
                  <Label htmlFor="remember-email" className="cursor-pointer text-sm font-normal text-[#5d6e8b] dark:text-[#a9b7d3]">
                    Manter conectado por 30d
                  </Label>
                </div>

                <div className="flex justify-center pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full px-0 text-sm font-medium text-[#566884] hover:bg-transparent hover:text-[#0f172a] dark:text-[#b4c0da] dark:hover:text-white"
                    onClick={() => handleModeChange("about")}
                  >
                    <Info className="h-4 w-4" />
                    O que e este sistema?
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {mode === "recovery" ? (
          <div className="flex w-full justify-center">
            <div className="w-full max-w-md py-8 text-[#0f172a] dark:text-white">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#586987] transition-colors hover:text-[#0f172a] dark:text-[#a8b6d3] dark:hover:text-white"
                onClick={() => handleModeChange("login")}
              >
                <ArrowBack className="h-4 w-4" />
                Voltar ao login
              </button>

              <div className="mt-10 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7d90b7] dark:text-[#7d90b7]">Recuperacao</p>
                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#0f172a] dark:text-white md:text-4xl">
                  Redefinir senha
                </h1>
                <p className="mt-4 text-sm leading-7 text-[#5c6d8a] dark:text-[#9caed1] md:text-base">
                  Informe seu e-mail para receber o link de redefinicao na rota publica do SCV.
                </p>
              </div>

              <form className="mt-10 space-y-5" onSubmit={handleRecoverySubmit}>
                <div>
                  <Label htmlFor="recovery-email" className="sr-only">
                    E-mail
                  </Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    autoComplete="username"
                    placeholder="E-mail *"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={LOGIN_INPUT_CLASS}
                    required
                  />
                </div>

                {errorMessage ? (
                  <Alert variant="destructive" className="rounded-2xl border-red-500/35 bg-red-500/10 text-white">
                    <AlertTitle className="text-white">Falha no envio</AlertTitle>
                    <AlertDescription className="text-red-100/90">{errorMessage}</AlertDescription>
                  </Alert>
                ) : null}

                {recoverySuccessMessage ? (
                  <Alert className="rounded-2xl border-emerald-500/35 bg-emerald-500/10 text-white">
                    <AlertTitle className="text-emerald-200">E-mail enviado</AlertTitle>
                    <AlertDescription className="text-emerald-100/90">{recoverySuccessMessage}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-[#38445d] text-base font-semibold text-white hover:bg-[#44516b] dark:bg-[#38445d] dark:hover:bg-[#44516b]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar link de recuperacao"}
                </Button>
              </form>
            </div>
          </div>
        ) : null}

        {mode === "about" ? (
          <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden py-6 text-[#0f172a] dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7d90b7]">Panorama do sistema</p>
                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#0f172a] dark:text-white md:text-4xl">
                  O que e este sistema?
                </h1>
                <p className="mt-4 text-sm leading-7 text-[#5c6d8a] dark:text-[#9caed1] md:text-base">
                  O SCV organiza a rotina da frota com uma visao integrada de operacao e custo, conectando veiculos,
                  entregas, abastecimentos, manutencoes, acertos e produtividade em uma mesma interface.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-full border-[#d6ddea] bg-white/80 text-[#16213a] hover:bg-white hover:text-[#16213a] dark:border-white/16 dark:bg-white/6 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                onClick={() => handleModeChange("login")}
              >
                Voltar
              </Button>
            </div>

            <div className="mt-8 flex-1 overflow-y-auto pr-1">
              <div className="grid gap-4 xl:grid-cols-2">
                {authSystemModules.map((module) => (
                  <section
                    key={module.title}
                    className="rounded-[1.75rem] border border-[#dbe2ee] bg-white/86 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/6"
                  >
                    <div className={MODULE_ICON_CLASS}>{getModuleIcon(module.title)}</div>
                    <h2 className="mt-4 text-xl font-semibold text-[#0f172a] dark:text-white">{module.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-[#5c6d8a] dark:text-[#b4c0da]">{module.description}</p>
                  </section>
                ))}
              </div>

              <section className="mt-8 rounded-[1.75rem] border border-[#dbe2ee] bg-white/86 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/6">
                <h2 className="text-xl font-semibold text-[#0f172a] dark:text-white">Perguntas frequentes</h2>
                <p className="mt-2 text-sm leading-7 text-[#5c6d8a] dark:text-[#b4c0da]">
                  Respostas rapidas para alinhar o uso do login e da operacao no SCV.
                </p>

                <Accordion type="single" collapsible className="mt-6">
                  {authFaqItems.map((item) => (
                    <AccordionItem key={item.question} value={item.question} className="border-[#dbe2ee] dark:border-white/10">
                      <AccordionTrigger className="text-left text-sm text-[#0f172a] hover:text-[#0f172a] dark:text-white dark:hover:text-white">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="leading-7 text-[#5c6d8a] dark:text-[#b4c0da]">{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </AuthPageShell>
  );
}
