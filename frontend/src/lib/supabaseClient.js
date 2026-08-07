import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { createClient as createServerClient } from "@/utils/supabase/server";

export function createServerSupabaseClient() {
  return import("next/headers").then(async ({ cookies }) => {
    const cookieStore = await cookies();
    return createServerClient(cookieStore);
  });
}

let browserClient;

export function getSupabaseClient() {
  if (typeof window === "undefined") return null;

  if (!browserClient) {
    browserClient = createBrowserClient();
  }

  return browserClient;
}

export const supabase = getSupabaseClient();

