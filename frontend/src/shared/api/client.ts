import { getAuthToken } from "../lib/auth-storage";

export const unauthorizedEventName = "studyplatform:unauthorized";

function authorizationHeaders() {
  const token = getAuthToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function getErrorMessage(status: number, data: unknown, context: "app" | "auth" | "login" = "app") {
  if (typeof data === "object" && data !== null && "message" in data) {
    return String((data as { message: unknown }).message);
  }

  if (typeof data === "object" && data !== null && "detail" in data) {
    return String((data as { detail: unknown }).detail);
  }

  if (status === 401) {
    return context === "login"
      ? "Usuario ou senha invalidos."
      : "Sua sessao expirou. Entre novamente para salvar suas alteracoes.";
  }

  if (status === 409) {
    return "Este usuario ou email ja esta cadastrado.";
  }

  return "Nao foi possivel conectar. Verifique se o backend esta rodando.";
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const authHeaders = authorizationHeaders();

  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value));

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });
  const data = await readResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event(unauthorizedEventName));
    }

    throw new Error(getErrorMessage(response.status, data, "app"));
  }

  return data as T;
}
