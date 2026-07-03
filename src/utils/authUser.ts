export type AuthUser = {
  id?: number;
  email?: string;
  full_name?: string;
  is_superuser?: boolean;
  [key: string]: unknown;
};

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthSuperuser() {
  return Boolean(getAuthUser()?.is_superuser);
}

export function isAuthVerified() {
  return localStorage.getItem("auth_verified") === "true";
}
