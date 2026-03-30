import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import RedefinirSenha from "@/pages/RedefinirSenha";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("RedefinirSenha", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/redefinir-senha");
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: null,
      user: null,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
    });
  });

  const renderPage = () =>
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <MemoryRouter initialEntries={["/redefinir-senha"]}>
          <Routes>
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

  it("mostra estado invalido quando nao ha sessao de recuperacao", () => {
    renderPage();

    expect(screen.getByText("Não foi possível validar este acesso")).toBeInTheDocument();
  });

  it("atualiza a senha quando existe uma sessao valida", async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: { access_token: "token" } as never,
      user: { id: "usuario-1" } as never,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      updatePassword,
    });

    renderPage();

    await user.type(screen.getByLabelText("Nova senha"), "nova-senha-segura");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "nova-senha-segura");
    await user.click(screen.getByRole("button", { name: /salvar nova senha/i }));

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith("nova-senha-segura");
    });

    expect(screen.getByText("Senha atualizada com sucesso. Você já pode voltar ao login.")).toBeInTheDocument();
  });
});
