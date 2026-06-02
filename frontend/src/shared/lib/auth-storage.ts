type StoredAuthUser = {
  name?: string | null;
};

const TOKEN_KEY = "studyplatform_token";
const USER_KEY = "studyplatform_user";

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function persistAuthSession(accessToken: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUserName() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return (JSON.parse(storedUser) as StoredAuthUser).name ?? null;
  } catch {
    return null;
  }
}
