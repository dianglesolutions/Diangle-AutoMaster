import type { Metadata } from "next";
import { LockKeyhole, ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  const enabled = process.env.AZURE_EASY_AUTH_ENABLED === "true";
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/admin";
  return <main className="auth-page"><div className="auth-art"><div className="auth-photo"/><div className="auth-overline">AUTO<span>MASTER</span><i>.</i></div><div className="auth-quote"><span className="eyebrow eyebrow-light"><span className="eyebrow-dot"/> THE ROAD AHEAD</span><h1>Better journeys<br/>start <em>here.</em></h1><p>Welcome to your AutoMaster workspace.</p></div><span className="auth-art-caption">EXCEPTIONAL CARS. EXCEPTIONAL SERVICE.</span></div><section className="auth-panel"><div className="auth-form-wrap"><Link className="back-link" href="/"><ArrowLeft size={15}/> Back to the collection</Link><div className="auth-icon"><LockKeyhole/></div><div className="eyebrow">TEAM ACCESS</div><h2>Welcome<br/><em>back.</em></h2><p className="auth-intro">Sign in with your organization account to manage the AutoMaster collection and enquiries.</p>{params.error && <div className="notice notice-error">{params.error === "not-admin" ? "This account is not on the AutoMaster administrator list." : params.error === "signin" ? "Sign in with your organization account to continue." : "Microsoft Entra sign-in is not configured for this deployment yet."}</div>}{enabled ? <a className="button button-dark auth-submit" href={`/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(next)}`}>Continue with Microsoft Entra <ArrowUpRight size={16}/></a> : <div className="notice notice-error">Azure Easy Auth is not enabled yet. Ask your Azure administrator to finish the App Service setup.</div>}<div className="auth-footnote">Team members only. Need access? Contact your administrator.</div></div></section></main>;
}
