import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchMe, loginUser, registerUser } from "../api/auth";
import type { RegisterInput } from "../api/auth";
import { tokenStore } from "../api/client";
import type { TokenResponse, User } from "../types";

const USER_KEY = "jobportal_user";

interface AuthValue {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function readSavedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && tokenStore.get() ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSavedUser);
  const queryClient = useQueryClient();

  function saveSession(res: TokenResponse): User {
    tokenStore.set(res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }

  function logout() {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    queryClient.clear(); // drop data that belonged to the previous user
  }

  // On page load, check the saved token is still valid (it expires after 60 minutes)
  useEffect(() => {
    if (!tokenStore.get()) return;
    fetchMe()
      .then(setUser)
      .catch((err) => {
        if (err?.status === 401) logout();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthValue = {
    user,
    login: async (email, password) => saveSession(await loginUser(email, password)),
    register: async (data) => saveSession(await registerUser(data)),
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
