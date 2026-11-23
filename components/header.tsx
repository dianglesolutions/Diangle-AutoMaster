import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function Header() {
  const user = await getCurrentUser();
  return <header className="site-header"><div className="container nav"><Link className="brand" href="/">AUTO<span>MASTER</span><i>.</i></Link><nav className="nav-links"><Link href="/#collection">Browse cars</Link><Link href="/#why-us">Our approach</Link></nav><div className="nav-actions"><Link className="nav-login" href={user ? "/admin" : "/login"}>{user ? "Dashboard" : "Sign in"}</Link><Link className="button button-dark button-small" href="/#collection">Explore collection <ArrowUpRight size={15}/></Link></div></div></header>;
}
