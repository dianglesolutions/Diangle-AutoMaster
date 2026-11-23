"use server";
import { redirect } from "next/navigation";
import { getSqlPool, sql } from "@/lib/azure/sql";

export async function submitEnquiry(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const pool = await getSqlPool();
  if (!pool) redirect(`/cars/${slug}?error=database`);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (name.length < 2 || name.length > 120 || email.length < 3 || email.length > 320 || phone.length > 80 || message.length < 5 || message.length > 4000) redirect(`/cars/${slug}?error=send`);
  try {
    await pool.request().input("slug", sql.NVarChar(180), slug).input("name", sql.NVarChar(120), name)
      .input("email", sql.NVarChar(320), email).input("phone", sql.NVarChar(80), phone).input("message", sql.NVarChar(4000), message)
      .query("INSERT INTO dbo.Enquiries (vehicle_id, customer_name, email, phone, message) SELECT id, @name, @email, @phone, @message FROM dbo.Vehicles WHERE slug = @slug AND status = 'available'; IF @@ROWCOUNT = 0 BEGIN; THROW 50001, 'Vehicle is no longer available.', 1; END;");
  } catch { redirect(`/cars/${slug}?error=send`); }
  redirect(`/cars/${slug}?sent=1`);
}
