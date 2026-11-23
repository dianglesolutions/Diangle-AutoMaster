import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Fuel, Gauge, Settings2, ShieldCheck } from "lucide-react";
import { getVehicle } from "@/lib/data";
import { submitEnquiry } from "@/app/cars/[slug]/actions";

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const car = await getVehicle(slug);
  return { title: car ? `${car.year} ${car.make} ${car.model}` : "Car not found" };
}

export default async function VehiclePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ sent?: string; error?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const car = await getVehicle(slug); if (!car) notFound();
  return <main className="detail-page"><div className="container"><Link className="back-link" href="/#collection"><ArrowLeft size={15}/> Back to the collection</Link><div className="detail-grid"><div className="detail-main"><div className="detail-image">{car.image_url ? <img src={car.image_url} alt={`${car.year} ${car.make} ${car.model}`}/> : <div className="car-placeholder"/>}<span className="car-tag">AUTOMASTER APPROVED</span></div><div className="detail-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> {car.year} · {car.exterior_color || "EXCEPTIONAL CONDITION"}</div><h1>{car.make} <em>{car.model}</em></h1></div><strong className="detail-price">{money(car.price)}</strong></div><div className="spec-grid"><div><Gauge/><span><small>MILEAGE</small><strong>{new Intl.NumberFormat("en-GB").format(car.mileage)} miles</strong></span></div><div><Fuel/><span><small>FUEL TYPE</small><strong>{car.fuel}</strong></span></div><div><Settings2/><span><small>TRANSMISSION</small><strong>{car.transmission}</strong></span></div><div><ShieldCheck/><span><small>BODY STYLE</small><strong>{car.body_style}</strong></span></div></div><section className="detail-description"><div className="eyebrow">A CLOSER LOOK</div><h2>Made for your<br/><em>next chapter.</em></h2><p>{car.description}</p></section></div><aside className="contact-card"><div className="eyebrow"><span className="eyebrow-dot"/> MAKE IT YOURS</div><h2>Let's talk<br/><em>about it.</em></h2><p>Ask a question, arrange a viewing or explore your finance options. Our team will get right back to you.</p>{query.sent && <div className="notice notice-success">Thanks — your enquiry is with our team.</div>}{query.error && <div className="notice notice-error">We couldn't send your enquiry. Please try again.</div>}<form action={submitEnquiry} className="contact-form"><input type="hidden" name="slug" value={car.slug}/><label>Your name<input name="name" placeholder="Full name" required/></label><label>Email address<input name="email" type="email" placeholder="you@example.com" required/></label><label>Phone number <span>OPTIONAL</span><input name="phone" type="tel" placeholder="+44"/></label><label>Your message<textarea name="message" rows={4} defaultValue={`Hi, I'm interested in the ${car.year} ${car.make} ${car.model}.`} required/></label><button className="button button-dark form-submit">Send enquiry <ArrowUpRight size={16}/></button></form><small className="privacy-note">Your details are only used to respond to your enquiry.</small></aside></div></div></main>;
}
