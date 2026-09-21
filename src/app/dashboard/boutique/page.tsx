"use client";

import React, { useState } from "react";
import {
  Globe,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ExternalLink,
  Copy,
  KeyRound,
  Link2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function BoutiquePage() {
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [youcanConnected, setYoucanConnected] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<string | null>(null);

  // Form state
  const [shopUrl, setShopUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  // Connection state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [connectedShopName, setConnectedShopName] = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const isShopify = showConfigModal === "Shopify";
      const endpoint = isShopify
        ? "/api/integrations/shopify/connect"
        : "/api/integrations/youcan/connect";

      const payload = isShopify
        ? { shopUrl, accessToken: apiKey }
        : { storeUrl: shopUrl, apiToken: apiKey };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Échec de la connexion. Vérifiez vos identifiants.");
        setIsLoading(false);
        return;
      }

      // Success
      const name = data.shop?.name || data.store?.name || showConfigModal;
      setConnectedShopName(name);

      if (isShopify) {
        setShopifyConnected(true);
      } else {
        setYoucanConnected(true);
      }

      setShowConfigModal(null);
      setShopUrl("");
      setApiKey("");
    } catch {
      setErrorMsg("Impossible de joindre le serveur. Vérifiez votre connexion internet.");
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Boutique en ligne</h2>
        <p className="text-xs text-slate-500 mt-1">
          Reliez votre boutique (Shopify, Youcan...) pour recevoir automatiquement les commandes de vos produits reliés avec GuinéeGo LAT.
        </p>
      </div>

      {/* SUCCESS TOAST */}
      {(shopifyConnected || youcanConnected) && connectedShopName && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs max-w-4xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
            <span>
              Boutique &quot;{connectedShopName}&quot; reliée avec succès ! Les nouvelles commandes COD seront importées automatiquement.
            </span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase font-bold shrink-0">Actif</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 max-w-4xl shadow-xs">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Reliez votre boutique en ligne</h3>
          <p className="text-xs text-slate-500 mt-1">
            Choisissez votre plateforme. Vos produits seront importés (lecture seule) puis reliés à vos stocks dans l&apos;entrepôt GuinéeGo LAT.
          </p>
        </div>

        {/* 4 PLATFORMS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SHOPIFY CARD */}
          <div
            onClick={() => {
              if (!shopifyConnected) {
                setShowConfigModal("Shopify");
                setErrorMsg("");
              }
            }}
            className={`bg-slate-50 border ${
              shopifyConnected ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20"
            } rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all duration-200 group shadow-xs`}
          >
            <div className="w-14 h-16 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/shopify-logo.png" alt="Shopify" className="w-14 h-16 object-contain" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-900 text-base">Shopify</h4>
              <p className="text-xs text-slate-500 font-medium">
                {shopifyConnected ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5" /> Boutique reliée
                  </span>
                ) : (
                  "Relier ma boutique Shopify"
                )}
              </p>
            </div>
          </div>

          {/* YOUCAN CARD */}
          <div
            onClick={() => {
              if (!youcanConnected) {
                setShowConfigModal("Youcan");
                setErrorMsg("");
              }
            }}
            className={`bg-slate-50 border ${
              youcanConnected ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20"
            } rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all duration-200 group shadow-xs`}
          >
            <div className="w-12 h-12 rounded-xl bg-[#0066ff] flex items-center justify-center text-white font-black text-xl shadow-xs">
              Y
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-900 text-base">Youcan</h4>
              <p className="text-xs text-slate-500 font-medium">
                {youcanConnected ? (
                  <span className="text-[#16a34a] font-bold flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5" /> Boutique reliée
                  </span>
                ) : (
                  "Relier ma boutique Youcan"
                )}
              </p>
            </div>
          </div>

          {/* WOOCOMMERCE CARD */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-not-allowed opacity-60">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-extrabold text-xl">
              W
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-base">WooCommerce</h4>
              <span className="px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase inline-block">Bientôt</span>
            </div>
          </div>

          {/* AUTRE CARD */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-not-allowed opacity-60">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-base">Autre plateforme</h4>
              <span className="px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase inline-block">Bientôt</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 pt-1">
          Vous n&apos;avez pas Shopify ? Reliez librement Youcan. D&apos;autres plateformes arrivent bientôt.
        </p>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* GUIDE DE CONNEXION SHOPIFY */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-4xl shadow-xs overflow-hidden">
        <button
          onClick={() => setShowGuide(showGuide === "shopify" ? null : "shopify")}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#16a34a]" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-900">Guide : Comment connecter Shopify ?</h4>
              <p className="text-[11px] text-slate-500">Étapes détaillées pour obtenir votre clé API</p>
            </div>
          </div>
          {showGuide === "shopify" ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showGuide === "shopify" && (
          <div className="px-5 pb-6 space-y-4 border-t border-slate-100 pt-5">
            {/* Ce dont vous avez besoin */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-[#16a34a] uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Ce dont vous avez besoin
              </h5>
              <ul className="text-xs text-slate-700 space-y-1.5 list-none">
                <li className="flex items-start gap-2">
                  <Link2 className="w-3.5 h-3.5 text-[#16a34a] shrink-0 mt-0.5" />
                  <span><span className="font-bold text-slate-900">URL de votre boutique</span> — ex : <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px] text-slate-800">ma-boutique.myshopify.com</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><span className="font-bold text-slate-900">Clé API Admin</span> — Un token d&apos;accès commençant par <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px] text-amber-700">shpat_</code></span>
                </li>
              </ul>
            </div>

            {/* Étapes */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 uppercase">Étapes pour obtenir votre clé API Shopify :</h5>

              <div className="space-y-2.5">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-xs font-bold flex items-center justify-center shrink-0">1</div>
                  <div className="text-xs text-slate-700">
                    Connectez-vous à votre <span className="font-bold text-slate-900">tableau de bord Shopify</span> sur <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">admin.shopify.com</code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-xs font-bold flex items-center justify-center shrink-0">2</div>
                  <div className="text-xs text-slate-700">
                    Allez dans <span className="font-bold text-slate-900">Paramètres</span> (en bas à gauche) <ArrowRight className="w-3 h-3 inline text-slate-400" /> <span className="font-bold text-slate-900">Apps et canaux de vente</span> <ArrowRight className="w-3 h-3 inline text-slate-400" /> <span className="font-bold text-slate-900">Développer des apps</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-xs font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="text-xs text-slate-700">
                    Cliquez sur <span className="font-bold text-slate-900">&quot;Créer une app&quot;</span>, nommez-la <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-[#16a34a] font-bold">guineego_livraison</code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-xs font-bold flex items-center justify-center shrink-0">4</div>
                  <div className="text-xs text-slate-700">
                    Dans <span className="font-bold text-slate-900">&quot;Configuration de l&apos;API Admin&quot;</span>, cochez les permissions : <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">read_orders</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">read_products</code> puis cliquez <span className="font-bold text-slate-900">&quot;Enregistrer&quot;</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-xs font-bold flex items-center justify-center shrink-0">5</div>
                  <div className="text-xs text-slate-700">
                    Cliquez <span className="font-bold text-slate-900">&quot;Installer l&apos;app&quot;</span>, puis copiez le <span className="font-bold text-amber-700">Token d&apos;accès Admin API</span> (il commence par <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-amber-700">shpat_</code>)
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-xs font-bold flex items-center justify-center shrink-0">6</div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-[#16a34a]">Collez votre URL et votre Token</span> dans le formulaire de connexion GuinéeGo LAT ci-dessus. C&apos;est terminé ! 🎉
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <span className="font-bold">Important :</span> Ne partagez jamais votre Token avec un tiers. Seul GuinéeGo LAT en a besoin pour importer vos commandes COD.
              </p>
            </div>

            <a
              href="https://help.shopify.com/fr/manual/apps/app-types/custom-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#16a34a] font-bold hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Documentation officielle Shopify
            </a>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* GUIDE DE CONNEXION YOUCAN */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-4xl shadow-xs overflow-hidden">
        <button
          onClick={() => setShowGuide(showGuide === "youcan" ? null : "youcan")}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-900">Guide : Comment connecter Youcan ?</h4>
              <p className="text-[11px] text-slate-500">Étapes détaillées pour obtenir votre clé API</p>
            </div>
          </div>
          {showGuide === "youcan" ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showGuide === "youcan" && (
          <div className="px-5 pb-6 space-y-4 border-t border-slate-100 pt-5">
            {/* Ce dont vous avez besoin */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-[#16a34a] uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Ce dont vous avez besoin
              </h5>
              <ul className="text-xs text-slate-700 space-y-1.5 list-none">
                <li className="flex items-start gap-2">
                  <Link2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><span className="font-bold text-slate-900">URL de votre boutique</span> — ex : <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px] text-blue-700">ma-boutique.youcan.shop</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><span className="font-bold text-slate-900">Token API</span> — Clé d&apos;accès générée dans les paramètres de votre boutique</span>
                </li>
              </ul>
            </div>

            {/* Étapes */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 uppercase">Étapes pour obtenir votre clé API Youcan :</h5>

              <div className="space-y-2.5">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold flex items-center justify-center shrink-0">1</div>
                  <div className="text-xs text-slate-700">
                    Connectez-vous à votre <span className="font-bold text-slate-900">tableau de bord YouCan</span> sur <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">seller-area.youcan.shop</code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold flex items-center justify-center shrink-0">2</div>
                  <div className="text-xs text-slate-700">
                    Allez dans <span className="font-bold text-slate-900">Paramètres</span> <ArrowRight className="w-3 h-3 inline text-slate-400" /> <span className="font-bold text-slate-900">API &amp; Intégrations</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="text-xs text-slate-700">
                    Cliquez <span className="font-bold text-slate-900">&quot;Générer un nouveau token&quot;</span> et donnez-lui le nom <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-[#16a34a] font-bold">guineego_livraison</code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold flex items-center justify-center shrink-0">4</div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-amber-700">Copiez le token</span> affiché (il ne sera plus visible ensuite)
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-xs font-bold flex items-center justify-center shrink-0">5</div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-[#16a34a]">Collez votre URL et votre Token</span> dans le formulaire de connexion GuinéeGo LAT ci-dessus. C&apos;est terminé ! 🎉
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <span className="font-bold">Important :</span> Votre token ne sera affiché qu&apos;une seule fois sur YouCan. Copiez-le immédiatement et conservez-le en lieu sûr.
              </p>
            </div>

            <a
              href="https://developer.youcan.shop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#16a34a] font-bold hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Documentation officielle YouCan
            </a>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* COMMENT ÇA MARCHE (FLUX) */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-4xl shadow-xs overflow-hidden">
        <button
          onClick={() => setShowGuide(showGuide === "flow" ? null : "flow")}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Copy className="w-4 h-4 text-[#16a34a]" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-900">Comment ça marche après la connexion ?</h4>
              <p className="text-[11px] text-slate-500">Le parcours complet de votre commande</p>
            </div>
          </div>
          {showGuide === "flow" ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showGuide === "flow" && (
          <div className="px-5 pb-6 space-y-4 border-t border-slate-100 pt-5">
            <div className="space-y-3">
              {[
                { step: "1", color: "bg-blue-50 text-blue-700 border border-blue-200", title: "Commande reçue", desc: "Un client passe une commande Cash on Delivery sur votre boutique en ligne." },
                { step: "2", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", title: "Import automatique", desc: "La commande apparaît instantanément dans votre espace GuinéeGo LAT (onglet Commandes)." },
                { step: "3", color: "bg-amber-50 text-amber-700 border border-amber-200", title: "Closing téléphonique", desc: "Notre équipe de closeuses appelle le client sous 15 min pour confirmer la commande et l'adresse." },
                { step: "4", color: "bg-purple-50 text-purple-700 border border-purple-200", title: "Préparation & Livraison", desc: "Le colis est préparé depuis l'entrepôt GuinéeGo et livré au client. Le livreur encaisse en cash." },
                { step: "5", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", title: "Reversement Mobile Money", desc: "Le montant encaissé moins 40 000 GNF (15 000 GNF Closing + 25 000 GNF Livraison) est viré sur votre MoMo." },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className={`w-7 h-7 rounded-full ${item.color} text-xs font-bold flex items-center justify-center shrink-0`}>
                    {item.step}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* CONFIG MODAL */}
      {/* ═══════════════════════════════════════════ */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                  showConfigModal === "Shopify"
                    ? "bg-emerald-50 text-[#16a34a] border border-emerald-100"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}>
                  {showConfigModal === "Shopify" ? "S" : "Y"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Relier {showConfigModal}</h3>
                  <p className="text-xs text-slate-500">Importation automatique des commandes COD</p>
                </div>
              </div>
              <button
                onClick={() => { setShowConfigModal(null); setErrorMsg(""); }}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-semibold">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#16a34a]" />
                  URL de la boutique
                </label>
                <input
                  type="text"
                  required
                  placeholder={showConfigModal === "Shopify" ? "ma-boutique.myshopify.com" : "ma-boutique.youcan.shop"}
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#16a34a] focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  {showConfigModal === "Shopify" ? "Token Admin API (shpat_...)" : "Token API YouCan"}
                </label>
                <input
                  type="password"
                  required
                  placeholder={showConfigModal === "Shopify" ? "shpat_xxxxxxxxxxxxxxxxxxxxxxxx" : "votre-token-api-youcan"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#16a34a] focus:bg-white font-mono"
                />
              </div>

              {/* Info box */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500">
                  Vos identifiants sont transmis de manière sécurisée. Consultez le guide ci-dessus pour obtenir votre clé API.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowConfigModal(null); setErrorMsg(""); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#e52320] hover:bg-[#c91d1a] text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Connexion en cours...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Valider la connexion
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
