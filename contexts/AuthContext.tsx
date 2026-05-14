"use client";

import { createContext, useContext, useEffect, useState } from "react";
import LoginForm from "@/components/LoginForm";

interface Session {
  userId: string;
  username: string;
}

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
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(username: string, password: string): Promise<"ok" | "invalid-credentials"> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return "invalid-credentials";
    const data = await res.json();
    setUser({ userId: data.userId, username: data.username });
    return "ok";
  }

  async function register(username: string, password: string): Promise<"ok" | "username-taken"> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.status === 409) return "username-taken";
    if (!res.ok) return "username-taken";
    const data = await res.json();
    setUser({ userId: data.userId, username: data.username });
    return "ok";
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  const value: AuthContextValue = { user, isLoading, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? null : user ? children : <LoginForm />}
    </AuthContext.Provider>
  );
}
