import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: { access_token: "token" } as never,
      user: { id: "usuario-1" } as never,
      signInWithPassword: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
    });
  });

  it("executa signOut e redireciona para /login", async () => {
    const user = userEvent.setup();
    const signOut = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      session: { access_token: "token" } as never,
      user: { id: "usuario-1" } as never,
      signInWithPassword: vi.fn(),
      signOut,
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/login" element={<div>Login</div>} />
            <Route path="*" element={<AppSidebar />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /^sair$/i }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
    });
  });
});
