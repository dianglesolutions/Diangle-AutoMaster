import { getSqlPool, sql } from "@/lib/azure/sql";

export type Vehicle = {
  id: string; slug: string; make: string; model: string; year: number; price: number;
  mileage: number; fuel: string; transmission: string; body_style: string;
  exterior_color: string; description: string; image_url: string | null; status: string;
  featured: boolean; created_at: string;
};

export const demoVehicles: Vehicle[] = [
  { id:"demo-1", slug:"bmw-330e-m-sport-2023", make:"BMW", model:"330e M Sport", year:2023, price:38900, mileage:18500, fuel:"Plug-in hybrid", transmission:"Automatic", body_style:"Saloon", exterior_color:"Brooklyn Grey", description:"A beautifully specified 330e combining effortless electric commuting with the long-distance confidence of BMW's plug-in hybrid powertrain. Presented in excellent condition with a complete service history.", image_url:null, status:"available", featured:true, created_at:"2026-01-01" },
  { id:"demo-2", slug:"porsche-macan-s-2022", make:"Porsche", model:"Macan S", year:2022, price:57900, mileage:24600, fuel:"Petrol", transmission:"Automatic", body_style:"SUV", exterior_color:"Crayon", description:"The Macan S delivers a remarkably engaging drive in a versatile, refined package. Carefully maintained and equipped with panoramic roof, adaptive cruise and premium audio.", image_url:null, status:"available", featured:true, created_at:"2026-01-02" },
  { id:"demo-3", slug:"mercedes-benz-eqa-250-2024", make:"Mercedes-Benz", model:"EQA 250+", year:2024, price:42900, mileage:9200, fuel:"Electric", transmission:"Automatic", body_style:"SUV", exterior_color:"Cosmos Black", description:"Quiet, confident electric motoring with an impressive range, intuitive MBUX technology and a composed ride. One owner from new, with the balance of the manufacturer's warranty.", image_url:null, status:"available", featured:false, created_at:"2026-01-03" },
  { id:"demo-4", slug:"audi-a5-sportback-2021", make:"Audi", model:"A5 Sportback S line", year:2021, price:31900, mileage:31800, fuel:"Diesel", transmission:"Automatic", body_style:"Hatchback", exterior_color:"Glacier White", description:"Elegant five-door practicality meets Audi's unmistakable build quality. S line styling, virtual cockpit and full service history make this a particularly compelling example.", image_url:null, status:"available", featured:false, created_at:"2026-01-04" },
  { id:"demo-5", slug:"volvo-xc60-recharge-2023", make:"Volvo", model:"XC60 Recharge Plus", year:2023, price:51400, mileage:14200, fuel:"Plug-in hybrid", transmission:"Automatic", body_style:"SUV", exterior_color:"Denim Blue", description:"Scandinavian design, advanced safety and powerful plug-in hybrid performance. A spacious family SUV with premium interior materials and a panoramic glass roof.", image_url:null, status:"available", featured:true, created_at:"2026-01-05" },
  { id:"demo-6", slug:"tesla-model-3-long-range-2022", make:"Tesla", model:"Model 3 Long Range", year:2022, price:33900, mileage:22500, fuel:"Electric", transmission:"Automatic", body_style:"Saloon", exterior_color:"Pearl White", description:"Long-range electric performance with over-the-air updates, premium connectivity and a minimalist, technology-rich cabin. Includes home charging cable and two key cards.", image_url:null, status:"available", featured:false, created_at:"2026-01-06" },
];


export async function getVehicles(): Promise<Vehicle[]> {
  const pool = await getSqlPool();
  if (!pool) return demoVehicles;

  const result = await pool.request().query<Vehicle>(
    "SELECT id, slug, make, model, year, price, mileage, fuel, transmission, body_style, exterior_color, description, image_url, status, featured, CONVERT(varchar(33), created_at, 127) AS created_at FROM dbo.Vehicles WHERE status = 'available' ORDER BY featured DESC, created_at DESC"
  );
  return result.recordset;
}

export async function getVehicle(slug: string): Promise<Vehicle | null> {
  const pool = await getSqlPool();
  if (!pool) return demoVehicles.find((vehicle) => vehicle.slug === slug) ?? null;

  const result = await pool
    .request()
    .input("slug", sql.NVarChar(180), slug)
    .query<Vehicle>(
      "SELECT id, slug, make, model, year, price, mileage, fuel, transmission, body_style, exterior_color, description, image_url, status, featured, CONVERT(varchar(33), created_at, 127) AS created_at FROM dbo.Vehicles WHERE slug = @slug AND status = 'available'"
    );
  return result.recordset[0] ?? null;
}
