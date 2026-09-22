import { NextRequest, NextResponse } from "next/server";
import { getBrandConfig, saveBrandConfig, saveGlobalAuditLog } from "@/lib/server-db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-service";
import type {
  BrandConfig,
  BrandMediaConfig,
  AgencyConfig,
  SocialsConfig,
  BrandStatsConfig,
  HeroConfig,
  ClosingCenterConfig,
  FaqEntryConfig,
  ServiceConfig,
  HowItWorksStepConfig,
  RegistrationCity,
  RiderRecruitmentConfig,
} from "@/lib/brand-config.types";

const MAX_PAYLOAD_BYTES = 500 * 1024; // 500 Ko
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Assainit une chaîne de caractères en supprimant les scripts et balises HTML dangereuses
 */
function sanitizeString(val: unknown, maxLength = 500): string {
  if (typeof val !== "string") return "";
  let clean = val.trim();
  if (clean.length > maxLength) clean = clean.slice(0, maxLength);
  // Élimination des scripts et gestionnaires d'évènements inline
  clean = clean.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "");
  clean = clean.replace(/<\s*script[^>]*>/gi, "");
  clean = clean.replace(/javascript\s*:/gi, "");
  clean = clean.replace(/vbscript\s*:/gi, "");
  clean = clean.replace(/on\w+\s*=/gi, "");
  // Nettoyage des balises HTML brutes
  clean = clean.replace(/<[^>]*>?/gm, "");
  return clean;
}

/**
 * Valide et assainit une URL pour interdire les protocoles dangereux (javascript:, data:, etc.)
 */
function sanitizeUrl(val: unknown, defaultVal = "#"): string {
  if (typeof val !== "string") return defaultVal;
  const trimmed = val.trim();
  if (!trimmed) return defaultVal;
  const lower = trimmed.toLowerCase();

  // Rejet absolu des schémas malveillants
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return defaultVal;
  }

  // Acceptation des URLs web absolues, relatives, et liens télécoms autorisés
  if (
    lower.startsWith("https://") ||
    lower.startsWith("http://") ||
    lower.startsWith("/") ||
    lower.startsWith("#") ||
    lower.startsWith("tel:") ||
    lower.startsWith("mailto:")
  ) {
    return trimmed.replace(/[<>"']/g, "");
  }

  return defaultVal;
}

/**
 * Valide une couleur hexadécimale
 */
function sanitizeColor(val: unknown, fallback: string): string {
  if (typeof val === "string" && HEX_COLOR_REGEX.test(val.trim())) {
    return val.trim();
  }
  return fallback;
}

/**
 * Assainit un numéro de téléphone ou identifiant WhatsApp
 */
function sanitizePhone(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.replace(/[^0-9+\s\-()]/g, "").trim().slice(0, 35);
}

/**
 * GET /api/brand-config
 *
 * Endpoint public : retourne la configuration de marque actuelle.
 */
export async function GET() {
  try {
    const brandConfig = await getBrandConfig();

    return NextResponse.json(
      {
        success: true,
        brandConfig,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Erreur GET /api/brand-config:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer la configuration de marque",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-config
 *
 * Endpoint sécurisé réservé au rôle PDG ou SUPER_ADMIN.
 * Sauvegarde la nouvelle configuration de marque dans settings.json.
 */
export async function PUT(req: NextRequest) {
  try {
    // 1. Contrôle de la taille du payload (Règle 6 : max 500 Ko)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "Taille de requête excessive (max 500 Ko)." },
        { status: 413 }
      );
    }

    // 2. Contrôle strict de la session serveur (Règles 2 & 3)
    const cookieHeader = req.headers.get("cookie") || "";
    const parsedCookieFromHeader = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.split("=")[1];
    const sessionCookie =
      req.cookies?.get(SESSION_COOKIE_NAME)?.value || parsedCookieFromHeader;
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: "Non authentifié. Session requise." },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(sessionCookie);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session invalide ou expirée." },
        { status: 401 }
      );
    }

    // Seuls PDG et SUPER_ADMIN sont habilités
    if (session.role !== "PDG" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Accès refusé. Rôle PDG ou Super Admin requis." },
        { status: 403 }
      );
    }

    // 3. Lecture et décodage du corps de la requête
    const rawText = await req.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "Taille de requête excessive (max 500 Ko)." },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Format JSON invalide." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide." },
        { status: 400 }
      );
    }

    // Extraire les données de configuration (accepte { brand: {...} } ou directement {...})
    const inputConfig = body.brand || body;

    // 4. Validation et Assainissement des données (Règles 4 & 5)
    const rawIdentity = inputConfig.identity || {};
    const displayName = sanitizeString(rawIdentity.displayName, 80);
    if (!displayName || displayName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Le nom d'affichage de la marque est obligatoire (au moins 2 caractères)." },
        { status: 400 }
      );
    }

    const sanitizedIdentity = {
      displayName,
      legalName: sanitizeString(rawIdentity.legalName, 120) || displayName,
      logoUrl: sanitizeUrl(rawIdentity.logoUrl, "/images/guineego_logo.jpg"),
      tagline: sanitizeString(rawIdentity.tagline, 120) || "Vos colis, notre priorité",
      primaryColor: sanitizeColor(rawIdentity.primaryColor, "#0d8f4f"),
      accentColor: sanitizeColor(rawIdentity.accentColor, "#e52320"),
      darkBgColor: sanitizeColor(rawIdentity.darkBgColor, "#071710"),
      country: sanitizeString(rawIdentity.country, 60) || "Guinée",
      countryCode: sanitizeString(rawIdentity.countryCode, 10) || "+224",
    };

    // Validation des agences
    const rawAgencies = Array.isArray(inputConfig.agencies) ? inputConfig.agencies : [];
    if (rawAgencies.length === 0) {
      return NextResponse.json(
        { success: false, error: "Au moins une agence physique doit être configurée." },
        { status: 400 }
      );
    }

    const sanitizedAgencies: AgencyConfig[] = rawAgencies.slice(0, 15).map((a: any, idx: number) => {
      const city = sanitizeString(a.city, 60) || `Agence ${idx + 1}`;
      return {
        id: sanitizeString(a.id, 40) || `hub-${idx + 1}`,
        city,
        title: sanitizeString(a.title, 100) || `Agence ${city}`,
        coverage: sanitizeString(a.coverage, 200) || city,
        primaryPhone: sanitizePhone(a.primaryPhone) || "+224 000 00 00 00",
        secondaryPhone: a.secondaryPhone ? sanitizePhone(a.secondaryPhone) : null,
        whatsapp: sanitizePhone(a.whatsapp).replace(/[^0-9]/g, "") || "224000000000",
        address: sanitizeString(a.address, 200) || city,
        status: sanitizeString(a.status, 60) || "Ouvert • 08h00 - 20h00",
        hubLead: a.hubLead ? sanitizeString(a.hubLead, 100) : undefined,
        image: a.image ? sanitizeUrl(a.image, "/images/eno_card_1.png") : undefined,
      };
    });

    // Validation des réseaux sociaux
    const rawSocials = inputConfig.socials || {};
    const sanitizedSocials: SocialsConfig = {
      tiktok: {
        handle: sanitizeString(rawSocials.tiktok?.handle, 60) || "@agence",
        url: sanitizeUrl(rawSocials.tiktok?.url, "https://tiktok.com"),
        label: sanitizeString(rawSocials.tiktok?.label, 60) || "TikTok Officiel",
        followers: sanitizeString(rawSocials.tiktok?.followers, 30),
        likes: sanitizeString(rawSocials.tiktok?.likes, 30),
      },
      facebook: {
        name: sanitizeString(rawSocials.facebook?.name, 80) || displayName,
        url: sanitizeUrl(rawSocials.facebook?.url, "https://facebook.com"),
        label: sanitizeString(rawSocials.facebook?.label, 60) || "Page Facebook",
      },
      instagram: {
        handle: sanitizeString(rawSocials.instagram?.handle, 60) || "@agence",
        url: sanitizeUrl(rawSocials.instagram?.url, "https://instagram.com"),
        label: sanitizeString(rawSocials.instagram?.label, 60) || "Instagram",
      },
      whatsappPrimary: sanitizeUrl(
        rawSocials.whatsappPrimary,
        `https://wa.me/${sanitizedAgencies[0]?.whatsapp || ""}`
      ),
      whatsappSecondary: rawSocials.whatsappSecondary
        ? sanitizeUrl(rawSocials.whatsappSecondary)
        : undefined,
    };

    // Validation des statistiques
    const rawStats = inputConfig.stats || {};
    const sanitizedStats: BrandStatsConfig = {
      tiktokFollowers: sanitizeString(rawStats.tiktokFollowers, 30),
      tiktokLikes: sanitizeString(rawStats.tiktokLikes, 30),
      yearsActive: sanitizeString(rawStats.yearsActive, 30) || "1 An",
      parcelsDelivered: sanitizeString(rawStats.parcelsDelivered, 30) || "5 000+",
      agencyCount: Math.max(1, Math.min(50, Number(rawStats.agencyCount) || sanitizedAgencies.length)),
      deliverySuccessRate: Math.max(50, Math.min(100, Number(rawStats.deliverySuccessRate) || 94)),
      closingConversionRate: Math.max(10, Math.min(100, Number(rawStats.closingConversionRate) || 92.4)),
    };

    // Validation du Hero
    const rawHero = inputConfig.hero || {};
    const sanitizedHero: HeroConfig = {
      headline: sanitizeString(rawHero.headline, 120) || displayName,
      subtext:
        sanitizeString(rawHero.subtext, 400) ||
        `Votre partenaire de livraison express COD à ${sanitizedAgencies.map((a) => a.city).join(" et ")}.`,
      coverageCities: Array.isArray(rawHero.coverageCities)
        ? rawHero.coverageCities.map((c: any) => sanitizeString(c, 50)).filter(Boolean).slice(0, 15)
        : sanitizedAgencies.map((a) => a.city),
    };

    // Validation des tarifs
    const rawPricing = inputConfig.pricing || {};
    const sanitizedPricing = {
      closingFeeDisplay: sanitizeString(rawPricing.closingFeeDisplay, 60) || "800 GNF / commande",
      deliveryFeeDisplay: sanitizeString(rawPricing.deliveryFeeDisplay, 60) || "2 000 GNF / course",
      currencyDisplay: sanitizeString(rawPricing.currencyDisplay, 20) || "GNF",
    };

    // Validation du Closing
    const rawClosing = inputConfig.closing || {};
    const sanitizedClosing: ClosingCenterConfig = {
      languages: sanitizeString(rawClosing.languages, 120) || "Français",
      callDelay: sanitizeString(rawClosing.callDelay, 40) || "< 15 min",
      conversionRate: sanitizeString(rawClosing.conversionRate, 40) || "92.4%",
      paymentMethods: Array.isArray(rawClosing.paymentMethods)
        ? rawClosing.paymentMethods.map((m: any) => sanitizeString(m, 50)).slice(0, 8)
        : ["Mobile Money", "Cash"],
    };

    // Validation des FAQs
    const rawFaq = Array.isArray(inputConfig.faq) ? inputConfig.faq : [];
    const sanitizedFaq: FaqEntryConfig[] = rawFaq.slice(0, 20).map((f: any) => ({
      q: sanitizeString(f.q, 200),
      a: sanitizeString(f.a, 600),
    }));

    // Validation des Services
    const rawServices = Array.isArray(inputConfig.services) ? inputConfig.services : [];
    const sanitizedServices: ServiceConfig[] = rawServices.slice(0, 10).map((s: any, idx: number) => ({
      id: sanitizeString(s.id, 40) || `srv-${idx + 1}`,
      title: sanitizeString(s.title, 80) || `Service ${idx + 1}`,
      badge: s.badge ? sanitizeString(s.badge, 60) : undefined,
      highlight: s.highlight ? sanitizeString(s.highlight, 80) : undefined,
      desc: sanitizeString(s.desc, 300) || "",
      feeDisplay: sanitizeString(s.feeDisplay, 60) || "Sur mesure",
      image: sanitizeUrl(s.image, "/images/eno_courier_bike.png"),
      href: s.href ? sanitizeUrl(s.href, "/partenaire") : "/partenaire",
      order: Number(s.order) || idx + 1,
    }));

    // Validation de HowItWorks
    const rawHow = Array.isArray(inputConfig.howItWorks) ? inputConfig.howItWorks : [];
    const sanitizedHowItWorks: HowItWorksStepConfig[] = rawHow.slice(0, 8).map((h: any, idx: number) => ({
      number: sanitizeString(h.number, 10) || `0${idx + 1}`,
      title: sanitizeString(h.title, 80) || `Étape ${idx + 1}`,
      desc: sanitizeString(h.desc, 300) || "",
      color: h.color ? sanitizeString(h.color, 40) : "bg-[#0d8f4f]",
      order: Number(h.order) || idx + 1,
    }));

    // Validation des villes d'enregistrement
    const rawCities = Array.isArray(inputConfig.registrationCities) ? inputConfig.registrationCities : [];
    const sanitizedRegistrationCities: RegistrationCity[] = rawCities.slice(0, 30).map((c: any) => ({
      value: sanitizeString(c.value, 50),
      label: sanitizeString(c.label, 60),
    }));

    // Validation du recrutement
    const rawRecruitment = inputConfig.recruitment || {};
    const sanitizedRecruitment: RiderRecruitmentConfig = {
      primaryLabel: sanitizeString(rawRecruitment.primaryLabel, 60) || "Postuler",
      secondaryLabel: rawRecruitment.secondaryLabel ? sanitizeString(rawRecruitment.secondaryLabel, 60) : undefined,
      whatsappPrimary: sanitizeUrl(rawRecruitment.whatsappPrimary, "#"),
      whatsappSecondary: rawRecruitment.whatsappSecondary ? sanitizeUrl(rawRecruitment.whatsappSecondary, "#") : undefined,
    };

    // Validation des Médias (Hero, Secondaire, CTA, Closing, Verso, Favicon, etc.)
    const rawMedia = inputConfig.media || {};
    const sanitizedMedia: BrandMediaConfig = {
      heroImage: rawMedia.heroImage ? sanitizeUrl(rawMedia.heroImage, "/images/eno_courier_bike.png") : "/images/eno_courier_bike.png",
      secondaryImage: rawMedia.secondaryImage ? sanitizeUrl(rawMedia.secondaryImage, "/images/eno_delivery_handover.png") : "/images/eno_delivery_handover.png",
      heroCard3Image: rawMedia.heroCard3Image ? sanitizeUrl(rawMedia.heroCard3Image) : undefined,
      heroCard4Image: rawMedia.heroCard4Image ? sanitizeUrl(rawMedia.heroCard4Image) : undefined,
      ctaImage: rawMedia.ctaImage ? sanitizeUrl(rawMedia.ctaImage, "/images/guineego_cta_banner.jpg") : "/images/guineego_cta_banner.jpg",
      closingImage: rawMedia.closingImage ? sanitizeUrl(rawMedia.closingImage, "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif") : "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif",
      closingBackImage: rawMedia.closingBackImage ? sanitizeUrl(rawMedia.closingBackImage, "/images/closing_phone_3d.jpg") : "/images/closing_phone_3d.jpg",
      riderImage: rawMedia.riderImage ? sanitizeUrl(rawMedia.riderImage, "/images/eno_courier_bike.png") : "/images/eno_courier_bike.png",
      communityCard1: rawMedia.communityCard1 ? sanitizeUrl(rawMedia.communityCard1) : undefined,
      communityCard2: rawMedia.communityCard2 ? sanitizeUrl(rawMedia.communityCard2) : undefined,
      communityCard3: rawMedia.communityCard3 ? sanitizeUrl(rawMedia.communityCard3) : undefined,
      faviconUrl: rawMedia.faviconUrl ? sanitizeUrl(rawMedia.faviconUrl, "/favicon.ico") : undefined,
    };

    // Assemblage de la configuration finale vérifiée
    const fullBrandConfig: BrandConfig = {
      identity: sanitizedIdentity,
      media: sanitizedMedia,
      agencies: sanitizedAgencies,
      socials: sanitizedSocials,
      stats: sanitizedStats,
      pricing: sanitizedPricing,
      hero: sanitizedHero,
      closing: sanitizedClosing,
      faq: sanitizedFaq,
      services: sanitizedServices,
      howItWorks: sanitizedHowItWorks,
      registrationCities: sanitizedRegistrationCities,
      recruitment: sanitizedRecruitment,
      updatedBy: `${session.name} (${session.role})`,
      lastUpdated: new Date().toISOString(),
    };

    // 5. Sauvegarde atomique et concurrente-sûre (Règle 8 & 12)
    const savedConfig = await saveBrandConfig(fullBrandConfig);

    // 6. Enregistrement dans le Journal d'Audit Global (Règle 9)

    await saveGlobalAuditLog({
      id: `aud-brand-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isoDate: new Date().toISOString(),
      actor: {
        id: session.userId,
        name: session.name,
        role: session.role,
        type: "USER",
      },
      action: "BRAND_CONFIG_UPDATED",
      actionLabel: "Mise à jour de la configuration de marque",
      module: "PARAMETRES",
      entityType: "SETTING",
      entityId: "BRAND_CONFIG",
      entityReference: `BRAND-${sanitizedIdentity.displayName.toUpperCase().slice(0, 8)}`,
      severity: "INFO",
      result: "SUCCESS",
      description: `Configuration de marque mise à jour avec succès par ${session.name} (${session.role}).`,
      reason: `Nom: ${sanitizedIdentity.displayName}, Agences: ${sanitizedAgencies.length}`,
    });

    // 7. Réponse HTTP structurée (Règle 11)
    return NextResponse.json(
      {
        success: true,
        message: "Configuration de marque enregistrée avec succès.",
        brand: savedConfig,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur PUT /api/brand-config:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de l'enregistrement de la configuration de marque.",
      },
      { status: 500 }
    );
  }
}
