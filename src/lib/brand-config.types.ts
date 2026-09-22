/**
 * @file brand-config.types.ts
 * @description Types TypeScript pour la configuration White-Label de la plateforme.
 *              Sert de contrat entre settings.json, le service serveur, et l'API publique.
 *
 * SOURCE DE VÉRITÉ : data/settings.json (section `brand`, `agencies`, `socials`, `landingPage`)
 *
 * Relation avec PlatformSettings (types.ts) :
 *   PlatformSettings.general  → référencé par BrandIdentityConfig (source partielle)
 *   PlatformSettings.brand    → nouveau champ ajouté par cette phase
 *   PlatformSettings.agencies → nouveau champ (remplace enoAgencies de mock-data.ts)
 *   PlatformSettings.socials  → nouveau champ (remplace enoSocials de mock-data.ts)
 *   PlatformSettings.landingPage → nouveau champ pour les textes de la landing page
 */

// ---------------------------------------------------------------------------
// Identité de marque (visuels, couleurs, nom)
// ---------------------------------------------------------------------------

export interface BrandIdentityConfig {
  /** Nom commercial affiché en page publique et dans les titres */
  displayName: string;
  /** Raison sociale légale (footer) */
  legalName: string;
  /** Chemin vers le logo principal (relatif à /public) */
  logoUrl: string;
  /** Tagline affichée sous le logo et dans le héro */
  tagline: string;
  /** Couleur primaire hexadécimale (ex: "#0d8f4f") */
  primaryColor: string;
  /** Couleur d'accent hexadécimale (ex: "#e52320") */
  accentColor: string;
  /** Couleur de fond principal sombre (ex: "#071710") */
  darkBgColor: string;
  /** Pays de déploiement (ex: "Guinée") */
  country: string;
  /** Indicatif téléphonique international (ex: "+224") */
  countryCode: string;
}

// ---------------------------------------------------------------------------
// Agence physique (remplace enoAgencies de mock-data.ts)
// ---------------------------------------------------------------------------

export interface AgencyConfig {
  /** Identifiant unique de l'agence (ex: "conakry") */
  id: string;
  /** Ville de l'agence (ex: "Conakry") */
  city: string;
  /** Titre descriptif (ex: "Hub Principal") */
  title: string;
  /** Zones géographiques couvertes */
  coverage: string;
  /** Numéro de téléphone principal (format E.164 ou affichage) */
  primaryPhone: string;
  /** Numéro secondaire (optionnel) */
  secondaryPhone?: string | null;
  /** Numéro WhatsApp sans "+" ni espaces (ex: "2240164291884") */
  whatsapp: string;
  /** Adresse physique complète */
  address: string;
  /** Statut d'ouverture (ex: "Ouvert • 08h00 - 20h30") */
  status: string;
  /** Responsable de l'agence */
  hubLead?: string;
  /** Image de l'agence physique ou du hub de distribution (optionnel) */
  image?: string;
}

// ---------------------------------------------------------------------------
// Canal social (remplace enoSocials de mock-data.ts)
// ---------------------------------------------------------------------------

export interface SocialChannelConfig {
  /** Handle/pseudonyme sur la plateforme (ex: "@guineego") */
  handle: string;
  /** URL complète du profil */
  url: string;
  /** Libellé affiché (ex: "TikTok Officiel") */
  label?: string;
}

export interface FacebookConfig {
  /** Nom de la page Facebook */
  name: string;
  url: string;
  label?: string;
}

export interface SocialsConfig {
  tiktok: SocialChannelConfig & {
    /** Abonnés affichés (ex: "1 157+") — mis à jour manuellement */
    followers?: string;
    /** J'aime affichés (ex: "4 351+") */
    likes?: string;
  };
  facebook: FacebookConfig;
  instagram: SocialChannelConfig;
  /** URL WhatsApp pré-remplie pour la 1ère agence (Cotonou/Conakry) */
  whatsappPrimary: string;
  /** URL WhatsApp pré-remplie pour la 2ème agence (Lokossa/Kankan), optionnel */
  whatsappSecondary?: string;
}

// ---------------------------------------------------------------------------
// Statistiques affichées sur la landing page
// ---------------------------------------------------------------------------

export interface BrandStatsConfig {
  /** Abonnés TikTok affichés (ex: "1 157+") */
  tiktokFollowers?: string;
  /** J'aime TikTok (ex: "4 351+") */
  tiktokLikes?: string;
  /** Durée d'activité (ex: "1 An") */
  yearsActive?: string;
  /** Colis livrés (ex: "5 000+") */
  parcelsDelivered?: string;
  /** Nombre d'agences (ex: "2") */
  agencyCount?: number;
  /** Taux de livraison réussi (ex: "94") — sans le % */
  deliverySuccessRate?: number;
  /** Taux de conversion closing (ex: "92.4") — sans le % */
  closingConversionRate?: number;
}

// ---------------------------------------------------------------------------
// Tarification publique
// ---------------------------------------------------------------------------

export interface BrandPricingConfig {
  /** Frais de closing affichés (ex: "800 F CFA / commande") */
  closingFeeDisplay?: string;
  /** Frais de livraison affichés (ex: "2 000 F CFA / course") */
  deliveryFeeDisplay?: string;
  /** Devise utilisée pour les affichages (ex: "GNF", "FCFA") */
  currencyDisplay?: string;
}

// ---------------------------------------------------------------------------
// Section Hero (landing page)
// ---------------------------------------------------------------------------

export interface HeroConfig {
  /** Titre principal du héro (ex: "GuinéeGo LAT") */
  headline: string;
  /** Sous-titre descriptif (ex: "Votre partenaire de livraison à Conakry et Kankan") */
  subtext: string;
  /** Villes de couverture listées dans le héro */
  coverageCities?: string[];
}

// ---------------------------------------------------------------------------
// Centre de closing
// ---------------------------------------------------------------------------

export interface ClosingCenterConfig {
  /** Langues pratiquées (ex: "Français • Fon • Mina") */
  languages?: string;
  /** Délai d'appel affiché (ex: "< 15 min") */
  callDelay?: string;
  /** Taux de conversion (ex: "92.4%") */
  conversionRate?: string;
  /** Modes de paiement acceptés (ex: ["MTN MoMo", "Moov Money", "Wave / Cash"]) */
  paymentMethods?: string[];
}

// ---------------------------------------------------------------------------
// FAQ — chaque entrée
// ---------------------------------------------------------------------------

export interface FaqEntryConfig {
  q: string;
  a: string;
}

// ---------------------------------------------------------------------------
// Recrutement livreurs
// ---------------------------------------------------------------------------

export interface RiderRecruitmentConfig {
  /** URL WhatsApp de candidature agence principale */
  whatsappPrimary?: string;
  /** URL WhatsApp de candidature agence secondaire */
  whatsappSecondary?: string;
  /** Libellé du bouton agence principale (ex: "Agence Conakry") */
  primaryLabel?: string;
  /** Libellé du bouton agence secondaire (ex: "Agence Kankan") */
  secondaryLabel?: string;
}

// ---------------------------------------------------------------------------
// Villes disponibles pour le formulaire d'inscription partenaire
// ---------------------------------------------------------------------------

export interface RegistrationCity {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Services proposés
// ---------------------------------------------------------------------------

export interface ServiceConfig {
  id?: string;
  title: string;
  badge?: string;
  highlight?: string;
  desc: string;
  feeDisplay: string;
  image: string;
  href?: string;
  order?: number;
}

// ---------------------------------------------------------------------------
// Étapes "Comment ça marche"
// ---------------------------------------------------------------------------

export interface HowItWorksStepConfig {
  number: string;
  title: string;
  desc: string;
  color?: string;
  order?: number;
}

// ---------------------------------------------------------------------------
// Images et Médias configurables de la marque et de la landing page
// ---------------------------------------------------------------------------

export interface BrandMediaConfig {
  /** Image principale du Hero (bannière ou visuel héro) */
  heroImage?: string;
  /** Image secondaire du Hero (carte flottante, remise colis, etc.) */
  secondaryImage?: string;
  /** Image carte 3 Hero (Closing / Appel téléphonique) */
  heroCard3Image?: string;
  /** Image carte 4 Hero (Paiement cash COD et remise) */
  heroCard4Image?: string;
  /** Image pour la bannière CTA / Conversion */
  ctaImage?: string;
  /** Image pour le centre de closing (Recto de la carte 3D) */
  closingImage?: string;
  /** Image pour le verso de la carte 3D de Closing */
  closingBackImage?: string;
  /** Image pour la modale de recrutement des livreurs */
  riderImage?: string;
  /** Image communauté / Reel 1 */
  communityCard1?: string;
  /** Image communauté / Reel 2 */
  communityCard2?: string;
  /** Image communauté / Reel 3 */
  communityCard3?: string;
  /** Favicon de la marque (optionnel) */
  faviconUrl?: string;
}

// ---------------------------------------------------------------------------
// Objet racine de la BrandConfig (ce que retourne l'API GET /api/brand-config)
// ---------------------------------------------------------------------------

export interface BrandConfig {
  identity: BrandIdentityConfig;
  /** Médias et visuels personnalisables de la landing page */
  media?: BrandMediaConfig;
  agencies: AgencyConfig[];
  socials: SocialsConfig;
  stats: BrandStatsConfig;
  pricing: BrandPricingConfig;
  hero: HeroConfig;
  closing: ClosingCenterConfig;
  faq: FaqEntryConfig[];
  services?: ServiceConfig[];
  howItWorks?: HowItWorksStepConfig[];
  registrationCities: RegistrationCity[];
  recruitment: RiderRecruitmentConfig;
  /** ISO date de dernière modification de la config de marque */
  lastUpdated?: string;
  /** Auteur de la dernière modification */
  updatedBy?: string;
}

// ---------------------------------------------------------------------------
// Extension de PlatformSettings pour inclure brandConfig
// (On ne modifie PAS PlatformSettings directement pour rester non-destructif ;
//  on utilise PlatformSettingsWithBrand quand on lit settings.json enrichi)
// ---------------------------------------------------------------------------

export interface PlatformSettingsWithBrand {
  /** Champ brand : données White-Label de la plateforme */
  brand?: BrandConfig;
}
