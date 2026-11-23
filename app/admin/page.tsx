import type { Metadata } from "next";
import { ArrowUpRight, CarFront, CircleCheck, Clock3, Inbox, Plus, RefreshCw, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { createVehicle, updateVehicleStatus } from "@/app/admin/actions";
import { getSqlPool } from "@/lib/azure/sql";

export const metadata: Metadata = { title: "Admin dashboard" };
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
type InventoryRow = { id: string; make: string; model: string; year: number; price: number; status: string };
type EnquiryRow = { id: string; customer_name: string; email: string; phone: string; message: string; status: string; vehicle_make: string | null; vehicle_model: string | null };

export default async function Admin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ user, admin }, params] = await Promise.all([requireAdmin(), searchParams]);
  const pool = await getSqlPool();
  const vehicles = pool ? (await pool.request().query<InventoryRow>("SELECT TOP (25) id, make, model, year, price, status FROM dbo.Vehicles ORDER BY created_at DESC")).recordset : [];
  const leads = pool ? (await pool.request().query<EnquiryRow>("SELECT TOP (8) e.id, e.customer_name, e.email, e.phone, e.message, e.status, v.make AS vehicle_make, v.model AS vehicle_model FROM dbo.Enquiries e LEFT JOIN dbo.Vehicles v ON v.id = e.vehicle_id ORDER BY e.created_at DESC")).recordset : [];
  const availableCount = pool ? (await pool.request().query<{ count: number }>("SELECT COUNT(*) AS count FROM dbo.Vehicles WHERE status = 'available'")).recordset[0]?.count ?? 0 : 0;
  const leadCount = pool ? (await pool.request().query<{ count: number }>("SELECT COUNT(*) AS count FROM dbo.Enquiries WHERE status = 'new'")).recordset[0]?.count ?? 0 : 0;
  return <main className="admin-page"><div className="admin-shell"><aside className="admin-rail"><a className="brand" href="/">AUTO<span>MASTER</span><i>.</i></a><div className="admin-rail-label">WORKSPACE</div><a className="rail-link active" href="/admin"><CarFront size={17}/> Overview</a><a className="rail-link" href="#inventory"><Search size={17}/> Inventory</a><a className="rail-link" href="#enquiries"><Inbox size={17}/> Enquiries{leadCount ? <span className="rail-badge">{leadCount}</span> : null}</a><div className="rail-spacer"/><div className="admin-user"><span className="avatar">{(admin.display_name || user.email || "G").slice(0,1).toUpperCase()}</span><span><strong>{admin.display_name || "Administrator"}</strong><small>{user.email}</small></span><form action={signOut}><button aria-label="Sign out" className="icon-button" title="Sign out"><ArrowUpRight size={16}/></button></form></div></aside>
    <section className="admin-main"><header className="admin-top"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR AUTOMASTER WORKSPACE</div><h1>Good morning, <em>{admin.display_name || "GRUID"}.</em></h1><p>Everything your showroom needs, in one place.</p></div><a className="button button-dark" href="/#collection" target="_blank">View storefront <ArrowUpRight size={15}/></a></header>
      {params.saved && <div className="notice notice-success"><CircleCheck size={17}/> Your vehicle has been added to the collection.</div>}{params.error && <div className="notice notice-error">{params.error === "image" ? "Choose an image under 8 MB." : params.error === "upload" ? "Image upload failed. Check Blob Storage access." : params.error === "database" ? "Azure SQL is not configured for this deployment." : "We couldn't save that vehicle. Check the form and database setup."}</d