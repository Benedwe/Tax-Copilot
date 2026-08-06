"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, getToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("tc_user") : null;
    if (stored && getToken()) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  function persist(token, user) {
    setToken(token);
    window.localStorage.setItem("tc_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const data = await api.login({ email, password });
    persist(data.token, data.user);
    return data.user;
  }

  async function register(name, email, password, tin) {
    const payload = { name, email, password };
    if (tin) payload.tin = tin.trim();
    const data = await api.register(payload);
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    setToken(null);
    window.localStorage.removeItem("tc_user");
    setUser(null);
    router.push("/");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
