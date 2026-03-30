const REMEMBER_STORAGE_KEY = "scv-login-remember-30d";
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

type RememberedEmailPayload = {
  email: string;
  expiresAt: number;
};

const isRememberedEmailPayload = (value: unknown): value is RememberedEmailPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<RememberedEmailPayload>;
  return typeof payload.email === "string" && typeof payload.expiresAt === "number";
};

export const loadRememberedEmail = () => {
  const rawValue = localStorage.getItem(REMEMBER_STORAGE_KEY);

  if (!rawValue) {
    return "";
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!isRememberedEmailPayload(parsed)) {
      localStorage.removeItem(REMEMBER_STORAGE_KEY);
      return "";
    }

    if (Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(REMEMBER_STORAGE_KEY);
      return "";
    }

    return parsed.email;
  } catch {
    localStorage.removeItem(REMEMBER_STORAGE_KEY);
    return "";
  }
};

export const saveRememberedEmail = (email: string) => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    localStorage.removeItem(REMEMBER_STORAGE_KEY);
    return;
  }

  const payload: RememberedEmailPayload = {
    email: trimmedEmail,
    expiresAt: Date.now() + THIRTY_DAYS_IN_MS,
  };

  localStorage.setItem(REMEMBER_STORAGE_KEY, JSON.stringify(payload));
};

export const clearRememberedEmail = () => {
  localStorage.removeItem(REMEMBER_STORAGE_KEY);
};

export { REMEMBER_STORAGE_KEY };
