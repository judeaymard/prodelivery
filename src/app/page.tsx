"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Truck,
  Package,
  BarChart3,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Globe,
  ArrowUpRight,
  HelpCircle,
  Check,
  Zap,
  ArrowRight,
  Activity,
  Headphones,
  TrendingUp,
  Flame,
  Award,
  Play,
  Heart,
  Share2,
} from "lucide-react";
import { useBrandConfig } from "@/lib/useBrandConfig";

export default function LandingPage() {
  const { brandConfig } = useBrandConfig();
  const {
    identity,
    media,
    agencies,
    socials,
    stats,
    pricing,
    hero,
    closing,
    faq,
    services,
    howItWorks,
    recruitment,
  } = brandConfig;

  const primaryColor = identity?.primaryColor || "#0d8f4f";
  const accentColor = identity?.accentColor || "#e52320";
  const darkBgColor = identity?.darkBgColor || "#071710";

  const agencyCities = (agencies || []).map((a) => a.city);
  const coverageCitiesList =
    hero?.coverageCities && hero.coverageCities.length > 0
      ? hero.coverageCities
      : agencyCities;
  const agencyCitiesLabel =
    coverageCitiesList.length > 2
      ? `${coverageCitiesList[0]} & Environs`
      : (coverageCitiesList.length > 0 ? coverageCitiesList.join(" & ") : (identity?.country || "Guinée"));
  const primaryAgency = agencies && agencies.length > 0 ? agencies[0] : null;
  const secondaryAgency = agencies && agencies.length > 1 ? agencies[1] : null;

  const tiktokUrl = typeof socials?.tiktok === "string" ? socials.tiktok : socials?.tiktok?.url || "https://tiktok.com/@guineego";
  const facebookUrl = typeof socials?.facebook === "string" ? socials.facebook : socials?.facebook?.url || "https://facebook.com/guineego";
  const instagramUrl = typeof socials?.instagram === "string" ? socials.instagram : socials?.instagram?.url || "https://instagram.com/guineego";
  const tiktokHandle = typeof socials?.tiktok === "object" ? socials?.tiktok?.handle || "@guineego" : "@guineego";
  const facebookName = typeof socials?.facebook === "object" ? socials?.facebook?.name || (identity?.displayName || "GuinéeGo") : (identity?.displayName || "GuinéeGo");
  const instagramHandle = typeof socials?.instagram === "object" ? socials?.instagram?.handle || "@guineego" : "@guineego";

  const whatsappPrimaryUrl = primaryAgency?.whatsapp
    ? `https://wa.me/${primaryAgency.whatsapp.replace(/[^0-9]/g, "")}`
    : "https://wa.me/224612117070";
  const whatsappSecondaryUrl = secondaryAgency?.whatsapp
    ? `https://wa.me/${secondaryAgency.whatsapp.replace(/[^0-9]/g, "")}`
    : whatsappPrimaryUrl;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [riderModalOpen, setRiderModalOpen] = useState(false);
  const [isClosingCardFlipped, setIsClosingCardFlipped] = useState(false);

  // 🌟 ANIMATION FLUIDE AU DÉFILEMENT (Slide Gauche/Droite, Fondu, Échelle)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    const elements = document.querySelectorAll(
      ".reveal-left, .reveal-right, .reveal-up, .reveal-scale"
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: "01",
      icon: PhoneCall,
      title: "Contactez notre agence",
      desc: "Inscrivez-vous sur l'Espace Partenaire ou contactez directement notre siège de Conakry sur WhatsApp.",
      color: "bg-[#0d8f4f]",
    },
    {
      number: "02",
      icon: Package,
      title: "Stockage & Dépôt Offert",
      desc: "Notre coursier récupère vos articles ou vous déposez votre stock dans notre entrepôt sécurisé à Conakry.",
      color: "bg-[#0f291e]",
    },
    {
      number: "03",
      icon: Truck,
      title: "Closing & Livraison Express",
      desc: "Nos closeuses confirment vos prospects sous 15 min et nos livreurs à moto livrent à domicile en moins de 2h.",
      color: "bg-[#0d8f4f]",
    },
    {
      number: "04",
      icon: CheckCircle2,
      title: "Reversement Cash Quotidien",
      desc: "L'argent est collecté auprès du client (COD) et vous est reversé le jour même par MTN Mobile Money Guinée ou Moov Money Guinée.",
      color: "bg-[#22c55e]",
    },
  ];

  const faqs = [
    {
      q: "Comment s'effectue le reversement de mon argent encaissé (Cash On Delivery) ?",
      a: "Tous les soirs ou à chaque livraison validée, l'argent collecté par nos livreurs vous est reversé directement par MTN Mobile Money Guinée, Moov Money Guinée ou Virement selon vos préférences déclarées.",
    },
    {
      q: "Quelles sont les communes et zones couvertes par GuinéeGo ?",
      a: "Notre siège et entrepôt opérationnel est situé à Conakry (Centre d'Affaires, Kaloum). Nos livreurs couvrent l'ensemble de la capitale : Kaloum, Ratoma, Matam, Dixinn et communes environnantes.",
    },
    {
      q: "Que se passe-t-il si un client annule au moment de la livraison ?",
      a: "Grâce à notre service de closing téléphonique préalable sous 15 min, notre taux d'annulation chute en dessous de 8%. Si une annulation survient malgré tout, le produit retourne immédiatement à l'entrepôt sans frais de pénalité.",
    },
    {
      q: "Le stockage de mes marchandises est-il vraiment 100% gratuit ?",
      a: "Oui ! Le stockage et l'entreposage de vos produits sont 100% offerts et sécurisés dans notre hub de Conakry. Vous ne payez que les frais de closing et de livraison lorsqu'un colis est remis au client.",
    },
  ];

  return (
    <div
      style={{
        "--brand-primary": primaryColor,
        "--brand-accent": accentColor,
        "--brand-dark-bg": darkBgColor,
      } as React.CSSProperties}
      className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[var(--brand-primary)] selection:text-white overflow-x-hidden"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --brand-primary: ${primaryColor};
          --brand-accent: ${accentColor};
          --brand-dark-bg: ${darkBgColor};
        }
        .brand-bg-primary { background-color: var(--brand-primary) !important; }
        .brand-text-primary { color: var(--brand-primary) !important; }
        .brand-border-primary { border-color: var(--brand-primary) !important; }
        .brand-bg-accent { background-color: var(--brand-accent) !important; }
        .brand-text-accent { color: var(--brand-accent) !important; }
        .brand-border-accent { border-color: var(--brand-accent) !important; }
        .brand-bg-dark { background-color: var(--brand-dark-bg) !important; }
        .brand-text-dark { color: var(--brand-dark-bg) !important; }
        .brand-border-dark { border-color: var(--brand-dark-bg) !important; }
        .brand-hover-text-primary:hover { color: var(--brand-primary) !important; }
        .brand-hover-bg-primary:hover { background-color: var(--brand-primary) !important; }
      `}} />
      {media?.faviconUrl && (
        <link rel="icon" href={media.faviconUrl} />
      )}
      {/* 💎 NAVIGATION BAR: DESIGN ÉPURÉ SANS DÉBORDEMENT */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform bg-white shrink-0">
                <Image
                  src={identity?.logoUrl || "/images/guineego_logo.jpg"}
                  alt={`Logo ${identity?.displayName || "GuinéeGo LAT"}`}
                  fill
                  className="object-contain p-0.5"
                  priority
                  unoptimized={Boolean(identity?.logoUrl?.startsWith("http") || identity?.logoUrl?.startsWith("/uploads"))}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  <span className="brand-text-primary">{identity?.displayName || "GuinéeGo LAT"}</span>
                </span>
                <span className="text-[9px] tracking-widest uppercase font-black text-emerald-600 mt-1">
                  {identity?.tagline || "VOS COLIS, NOTRE PRIORITÉ"}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — Serrés pour rester strictement sur une seule ligne */}
            <div className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-xs xl:text-sm font-semibold text-slate-700 whitespace-nowrap flex-nowrap">
              <a href="#services" className="hover:text-[#0d8f4f] transition-colors">
                Services
              </a>
              <a href="#comment-ca-marche" className="hover:text-[#0d8f4f] transition-colors">
                Comment ça marche
              </a>
              <button
                onClick={() => setRiderModalOpen(true)}
                className="hover:text-[#0d8f4f] transition-colors flex items-center gap-1 cursor-pointer font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Truck className="w-3.5 h-3.5 text-[#0d8f4f]" />
                <span>Devenir livreur</span>
              </button>
              <a href="#communaute" className="hover:text-[#0d8f4f] transition-colors flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500" /> Communauté
              </a>
              <a href="#pourquoi" className="hover:text-[#0d8f4f] transition-colors">
                Pourquoi GuinéeGo
              </a>
              <a href="#faq" className="hover:text-[#0d8f4f] transition-colors">
                FAQ
              </a>
            </div>

            {/* Action Buttons */}
            <div className="hidden sm:flex items-center gap-2.5 shrink-0">
              <a
                href={whatsappPrimaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#0d8f4f] border border-emerald-200 text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25d366] fill-[#25d366]" />
                <span>WhatsApp</span>
              </a>
              <Link
                href="/partenaire"
                className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full bg-[#0d8f4f] hover:bg-[#15803d] text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5 text-emerald-100" />
                <span>Espace Partenaire</span>
                <ChevronRight className="w-3 h-3 text-emerald-200" />
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/partenaire"
                className="px-3.5 py-2 rounded-full bg-[#0d8f4f] text-white text-xs font-bold sm:hidden"
              >
                Connexion
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Menu mobile"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-6 py-6 space-y-4 shadow-xl animate-fade-in-up">
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-900">
              Nos Services
            </a>
            <a href="#comment-ca-marche" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-[#0d8f4f]">
              Comment ça marche
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setRiderModalOpen(true);
              }}
              className="w-full text-left text-sm font-bold text-emerald-700 flex items-center gap-2"
            >
              <Truck className="w-4 h-4 text-[#0d8f4f]" /> Devenir livreur (Recrutement)
            </button>
            <a href="#communaute" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-900">
              Réseaux Sociaux (@guineego)
            </a>
            <a href="#pourquoi" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-900">
              Pourquoi {identity?.displayName || "GuinéeGo"}
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-900">
              FAQ
            </a>
            <Link href="/partenaire" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-black text-[#0d8f4f] pt-2 border-t border-slate-100">
              Accès Espace Partenaire →
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={whatsappPrimaryUrl}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25d366] text-white font-bold text-xs shadow-md"
              >
                <MessageSquare className="w-4 h-4 fill-white" /> WhatsApp {primaryAgency?.city || "Conakry"} : {primaryAgency?.primaryPhone || "+224 612 11 31 31"}
              </a>
              {secondaryAgency && (
                <a
                  href={whatsappSecondaryUrl}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#0d8f4f] text-white font-bold text-xs shadow-md"
                >
                  <MessageSquare className="w-4 h-4 fill-white" /> WhatsApp {secondaryAgency.city} : {secondaryAgency.primaryPhone}
                </a>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 🌟 HERO SECTION WITH FLUID 3D ROTATING PHOTO CARDS */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-white py-12 lg:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Copy (6 cols) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left reveal-left">
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                {hero?.headline ? (
                  hero.headline.includes(identity?.displayName) ? (
                    hero.headline.split(identity?.displayName).map((part: string, i: number, arr: string[]) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && <span className="brand-text-primary">{identity?.displayName}</span>}
                      </React.Fragment>
                    ))
                  ) : (
                    <>
                      {hero.headline} avec <span className="brand-text-primary">{identity?.displayName}</span>
                    </>
                  )
                ) : (
                  <>
                    {identity?.tagline || "Vos colis, notre priorité"} avec <span className="brand-text-primary">{identity?.displayName || "GuinéeGo LAT"}</span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                {hero?.subtext || (
                  <>
                    <strong>{identity?.displayName || "GuinéeGo"}</strong> s&apos;occupe de toutes vos livraisons de colis à <strong>{agencyCitiesLabel}</strong>. Nous combinons un <strong>closing téléphonique en {closing?.callDelay || "15 min"}</strong> pour confirmer vos commandes, le <strong>stockage 100% offert</strong> et l&apos;encaissement Cash On Delivery avec reversement immédiat par Mobile Money.
                  </>
                )}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1">
                <Link
                  href="/partenaire"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#e52320] hover:bg-[#c91d1a] text-white font-black text-sm shadow-xl shadow-rose-600/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Users className="w-4 h-4 text-emerald-100" />
                  Rejoindre l&apos;Espace Partenaire
                </Link>

                <a
                  href={whatsappPrimaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#25d366] hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  WhatsApp Agence
                </a>
              </div>

              {/* Trust Metrics Pill Box */}
              <div className="pt-4 max-w-lg mx-auto lg:mx-0">
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 text-left">
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-slate-900">
                      {stats?.deliverySuccessRate ? `${stats.deliverySuccessRate}%+` : "94%+"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">Taux de réussite</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-[#0d8f4f]">
                      {stats?.agencyCount && stats.agencyCount > 1 ? `${stats.agencyCount} Agences` : "1 Hub Siège"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">{agencyCitiesLabel || "Conakry"}</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-700">100%</p>
                    <p className="text-[11px] text-slate-500 font-semibold">Reversement Daily</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: 3D ROTATING PHOTO CARD CAROUSEL */}
            <div className="lg:col-span-6 relative py-4 flex flex-col items-center reveal-right delay-150">
              <div className="wrap_3d_card">
                {/* 3D Card 1: Flotte GuinéeGo à moto (Photo 2 Dossier A) */}
                <div className="rotating_card group">
                  <div className="relative w-full h-full">
                    <Image
                      src={media?.heroImage || "/images/guineego_hero_2.jpeg"}
                      alt={`Livreur ${identity?.displayName || "GuinéeGo"} à moto remettant un colis`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean(media?.heroImage?.startsWith("http") || media?.heroImage?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-[#0d8f4f] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
                      SERVICE 7J/7 • CONAKRY
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 text-white">
                      <p className="text-xs font-black">Flotte Motorisée GuinéeGo</p>
                      <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Livraison Rapide, Fiable &amp; Sûre</p>
                    </div>
                  </div>
                </div>

                {/* 3D Card 2: Stockage et Partenariat E-commerce (Photo 3 Dossier A) */}
                <div className="rotating_card group">
                  <div className="relative w-full h-full">
                    <Image
                      src={media?.secondaryImage || "/images/guineego_hero_3.jpeg"}
                      alt={`Partenaire e-commerce ${identity?.displayName || "GuinéeGo"} avec colis en entrepôt`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean(media?.secondaryImage?.startsWith("http") || media?.secondaryImage?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-[#071710] text-[#86efac] border border-emerald-500 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
                      PARTENAIRE N°1
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 text-white">
                      <p className="text-xs font-black">Stockage, Closing &amp; Livraison</p>
                      <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Pour E-commerçants en Guinée</p>
                    </div>
                  </div>
                </div>

                {/* 3D Card 3: Équipe et Anniversaire 1 An (Photo 1 Dossier A) */}
                <div className="rotating_card group">
                  <div className="relative w-full h-full">
                    <Image
                      src={media?.heroCard3Image || "/images/guineego_hero_1.jpeg"}
                      alt={`Équipe GuinéeGo LAT célébrant 1 an d'activité`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean((media?.heroCard3Image || media?.closingImage)?.startsWith("http") || (media?.heroCard3Image || media?.closingImage)?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-[#0d8f4f] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
                      1 AN D&apos;IMPACT EN GUINÉE
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 text-white">
                      <p className="text-xs font-black">GuinéeGo - Services Express</p>
                      <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Livraison • Academy • Transit</p>
                    </div>
                  </div>
                </div>

                {/* 3D Card 4: Paiement Cash COD & Course Urgente */}
                <div className="rotating_card group">
                  <div className="relative w-full h-full">
                    <Image
                      src={media?.heroCard4Image || "/images/guineego_hero_2.jpeg"}
                      alt={`Encaissement et remise ${identity?.displayName || "GuinéeGo"}`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean(media?.heroCard4Image?.startsWith("http") || media?.heroCard4Image?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
                      CASH COD SÉCURISÉ
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 text-white">
                      <p className="text-xs font-black">Encaissement &amp; Virement Daily</p>
                      <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Reversement MTN MoMo &amp; Moov</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Trust Badge */}
              <div className="mt-6 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-md border border-emerald-100 flex items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-[#0d8f4f] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900">Plus de 1 An de Confiance en Guinée</p>
                  <p className="text-[10px] text-emerald-700 font-bold">Des milliers de colis livrés avec succès</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📍 SECTION NOTRE SIÈGE ET IMPLANTATION LOCALE (CONAKRY) */}
      <section id="agences" className="py-20 bg-[#071710] text-white relative overflow-hidden border-b border-emerald-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3 reveal-up">
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-emerald-500/30 inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#22c55e]" /> {agencies && agencies.length > 1 ? "NOS AGENCES PHYSIQUES" : "NOTRE SIÈGE & IMPLANTATION LOCALE"}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {agencies && agencies.length > 1 ? (
                <>Une présence réelle à {agencies.map((a: any, i: number) => (
                  <span key={a.id}><span className="text-[#22c55e]">{a.city}</span>{i < agencies.length - 1 ? " & " : ""}</span>
                ))}</>
              ) : (
                <>Une présence locale au cœur de <span className="text-[#22c55e]">Conakry</span></>
              )}
            </h2>
            <p className="text-emerald-100/70 text-sm sm:text-base font-normal">
              {agencies && agencies.length > 1
                ? "Vos clients sont servis rapidement grâce à nos entrepôts de proximité et nos flottes de coursiers déployées sur le terrain."
                : "Vos clients sont servis rapidement grâce à notre hub de proximité et notre flotte de coursiers déployée sur le terrain."}
            </p>
          </div>

          <div className={agencies && agencies.length === 1 ? "max-w-2xl mx-auto" : "grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"}>
            {(agencies || []).map((agency: any, index: number) => (
              <div
                key={agency.id}
                className={`bg-gradient-to-br from-[#0c2419] to-[#081b13] border border-emerald-800/50 rounded-3xl p-7 space-y-6 shadow-2xl hover:border-emerald-500/50 transition-all duration-300 group flex flex-col justify-between ${
                  index === 0 ? "reveal-left delay-100" : "reveal-right delay-200"
                }`}
              >
                <div className="space-y-4">
                  {/* Agency Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#22c55e] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        {agency.status}
                      </span>
                      <h3 className="text-2xl font-black text-white mt-2.5">
                        Agence de {agency.city}
                      </h3>
                      <p className="text-xs text-emerald-300/80 font-medium mt-0.5">
                        {agency.title}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-[#22c55e] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <MapPin className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Zones Couvertes */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-900/60 text-xs">
                    <p className="text-[10px] font-extrabold uppercase text-emerald-400">Zones Couvertes</p>
                    <p className="font-bold text-white mt-0.5">{agency.coverage}</p>
                  </div>

                  {/* Contacts Téléphoniques */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2.5 text-xs text-slate-200">
                      <PhoneCall className="w-4 h-4 text-[#22c55e]" />
                      <span>Numéro principal :</span>
                      <a href={`tel:${agency.primaryPhone.replace(/\s+/g, '')}`} className="font-mono font-bold text-white hover:text-emerald-300">
                        {agency.primaryPhone}
                      </a>
                    </div>
                    {agency.secondaryPhone && (
                      <div className="flex items-center gap-2.5 text-xs text-slate-200">
                        <PhoneCall className="w-4 h-4 text-emerald-400" />
                        <span>Ligne secondaire :</span>
                        <a href={`tel:${agency.secondaryPhone.replace(/\s+/g, '')}`} className="font-mono font-bold text-white hover:text-emerald-300">
                          {agency.secondaryPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-900/60">
                  <a
                    href={`tel:${agency.primaryPhone.replace(/\s+/g, '')}`}
                    className="px-4 py-3 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 text-white text-xs font-bold border border-emerald-800 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4 text-[#22c55e]" /> Appeler
                  </a>
                  <a
                    href={`https://wa.me/${agency.whatsapp}?text=Bonjour%20${encodeURIComponent(identity?.displayName || 'GuinéeGo')}%20${encodeURIComponent(agency.city)}%2C%20je%20souhaite%20confier%20des%20colis`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-2xl bg-[#25d366] hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" /> WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3 reveal-up">
            <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-[#15803d] text-xs font-bold border border-emerald-300">
              Comment ça marche
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Simple, rapide et efficace
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-normal">
              En 4 étapes simples, vos colis sont livrés et votre argent encaissé en toute sécurité en Guinée.
            </p>
          </div>

          {/* 4-Step Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative max-w-6xl mx-auto">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const delayClass =
                index === 0 ? "delay-100" : index === 1 ? "delay-200" : index === 2 ? "delay-300" : "delay-400";
              return (
                <div key={index} className={`flex flex-col items-center text-center relative group reveal-up ${delayClass}`}>
                  <div className="relative mb-6">
                    <div className={`w-22 h-22 rounded-3xl ${step.color} text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-300`}>
                      <StepIcon className="w-9 h-9 stroke-[2]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#071710] text-white font-black text-xs flex items-center justify-center border-2 border-white shadow">
                      {step.number}
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal max-w-xs">{step.desc}</p>

                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-9 -right-5 text-emerald-300 z-10">
                      <ArrowRight className="w-5 h-5 stroke-[2]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 📱 SECTION COMMUNAUTÉ FACEBOOK & RÉSEAUX SOCIAUX — FORMAT VISUEL IMMERSIF */}
      <section id="communaute" className="py-20 bg-[#06140e] text-white relative overflow-hidden border-b border-emerald-950">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 reveal-up">
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-emerald-500/30 inline-flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-500" /> NOTRE COMMUNAUTÉ FACEBOOK
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Suivez nos actualités sur <span className="text-emerald-400">Facebook</span> &amp; nos Réseaux
            </h2>
            <p className="text-emerald-100/70 text-sm sm:text-base font-normal">
              Retrouvez le quotidien de notre flotte, nos séances de formation, les livraisons express et les avis de nos clients sur notre page officielle.
            </p>
          </div>

          {/* 🌟 CREATOR PROFILE BAR (Style Page Officielle Facebook — Preuves sur une seule ligne) */}
          <div className="max-w-5xl mx-auto p-4 sm:p-5 rounded-3xl bg-emerald-950/40 border border-emerald-800/40 backdrop-blur-md flex flex-col xl:flex-row items-center justify-between gap-5 shadow-xl reveal-scale delay-100">
            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-3.5 text-center sm:text-left shrink-0">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 shadow-lg bg-white shrink-0">
                <Image
                  src={identity?.logoUrl || "/images/guineego_logo.jpeg"}
                  alt={`Avatar ${identity?.displayName || "GuinéeGo"} Facebook`}
                  fill
                  className="object-contain p-1"
                  unoptimized={Boolean(identity?.logoUrl?.startsWith("http") || identity?.logoUrl?.startsWith("/uploads"))}
                />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <h3 className="text-base font-black text-white">{identity?.displayName || "GuinéeGo"} - Services Express</h3>
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black" title="Page certifiée officielle">
                    ✓
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-400 font-mono">Page Facebook Officielle • Entreprise de cargo et fret</p>
                <p className="text-[11px] text-slate-300 mt-0.5 whitespace-nowrap">« Livraison express partout en Guinée • 📍 Conakry »</p>
              </div>
            </div>

            {/* Middle: Live Verified Stats — TOUTES LES PREUVES STRICTEMENT SUR UNE SEULE LIGNE */}
            <div className="flex items-center justify-center gap-3.5 sm:gap-6 border-y xl:border-y-0 xl:border-x border-emerald-800/60 py-3 xl:py-0 px-2 xl:px-6 text-center whitespace-nowrap shrink-0">
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">{stats?.facebookFollowers || "1,8 K"}</span>
                <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">Abonnés</span>
              </div>

              <span className="text-emerald-600 font-bold text-sm">•</span>

              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-black text-rose-500 tracking-tight">{stats?.facebookPosts || "99"}</span>
                <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">Publications</span>
              </div>

              <span className="text-emerald-600 font-bold text-sm">•</span>

              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">7j/7</span>
                <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">Disponible</span>
              </div>
            </div>

            {/* Right: Action Button */}
            <div className="shrink-0">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-[#e52320] hover:bg-[#c91d1a] text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
              >
                <span>Rejoindre sur Facebook</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 🌟 3 CARTES ÉPURÉES & SANS SURCHARGE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Carte 1: Flotte Conakry & Livreur */}
            <div className="group relative rounded-3xl overflow-hidden border border-emerald-900/60 hover:border-emerald-500 bg-[#071710] h-[380px] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-6 reveal-left delay-150">
              <Image
                src={media?.communityCard1 || "/images/guineego_communaute_livreur.jpg"}
                alt={`Flotte et livreur de livraison ${identity?.displayName || "GuinéeGo"}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={Boolean(media?.communityCard1?.startsWith("http") || media?.communityCard1?.startsWith("/uploads"))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-[#071710]/70 to-transparent"></div>

              {/* Top Tag */}
              <div className="relative z-10 flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold uppercase tracking-wider">
                  Conakry • Fret &amp; Cargo
                </span>
                <span className="text-[10px] text-emerald-300 font-medium">
                  Facebook @guineego
                </span>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10 space-y-2">
                <h3 className="text-lg font-bold text-white leading-snug">
                  Motos &amp; Caissons Sécurisés
                </h3>
                <p className="text-xs text-slate-300 font-normal">
                  Colis, repas et courses urgentes protégés et livrés rapidement.
                </p>
                <div className="pt-2">
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-200 transition-colors"
                  >
                    <span>Voir sur Facebook</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Carte 2: Remise de colis en main propre (Photo 1 Dossier photos1) */}
            <div className="group relative rounded-3xl overflow-hidden border border-emerald-900/60 hover:border-emerald-500 bg-[#071710] h-[380px] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-6 reveal-up delay-250">
              <Image
                src={media?.communityCard2 || "/images/guineego_communaute_remise.jpeg"}
                alt={`Remise de colis en main propre par un livreur ${identity?.displayName || "GuinéeGo"}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={Boolean(media?.communityCard2?.startsWith("http") || media?.communityCard2?.startsWith("/uploads"))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-[#071710]/70 to-transparent"></div>

              {/* Top Tag */}
              <div className="relative z-10 flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold uppercase tracking-wider">
                  Conakry &amp; Environs
                </span>
                <span className="text-[10px] text-emerald-300 font-medium">
                  Facebook @guineego
                </span>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10 space-y-2">
                <h3 className="text-lg font-bold text-white leading-snug">
                  Remise en Main Propre &amp; COD
                </h3>
                <p className="text-xs text-slate-300 font-normal">
                  Encaissement du cash et reversement sécurisé garanti.
                </p>
                <div className="pt-2">
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-200 transition-colors"
                  >
                    <span>Voir sur Facebook</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Carte 3: Réunion d'équipe & Formation (Photo 3 Dossier photos1) */}
            <div className="group relative rounded-3xl overflow-hidden border border-emerald-900/60 hover:border-emerald-500 bg-[#071710] h-[380px] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-6 reveal-right delay-350">
              <Image
                src={media?.communityCard3 || "/images/guineego_communaute_equipe.jpeg"}
                alt={`Séance de travail et équipe terrain ${identity?.displayName || "GuinéeGo"}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={Boolean(media?.communityCard3?.startsWith("http") || media?.communityCard3?.startsWith("/uploads"))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-[#071710]/70 to-transparent"></div>

              {/* Top Tag */}
              <div className="relative z-10 flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold uppercase tracking-wider">
                  Immersion GuinéeGo
                </span>
                <span className="text-[10px] text-emerald-300 font-medium">
                  Facebook @guineego
                </span>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10 space-y-2">
                <h3 className="text-lg font-bold text-white leading-snug">
                  Séances &amp; Équipe Terrain
                </h3>
                <p className="text-xs text-slate-300 font-normal">
                  99 publications partagées avec notre communauté de plus de 1 800 abonnés.
                </p>
                <div className="pt-2">
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-200 transition-colors"
                  >
                    <span>Voir sur Facebook</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 🔗 UNIFIED SOCIAL CHANNELS BAR */}
          <div className="max-w-4xl mx-auto pt-4 reveal-up delay-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/40 hover:border-emerald-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-sm font-black">
                    f
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white">Facebook</p>
                    <p className="text-[10px] text-emerald-300 font-medium">GuineeGo • 1,8 K Abonnés</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappPrimaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/40 hover:border-emerald-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-[#25d366] flex items-center justify-center text-sm font-black">
                    <MessageSquare className="w-4 h-4 fill-[#25d366]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white">WhatsApp Direct</p>
                    <p className="text-[10px] text-emerald-300 font-mono">+224 612 11 70 70</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </a>

              {/* Site Web Officiel */}
              <a
                href="https://guineego.net"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/40 hover:border-cyan-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center text-sm font-black">
                    🌐
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white">Site Officiel</p>
                    <p className="text-[10px] text-cyan-300 font-mono">guineego.net</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 🔮 CLOSING SECTION */}
      <section id="closing" className="py-20 bg-emerald-50/40 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Photo - 3D Flip Card */}
            <div className="lg:col-span-5 relative py-4 reveal-left">
              <div
                className={`flip-card h-[400px] w-full cursor-pointer group select-none ${
                  isClosingCardFlipped ? "is-flipped" : ""
                }`}
                onClick={() => setIsClosingCardFlipped(!isClosingCardFlipped)}
                title="Cliquez ou survolez pour retourner la carte"
              >
                <div className="flip-card-inner">
                  {/* RECTO: L'opératrice au centre d'appel */}
                  <div className="flip-card-front bg-slate-950 border-4 border-white shadow-2xl overflow-hidden flex flex-col justify-between p-5">
                    <Image
                      src={media?.closingImage || "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif"}
                      alt={`Opératrice téléconseillère ${identity?.displayName || "GuinéeGo"} au centre d'appel`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean(media?.closingImage?.startsWith("http") || media?.closingImage?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-black/30 to-black/20"></div>

                    {/* Top Tag & Hint */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="px-3 py-1 rounded-full bg-[#0d8f4f] text-white text-[10px] font-black uppercase tracking-wider shadow">
                        Centre Closing {identity?.displayName || "GuinéeGo"} Conakry
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        Retourner ↻
                      </span>
                    </div>

                    {/* Bottom Info */}
                    <div className="relative z-10 text-left text-white">
                      <p className="text-xs font-bold text-slate-100">
                        Une équipe locale dédiée à la confirmation de vos commandes en 15 minutes.
                      </p>
                    </div>
                  </div>

                  {/* VERSO: Confirmation 3D & Résultat Vente Validée */}
                  <div className="flip-card-back bg-[#071710] border-4 border-emerald-500/80 shadow-2xl overflow-hidden flex flex-col justify-between p-6 text-left">
                    <Image
                      src={media?.closingBackImage || "/images/closing_phone_3d.jpg"}
                      alt={`Confirmation de commande e-commerce ${identity?.displayName || "GuinéeGo"}`}
                      fill
                      className="object-cover opacity-35"
                      unoptimized={Boolean(media?.closingBackImage?.startsWith("http") || media?.closingBackImage?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-[#071710]/85 to-[#071710]/70"></div>

                    {/* Top Status */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#86efac] border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
                        COMMANDE VALIDÉE
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        Recto ↻
                      </span>
                    </div>

                    {/* Center Stat Highlights */}
                    <div className="relative z-10 space-y-3 my-auto">
                      <div className="space-y-1">
                        <h4 className="text-xl font-black text-white leading-tight">
                          Vos Ventes Sécurisées Avant Expédition
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          Validation du numéro, adresse exacte vérifiée et créneau horaire fixé directement avec l&apos;acheteur.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Délai d&apos;Appel</p>
                          <p className="text-sm font-black text-emerald-400">{closing?.callDelay || "< 15 min"}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Succès Closing</p>
                          <p className="text-sm font-black text-white">+{stats?.closingConversionRate || "35"}% Ventes</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Note */}
                    <div className="relative z-10 pt-2 border-t border-emerald-900/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-300">
                        Transmis immédiatement au livreur
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {closing?.languages || "Français • Poular • Malinké • Soussou"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Explanation */}
            <div className="lg:col-span-7 space-y-6 py-2 reveal-right delay-150">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#071710] text-white text-xs font-bold shadow-md">
                <span className="w-2 rounded-full h-2 bg-emerald-400 animate-ping"></span>
                <Headphones className="w-3.5 h-3.5 text-[#86efac]" />
                <span>POURQUOI LE CLOSING CHANGE TOUT</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-slate-900">
                Ne perdez plus 40% de vos ventes à cause du manque de confirmation
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                En Afrique, l&apos;achat en ligne repose d&apos;abord sur la confiance humaine. Chez <strong>{identity?.displayName || "GuinéeGo"}</strong>, nos opératrices téléphoniques appellent vos prospects sous 15 minutes pour valider leur commande, préciser l&apos;adresse exacte et convenir du créneau de livraison.
              </p>

              {/* 2 Pro Feature Cards with Float Animation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="animate-float-closing-1 p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-md hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 space-y-2 group cursor-default">
                  <div className="flex justify-between items-center">
                    <CheckCircle2 className="w-5 h-5 text-[#0d8f4f] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      98% de Réponse
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Appels en Français & Langues Locales
                  </h4>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                    Échanges courtois et rassurants adaptés aux clients de Conakry et ses communes.
                  </p>
                </div>

                <div className="animate-float-closing-2 p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-md hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 space-y-2 group cursor-default">
                  <div className="flex justify-between items-center">
                    <Activity className="w-5 h-5 text-[#0d8f4f] animate-heartbeat" />
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Synchro Dashboard
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Suivi en Direct & Notes Closeuses
                  </h4>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                    Chaque appel est consigné avec l&apos;adresse validée et le statut de livraison réactualisé.
                  </p>
                </div>
              </div>

              {/* Live Stat Footer Banner with Radar Pulse */}
              <div className="animate-pulse-glow flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#071710] text-white text-xs border border-emerald-500/40 hover:border-emerald-400 shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Taux de Conversion Moyen
                    </p>
                    <p className="font-black text-emerald-400 text-sm">92.4% d&apos;achats confirmés</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Délai moyen d&apos;appel</p>
                    <p className="font-black text-white text-sm">&lt; 15 minutes chrono</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 NOS SERVICES */}
      <section id="services" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3 reveal-up">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Des solutions de closing & logistique adaptées aux e-commerçants
            </h2>
            <p className="text-slate-600 text-sm">
              Du premier appel du client jusqu&apos;à l&apos;encaissement du cash et son reversement dans vos mains.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Closing Téléphonique Pro */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group transition-all hover:shadow-xl hover:border-emerald-300 reveal-up delay-100">
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={services?.[0]?.image || "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif"}
                  alt={services?.[0]?.title || "Opératrice Téléphonique Closeuse"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized={Boolean(services?.[0]?.image?.startsWith("http") || services?.[0]?.image?.startsWith("/uploads"))}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-[#0d8f4f] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                  1. Closing Téléphonique
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold">
                  Validation prospect en 15 min
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">1. Closing Téléphonique Pro</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Nos opératrices guinéennes qualifiées appellent vos prospects sous 15 min pour valider l&apos;achat et l&apos;adresse exacte.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{pricing?.closingFeeDisplay || "800 GNF / commande"}</span>
                  <Link href="/partenaire" className="text-[#0d8f4f] font-black hover:underline">
                    Détails →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Stockage & Entrepôt Conakry */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group transition-all hover:shadow-xl hover:border-emerald-300 reveal-up delay-200">
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={services?.[1]?.image || "/images/guineego_stockage_entrepot.jpg"}
                  alt={services?.[1]?.title || "Stockage entrepôt et préparation colis"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized={Boolean(services?.[1]?.image?.startsWith("http") || services?.[1]?.image?.startsWith("/uploads"))}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-[#071710] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                  2. Stockage Gratuit
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold">
                  Hub Conakry
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">2. Stockage &amp; Entrepôt</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Entreposage gratuit et sécurisé de vos marchandises dans notre hub sous surveillance 24h/24.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-600">100% OFFERT</span>
                  <Link href="/partenaire" className="text-[#0d8f4f] font-black hover:underline">
                    Détails →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 3: Livraison Express COD */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group transition-all hover:shadow-xl hover:border-emerald-300 reveal-up delay-300">
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={services?.[2]?.image || "/images/guineego_hero_2.jpeg"}
                  alt={services?.[2]?.title || `Remise colis client ${identity?.displayName || "GuinéeGo"}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized={Boolean(services?.[2]?.image?.startsWith("http") || services?.[2]?.image?.startsWith("/uploads"))}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-[#0d8f4f] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                  3. Livraison Express
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold">
                  Remise sous 2h & Cash COD
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">3. Livraison Express COD (&lt; 2h)</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Livraison directe à domicile avec encaissement du cash et reversement Mobile Money garanti.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{pricing?.deliveryFeeDisplay || "2 000 GNF / course"}</span>
                  <Link href="/partenaire" className="text-[#0d8f4f] font-black hover:underline">
                    Détails →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 4: Dashboard & Synchro E-commerce */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group transition-all hover:shadow-xl hover:border-emerald-300 reveal-up delay-400">
              <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                <Image
                  src={services?.[3]?.image || "/images/istockphoto-1481860080-612x612.jpg"}
                  alt={services?.[3]?.title || "Gestion tableau de bord et synchro Shopify"}
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-500"
                  unoptimized={Boolean(services?.[3]?.image?.startsWith("http") || services?.[3]?.image?.startsWith("/uploads"))}
                />
                <div className="absolute top-3 left-3 bg-[#071710] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                  4. Suivi Dashboard
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-slate-900 font-extrabold text-xs bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-xs border border-slate-200">
                  Synchro Shopify & Suivi Réel
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">4. Dashboard & Synchro E-commerce</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Pilotez vos ventes, suivez chaque coursier et consultez vos bilans financiers en temps réel.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-600">GRATUIT</span>
                  <Link href="/partenaire" className="text-[#0d8f4f] font-black hover:underline">
                    Accéder →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 COMPARATIF VS BATTLE CARDS */}
      <section id="pourquoi" className="py-20 bg-[#071710] text-white relative overflow-hidden border-b border-emerald-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3 reveal-up">
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-emerald-500/30 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> PERFORMANCE LOGISTIQUE EN GUINÉE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Pourquoi choisir <span className="text-[#22c55e]">{identity?.displayName || "GuinéeGo"}</span> ?
            </h2>
            <p className="text-emerald-100/70 text-sm sm:text-base font-normal">
              Découvrez la différence entre les coursiers classiques et le système intégré {identity?.displayName || "GuinéeGo"}.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto mb-16">
            {/* Left Card: COURSIERS CLASSIQUES */}
            <div className="lg:col-span-5 reveal-left delay-100">
              <div className="animate-float-left bg-slate-950/80 border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative group transition-all duration-300">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Méthode Classique
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">Coursiers Indépendants</h3>
                  </div>
                  <XCircle className="w-7 h-7 text-rose-500 stroke-[2]" />
                </div>

                <div className="space-y-3 text-xs font-medium">
                  <div className="flex items-start gap-2.5 text-slate-300">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Aucun rappel prospect (jusqu&apos;à 40% de commandes perdues)</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-300">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Stockage non sécurisé ou à la charge de l&apos;e-commerçant</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-300">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Reversement des fonds très lent (7 à 14 jours d&apos;attente)</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-300">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Aucun tableau de bord ni suivi d&apos;avancement en temps réel</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-slate-400">Taux de livraison réussi</span>
                    <span className="text-rose-400">55%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[55%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center VS Emblem */}
            <div className="lg:col-span-2 flex justify-center py-2 reveal-scale delay-200">
              <div className="w-14 h-14 rounded-full bg-[#0d8f4f] text-white font-black text-lg flex items-center justify-center shadow-[0_0_25px_rgba(22,163,74,0.6)] border-4 border-[#071710] animate-pulse">
                VS
              </div>
            </div>

            {/* Right Card: GuinéeGo */}
            <div className="lg:col-span-5 reveal-right delay-100">
              <div className="animate-float-right bg-gradient-to-br from-[#0c2419] to-[#071710] border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_35px_rgba(22,163,74,0.35)] relative group transition-all duration-300">
                <div className="absolute -top-3.5 right-6 bg-[#0d8f4f] text-white font-black text-[10px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-lg">
                  Recommandé E-commerce
                </div>

                <div className="flex justify-between items-center border-b border-emerald-900 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
                      Solution Complète
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">{identity?.displayName || "GuinéeGo"}</h3>
                  </div>
                  <CheckCircle2 className="w-7 h-7 text-[#22c55e] stroke-[2]" />
                </div>

                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                    <span>Closing téléphonique pro sous 15 min ({closing?.languages || "Français + Langues Locales"})</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                    <span>Stockage 100% OFFERT dans notre entrepôt à Conakry</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Reversement Cash COD quotidien par MTN Mobile Money / Moov</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                    <span>Flotte moto dédiée & contact direct agence Conakry</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-emerald-900 space-y-1.5">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-emerald-200">Taux de livraison réussi</span>
                    <span className="text-emerald-400 font-black">94% +</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#0d8f4f] h-full w-[94%] rounded-full shadow-[0_0_10px_#0d8f4f]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ❓ QUESTIONS FRÉQUENTES (FAQ) */}
      <section id="faq" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2 reveal-up">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#0d8f4f]">
              TRANSPARENCE TOTALE
            </span>
            <h2 className="text-3xl font-black text-slate-900">Questions Fréquentes</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Tout ce que vous devez savoir sur nos services de closing et livraison en Guinée.
            </p>
          </div>

          <div className="space-y-3 reveal-up delay-100">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full p-5 text-left font-bold text-xs sm:text-sm text-slate-900 flex justify-between items-center gap-4 hover:text-[#0d8f4f] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeFaq === index ? "rotate-90 text-[#0d8f4f]" : ""
                    }`}
                  />
                </button>
                {activeFaq === index && (
                  <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 👑 CTA BANNER */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0c2419] to-[#071710] rounded-3xl p-8 sm:p-14 text-white text-center space-y-6 shadow-2xl relative overflow-hidden border border-emerald-900 reveal-scale">
            <Image
              src={media?.ctaImage || "/images/guineego_cta_banner.jpg"}
              alt="Bannière d'action GuinéeGo"
              fill
              className="object-cover opacity-25 pointer-events-none"
              unoptimized={Boolean(media?.ctaImage?.startsWith("http") || media?.ctaImage?.startsWith("/uploads"))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-[#071710]/70 to-[#071710]/40 pointer-events-none"></div>
            <div className="max-w-xl mx-auto space-y-3 relative z-10">
              <span className="px-3.5 py-1 rounded-full bg-[#0d8f4f] text-white text-[10px] font-black uppercase tracking-wider">
                Rejoignez {identity?.displayName || "GuinéeGo"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Booster vos ventes e-commerce en Guinée dès aujourd&apos;hui
              </h2>
              <p className="text-emerald-100/80 text-xs sm:text-sm font-medium">
                {primaryAgency ? `${primaryAgency.title || "Siège Conakry"} : ${primaryAgency.primaryPhone}. ${identity?.tagline || "Vos colis, notre priorité."}` : "Conakry, Guinée. Vos colis, notre priorité."}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3.5 relative z-10 pt-2">
              <Link
                href="/partenaire"
                className="px-8 py-4 rounded-full bg-[#0d8f4f] text-white font-black text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-xl shadow-emerald-600/30"
              >
                <Users className="w-4 h-4" />
                Accéder à l&apos;Espace Partenaire
              </Link>
              <a
                href={whatsappPrimaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-full bg-[#25d366] hover:bg-emerald-600 text-white font-black text-xs transition-all flex items-center gap-2 shadow-xl"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                WhatsApp Agence Conakry
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 👑 FOOTER AVEC CONTACTS EXACTS ET RÉSEAUX SOCIAUX */}
      <footer className="bg-[#071710] text-slate-400 border-t border-emerald-950 pt-12 pb-8 text-[11px] antialiased">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 pb-10 border-b border-emerald-900/60">
            {/* Col 1: Brand & Bio */}
            <div className="md:col-span-4 space-y-3.5">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 bg-white">
                  <Image
                    src={identity?.logoUrl || "/images/guineego_logo.jpeg"}
                    alt={`Logo ${identity?.displayName || "GuinéeGo"}`}
                    fill
                    className="object-contain p-0.5"
                    unoptimized={Boolean(identity?.logoUrl?.startsWith("http") || identity?.logoUrl?.startsWith("/uploads"))}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-white tracking-tight">
                    {identity?.displayName || "GuinéeGo"}
                  </span>
                  <span className="text-[9px] uppercase font-black text-emerald-400 tracking-wider">
                    {identity?.tagline || "Vos colis, notre priorité"}
                  </span>
                </div>
              </Link>

              <p className="text-[11px] text-slate-400 leading-relaxed font-normal max-w-sm">
                Agence guinéenne de closing téléphonique, stockage sécurisé et livraison express Cash On Delivery pour e-commerçants. Présente à Conakry.
              </p>

              <div className="space-y-1.5 pt-1">
                {(agencies && agencies.length > 0 ? agencies : [
                  { id: "conakry", title: "Siège Conakry", city: "Conakry", address: "Dabompa, Tamisso, Conakry, Guinée" }
                ]).map((agency: any) => (
                  <div key={agency.id} className="flex items-center gap-2 text-[10px] font-semibold text-emerald-200 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60 w-fit">
                    <MapPin className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                    <span>{agency.title || `Agence ${agency.city}`} : {agency.address || agency.city}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 2: Navigation Rapide */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-white text-[11px] font-black uppercase tracking-wider">
                Navigation
              </h4>
              <ul className="space-y-2 text-slate-400 font-normal">
                <li>
                  <a href="#services" className="hover:text-emerald-300 transition-colors">
                    Nos Services
                  </a>
                </li>
                <li>
                  <a href="#agences" className="hover:text-emerald-300 transition-colors">
                    {agencies && agencies.length > 1 ? "Nos Agences" : "Notre Siège"}
                  </a>
                </li>
                <li>
                  <a href="#closing" className="hover:text-emerald-300 transition-colors">
                    Centre de Closing
                  </a>
                </li>
                <li>
                  <a href="#communaute" className="hover:text-emerald-300 transition-colors">
                    Réseaux Sociaux
                  </a>
                </li>
                <li>
                  <a href="#pourquoi" className="hover:text-emerald-300 transition-colors">
                    Pourquoi GuinéeGo
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Réseaux Sociaux Officiels */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-white text-[11px] font-black uppercase tracking-wider">
                Suivez-nous sur les Réseaux
              </h4>
              <ul className="space-y-2.5 text-slate-300 font-medium">
                <li>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-400 hover:text-white transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Facebook : <strong>{facebookName}</strong></span>
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappPrimaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#25d366]"></span>
                    <span>WhatsApp : <strong>+224 612 11 70 70</strong></span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://guineego.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Site Web : <strong>guineego.net</strong></span>
                  </a>
                </li>
                <li>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <span>Instagram : <strong>{instagramHandle}</strong></span>
                  </a>
                </li>
              </ul>

              <div className="pt-2">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Reconnaissance</p>
                <p className="text-[11px] text-emerald-400 font-bold mt-0.5">Plus de 1 an d&apos;activité en Guinée</p>
              </div>
            </div>

            {/* Col 4: Contacts Officiels des Agences */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-white text-[11px] font-black uppercase tracking-wider">
                Contacts Directs Agence
              </h4>
              <div className="space-y-2 text-slate-300 font-medium">
                {(agencies && agencies.length > 0 ? agencies : [
                  { id: "conakry", title: "Siège & Hub Conakry", city: "Conakry", primaryPhone: "+224 612 11 31 31", secondaryPhone: "+224 612 11 70 70" }
                ]).map((agency: any, idx: number) => (
                  <div key={agency.id || idx} className={idx > 0 ? "pt-1 border-t border-emerald-900/60" : ""}>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase">{agency.title || `Agence ${agency.city}`}</p>
                    <p className="flex items-center gap-2 mt-0.5">
                      <PhoneCall className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                      <span>{agency.primaryPhone}</span>
                    </p>
                    {agency.secondaryPhone && (
                      <p className="flex items-center gap-2 text-slate-400">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{agency.secondaryPhone}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Email & Support */}
              <div className="pt-1.5 space-y-1 text-[10px] text-slate-400">
                <p className="flex items-center gap-1.5">
                  <span className="text-[#22c55e]">✉</span>
                  <a href="mailto:thesucces999@gmail.com" className="hover:text-emerald-300 transition-colors">thesucces999@gmail.com</a>
                </p>
              </div>

              {/* Payment Methods */}
              <div className="pt-2">
                <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
                  <span className="bg-emerald-950 text-yellow-400 px-2 py-0.5 rounded-md border border-emerald-800">
                    MTN MoMo
                  </span>
                  <span className="bg-emerald-950 text-blue-400 px-2 py-0.5 rounded-md border border-emerald-800">
                    Moov Money
                  </span>
                  <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-800">
                    Wave / Cash
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500 font-medium">
            <p>© {new Date().getFullYear()} {identity?.legalName || identity?.displayName || "GuinéeGo"} ({identity?.country || "Guinée"}) — {agencyCitiesLabel}. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <Link href="/partenaire" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Espace Partenaire
              </Link>
              <span className="text-slate-700">•</span>
              <a href={whatsappPrimaryUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                WhatsApp {primaryAgency?.city || "Conakry"}
              </a>
              {secondaryAgency && (
                <>
                  <span className="text-slate-700">•</span>
                  <a href={whatsappSecondaryUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    WhatsApp {secondaryAgency.city}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
      {/* 🛵 MODALE INTERACTIVE: DEVENIR LIVREUR GuinéeGo */}
      {riderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#071710] border border-emerald-800/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#0d8f4f]/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Close Button */}
            <button
              onClick={() => setRiderModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-slate-300 hover:text-white transition-colors"
              aria-label="Fermer la boîte"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-[#0d8f4f] text-white text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow">
                <Truck className="w-3.5 h-3.5" /> RECRUTEMENT LIVREURS OUVERT
              </span>
              <h3 className="text-2xl font-black text-white">
                Rejoignez la Flotte <span className="text-[#22c55e]">{identity?.displayName || "GuinéeGo"}</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Vous possédez une moto et connaissez bien votre ville ? Devenez livreur officiel {identity?.displayName || "GuinéeGo"} à Conakry avec un volume journalier de colis garanti.
              </p>
            </div>

            {/* Photo Thumbnail + 3 Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-emerald-950/60 border border-emerald-900/60">
              <div className="sm:col-span-4 relative h-28 rounded-xl overflow-hidden border border-emerald-700/60">
                <Image
                  src={media?.riderImage || media?.heroImage || "/images/guineego_hero_2.jpeg"}
                  alt={`Livreur ${identity?.displayName || "GuinéeGo"} à moto`}
                  fill
                  className="object-cover"
                  unoptimized={Boolean((media?.riderImage || media?.heroImage)?.startsWith("http") || (media?.riderImage || media?.heroImage)?.startsWith("/uploads"))}
                />
              </div>
              <div className="sm:col-span-8 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                  <span><strong>Caisson isotherme officiel</strong> vert floqué {identity?.displayName || "GuinéeGo"} mis à disposition.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                  <span><strong>Rémunération motivante</strong> par course livrée avec paiement régulier.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                  <span>Affectation immédiate sur <strong>Conakry</strong> et communes.</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Recruitment Actions */}
            <div className="space-y-2.5 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Postuler directement par WhatsApp :
              </p>

              <div className={secondaryAgency ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                {/* Primary Agency Application */}
                <a
                  href={recruitment?.whatsappPrimary || `https://wa.me/${(primaryAgency?.whatsapp || "224612117070").replace(/[^0-9]/g, "")}?text=Bonjour%20${encodeURIComponent(identity?.displayName || "GuinéeGo")}%2C%20je%20souhaite%20postuler%20comme%20LIVREUR%20%C3%A0%20CONAKRY.%20Voici%20mes%20informations%20%3A`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-[#25d366] hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-center"
                >
                  <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                  <span>Postuler pour {primaryAgency?.city || "Conakry"}<br /><span className="text-[10px] font-mono font-normal">{primaryAgency?.primaryPhone || "+224 612 11 31 31"}</span></span>
                </a>

                {/* Secondary Agency Application if exists */}
                {secondaryAgency && (
                  <a
                    href={recruitment?.whatsappSecondary || `https://wa.me/${(secondaryAgency.whatsapp || "").replace(/[^0-9]/g, "")}?text=Bonjour%20${encodeURIComponent(identity?.displayName || "GuinéeGo")}%2C%20je%20souhaite%20postuler%20comme%20LIVREUR%20%C3%A0%20${encodeURIComponent(secondaryAgency.city)}.%20Voici%20mes%20informations%20%3A`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-[#0d8f4f] hover:bg-[#15803d] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-center"
                  >
                    <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                    <span>Postuler pour {secondaryAgency.city}<br /><span className="text-[10px] font-mono font-normal">{secondaryAgency.primaryPhone}</span></span>
                  </a>
                )}
              </div>
            </div>

            {/* Direct Call Footer */}
            <div className="pt-3 border-t border-emerald-900/60 text-center text-slate-400 text-xs">
              <span>Vous préférez appeler ? </span>
              <a href={`tel:${(primaryAgency?.primaryPhone || "+224612113131").replace(/\s+/g, '')}`} className="text-[#22c55e] font-bold hover:underline">
                {primaryAgency?.primaryPhone || "+224 612 11 31 31"}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
