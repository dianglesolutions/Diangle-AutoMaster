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

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <aside className="admin-rail">
          <a className="brand" href="/">AUTO<span>MASTER</span><i>.</i></a>
          <div className="admin-rail-label">WORKSPACE</div>
          <a className="rail-link active" href="/admin"><CarFront size={17}/> Overview</a>
          <a className="rail-link" href="#inventory"><Search size={17}/> Inventory</a>
          <a className="rail-link" href="#enquiries"><Inbox size={17}/> Enquiries{leadCount ? <span className="rail-badge">{leadCount}</span> : null}</a>
          <div className="rail-spacer"/>
          <div className="admin-user">
            <span className="avatar">{(admin.display_name || user.email || "G").slice(0, 1).toUpperCase()}</span>
            <span><strong>{admin.display_name || "Administrator"}</strong><small>{user.email}</small></span>
            <form action={signOut}><button aria-label="Sign out" className="icon-button" title="Sign out"><ArrowUpRight size={16}/></button></form>
          </div>
        </aside>

        <section className="admin-main">
          <header className="admin-top">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot"/> YOUR AUTOMASTER WORKSPACE</div>
              <h1>Good morning, <em>{admin.display_name || "GRUID"}.</em></h1>
              <p>Everything your showroom needs, in one place.</p>
            </div>
            <a className="button button-dark" href="/#collection" target="_blank">View storefront <ArrowUpRight size={15}/></a>
          </header>

          {params.saved && <div className="notice notice-success"><CircleCheck size={17}/> Your vehicle has been added to the collection.</div>}
          {params.error && <div className="notice notice-error">{params.error === "image" ? "Choose an image under 8 MB." : params.error === "upload" ? "Image upload failed. Check Blob Storage access." : params.error === "database" ? "Azure SQL is not configured for this deployment." : params.error === "invalid" ? "Enter a make, model, valid year and non-negative price." : "We couldn't save that vehicle. Check the form and database setup."}</div>}

          <div className="admin-stats">
            <article className="admin-stat"><span>AVAILABLE VEHICLES</span><strong>{availableCount}</strong><small>Ready for the showroom</small></article>
            <article className="admin-stat"><span>NEW ENQUIRIES</span><strong>{leadCount}</strong><small>Awaiting a response</small></article>
            <article className="admin-stat"><span>INVENTORY RECORDS</span><strong>{vehicles.length}</strong><small>Latest 25 vehicles</small></article>
          </div>

          <section className="admin-panel" id="inventory">
            <div className="admin-panel-heading">
              <div><div className="eyebrow"><span className="eyebrow-dot"/> SHOWROOM</div><h2>Vehicle inventory</h2></div>
              <a className="text-link" href="#add-vehicle"><Plus size={15}/> Add a vehicle</a>
            </div>
            {vehicles.length ? (
              <div className="admin-table-wrap"><table className="admin-table">
                <thead><tr><th>Vehicle</th><th>Price</th><th>Status</th><th>Update</th></tr></thead>
                <tbody>{vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong></td>
                    <td>{money(vehicle.price)}</td>
                    <td><span className={`status-pill status-${vehicle.status}`}>{vehicle.status}</span></td>
                    <td><form action={updateVehicleStatus} className="status-form">
                      <input type="hidden" name="id" value={vehicle.id}/>
                      <select name="status" defaultValue={vehicle.status} aria-label={`Status for ${vehicle.make} ${vehicle.model}`}>
                        <option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option>
                      </select>
                      <button className="icon-button" type="submit" title="Update status" aria-label="Update status"><RefreshCw size={15}/></button>
                    </form></td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <p className="admin-empty">No vehicles in Azure SQL yet. Add your first vehicle below.</p>}
          </section>

          <section className="admin-panel" id="add-vehicle">
            <div className="admin-panel-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> NEW LISTING</div><h2>Add a vehicle</h2></div></div>
            <form action={createVehicle} className="admin-form" encType="multipart/form-data">
              <label>Make<input name="make" placeholder="e.g. BMW" required/></label>
              <label>Model<input name="model" placeholder="e.g. 330e M Sport" required/></label>
              <label>Year<input name="year" type="number" min="1900" max="2100" required/></label>
              <label>Price (£)<input name="price" type="number" min="0" step="100" required/></label>
              <label>Mileage<input name="mileage" type="number" min="0" defaultValue="0"/></label>
              <label>Fuel<select name="fuel" defaultValue="Petrol"><option>Petrol</option><option>Diesel</option><option>Electric</option><option>Plug-in hybrid</option><option>Hybrid</option></select></label>
              <label>Transmission<select name="transmission" defaultValue="Automatic"><option>Automatic</option><option>Manual</option></select></label>
              <label>Body style<input name="body_style" placeholder="e.g. SUV"/></label>
              <label>Exterior colour<input name="exterior_color" placeholder="e.g. Alpine White"/></label>
              <label className="admin-checkbox"><input type="checkbox" name="featured"/> Feature this vehicle</label>
              <label className="admin-wide">Description<textarea name="description" rows={4} placeholder="Describe the vehicle and its condition"/></label>
              <label className="admin-wide">Vehicle image<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif"/><small>JPG, PNG, WebP or AVIF, up to 8 MB.</small></label>
              <button className="button button-dark" type="submit"><Plus size={16}/> Save vehicle</button>
            </form>
          </section>

          <section className="admin-panel" id="enquiries">
            <div className="admin-panel-heading">
              <div><div className="eyebrow"><span className="eyebrow-dot"/> CUSTOMER INTEREST</div><h2>Recent enquiries</h2></div>
              <span className="admin-count"><Clock3 size={15}/> {leadCount} new</span>
            </div>
            {leads.length ? <div className="enquiry-list">{leads.map((lead) => (
              <article className="enquiry-card" key={lead.id}>
                <div><strong>{lead.customer_name}</strong><small>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</small></div>
                <p>{lead.message}</p>
                <small>{lead.vehicle_make && lead.vehicle_model ? `Interested in ${lead.vehicle_make} ${lead.vehicle_model}` : "General enquiry"} · {lead.status}</small>
              </article>
            ))}</div> : <p className="admin-empty">No enquiries have arrived yet.</p>}
          </section>
        </section>
      </div>
    </main>
  );
}
