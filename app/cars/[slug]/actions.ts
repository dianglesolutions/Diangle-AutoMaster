"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitEnquiry(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");
  const slug = String(formData.get("slug") ?? "");
  const { data: vehicle } = await supabase.from("vehicles").select("id").eq("slug", slug).maybeSingle();
  const { error } = await supabase.from("enquiries").insert({ vehicle_id: vehicle?.id ?? null, customer_name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), phone: String(formData.get("phone") ?? ""), message: String(formData.get("message") ?? "") });
  if (error) redirect(`/cars/${slug}?error=send`);
  redirect(`/cars/${slug}?sent=1`);
}
