"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Save,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Building2,
  Sparkles,
  Palette,
  Phone,
  Share2,
  Headset,
  HelpCircle,
  Truck,
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  MapPin,
  Clock,
  Layers,
  BarChart3,
  Check,
  Zap,
  ShoppingBag,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { useBrandConfig, invalidateBrandConfigCache } from "@/lib/useBrandConfig";
import { MediaImagePicker } from "@/components/admin/MediaImagePicker";
import type {
  BrandConfig,
  BrandMediaConfig,
  AgencyConfig,
  ServiceConfig,
  HowItWorksStepConfig,
  FaqEntryConfig,
  RegistrationCity,
} from "@/lib/brand-config.types";

export default function AdminSitePublicPage() {
  const { hasPermission } = useOperations();
  const { brandConfig: loadedBrand, loading: configLoading } = useBrandConfig();

  // Matrice de permissions : settings.manage
  const canManage = hasPermission("settings.manage");

  // State local du formulaire
  const [formData, setFormData] = useState<BrandConfig | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    | "MEDIA"
    | "IDENTITY"
    | "HERO"
    | "STATS"
    | "AGENCIES"
    | "SERVICES"
    | "HOW_IT_WORKS"
    | "SOCIALS"
    | "CLOSING"
    | "FAQ"
    | "RECRUITMENT"
  >("MEDIA");

  // Retours utilisateur
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronisation du formulaire quand la config est chargée
  useEffect(() => {
    if (loadedBrand && !formData) {
      setFormData(JSON.parse(JSON.stringify(loadedBrand)));
    }
  }, [loadedBrand, formData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fade-in-up">
        <div className="bg-white p-8 rounded-3xl border border-rose-200/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Accès Restreint</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Vous n&apos;avez pas l&apos;habilitation requise (<code>settings.manage</code>) pour modifier l&apos;identité et le contenu de la page d&apos;accueil publique.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Retour au Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (configLoading || !formData) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Chargement de la configuration de marque...</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // HANDLER: SAUVEGARDE RÉELLE VERS PUT /api/brand-config
  // =========================================================================
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/brand-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Erreur serveur (${res.status})`);
      }

      // Invalidation du cache et notification
      if (data.brand) {
        setFormData(data.brand);
        invalidateBrandConfigCache(data.brand);
      } else {
        invalidateBrandConfigCache(formData);
      }

      showToast("Modifications enregistrées avec succès !");
    } catch (err: unknown) {
      console.error("Erreur lors de la sauvegarde du Brand Config:", err);
      const msg = err instanceof Error ? err.message : "Échec de l'enregistrement de la configuration.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // GESTION DES LISTES DYNAMIQUES (Agences, Services, FAQ, Étapes)
  // =========================================================================

  // Agences
  const handleAddAgency = () => {
    const newAgency: AgencyConfig = {
      id: `hub-${Date.now()}`,
      city: "Nouvelle Ville",
      title: "Hub Secondaire",
      coverage: "Toute la ville et périphérie",
      primaryPhone: "+224 600 00 00 00",
      secondaryPhone: "",
      whatsapp: "224600000000",
      address: "Adresse de l'agence physique",
      status: "Ouvert • 08h00 - 20h00",
      hubLead: "Responsable d'agence",
    };
    setFormData({ ...formData, agencies: [...formData.agencies, newAgency] });
  };

  const handleUpdateAgency = (index: number, updates: Partial<AgencyConfig>) => {
    const next = [...formData.agencies];
    next[index] = { ...next[index], ...updates };
    setFormData({ ...formData, agencies: next });
  };

  const handleRemoveAgency = (index: number) => {
    const next = formData.agencies.filter((_, i) => i !== index);
    setFormData({ ...formData, agencies: next });
  };

  // Services
  const handleAddService = () => {
    const nextServices = formData.services ? [...formData.services] : [];
    const newService: ServiceConfig = {
      id: `service-${Date.now()}`,
      title: "Nouveau Service",
      badge: "Inclus",
      highlight: "Point fort",
      desc: "Description détaillée du service proposé aux e-commerçants.",
      feeDisplay: "Inclus",
      image: "/images/delivery_hub.png",
    };
    setFormData({ ...formData, services: [...nextServices, newService] });
  };

  const handleUpdateService = (index: number, updates: Partial<ServiceConfig>) => {
    const current = formData.services ? [...formData.services] : [];
    current[index] = { ...current[index], ...updates };
    setFormData({ ...formData, services: current });
  };

  const handleRemoveService = (index: number) => {
    const current = formData.services ? [...formData.services] : [];
    setFormData({ ...formData, services: current.filter((_, i) => i !== index) });
  };

  // FAQ
  const handleAddFaq = () => {
    const nextFaq = [...formData.faq, { q: "Nouvelle question ?", a: "Réponse détaillée à cette question." }];
    setFormData({ ...formData, faq: nextFaq });
  };

  const handleUpdateFaq = (index: number, updates: Partial<FaqEntryConfig>) => {
    const nextFaq = [...formData.faq];
    nextFaq[index] = { ...nextFaq[index], ...updates };
    setFormData({ ...formData, faq: nextFaq });
  };

  const handleRemoveFaq = (index: number) => {
    setFormData({ ...formData, faq: formData.faq.filter((_, i) => i !== index) });
  };

  // Comment ça marche
  const handleAddStep = () => {
    const current = formData.howItWorks ? [...formData.howItWorks] : [];
    const stepNum = String(current.length + 1).padStart(2, "0");
    const newStep: HowItWorksStepConfig = {
      number: stepNum,
      title: "Nouvelle étape",
      desc: "Description du fonctionnement pour cette étape clé.",
      color: "#0d8f4f",
    };
    setFormData({ ...formData, howItWorks: [...current, newStep] });
  };

  const handleUpdateStep = (index: number, updates: Partial<HowItWorksStepConfig>) => {
    const current = formData.howItWorks ? [...formData.howItWorks] : [];
    current[index] = { ...current[index], ...updates };
    setFormData({ ...formData, howItWorks: current });
  };

  const handleRemoveStep = (index: number) => {
    const current = formData.howItWorks ? [...formData.howItWorks] : [];
    setFormData({ ...formData, howItWorks: current.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up font-sans max-w-7xl mx-auto pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              White-Label & Configuration Publique
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Site public
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Gérez l&apos;identité et le contenu affichés sur votre page d&apos;accueil.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Ouvrir la landing page publique dans un nouvel onglet"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Voir le site</span>
          </Link>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Erreur de validation ou serveur */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. NAVIGATION HORIZONTALE PAR SECTIONS */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: "MEDIA", label: "🖼️ Images & Médias", icon: ImageIcon },
            { id: "IDENTITY", label: "Identité & Thème", icon: Palette },
            { id: "HERO", label: "Accueil / Hero", icon: Sparkles },
            { id: "STATS", label: "Statistiques", icon: BarChart3 },
            { id: "AGENCIES", label: `Agences (${formData.agencies.length})`, icon: Building2 },
            { id: "SERVICES", label: `Services (${formData.services?.length || 0})`, icon: Layers },
            { id: "HOW_IT_WORKS", label: "Comment ça marche", icon: Truck },
            { id: "SOCIALS", label: "Réseaux sociaux", icon: Share2 },
            { id: "CLOSING", label: "Closing Center", icon: Headset },
            { id: "FAQ", label: `FAQ (${formData.faq.length})`, icon: HelpCircle },
            { id: "RECRUITMENT", label: "Contacts & Footer", icon: Phone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FORMULAIRES PAR ONGLET */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* =================================================================== */}
        {/* SECTION 1: GESTION COMPLÈTE DES IMAGES & MÉDIAS DU SITE PUBLIC      */}
        {/* =================================================================== */}
        {activeSubTab === "MEDIA" && (
          <div className="space-y-8">
            {/* Bannière d'introduction */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                    <ImageIcon className="w-5 h-5 brand-text-primary" />
                    <span>Images & Médias du Site Public</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Importez directement vos images depuis votre ordinateur sans jamais avoir à saisir d&apos;URL. Vos fichiers originaux sont conservés sans compression destructive en haute définition dans <code>public/uploads/brand/</code> et s&apos;affichent immédiatement sur la page d&apos;accueil.
                  </p>
                </div>

                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Voir la page d&apos;accueil</span>
                </Link>
              </div>

              {/* Rappel des formats supportés & qualité */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
                  <strong className="text-slate-900 block font-bold">Formats acceptés</strong>
                  PNG, JPG, WEBP, AVIF, SVG, ICO (jusqu&apos;à 10 Mo).
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
                  <strong className="text-slate-900 block font-bold">Qualité maximale</strong>
                  Fichiers originaux préservés sans réduction floue ni compression.
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
                  <strong className="text-slate-900 block font-bold">Connexion directe</strong>
                  Alimente automatiquement les sections de la landing page <code>/</code>.
                </div>
              </div>
            </div>

            {/* 1. LOGO & IDENTITÉ */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-600">
                1. Identité Visuelle & Logos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaImagePicker
                  label="Logo Principal"
                  description="Affiché dans la barre de navigation, le pied de page et les écrans de connexion."
                  value={formData.identity.logoUrl}
                  defaultValue="/images/guineego_logo.jpg"
                  slot="logo"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, logoUrl: newUrl },
                    })
                  }
                  aspectRatio="contain"
                  recommendedSize="512x512 ou SVG transparent"
                  recommendedMinWidth={512}
                />

                <MediaImagePicker
                  label="Favicon du Site"
                  description="Icône affichée dans l'onglet du navigateur internet et les favoris."
                  value={formData.media?.faviconUrl || ""}
                  defaultValue="/favicon.ico"
                  slot="favicon"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        faviconUrl: newUrl,
                      },
                    })
                  }
                  aspectRatio="square"
                  recommendedSize="32x32, 64x64 ou 512x512 .ico / .png"
                  recommendedMinWidth={32}
                />
              </div>
            </div>

            {/* 2. VISUELS DU HÉRO */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-600">
                2. Visuels du Héro (Carrousel 3D)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaImagePicker
                  label="Hero Principal (Hero Card 1 : Flotte & Motos)"
                  description="Grande photo principale de la flotte de motos et caissons isothermes."
                  value={formData.media?.heroImage || ""}
                  defaultValue="/images/eno_courier_bike.png"
                  slot="hero"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        heroImage: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="1920x1080 (HD) ou 2560x1440"
                  recommendedMinWidth={1920}
                />

                <MediaImagePicker
                  label="Hero Card 2 : Remise de colis en main propre"
                  description="Visuel illustrant la livraison directe et la satisfaction client sur le terrain."
                  value={formData.media?.secondaryImage || ""}
                  defaultValue="/images/eno_delivery_handover.png"
                  slot="hero-card-2"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        secondaryImage: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="900x900 ou 1080x1080"
                  recommendedMinWidth={900}
                />

                <MediaImagePicker
                  label="Hero Card 3 : Centre de Closing & Téléconseillère"
                  description="Visuel de l'opératrice téléphonique effectuant la confirmation de commande."
                  value={formData.media?.heroCard3Image || ""}
                  defaultValue="/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif"
                  slot="hero-card-3"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        heroCard3Image: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="900x900 ou 1080x1080"
                  recommendedMinWidth={900}
                />

                <MediaImagePicker
                  label="Hero Card 4 : Paiement Cash COD"
                  description="Illustration du paiement à la livraison Cash On Delivery et du reversement mobile money."
                  value={formData.media?.heroCard4Image || ""}
                  defaultValue="/images/gros-plan-livreur-colis_23-2149095905.avif"
                  slot="hero-card-4"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        heroCard4Image: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="900x900 ou 1080x1080"
                  recommendedMinWidth={900}
                />
              </div>
            </div>

            {/* 3. CLOSING CENTER */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-600">
                3. Centre de Closing (Carte 3D Interactive)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaImagePicker
                  label="Image Avant (Recto) : Téléconseillère"
                  description="Photo valorisant les opératrices au centre d'appels confirmant les commandes sous 15 min."
                  value={formData.media?.closingImage || ""}
                  defaultValue="/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif"
                  slot="closing-recto"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        closingImage: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="1000x700 ou 1200x800"
                  recommendedMinWidth={900}
                />

                <MediaImagePicker
                  label="Image Arrière (Verso) : Confirmation Vente"
                  description="Image en fond du verso de la carte 3D interactive illustrant la commande validée."
                  value={formData.media?.closingBackImage || ""}
                  defaultValue="/images/closing_phone_3d.jpg"
                  slot="closing-verso"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        closingBackImage: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="1000x700 ou 1200x800"
                  recommendedMinWidth={900}
                />
              </div>
            </div>

            {/* 4. BANNIÈRE CTA & RECRUTEMENT */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-600">
                4. Bannière CTA & Recrutement Livreurs
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaImagePicker
                  label="Image de la Bannière CTA Finale"
                  description="Illustration de fond accompagnant l'invitation des e-commerçants à s'inscrire."
                  value={formData.media?.ctaImage || ""}
                  defaultValue="/images/guineego_cta_banner.jpg"
                  slot="cta"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        ctaImage: newUrl,
                      },
                    })
                  }
                  aspectRatio="wide"
                  recommendedSize="1920x800 (Haute Définition Panoramique)"
                  recommendedMinWidth={1920}
                />

                <MediaImagePicker
                  label="Image Recrutement Livreur (Modale)"
                  description="Illustration de la moto et du caisson isotherme affichée dans la boîte de dialogue de recrutement."
                  value={formData.media?.riderImage || ""}
                  defaultValue="/images/eno_courier_bike.png"
                  slot="rider"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        riderImage: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="800x600 ou 1000x800"
                  recommendedMinWidth={800}
                />
              </div>
            </div>

            {/* 5. PREUVE SOCIALE & RÉSEAUX */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-600">
                5. Community & Réseaux Sociaux (Cartes Reels)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MediaImagePicker
                  label="Community Card 1 : Flotte de livraison"
                  description="Visuel illustrant vos coursiers en mouvement dans les rues."
                  value={formData.media?.communityCard1 || ""}
                  defaultValue="/images/eno_card_1.png"
                  slot="community-1"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        communityCard1: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="1080x1350 ou 800x1000"
                  recommendedMinWidth={800}
                />

                <MediaImagePicker
                  label="Community Card 2 : Remise de colis en main propre"
                  description="Visuel illustrant la livraison directe et le contact client."
                  value={formData.media?.communityCard2 || ""}
                  defaultValue="/images/eno_card_2.png"
                  slot="community-2"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        communityCard2: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="1080x1350 ou 800x1000"
                  recommendedMinWidth={800}
                />

                <MediaImagePicker
                  label="Community Card 3 : Satisfaction client"
                  description="Visuel illustrant la rapidité et la satisfaction e-commerce."
                  value={formData.media?.communityCard3 || ""}
                  defaultValue="/images/eno_courier_handover_action.png"
                  slot="community-3"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      media: {
                        ...(formData.media || {}),
                        communityCard3: newUrl,
                      },
                    })
                  }
                  aspectRatio="video"
                  recommendedSize="1080x1350 ou 800x1000"
                  recommendedMinWidth={800}
                />
              </div>
            </div>

            {/* 6. IMAGES DES SERVICES */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">6. Images des Services ({formData.services?.length || 0})</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Images illustrant chaque service proposé sur la page d&apos;accueil.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("SERVICES")}
                  className="text-xs font-bold brand-text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Gérer dans l&apos;onglet Services →</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {(formData.services || []).map((srv, idx) => (
                  <div key={srv.id || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{srv.title}</span>
                    <MediaImagePicker
                      label=""
                      value={srv.image}
                      defaultValue={
                        idx === 0
                          ? "/images/femme-afro-americaine-travaille-dans-operateur-centre-appels-agent-du-service-client-portant-casques-microphone-travaillant-ordinateur-portable_627829-586.avif"
                          : idx === 1
                          ? "/images/eno_courier_bike.png"
                          : idx === 2
                          ? "/images/eno_delivery_handover.png"
                          : "/images/istockphoto-1481860080-612x612.jpg"
                      }
                      slot={`service-${idx + 1}`}
                      onChange={(newUrl) => handleUpdateService(idx, { image: newUrl })}
                      aspectRatio="video"
                      recommendedMinWidth={800}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 1: IDENTITÉ & THÈME VISUEL                                 */}
        {/* =================================================================== */}
        {activeSubTab === "IDENTITY" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Identité de Marque & Thème Visuel</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Renseignez le nom commercial, la raison sociale, les logos et la palette de couleurs de votre agence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nom affiché (Commercial)</label>
                <input
                  type="text"
                  value={formData.identity.displayName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, displayName: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Raison sociale légale</label>
                <input
                  type="text"
                  value={formData.identity.legalName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, legalName: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <MediaImagePicker
                  label="Logo Principal de la Marque"
                  description="Logo officiel affiché sur l'en-tête et l'ensemble de la plateforme."
                  value={formData.identity.logoUrl}
                  defaultValue="/images/eno_livraison_logo.jpg"
                  onChange={(newUrl) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, logoUrl: newUrl },
                    })
                  }
                  aspectRatio="contain"
                  recommendedSize="512x512 ou SVG"
                />
              </div>

              <div className="flex flex-col justify-center space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Slogan / Tagline</label>
                  <input
                    type="text"
                    value={formData.identity.tagline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identity: { ...formData.identity, tagline: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pays de déploiement</label>
                <input
                  type="text"
                  value={formData.identity.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, country: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Indicatif téléphonique</label>
                <input
                  type="text"
                  value={formData.identity.countryCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identity: { ...formData.identity, countryCode: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Couleurs de marque */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Palette de Couleurs
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Couleur Primaire</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.identity.primaryColor || "#0d8f4f"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          identity: { ...formData.identity, primaryColor: e.target.value },
                        })
                      }
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.identity.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          identity: { ...formData.identity, primaryColor: e.target.value },
                        })
                      }
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Couleur d&apos;Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.identity.accentColor || "#e52320"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          identity: { ...formData.identity, accentColor: e.target.value },
                        })
                      }
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.identity.accentColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          identity: { ...formData.identity, accentColor: e.target.value },
                        })
                      }
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fond Sombre (Footer/Hero)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.identity.darkBgColor || "#071710"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          identity: { ...formData.identity, darkBgColor: e.target.value },
                        })
                      }
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.identity.darkBgColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          identity: { ...formData.identity, darkBgColor: e.target.value },
                        })
                      }
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 2: ACCUEIL / HERO                                          */}
        {/* =================================================================== */}
        {activeSubTab === "HERO" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">En-tête & Section Hero</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Textes d&apos;accroche et villes phares mis en avant dès l&apos;arrivée sur la landing page.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Titre principal (Headline)</label>
              <input
                type="text"
                value={formData.hero.headline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, headline: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sous-titre descriptif (Subtext)</label>
              <textarea
                rows={3}
                value={formData.hero.subtext}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, subtext: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Villes de couverture phares (séparées par une virgule)
              </label>
              <input
                type="text"
                value={(formData.hero.coverageCities || []).join(", ")}
                onChange={(e) => {
                  const cities = e.target.value.split(",").map((c) => c.trim()).filter(Boolean);
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, coverageCities: cities },
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Exemple: Conakry, Kankan, Kindia, Mamou</span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 3: STATISTIQUES                                             */}
        {/* =================================================================== */}
        {activeSubTab === "STATS" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Indicateurs & Chiffres Clés</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Métriques de performance affichées sur la page pour rassurer les futurs marchands.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Taux de livraison réussi (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.stats.deliverySuccessRate ?? 94}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, deliverySuccessRate: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Taux de closing (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.stats.closingConversionRate ?? 92.4}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, closingConversionRate: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Colis livrés (Affichage)</label>
                <input
                  type="text"
                  value={formData.stats.parcelsDelivered || "5 000+"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, parcelsDelivered: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Durée d&apos;activité</label>
                <input
                  type="text"
                  value={formData.stats.yearsActive || "1 An"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, yearsActive: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre d&apos;agences</label>
                <input
                  type="number"
                  value={formData.stats.agencyCount ?? formData.agencies.length}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, agencyCount: parseInt(e.target.value, 10) || 0 },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Abonnés TikTok (Affichage)</label>
                <input
                  type="text"
                  value={formData.stats.tiktokFollowers || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, tiktokFollowers: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 4: AGENCES PHYSIQUES                                       */}
        {/* =================================================================== */}
        {activeSubTab === "AGENCIES" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div>
                <h3 className="text-base font-black text-slate-900">Agences Physiques & Hubs</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Liste des points de contact physiques affichés dans la section agences de la page d&apos;accueil.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAgency}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une agence</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.agencies.map((agency, index) => (
                <div key={agency.id || index} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black">
                        {index + 1}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{agency.city || "Nouvelle Agence"} — {agency.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAgency(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer cette agence"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Ville</label>
                      <input
                        type="text"
                        value={agency.city}
                        onChange={(e) => handleUpdateAgency(index, { city: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Titre du Hub</label>
                      <input
                        type="text"
                        value={agency.title}
                        onChange={(e) => handleUpdateAgency(index, { title: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Zones de couverture</label>
                      <input
                        type="text"
                        value={agency.coverage}
                        onChange={(e) => handleUpdateAgency(index, { coverage: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Téléphone Principal</label>
                      <input
                        type="text"
                        value={agency.primaryPhone}
                        onChange={(e) => handleUpdateAgency(index, { primaryPhone: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp (chiffres sans +)</label>
                      <input
                        type="text"
                        value={agency.whatsapp}
                        onChange={(e) => handleUpdateAgency(index, { whatsapp: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Horaires / Statut</label>
                      <input
                        type="text"
                        value={agency.status}
                        onChange={(e) => handleUpdateAgency(index, { status: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Adresse Complète</label>
                      <input
                        type="text"
                        value={agency.address}
                        onChange={(e) => handleUpdateAgency(index, { address: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Responsable Hub (Optionnel)</label>
                      <input
                        type="text"
                        value={agency.hubLead || ""}
                        onChange={(e) => handleUpdateAgency(index, { hubLead: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <MediaImagePicker
                      label={`Photo ou façade de l'agence : ${agency.city}`}
                      value={agency.image || ""}
                      defaultValue="/images/eno_card_1.png"
                      onChange={(newUrl) => handleUpdateAgency(index, { image: newUrl })}
                      aspectRatio="video"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 5: SERVICES PROPOSÉS                                       */}
        {/* =================================================================== */}
        {activeSubTab === "SERVICES" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div>
                <h3 className="text-base font-black text-slate-900">Services Proposés aux Marchands</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Présentation des offres clés : Livraison COD, Pôle Closing, Stockage, etc.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddService}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un service</span>
              </button>
            </div>

            <div className="space-y-4">
              {(formData.services || []).map((srv, index) => (
                <div key={srv.id || index} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black text-slate-900">{srv.title || "Nouveau Service"}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer ce service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Titre du Service</label>
                      <input
                        type="text"
                        value={srv.title}
                        onChange={(e) => handleUpdateService(index, { title: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Badge (ex: Inclus, Express)</label>
                      <input
                        type="text"
                        value={srv.badge || ""}
                        onChange={(e) => handleUpdateService(index, { badge: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Tarif affiché</label>
                      <input
                        type="text"
                        value={srv.feeDisplay || ""}
                        onChange={(e) => handleUpdateService(index, { feeDisplay: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={srv.desc}
                      onChange={(e) => handleUpdateService(index, { desc: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <MediaImagePicker
                      label={`Image illustrative pour "${srv.title || "ce service"}"`}
                      value={srv.image}
                      defaultValue="/images/eno_courier_bike.png"
                      onChange={(newUrl) => handleUpdateService(index, { image: newUrl })}
                      aspectRatio="video"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 6: COMMENT ÇA MARCHE                                       */}
        {/* =================================================================== */}
        {activeSubTab === "HOW_IT_WORKS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div>
                <h3 className="text-base font-black text-slate-900">Étapes « Comment ça marche »</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Étapes du processus de livraison expliquées aux nouveaux clients.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddStep}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une étape</span>
              </button>
            </div>

            <div className="space-y-4">
              {(formData.howItWorks || []).map((step, index) => (
                <div key={index} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-black">
                        {step.number}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{step.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer cette étape"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Numéro (ex: 01)</label>
                      <input
                        type="text"
                        value={step.number}
                        onChange={(e) => handleUpdateStep(index, { number: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Titre de l&apos;étape</label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateStep(index, { title: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Explication</label>
                    <textarea
                      rows={2}
                      value={step.desc}
                      onChange={(e) => handleUpdateStep(index, { desc: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 7: RÉSEAUX SOCIAUX                                          */}
        {/* =================================================================== */}
        {activeSubTab === "SOCIALS" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Réseaux Sociaux & Liens Directs</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Canaux officiels affichés dans la barre supérieure et le pied de page de la landing page.
              </p>
            </div>

            {/* TikTok */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                🎵 Profil TikTok
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL Profil TikTok</label>
                  <input
                    type="url"
                    value={formData.socials.tiktok?.url || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socials: {
                          ...formData.socials,
                          tiktok: { ...formData.socials.tiktok, url: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Handle (ex: @guineego)</label>
                  <input
                    type="text"
                    value={formData.socials.tiktok?.handle || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socials: {
                          ...formData.socials,
                          tiktok: { ...formData.socials.tiktok, handle: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Facebook */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                📘 Page Facebook
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL Page Facebook</label>
                  <input
                    type="url"
                    value={formData.socials.facebook?.url || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socials: {
                          ...formData.socials,
                          facebook: { ...formData.socials.facebook, url: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nom affiché Facebook</label>
                  <input
                    type="text"
                    value={formData.socials.facebook?.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socials: {
                          ...formData.socials,
                          facebook: { ...formData.socials.facebook, name: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Instagram */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                📸 Compte Instagram
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL Profil Instagram</label>
                  <input
                    type="url"
                    value={formData.socials.instagram?.url || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socials: {
                          ...formData.socials,
                          instagram: { ...formData.socials.instagram, url: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Handle Instagram</label>
                  <input
                    type="text"
                    value={formData.socials.instagram?.handle || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socials: {
                          ...formData.socials,
                          instagram: { ...formData.socials.instagram, handle: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Shortcuts */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                💬 Liens WhatsApp Directs (Landing Page)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lien WhatsApp Agence Principale</label>
                  <input
                    type="url"
                    value={formData.socials.whatsappPrimary || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socials: { ...formData.socials, whatsappPrimary: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lien WhatsApp Agence Secondaire (Optionnel)</label>
                  <input
                    type="url"
                    value={formData.socials.whatsappSecondary || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socials: { ...formData.socials, whatsappSecondary: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 8: PÔLE CLOSING                                             */}
        {/* =================================================================== */}
        {activeSubTab === "CLOSING" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Pôle Télévente & Centre de Closing</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Détails du service de confirmation téléphonique présenté aux marchands.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Délai d&apos;appel affiché</label>
                <input
                  type="text"
                  value={formData.closing.callDelay || "< 15 min"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      closing: { ...formData.closing, callDelay: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Taux de conversion affiché</label>
                <input
                  type="text"
                  value={formData.closing.conversionRate || "92.4%"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      closing: { ...formData.closing, conversionRate: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Langues de négociation pratiquées</label>
              <input
                type="text"
                value={formData.closing.languages || "Français • Sousou • Malinké • Peul"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    closing: { ...formData.closing, languages: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Modes de paiement acceptés (séparés par une virgule)
              </label>
              <input
                type="text"
                value={(formData.closing.paymentMethods || []).join(", ")}
                onChange={(e) => {
                  const methods = e.target.value.split(",").map((m) => m.trim()).filter(Boolean);
                  setFormData({
                    ...formData,
                    closing: { ...formData.closing, paymentMethods: methods },
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Exemple: Orange Money, MTN MoMo, Espèces à la livraison</span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 9: FOIRE AUX QUESTIONS (FAQ)                                */}
        {/* =================================================================== */}
        {activeSubTab === "FAQ" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div>
                <h3 className="text-base font-black text-slate-900">Questions Fréquentes (FAQ)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Réponses aux interrogations habituelles des marchands sur les tarifs, délais et reversements.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddFaq}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une question</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.faq.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black text-slate-400">Question #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer cette FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Question</label>
                    <input
                      type="text"
                      value={item.q}
                      onChange={(e) => handleUpdateFaq(index, { q: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Réponse détaillée</label>
                    <textarea
                      rows={3}
                      value={item.a}
                      onChange={(e) => handleUpdateFaq(index, { a: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 10: CONTACTS, RECRUTEMENT & TARIFS PUBLICS                 */}
        {/* =================================================================== */}
        {activeSubTab === "RECRUITMENT" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Tarification Publique & Recrutement Livreurs</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Canaux d&apos;embauche des coursiers et affichage indicatif des tarifs.
              </p>
            </div>

            {/* Tarifs affichés */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                💰 Grille Tarifaire Affichée
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Frais de Closing</label>
                  <input
                    type="text"
                    value={formData.pricing?.closingFeeDisplay || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, closingFeeDisplay: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    placeholder="800 GNF / commande"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Frais de Livraison</label>
                  <input
                    type="text"
                    value={formData.pricing?.deliveryFeeDisplay || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, deliveryFeeDisplay: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    placeholder="2 000 GNF / course"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Devise d&apos;affichage</label>
                  <input
                    type="text"
                    value={formData.pricing?.currencyDisplay || "GNF"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, currencyDisplay: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Recrutement Livreurs */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                🛵 Postuler comme Livreur (WhatsApp Candidature)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL WhatsApp Candidature Hub 1</label>
                  <input
                    type="url"
                    value={formData.recruitment?.whatsappPrimary || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recruitment: { ...formData.recruitment, whatsappPrimary: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Libellé Bouton Hub 1</label>
                  <input
                    type="text"
                    value={formData.recruitment?.primaryLabel || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recruitment: { ...formData.recruitment, primaryLabel: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    placeholder="Agence Conakry"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL WhatsApp Candidature Hub 2</label>
                  <input
                    type="url"
                    value={formData.recruitment?.whatsappSecondary || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recruitment: { ...formData.recruitment, whatsappSecondary: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Libellé Bouton Hub 2</label>
                  <input
                    type="text"
                    value={formData.recruitment?.secondaryLabel || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recruitment: { ...formData.recruitment, secondaryLabel: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden"
                    placeholder="Agence Kankan"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barre d'action inférieure */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Voir le site public</span>
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
