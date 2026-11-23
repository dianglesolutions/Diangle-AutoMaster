"use server";
import { redirect } from "next/navigation";

export async function signOut() {
  redirect("/.auth/logout?post_logout_redirect_uri=%2F");
}
