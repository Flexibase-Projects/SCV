import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
      resetPasswordForEmail: authMocks.resetPasswordForEmail,
      signInWithPassword: authMocks.signInWithPassword,
      signOut: authMocks.signOut,
      updateUser: authMocks.updateUser,
    },
  },
}));

function Probe() {
  const { sendPasswordResetEmail } = useAuth();

  return (
    <button type="button" onClick={() => void sendPasswordResetEmail("acesso@flexibase.com.br")}>
      Enviar
    </button>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    authMocks.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: authMocks.unsubscribe,
        },
      },
    });
    authMocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    authMocks.signInWithPassword.mockResolvedValue({ error: null });
    authMocks.signOut.mockResolvedValue({ error: null });
    authMocks.updateUser.mockResolvedValue({ error: null });
    window.history.replaceState({}, "", "/login");
  });

  it("monta o redirect correto para reset de senha", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(authMocks.resetPasswordForEmail).toHaveBeenCalledWith("acesso@flexibase.com.br", {
        redirectTo: "http://localhost:3000/redefinir-senha",
      });
    });
  });
});
