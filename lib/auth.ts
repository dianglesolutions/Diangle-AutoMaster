import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: admin } = await supabase.from("admin_users").select("display_name").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/?access=denied");
  return { supabase, user, admin };
}
