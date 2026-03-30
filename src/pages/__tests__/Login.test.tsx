import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { REMEMBER_STORAGE_KEY } from "@/components/auth/loginRemember";
import Login from "@/pages/Login";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("Login", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: null,
      user: null,
      signInWithPassword: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
      updatePassword: vi.fn(),
    });
  });

  const renderPage = (initialEntries = ["/login"]) =>
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/entregas" element={<div>Entregas</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

  it("preenche o email salvo e o checkbox de remember-me", async () => {
    localStorage.setItem(
      REMEMBER_STORAGE_KEY,
      JSON.stringify({
        email: "lembrado@flexibase.com.br",
        expiresAt: Date.now() + 60_000,
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText("E-mail")).toHaveValue("lembrado@flexibase.com.br");
    });

    expect(screen.getByRole("checkbox", { name: /manter conectado por 30d/i })).toBeChecked();
  });

  it("faz login, salva apenas o email e volta para a rota de origem", async () => {
    const user = userEvent.setup();
    const signInWithPassword = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: null,
      user: null,
      signInWithPassword,
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
    });

    renderPage([
      {
        pathname: "/login",
        state: {
          from: {
            pathname: "/entregas",
            search: "",
            hash: "",
          },
        },
      },
    ]);

    await user.type(screen.getByLabelText("E-mail"), "usuario@flexibase.com.br");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByRole("checkbox", { name: /manter conectado por 30d/i }));
    await user.click(screen.getByRole("button", { name: /acessar sistema/i }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith("usuario@flexibase.com.br", "senha-segura");
    });

    await waitFor(() => {
      expect(screen.getByText("Entregas")).toBeInTheDocument();
    });

    const storedPayload = JSON.parse(localStorage.getItem(REMEMBER_STORAGE_KEY) as string);
    expect(storedPayload.email).toBe("usuario@flexibase.com.br");
    expect(storedPayload).not.toHaveProperty("password");
  });

  it("mostra erro amigavel quando as credenciais sao invalidas", async () => {
    const user = userEvent.setup();
    const signInWithPassword = vi.fn().mockRejectedValue(new Error("Invalid login credentials"));

    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: null,
      user: null,
      signInWithPassword,
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
    });

    renderPage();

    await user.type(screen.getByLabelText("E-mail"), "usuario@flexibase.com.br");
    await user.type(screen.getByLabelText("Senha"), "senha-invalida");
    await user.click(screen.getByRole("button", { name: /acessar sistema/i }));

    await waitFor(() => {
      expect(screen.getByText("E-mail ou senha invalidos. Confira os dados e tente novamente.")).toBeInTheDocument();
    });
  });

  it("envia o e-mail de recuperacao a partir do modo dedicado", async () => {
    const user = userEvent.setup();
    const sendPasswordResetEmail = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: null,
      user: null,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      sendPasswordResetEmail,
      updatePassword: vi.fn(),
    });

    renderPage();

    await user.click(screen.getByRole("button", { name: /esqueci minha senha/i }));
    await user.type(screen.getByLabelText("E-mail"), "recuperacao@flexibase.com.br");
    await user.click(screen.getByRole("button", { name: /enviar link de recuperacao/i }));

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith("recuperacao@flexibase.com.br");
    });

    expect(screen.getByText(/voce recebera um link para redefinir a senha/i)).toBeInTheDocument();
  });

  it("alterna entre modo claro e escuro pelo toggle da tela", async () => {
    const user = userEvent.setup();

    renderPage();

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("light");
    });

    await user.click(screen.getAllByRole("button", { name: /ativar modo escuro/i })[0]);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
  });
});
