"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  hashPassword,
  getAllUsers,
  createUser,
  findUserByUsername,
  getSession,
  saveSession,
  clearSession,
} from "@/lib/auth";
import type { Session } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

interface AuthContextValue {
  user: Session | null;
  isLoading: boolean;
  login(username: string, password: string): Promise<"ok" | "invalid-credentials">;
  register(username: string, password: string): Promise<"ok" | "username-taken">;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  async function login(
    username: string,
    password: string
  ): Promise<"ok" | "invalid-credentials"> {
    const found = findUserByUsername(username);
    if (!found) return "invalid-credentials";
    const hash = await hashPassword(password);
    if (hash !== found.passwordHash) return "invalid-credentials";
    const session: Session = { userId: found.id, username: found.username };
    saveSession(session);
    setUser(session);
    return "ok";
  }

  async function register(
    username: string,
    password: string
  ): Promise<"ok" | "username-taken"> {
    const existing = findUserByUsername(username);
    if (existing) return "username-taken";

    const isFirstUser = getAllUsers().length === 0;
    const hash = await hashPassword(password);
    const newUser = createUser(username, hash);

    if (isFirstUser) {
      for (const suffix of ["expenses", "categories", "contributions"]) {
        const old = localStorage.getItem(`dash-finance-${suffix}`);
        if (old) {
          localStorage.setItem(`dash-finance-${suffix}-${newUser.id}`, old);
          localStorage.removeItem(`dash-finance-${suffix}`);
        }
      }
    }

    const session: Session = { userId: newUser.id, username: newUser.username };
    saveSession(session);
    setUser(session);
    return "ok";
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  const value: AuthContextValue = { user, isLoading, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? null : user ? children : <LoginForm />}
    </AuthContext.Provider>
  );
}
