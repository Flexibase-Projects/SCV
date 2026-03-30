import { beforeEach, describe, expect, it } from "vitest";
import {
  REMEMBER_STORAGE_KEY,
  clearRememberedEmail,
  loadRememberedEmail,
  saveRememberedEmail,
} from "@/components/auth/loginRemember";

describe("loginRemember", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("salva apenas email e expiracao", () => {
    saveRememberedEmail("contato@flexibase.com.br");

    const storedValue = localStorage.getItem(REMEMBER_STORAGE_KEY);

    expect(storedValue).toBeTruthy();
    expect(JSON.parse(storedValue as string)).toEqual(
      expect.objectContaining({
        email: "contato@flexibase.com.br",
        expiresAt: expect.any(Number),
      }),
    );
    expect(JSON.parse(storedValue as string)).not.toHaveProperty("password");
  });

  it("remove o email quando o payload expirou", () => {
    localStorage.setItem(
      REMEMBER_STORAGE_KEY,
      JSON.stringify({
        email: "expirado@flexibase.com.br",
        expiresAt: Date.now() - 1000,
      }),
    );

    expect(loadRememberedEmail()).toBe("");
    expect(localStorage.getItem(REMEMBER_STORAGE_KEY)).toBeNull();
  });

  it("limpa o armazenamento explicitamente", () => {
    saveRememberedEmail("usuario@flexibase.com.br");
    clearRememberedEmail();

    expect(localStorage.getItem(REMEMBER_STORAGE_KEY)).toBeNull();
  });
});
