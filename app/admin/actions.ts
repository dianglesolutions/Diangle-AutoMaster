"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function createVehicle(formData: FormData) {
  const { supabase } = await requireAdmin();
  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const year = Number(formData.get("year"));
  const price = Number(formData.get("price"));
  if (!make || !model || !Number.isFinite(year) || !Number.isFinite(price) || price < 0) redirect("/admin?error=invalid");
  const file = formData.get("image");
  let imageUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
    const extension = extensions[file.type];
    if (!extension || file.size > 8 * 1024 * 1024) redirect("/admin?error=image");
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("vehicles").upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (uploadError) redirect("/admin?error=upload");
    imageUrl = supabase.storage.from("vehicles").getPublicUrl(path).data.publicUrl;
  }
  const slug = `${slugify(`${make}-${model}-${year}`)}-${crypto.randomUUID().slice(0, 6)}`;
  const { error } = await supabase.from("vehicles").insert({
    slug, make, model, year, price, mileage: Number(formData.get("mileage") || 0),
    fuel: String(formData.get("fuel") || "Petrol"), transmission: String(formData.get("transmission") || "Automatic"),
    body_style: String(formData.get("body_style") || "Other"), exterior_color: String(formData.get("exterior_color") || ""),
    description: String(formData.get("description") || ""), image_url: imageUrl,
    featured: formData.get("featured") === "on", status: "available",
  });
  if (error) redirect("/admin?error=save");
  revalidatePath("/"); revalidatePath("/admin");
  redirect("/admin?saved=1");
}

export async function updateVehicleStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["available", "reserved", "sold"].includes(status)) return;
  await supabase.from("vehicles").update({ status }).eq("id", id);
  revalidatePath("/"); revalidatePath("/admin");
}
