"use client";

import { useState, useEffect } from "react";
import type { BrandConfig } from "./brand-config.types";

/**
 * Configuration de repli initiale (Fallback)
 * Garantit que la landing page s'affiche instantanément sans écran blanc
 * même en cas d'indisponibilité temporaire du réseau ou du serveur.
 */
export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  identity: {
    displayName: "GuinéeGo LAT",
    legalName: "GuinéeGo LAT SARL",
    logoUrl: "/images/guineego_logo.jpg",
    tagline: "Vos colis, notre priorité",
    primaryColor: "#0d8f4f",
    accentColor: "#e52320",
    darkBgColor: "#071710",
    country: "Guinée",
    countryCode: "+224",
  },
  agencies: [
    {
      id: "conakry",
      city: "Conakry",
      title: "Agence Principale Grand Conakry",
      coverage: "Conakry • Kaloum • Ratoma • Matam • Dixinn",
      primaryPhone: "+224 620 00 00 00",
      secondaryPhone: "+224 660 00 00 00",
      whatsapp: "224620000000",
      address: "Centre d'Affaires, Kaloum, Conakry, Guinée",
      status: "Ouvert • 08h00 - 20h30",
      hubLead: "Responsable Opérations Conakry",
    },
    {
      id: "kankan",
      city: "Kankan",
      title: "Agence Régionale Haute-Guinée",
      coverage: "Kankan • Haute-Guinée • Faranah",
      primaryPhone: "+224 660 00 00 00",
      secondaryPhone: null,
      whatsapp: "224660000000",
      address: "Avenue Principale, Kankan, Guinée",
      status: "Ouvert • 08h00 - 19h00",
      hubLead: "Responsable Antenne Kankan",
    },
  ],
  socials: {
    tiktok: {
      handle: "@guineego",
      url: "https://www.tiktok.com/@guineego",
      label: "TikTok Officiel",
      followers: "1 157+",
      likes: "4 351+",
    },
    facebook: {
      name: "GuinéeGo LAT",
      url: "https://www.facebook.com/guineego",
      label: "Page Facebook",
    },
    instagram: {
      handle: "@guineego",
      url: "https://www.instagram.com/guineego",
      label: "Instagram",
    },
    whatsappPrimary: "https://wa.me/224620000000?text=Bonjour%20Guin%C3%A9eGo%20LAT%2C%20je%20souhaite%20confier%20mes%20colis%20%C3%A0%20Conakry",
    whatsappSecondary: "https://wa.me/224660000000?text=Bonjour%20Guin%C3%A9eGo%20LAT%2C%20je%20souhaite%20confier%20mes%20colis%20%C3%A0%20Kankan",
  },
  stats: {
    tiktokFollowers: "1 157+",
    tiktokLikes: "4 351+",
    yearsActive: "1 An",
    parcelsDelivered: "5 000+",
    agencyCount: 2,
    deliverySuccessRate: 94,
    closingConversionRate: 92.4,
  },
  pricing: {
    closingFeeDisplay: "800 GNF / commande",
    deliveryFeeDisplay: "2 000 GNF / course",
    currencyDisplay: "GNF",
  },
  hero: {
    headline: "GuinéeGo LAT",
    subtext: "Votre partenaire de livraison express COD à Conakry et Kankan. Closing téléphonique, stockage gratuit, reversement quotidien.",
    coverageCities: ["Conakry", "Kankan", "Kaloum", "Ratoma", "Matam", "Dixinn"],
  },
  closing: {
    languages: "Français • Poular • Malinké • Soussou",
    callDelay: "< 15 min",
    conversionRate: "92.4%",
    paymentMethods: ["MTN Mobile Money Guinée", "Moov Money Guinée", "Wave / Cash"],
  },
  faq: [
    {
      q: "Dans quelles villes livrez-vous ?",
      a: "GuinéeGo LAT opère actuellement à Conakry (Grand Conakry) et Kankan (Haute-Guinée). Nos livreurs couvrent Kaloum, Ratoma, Matam, Dixinn et les communes environnantes.",
    },
    {
      q: "Comment sont reversés les fonds collectés ?",
      a: "Chaque soir ouvrable, les fonds collectés sont reversés via MTN Mobile Money Guinée ou Moov Money Guinée. Vous recevez une notification de confirmation dès le virement effectué.",
    },
    {
      q: "Combien d'agences possédez-vous ?",
      a: "GuinéeGo LAT dispose de 2 agences actives : Conakry (Centre d'Affaires, Kaloum) et Kankan (Avenue Principale). Chaque agence gère son propre stock et ses propres livreurs.",
    },
    {
      q: "Comment contacter l'agence ?",
      a: "Contactez l'Agence Conakry au +224 620 00 00 00 ou l'Agence Kankan au +224 660 00 00 00. Vous pouvez aussi nous écrire directement sur WhatsApp pour une réponse rapide.",
    },
  ],
  services: [
    {
      id: "closing",
      title: "1. Closing Téléphonique Pro",
      badge: "1. Closing Téléphonique",
      highlight: "Validation prospect en 15 min",
      desc: "Nos opératrices qualifiées appellent vos prospects sous 15 min pour valider l'achat et l'adresse exacte.",
      feeDisplay: "800 GNF / commande",
      image: "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif",
      href: "/partenaire",
      order: 1,
    },
    {
      id: "storage",
      title: "2. Stockage & Entrepôt",
      badge: "2. Stockage Gratuit",
      highlight: "Hubs Conakry & Kankan",
      desc: "Entreposage gratuit et sécurisé de vos marchandises dans nos hubs sous surveillance 24h/24.",
      feeDisplay: "100% OFFERT",
      image: "/images/eno_courier_bike.png",
      href: "/partenaire",
      order: 2,
    },
    {
      id: "delivery",
      title: "3. Livraison Express COD (< 2h)",
      badge: "3. Livraison Express",
      highlight: "Remise sous 2h & Cash COD",
      desc: "Livraison directe à domicile avec encaissement du cash et reversement Mobile Money garanti.",
      feeDisplay: "2 000 GNF / course",
      image: "/images/eno_delivery_handover.png",
      href: "/partenaire",
      order: 3,
    },
    {
      id: "dashboard",
      title: "4. Dashboard & Synchro E-commerce",
      badge: "4. Suivi Dashboard",
      highlight: "Synchro Shopify & Suivi Réel",
      desc: "Pilotez vos ventes, suivez chaque coursier et consultez vos bilans financiers en temps réel.",
      feeDisplay: "GRATUIT",
      image: "/images/istockphoto-1481860080-612x612.jpg",
      href: "/partenaire",
      order: 4,
    },
  ],
  howItWorks: [
    {
      number: "01",
      title: "Contactez notre agence",
      desc: "Inscrivez-vous sur l'Espace Partenaire ou contactez directement nos agences sur WhatsApp.",
      color: "bg-[#0d8f4f]",
      order: 1,
    },
    {
      number: "02",
      title: "Stockage & Dépôt Offert",
      desc: "Notre coursier récupère vos articles ou vous déposez votre stock dans nos entrepôts sécurisés.",
      color: "bg-[#0f291e]",
      order: 2,
    },
    {
      number: "03",
      title: "Closing & Livraison Express",
      desc: "Nos closeuses confirment vos prospects sous 15 min et nos livreurs à moto livrent à domicile en moins de 2h.",
      color: "bg-[#0d8f4f]",
      order: 3,
    },
    {
      number: "04",
      title: "Reversement Cash Quotidien",
      desc: "L'argent est collecté auprès du client (COD) et vous est reversé le jour même par Mobile Money.",
      color: "bg-[#22c55e]",
      order: 4,
    },
  ],
  registrationCities: [
    { value: "Conakry", label: "Conakry" },
    { value: "Kaloum", label: "Kaloum" },
    { value: "Ratoma", label: "Ratoma" },
    { value: "Matam", label: "Matam" },
    { value: "Kankan", label: "Kankan" },
    { value: "Faranah", label: "Faranah" },
    { value: "Autre", label: "Autre ville" },
  ],
  recruitment: {
    primaryLabel: "Agence Conakry",
    secondaryLabel: "Agence Kankan",
    whatsappPrimary: "https://wa.me/224620000000?text=Bonjour%20Guin%C3%A9eGo%20LAT%2C%20je%20souhaite%20postuler%20comme%20LIVREUR%20%C3%A0%20CONAKRY.%20Voici%20mes%20informations%20%3A",
    whatsappSecondary: "https://wa.me/224660000000?text=Bonjour%20Guin%C3%A9eGo%20LAT%2C%20je%20souhaite%20postuler%20comme%20LIVREUR%20%C3%A0%20KANKAN.%20Voici%20mes%20informations%20%3A",
  },
};

// Cache en mémoire pour éviter de refaire plusieurs requêtes simultanées
let cachedBrandConfig: BrandConfig | null = null;
let fetchPromise: Promise<BrandConfig> | null = null;

/**
 * Invalide le cache local et notifie tous les composants consommateurs
 * pour un rafraîchissement immédiat de la marque.
 */
export function invalidateBrandConfigCache(newConfig?: BrandConfig): void {
  if (newConfig) {
    cachedBrandConfig = newConfig;
  } else {
    cachedBrandConfig = null;
  }
  fetchPromise = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("brand-config-updated", { detail: newConfig || null })
    );
  }
}

/**
 * Force une nouvelle récupération de la configuration depuis l'API serveur
 */
export async function refreshBrandConfig(): Promise<BrandConfig> {
  cachedBrandConfig = null;
  fetchPromise = null;
  try {
    const res = await fetch(`/api/brand-config?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.brandConfig) {
        cachedBrandConfig = data.brandConfig as BrandConfig;
        invalidateBrandConfigCache(cachedBrandConfig);
        return cachedBrandConfig;
      }
    }
  } catch (e) {
    console.warn("Échec refreshBrandConfig:", e);
  }
  return cachedBrandConfig || DEFAULT_BRAND_CONFIG;
}

export function useBrandConfig() {
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(
    cachedBrandConfig || DEFAULT_BRAND_CONFIG
  );
  const [loading, setLoading] = useState<boolean>(!cachedBrandConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Écoute des mises à jour en direct déclenchées par l'espace PDG
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<BrandConfig | null>;
      if (customEvent.detail && isMounted) {
        setBrandConfig(customEvent.detail);
      } else if (isMounted) {
        // Refetch depuis le serveur avec bust de cache
        fetch(`/api/brand-config?t=${Date.now()}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.brandConfig && isMounted) {
              cachedBrandConfig = data.brandConfig as BrandConfig;
              setBrandConfig(data.brandConfig as BrandConfig);
            }
          })
          .catch(() => {});
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("brand-config-updated", handleUpdate);
    }

    if (!fetchPromise) {
      fetchPromise = fetch("/api/brand-config")
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const data = await res.json();
          if (data.success && data.brandConfig) {
            cachedBrandConfig = data.brandConfig as BrandConfig;
            return data.brandConfig as BrandConfig;
          }
          throw new Error(data.error || "Configuration invalide");
        })
        .catch((err) => {
          console.warn("Utilisation de la configuration par défaut suite à l'erreur:", err);
          fetchPromise = null;
          return DEFAULT_BRAND_CONFIG;
        });
    }

    fetchPromise.then((config) => {
      if (isMounted) {
        setBrandConfig(config);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("brand-config-updated", handleUpdate);
      }
    };
  }, []);

  return { brandConfig, loading, error, refresh: refreshBrandConfig };
}

