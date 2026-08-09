"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabaseClient";

import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const hasValidTin = Boolean(
    user?.tin && user.tin.replace(/\D/g, "").length === 9
  );

  useEffect(() => {
    async function bootstrap() {
      const storedUser = localStorage.getItem("tax_copilot_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem("tax_copilot_user");
        }
      }

      const token = localStorage.getItem("tax_copilot_token");
      if (token) {
        try {
          const res = await api.getProfile();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem("tax_copilot_user", JSON.stringify(res.user));
          }
        } catch (e) {
          // Token might be expired or invalid
        }
      }

      setLoading(false);
    }

    bootstrap();
  }, []);

  async function login(email, password) {
    const res = await api.login(email, password);
    if (res?.token && res?.user) {
      localStorage.setItem("tax_copilot_token", res.token);
      localStorage.setItem("tax_copilot_user", JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    }
    throw new Error("Login failed.");
  }

  async function register(name, email, password, tin) {
    const cleanTin = (tin || "").replace(/\D/g, "");
    if (cleanTin.length !== 9) {
      throw new Error("Compulsory TRA TIN must be a valid 9-digit number.");
    }

    const res = await api.register({ name, email, password, tin });
    if (res?.token && res?.user) {
      localStorage.setItem("tax_copilot_token", res.token);
      localStorage.setItem("tax_copilot_user", JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    }
    throw new Error("Registration failed.");
  }

  async function updateUserTin(tin) {
    const res = await api.updateTin(tin);
    if (res?.user) {
      setUser(res.user);
      localStorage.setItem("tax_copilot_user", JSON.stringify(res.user));
      return res.user;
    }
    throw new Error("Failed to update TIN.");
  }

  async function logout() {
    localStorage.removeItem("tax_copilot_token");
    localStorage.removeItem("tax_copilot_user");
    setUser(null);
    router.push("/");
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, hasValidTin, login, register, updateUserTin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
