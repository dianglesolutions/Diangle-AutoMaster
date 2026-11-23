"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getSqlPool, sql } from "@/lib/azure/sql";
import { uploadVehicleImage } from "@/lib/azure/blob";

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function createVehicle(formData: FormData) {
  await requireAdmin();
  const pool = await getSqlPool();
  if (!pool) redirect("/admin?error=database");
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
    try { imageUrl = await uploadVehicleImage(path, Buffer.from(await file.arrayBuffer()), file.type); }
    catch { redirect("/admin?error=upload"); }
  }
  const slug = `${slugify(`${make}-${model}-${year}`)}-${crypto.randomUUID().slice(0, 6)}`;
  try {
    await pool.request()
      .input("slug", sql.NVarChar(180), slug)
      .input("make", sql.NVarChar(80), make)
      .input("model", sql.NVarChar(120), model)
      .input("year", sql.Int, year)
      .input("price", sql.Decimal(12, 2), price)
      .input("mileage", sql.Int, Number(formData.get("mileage") || 0))
      .input("fuel", sql.NVarChar(40), String(formData.get("fuel") || "Petrol"))
      .input("transmission", sql.NVarChar(40), String(formData.get("transmission") || "Automatic"))
      .input("bodyStyle", sql.NVarChar(40), String(formData.get("body_style") || "Other"))
      .input("color", sql.NVarChar(80), String(formData.get("exterior_color") || ""))
      .input("description", sql.NVarChar(sql.MAX), String(formData.get("description") || ""))
      .input("imageUrl", sql.NVarChar(1000), imageUrl)
      .input("featured", sql.Bit, formData.get("featured") === "on")
      .query("INSERT INTO dbo.Vehicles (slug, make, model, year, price, mileage, fuel, transmission, body_style, exterior_color, description, image_url, featured, status) VALUES (@slug, @make, @model, @year, @price, @mileage, @fuel, @transmission, @bodyStyle, @color, @description, @imageUrl, @featured, 'available')");
  } catch { redirect("/admin?error=save"); }
  revalidatePath("/"); revalidatePath("/admin");
  redirect("/admin?saved=1");
}

export async function updateVehicleStatus(formData: FormData) {
  await requireAdmin();
  const pool = await getSqlPool();
  if (!pool) redirect("/admin?error=database");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["available", "reserved", "sold"].includes(status)) return;
  await pool.request().input("id", sql.UniqueIdentifier, id).input("status", sql.NVarChar(20), status).query("UPDATE dbo.Vehicles SET status = @status, updated_at = SYSUTCDATETIME() WHERE id = @id");
  revalidatePath("/"); revalidatePath("/admin");
}
