import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

function LoginRouteProbe() {
  const location = useLocation();
  return (
    <div>
      <span>Login</span>
      <span data-testid="redirect-origin">{location.state?.from?.pathname ?? "sem-origem"}</span>
    </div>
  );
}

describe("ProtectedRoute", () => {
  it("exibe a tela de bootstrap enquanto a sessao esta carregando", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: true,
      session: null,
      user: null,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/entregas"]}>
        <Routes>
          <Route path="/login" element={<LoginRouteProbe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/entregas" element={<div>Entregas</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Validando sua sessão")).toBeInTheDocument();
  });

  it("redireciona para o login preservando a rota originalmente tentada", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: null,
      user: null,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/entregas"]}>
        <Routes>
          <Route path="/login" element={<LoginRouteProbe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/entregas" element={<div>Entregas</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByTestId("redirect-origin")).toHaveTextContent("/entregas");
  });

  it("renderiza o conteudo protegido quando a sessao existe", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: { access_token: "token" } as never,
      user: { id: "usuario-1" } as never,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/entregas"]}>
        <Routes>
          <Route path="/login" element={<LoginRouteProbe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/entregas" element={<div>Entregas</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Entregas")).toBeInTheDocument();
  });
});
