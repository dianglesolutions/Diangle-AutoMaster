import { NextResponse } from "next/server";
import { getVehicleBlob } from "@/lib/azure/blob";

const validName = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!validName.test(name)) return new NextResponse("Not found", { status: 404 });
  try {
    const blob = getVehicleBlob(name);
    const [data, properties] = await Promise.all([blob.downloadToBuffer(), blob.getProperties()]);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": properties.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
