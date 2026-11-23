import { redirect } from "next/navigation";
import { headers } from "next/headers";

type AzurePrincipal = { userDetails?: string; claims?: Array<{ typ?: string; val?: string }> };
export type AppUser = { email: string; name: string };

export async function getCurrentUser(): Promise<AppUser | null> {
  // Only trust this header when App Service Easy Auth is enabled. This prevents
  // a caller from spoofing the header during local development or misconfiguration.
  if (process.env.AZURE_EASY_AUTH_ENABLED !== "true") return null;
  const requestHeaders = await headers();
  if (requestHeaders.get("x-ms-client-principal-idp") !== "aad") return null;
  const encoded = requestHeaders.get("x-ms-client-principal");
  if (!encoded) return null;
  try {
    const principal = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as AzurePrincipal;
    const claims = principal.claims ?? [];
    const pick = (matches: string[]) => claims.find((claim) => matches.some((match) => (claim.typ ?? "").toLowerCase().includes(match)))?.val;
    const email = pick(["emailaddress", "preferred_username", "upn"]) || principal.userDetails;
    if (!email?.includes("@")) return null;
    const name = claims.find((claim) => {
      const type = (claim.typ ?? "").toLowerCase();
      return type === "name" || type.endsWith("/name");
    })?.val;
    return { email: email.toLowerCase(), name: name || email.split("@")[0] };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=signin");
  const allowedEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!allowedEmails.includes(user.email)) redirect("/login?error=not-admin");
  const displayName = process.env.ADMIN_DISPLAY_NAME || "GRUID";
  return { user, admin: { display_name: displayName } };
}
