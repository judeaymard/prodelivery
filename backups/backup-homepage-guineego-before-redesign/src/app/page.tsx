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
    coverageCitiesList.length > 0 ? coverageCitiesList.join(" & ") : (identity?.country || "Guinée");
  const primaryAgency = agencies && agencies.length > 0 ? agencies[0] : null;
  const secondaryAgency = agencies && agencies.length > 1 ? agencies[1] : primaryAgency;

  const tiktokUrl = typeof socials?.tiktok === "string" ? socials.tiktok : socials?.tiktok?.url || "https://tiktok.com/@guineego";
  const facebookUrl = typeof socials?.facebook === "string" ? socials.facebook : socials?.facebook?.url || "https://facebook.com/guineego";
  const instagramUrl = typeof socials?.instagram === "string" ? socials.instagram : socials?.instagram?.url || "https://instagram.com/guineego";
  const tiktokHandle = typeof socials?.tiktok === "object" ? socials?.tiktok?.handle || "@guineego" : "@guineego";
  const facebookName = typeof socials?.facebook === "object" ? socials?.facebook?.name || (identity?.displayName || "GuinéeGo LAT") : (identity?.displayName || "GuinéeGo LAT");
  const instagramHandle = typeof socials?.instagram === "object" ? socials?.instagram?.handle || "@guineego" : "@guineego";

  const whatsappPrimaryUrl = primaryAgency?.whatsapp
    ? `https://wa.me/${primaryAgency.whatsapp.replace(/[^0-9]/g, "")}`
    : "https://wa.me/224613242013";
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
      desc: "Inscrivez-vous sur l'Espace Partenaire ou contactez directement l'Agence de Conakry ou Kankan sur WhatsApp.",
      color: "bg-[#0d8f4f]",
    },
    {
      number: "02",
      icon: Package,
      title: "Stockage & Dépôt Offert",
      desc: "Notre coursier récupère vos articles ou vous déposez votre stock dans nos entrepôts sécurisés à Conakry ou Kankan.",
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
      desc: "L'argent est collecté auprès du client (COD) et vous est reversé le jour même par MTN Mobile Money ou Moov Money.",
      color: "bg-[#22c55e]",
    },
  ];

  const faqs = [
    {
      q: "Comment s'effectue le reversement de mon argent encaissé (Cash On Delivery) ?",
      a: "Tous les soirs ou à chaque livraison validée, l'argent collecté par nos livreurs vous est reversé directement par MTN Mobile Money (+229 01 64 29 18 84), Moov Money ou Virement selon vos préférences déclarées.",
    },
    {
      q: "Quelles sont les villes et agences couvertes par GuinéeGo LAT ?",
      a: "Nous disposons de 2 grandes agences physiques opérationnelles : l'Agence Principale de Cotonou (couvrant Cotonou, Abomey-Calavi et Porto-Novo) et l'Agence Régionale de Lokossa (couvrant Lokossa et la zone Mono/Couffo). Nous assurons également des expéditions vers tout le Guinée.",
    },
    {
      q: "Que se passe-t-il si un client annule au moment de la livraison ?",
      a: "Grâce à notre service de closing téléphonique préalable sous 15 min, notre taux d'annulation chute en dessous de 8%. Si une annulation survient malgré tout, le produit retourne immédiatement à l'entrepôt sans frais de pénalité.",
    },
    {
      q: "Le stockage de mes marchandises est-il vraiment 100% gratuit ?",
      a: "Oui ! Le stockage et l'entreposage de vos produits sont 100% offerts et sécurisés dans nos hubs de Conakry et Kankan. Vous ne payez que les frais de closing et de livraison lorsqu'un colis est remis au client.",
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
              Pourquoi GuinéeGo LAT
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
                <MessageSquare className="w-4 h-4 fill-white" /> WhatsApp Cotonou : 01 64 29 18 84
              </a>
              <a
                href={whatsappSecondaryUrl}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#0d8f4f] text-white font-bold text-xs shadow-md"
              >
                <MessageSquare className="w-4 h-4 fill-white" /> WhatsApp Lokossa : 01 67 51 00 82
              </a>
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
                    <strong>{identity?.displayName || "GuinéeGo LAT"}</strong> s&apos;occupe de toutes vos livraisons de colis à <strong>{agencyCitiesLabel}</strong>. Nous combinons un <strong>closing téléphonique en {closing?.callDelay || "15 min"}</strong> pour confirmer vos commandes, le <strong>stockage 100% offert</strong> et l&apos;encaissement Cash On Delivery avec reversement immédiat par Mobile Money.
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
                      {stats?.agencyCount ? `${stats.agencyCount} Agences` : `${agencies?.length || 2} Agences`}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">{agencyCitiesLabel || "Cotonou & Lokossa"}</p>
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
                {/* 3D Card 1: Vraie photo du livreur à moto avec caisson vert ENO */}
                <div className="rotating_card group">
                  <div className="relative w-full h-full">
                    <Image
                      src={media?.heroImage || "/images/eno_courier_bike.png"}
                      alt={`Livreur ${identity?.displayName || "GuinéeGo LAT"} à moto avec caisson vert officiel`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean(media?.heroImage?.startsWith("http") || media?.heroImage?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-[#0d8f4f] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
                      FLOTTE GUINÉECO LAT
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 text-white">
                      <p className="text-xs font-black">Caisson Isotherme Sécurisé</p>
                      <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Grand Conakry & Régions</p>
                    </div>
                  </div>
                </div>

                {/* 3D Card 2: Vraie photo de la remise de colis à Lokossa */}
                <div className="rotating_card group">
                  <div className="relative w-full h-full">
                    <Image
                      src={media?.secondaryImage || "/images/eno_delivery_handover.png"}
                      alt={`Remise de colis en main propre par un coursier ${identity?.displayName || "GuinéeGo"}`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean(media?.secondaryImage?.startsWith("http") || media?.secondaryImage?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-[#071710] text-[#86efac] border border-emerald-500 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
                      SATISFACTION CLIENT
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 text-white">
                      <p className="text-xs font-black">Remise en main propre</p>
                      <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Kankan & Haute-Guinée</p>
                    </div>
                  </div>
                </div>

                {/* 3D Card 3: Closeuse professionnelle */}
                <div className="rotating_card group">
                  <div className="relative w-full h-full">
                    <Image
                      src={media?.heroCard3Image || media?.closingImage || "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif"}
                      alt={`Closeuse professionnelle ${identity?.displayName || "GuinéeGo LAT"}`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean((media?.heroCard3Image || media?.closingImage)?.startsWith("http") || (media?.heroCard3Image || media?.closingImage)?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-[#0d8f4f] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
                      CLOSING 15 MIN
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 text-white">
                      <p className="text-xs font-black">Centre de Closing Téléphonique</p>
                      <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Confirmation & Prise d&apos;adresse</p>
                    </div>
                  </div>
                </div>

                {/* 3D Card 4: Paiement Cash COD */}
                <div className="rotating_card group">
                  <div className="relative w-full h-full">
                    <Image
                      src={media?.heroCard4Image || "/images/gros-plan-livreur-colis_23-2149095905.avif"}
                      alt="Paiement cash COD et remise colis"
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean(media?.heroCard4Image?.startsWith("http") || media?.heroCard4Image?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
                      CASH COD
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 text-white">
                      <p className="text-xs font-black">Encaissement & Virement Daily</p>
                      <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Reversement MTN MoMo & Moov</p>
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

      {/* 📍 SECTION NOS AGENCES PHYSIQUES AU BÉNIN (COTONOU & LOKOSSA) */}
      <section id="agences" className="py-20 bg-[#071710] text-white relative overflow-hidden border-b border-emerald-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3 reveal-up">
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-emerald-500/30 inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#22c55e]" /> DEUX AGENCES PHYSIQUES À VOTRE SERVICE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Une présence réelle à <span className="text-[#22c55e]">Cotonou</span> & <span className="text-[#22c55e]">Lokossa</span>
            </h2>
            <p className="text-emerald-100/70 text-sm sm:text-base font-normal">
              Vos clients sont servis rapidement grâce à nos entrepôts de proximité et nos flottes de coursiers déployées sur le terrain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                    href={`https://wa.me/${agency.whatsapp}?text=Bonjour%20ENO%20LIVRAISON%20${agency.city}%2C%20je%20souhaite%20confier%20des%20colis`}
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

      {/* 📱 SECTION COMMUNAUTÉ TIKTOK & RÉSEAUX SOCIAUX — FORMAT REELS IMMERSIF */}
      <section id="communaute" className="py-20 bg-[#06140e] text-white relative overflow-hidden border-b border-emerald-950">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 reveal-up">
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-emerald-500/30 inline-flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" /> COULISSES & IMMERSION TERRAIN
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Vivez l&apos;expérience sur <span className="text-[#22c55e]">TikTok</span> & nos Réseaux
            </h2>
            <p className="text-emerald-100/70 text-sm sm:text-base font-normal">
              Découvrez le quotidien de nos livreurs, les réceptions en entrepôt, les tournées à Conakry et Kankan, et les retours d&apos;expérience de nos clients.
            </p>
          </div>

          {/* 🌟 CREATOR PROFILE BAR (Style Carte Créateur TikTok Officiel — Preuves sur une seule ligne) */}
          <div className="max-w-5xl mx-auto p-4 sm:p-5 rounded-3xl bg-emerald-950/40 border border-emerald-800/40 backdrop-blur-md flex flex-col xl:flex-row items-center justify-between gap-5 shadow-xl reveal-scale delay-100">
            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-3.5 text-center sm:text-left shrink-0">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#22c55e] shadow-lg bg-white shrink-0">
                <Image
                  src={identity?.logoUrl || "/images/guineego_logo.jpg"}
                  alt={`Avatar ${identity?.displayName || "GuinéeGo LAT"} TikTok`}
                  fill
                  className="object-contain p-1"
                  unoptimized={Boolean(identity?.logoUrl?.startsWith("http") || identity?.logoUrl?.startsWith("/uploads"))}
                />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <h3 className="text-base font-black text-white">{identity?.displayName || "GuinéeGo LAT"}</h3>
                  <span className="w-4 h-4 rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[10px] font-black" title="Certifié officiel">
                    ✓
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-400 font-mono">@guineego</p>
                <p className="text-[11px] text-slate-300 mt-0.5 whitespace-nowrap">« Vos colis, notre priorité ! 📍 Cotonou & Lokossa »</p>
              </div>
            </div>

            {/* Middle: Live Verified Stats — TOUTES LES PREUVES STRICTEMENT SUR UNE SEULE LIGNE */}
            <div className="flex items-center justify-center gap-3.5 sm:gap-6 border-y xl:border-y-0 xl:border-x border-emerald-800/60 py-3 xl:py-0 px-2 xl:px-6 text-center whitespace-nowrap shrink-0">
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">{stats?.tiktokFollowers || "1 157+"}</span>
                <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">Abonnés</span>
              </div>

              <span className="text-emerald-600 font-bold text-sm">•</span>

              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-black text-[#22c55e] tracking-tight">{stats?.tiktokLikes || "4 351+"}</span>
                <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">J&apos;aime</span>
              </div>

              <span className="text-emerald-600 font-bold text-sm">•</span>

              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">{stats?.yearsActive || "1 An"}</span>
                <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">d&apos;existence</span>
              </div>
            </div>

            {/* Right: Action Button */}
            <div className="shrink-0">
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
              >
                <span>S&apos;abonner sur TikTok</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 🌟 3 CARTES ÉPURÉES & SANS SURCHARGE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Carte 1: Flotte Cotonou */}
            <div className="group relative rounded-3xl overflow-hidden border border-emerald-900/60 hover:border-emerald-500 bg-[#071710] h-[380px] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-6 reveal-left delay-150">
              <Image
                src={media?.communityCard1 || "/images/eno_card_1.png"}
                alt={`Flotte de livraison ${agencyCities[0] || "Cotonou"}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={Boolean(media?.communityCard1?.startsWith("http") || media?.communityCard1?.startsWith("/uploads"))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-[#071710]/70 to-transparent"></div>

              {/* Top Tag */}
              <div className="relative z-10 flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold uppercase tracking-wider">
                  Cotonou & Calavi
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  TikTok @guineego
                </span>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10 space-y-2">
                <h3 className="text-lg font-bold text-white leading-snug">
                  Motos & Caissons Isothermes
                </h3>
                <p className="text-xs text-slate-300 font-normal">
                  Colis protégés de la poussière et livrés en moins de 2h.
                </p>
                <div className="pt-2">
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22c55e] hover:text-white transition-colors"
                  >
                    <span>Voir sur TikTok</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Carte 2: Remise Lokossa */}
            <div className="group relative rounded-3xl overflow-hidden border border-emerald-900/60 hover:border-emerald-500 bg-[#071710] h-[380px] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-6 reveal-up delay-250">
              <Image
                src={media?.communityCard2 || "/images/eno_card_2.png"}
                alt={`Remise de colis en main propre ${agencyCities[1] ? "à " + agencyCities[1] : "à Lokossa"}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={Boolean(media?.communityCard2?.startsWith("http") || media?.communityCard2?.startsWith("/uploads"))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-[#071710]/70 to-transparent"></div>

              {/* Top Tag */}
              <div className="relative z-10 flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold uppercase tracking-wider">
                  Lokossa & Mono
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  TikTok @guineego
                </span>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10 space-y-2">
                <h3 className="text-lg font-bold text-white leading-snug">
                  Remise en Main Propre & COD
                </h3>
                <p className="text-xs text-slate-300 font-normal">
                  Encaissement du cash et reversement Mobile Money le jour même.
                </p>
                <div className="pt-2">
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22c55e] hover:text-white transition-colors"
                  >
                    <span>Voir sur TikTok</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Carte 3: Réseau & Croissance */}
            <div className="group relative rounded-3xl overflow-hidden border border-emerald-900/60 hover:border-emerald-500 bg-[#071710] h-[380px] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-6 reveal-right delay-350">
              <Image
                src={media?.communityCard3 || "/images/eno_courier_handover_action.png"}
                alt={`Satisfaction client et livraisons ${identity?.displayName || "Eno"}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={Boolean(media?.communityCard3?.startsWith("http") || media?.communityCard3?.startsWith("/uploads"))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-[#071710]/70 to-transparent"></div>

              {/* Top Tag */}
              <div className="relative z-10 flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold uppercase tracking-wider">
                  Guinée
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  TikTok @guineego
                </span>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10 space-y-2">
                <h3 className="text-lg font-bold text-white leading-snug">
                  1 An d&apos;Existence en Guinée
                </h3>
                <p className="text-xs text-slate-300 font-normal">
                  Plus de 5 000 colis distribués et 4 350+ mentions J&apos;aime.
                </p>
                <div className="pt-2">
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22c55e] hover:text-white transition-colors"
                  >
                    <span>Voir sur TikTok</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 🔗 UNIFIED SOCIAL CHANNELS BAR */}
          <div className="max-w-4xl mx-auto pt-4 reveal-up delay-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* TikTok */}
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/40 hover:border-emerald-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center text-sm font-black">
                    🎵
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white">TikTok</p>
                    <p className="text-[10px] text-emerald-300 font-mono">@guineego</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/40 hover:border-emerald-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-black">
                    f
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white">Facebook</p>
                    <p className="text-[10px] text-emerald-300 font-medium">GuinéeGo LAT</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </a>

              {/* Instagram */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/40 hover:border-emerald-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center text-sm font-black">
                    📸
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white">Instagram</p>
                    <p className="text-[10px] text-emerald-300 font-mono">@guineego</p>
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
                      alt={`Opératrice téléconseillère ${identity?.displayName || "GuinéeGo LAT"} au centre d'appel`}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={Boolean(media?.closingImage?.startsWith("http") || media?.closingImage?.startsWith("/uploads"))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071710] via-black/30 to-black/20"></div>

                    {/* Top Tag & Hint */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="px-3 py-1 rounded-full bg-[#0d8f4f] text-white text-[10px] font-black uppercase tracking-wider shadow">
                        Centre Closing ENO Cotonou
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
                      alt={`Confirmation de commande e-commerce ${identity?.displayName || "ENO"}`}
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
                        Français • Fon • Mina
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
                En Afrique, l&apos;achat en ligne repose d&apos;abord sur la confiance humaine. Chez <strong>GuinéeGo LAT</strong>, nos opératrices téléphoniques appellent vos prospects sous 15 minutes pour valider leur commande, préciser l&apos;adresse exacte et convenir du créneau de livraison.
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
                    Échanges courtois et rassurants adaptés aux clients de Cotonou, Calavi, Porto-Novo et Lokossa.
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
                  <span className="font-bold text-slate-900">800 F CFA / commande</span>
                  <Link href="/partenaire" className="text-[#0d8f4f] font-black hover:underline">
                    Détails →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Stockage & Entrepôt Cotonou & Lokossa */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group transition-all hover:shadow-xl hover:border-emerald-300 reveal-up delay-200">
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={services?.[1]?.image || "/images/eno_courier_bike.png"}
                  alt={services?.[1]?.title || "Stockage entrepôt et préparation colis ENO"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized={Boolean(services?.[1]?.image?.startsWith("http") || services?.[1]?.image?.startsWith("/uploads"))}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-[#071710] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                  2. Stockage Gratuit
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold">
                  Hubs Cotonou & Lokossa
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">2. Stockage & Entrepôt</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Entreposage gratuit et sécurisé de vos marchandises dans nos hubs sous surveillance 24h/24.
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
                  src={services?.[2]?.image || "/images/eno_delivery_handover.png"}
                  alt={services?.[2]?.title || "Remise colis client GuinéeGo LAT"}
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
                  <span className="font-bold text-slate-900">2 000 F CFA / course</span>
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
              <Sparkles className="w-3.5 h-3.5" /> PERFORMANCE LOGISTIQUE AU BÉNIN
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Pourquoi choisir <span className="text-[#22c55e]">GuinéeGo LAT</span> ?
            </h2>
            <p className="text-emerald-100/70 text-sm sm:text-base font-normal">
              Découvrez la différence entre les coursiers classiques et le système intégré GuinéeGo LAT.
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

            {/* Right Card: GuinéeGo LAT */}
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
                    <h3 className="text-xl font-black text-white mt-1">GuinéeGo LAT</h3>
                  </div>
                  <CheckCircle2 className="w-7 h-7 text-[#22c55e] stroke-[2]" />
                </div>

                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                    <span>Closing téléphonique pro sous 15 min (Français + Fon/Mina)</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                    <span>Stockage 100% OFFERT dans nos entrepôts Cotonou & Lokossa</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Reversement Cash COD quotidien par MTN MoMo / Moov</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                    <span>Flotte moto dédiée & contact direct agences Cotonou / Lokossa</span>
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
            {media?.ctaImage && (
              <Image
                src={media.ctaImage}
                alt="Bannière d'action GuinéeGo"
                fill
                className="object-cover opacity-15 pointer-events-none"
                unoptimized={Boolean(media.ctaImage.startsWith("http") || media.ctaImage.startsWith("/uploads"))}
              />
            )}
            <div className="max-w-xl mx-auto space-y-3 relative z-10">
              <span className="px-3.5 py-1 rounded-full bg-[#0d8f4f] text-white text-[10px] font-black uppercase tracking-wider">
                Rejoignez GuinéeGo LAT
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Booster vos ventes e-commerce en Guinée dès aujourd&apos;hui
              </h2>
              <p className="text-emerald-100/80 text-xs sm:text-sm font-medium">
                Cotonou : 01 64 29 18 84 • Lokossa : 01 67 51 00 82. Vos colis, notre priorité.
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
                    src={identity?.logoUrl || "/images/guineego_logo.jpg"}
                    alt={`Logo ${identity?.displayName || "GuinéeGo LAT"}`}
                    fill
                    className="object-contain p-0.5"
                    unoptimized={Boolean(identity?.logoUrl?.startsWith("http") || identity?.logoUrl?.startsWith("/uploads"))}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-white tracking-tight">
                    ENO <span className="text-[#22c55e]">LIVRAISON</span>
                  </span>
                  <span className="text-[9px] uppercase font-black text-emerald-400 tracking-wider">
                    Vos colis, notre priorité
                  </span>
                </div>
              </Link>

              <p className="text-[11px] text-slate-400 leading-relaxed font-normal max-w-sm">
                Agence guinéenne de closing téléphonique, stockage sécurisé et livraison express Cash On Delivery pour e-commerçants. Présente à Conakry et Kankan.
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-200 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60 w-fit">
                  <MapPin className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                  <span>Agence Conakry : Centre d'Affaires, Kaloum</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-200 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60 w-fit">
                  <MapPin className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                  <span>Agence Kankan : Avenue Principale, Kankan</span>
                </div>
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
                    Nos 2 Agences
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
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-300 hover:text-white transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>TikTok : <strong>{tiktokHandle}</strong></span>
                  </a>
                </li>
                <li>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Facebook : <strong>{facebookName}</strong></span>
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
                Contacts Directs Agences
              </h4>
              <div className="space-y-2 text-slate-300 font-medium">
                {(agencies && agencies.length > 0 ? agencies : [
                  { id: "1", title: "Agence Conakry", city: "Conakry", primaryPhone: "+229 01 64 29 18 84", secondaryPhone: "+229 01 93 83 79 06" },
                  { id: "2", title: "Agence Kankan", city: "Kankan", primaryPhone: "+229 01 67 51 00 82" }
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
            <p>© {new Date().getFullYear()} {identity?.legalName || identity?.displayName || "GuinéeGo LAT"} ({identity?.country || "Guinée"}) — {agencyCitiesLabel}. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <Link href="/partenaire" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Espace Partenaire
              </Link>
              <span className="text-slate-700">•</span>
              <a href={whatsappPrimaryUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                WhatsApp Cotonou
              </a>
              <span className="text-slate-700">•</span>
              <a href={whatsappSecondaryUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                WhatsApp Lokossa
              </a>
            </div>
          </div>
        </div>
      </footer>
      {/* 🛵 MODALE INTERACTIVE: DEVENIR LIVREUR GuinéeGo LAT */}
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
                Rejoignez la Flotte <span className="text-[#22c55e]">GuinéeGo LAT</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Vous possédez une moto et connaissez bien votre ville ? Devenez livreur officiel ENO à Conakry ou Kankan avec un volume journalier de colis garanti.
              </p>
            </div>

            {/* Photo Thumbnail + 3 Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-emerald-950/60 border border-emerald-900/60">
              <div className="sm:col-span-4 relative h-28 rounded-xl overflow-hidden border border-emerald-700/60">
                <Image
                  src={media?.riderImage || media?.heroImage || "/images/eno_courier_bike.png"}
                  alt={`Livreur ${identity?.displayName || "GuinéeGo LAT"} à moto`}
                  fill
                  className="object-cover"
                  unoptimized={Boolean((media?.riderImage || media?.heroImage)?.startsWith("http") || (media?.riderImage || media?.heroImage)?.startsWith("/uploads"))}
                />
              </div>
              <div className="sm:col-span-8 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                  <span><strong>Caisson isotherme officiel</strong> vert floqué ENO mis à disposition.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                  <span><strong>Rémunération motivante</strong> par course livrée avec paiement régulier.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                  <span>Affectation immédiate sur <strong>Cotonou</strong> ou <strong>Lokossa</strong>.</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Recruitment Actions */}
            <div className="space-y-2.5 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Postuler directement par WhatsApp :
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cotonou Application */}
                <a
                  href="https://wa.me/2290164291884?text=Bonjour%20ENO%20LIVRAISON%2C%20je%20souhaite%20postuler%20comme%20LIVREUR%20%C3%A0%20COTONOU.%20Voici%20mes%20informations%20%3A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-[#25d366] hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-center"
                >
                  <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                  <span>Agence Conakry<br /><span className="text-[10px] font-mono font-normal">01 64 29 18 84</span></span>
                </a>

                {/* Lokossa Application */}
                <a
                  href="https://wa.me/2290167510082?text=Bonjour%20ENO%20LIVRAISON%2C%20je%20souhaite%20postuler%20comme%20LIVREUR%20%C3%A0%20LOKOSSA.%20Voici%20mes%20informations%20%3A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-[#0d8f4f] hover:bg-[#15803d] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-center"
                >
                  <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                  <span>Agence Kankan<br /><span className="text-[10px] font-mono font-normal">01 67 51 00 82</span></span>
                </a>
              </div>
            </div>

            {/* Direct Call Footer */}
            <div className="pt-3 border-t border-emerald-900/60 text-center text-slate-400 text-xs">
              <span>Vous préférez appeler ? </span>
              <a href="tel:+2290164291884" className="text-[#22c55e] font-bold hover:underline">
                +229 01 64 29 18 84
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
