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

  useEffect(() => {
    async function bootstrap() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUser(data.session.user);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Ignore supabase errors
      }

      const storedUser = localStorage.getItem("tax_copilot_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem("tax_copilot_user");
        }
      }
      setLoading(false);
    }

    bootstrap();

    let listener;
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data } = supabase.auth.onAuthStateChange((_, session) => {
          if (session?.user) {
            setUser(session.user);
          }
        });
        listener = data;
      }
    } catch (e) {
      // Ignore listener error
    }

    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function login(email, password) {
    const supabase = getSupabaseClient();

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          setUser(data.user);
          return data.user;
        }
      }
    } catch (e) {
      // Fallback to local backend login
    }

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
    const supabase = getSupabaseClient();

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, tin } },
        });
        if (!error && data?.user) {
          setUser(data.user);
          return data.user;
        }
      }
    } catch (e) {
      // Fallback to local backend register
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

  async function logout() {
    const supabase = getSupabaseClient();

    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem("tax_copilot_token");
    localStorage.removeItem("tax_copilot_user");
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
