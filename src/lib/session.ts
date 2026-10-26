import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
  role: "aanbieder" | "baasje";
  name: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as CurrentUser["role"]) ?? "baasje",
    name: profile?.display_name ?? null,
  };
}
