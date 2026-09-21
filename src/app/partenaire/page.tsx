"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  BarChart3,
  Truck,
  Star,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  User,
  Phone,
  Store,
  MapPin,
  CheckCircle2,
} from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<"partenaire" | "agence">("partenaire");

  useEffect(() => {
    const mode = searchParams.get("mode") || searchParams.get("tab");
    if (mode === "register" || mode === "signup" || mode === "inscription") {
      setIsRegister(true);
    }
  }, [searchParams]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [city, setCity] = useState("Cotonou");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Identifiants incorrects. Veuillez vérifier vos accès.");
        setLoading(false);
        return;
      }

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else if (role === "agence") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Erreur login:", err);
      setErrorMsg("Impossible de joindre le serveur d'authentification. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          shopName,
          email: signupEmail,
          phone,
          password: signupPassword,
          city,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Échec de l'inscription. Veuillez vérifier les informations.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Votre compte partenaire a été créé avec succès ! Redirection en cours...");
      setTimeout(() => {
        router.push(data.redirectUrl || "/dashboard");
      }, 900);
    } catch (err: any) {
      console.error("Erreur inscription:", err);
      setErrorMsg("Erreur réseau lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[420px] w-full mx-auto space-y-3.5 sm:space-y-4">
      {/* Mobile Header with Logo */}
      <div className="lg:hidden flex flex-col items-center text-center space-y-2 pb-1">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-white">
            <Image
              src="/images/guineego_logo.jpg"
              alt="Logo GuinéeGo LAT"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
        </Link>
        <div>
          <span className="text-lg font-black text-slate-900 block">
            ENO <span className="text-[#16a34a]">LIVRAISON</span>
          </span>
          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">
            VOS COLIS, NOTRE PRIORITÉ
          </span>
        </div>
      </div>

      <div className="lg:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#16a34a] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à l&apos;accueil
        </Link>
      </div>

      {/* 🔘 TOP ROLE SWITCHER */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setRole("partenaire");
            setSuccessMsg("");
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs transition-all ${
            role === "partenaire"
              ? "bg-[#16a34a] text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900 font-medium"
          }`}
        >
          Partenaire
        </button>

        <button
          type="button"
          onClick={() => {
            setRole("agence");
            setIsRegister(false);
            setSuccessMsg("");
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs transition-all ${
            role === "agence"
              ? "bg-black text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900 font-medium"
          }`}
        >
          Agence
        </button>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in-up">
          <Shield className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FORM TITLE & SUBTITLE */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          {isRegister ? "Créer un compte" : "Bon retour !"}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          {isRegister
            ? "Inscrivez votre boutique chez GuinéeGo LAT"
            : role === "partenaire"
            ? "Connectez-vous à votre espace e-commerçant"
            : "Connexion sécurisée pour l'équipe agence"}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 📝 FORMULAIRE D'INSCRIPTION */}
      {/* ══════════════════════════════════════════════════════ */}
      {isRegister ? (
        <form onSubmit={handleSignup} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Nom complet */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5 text-[#16a34a]" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nom du gérant"
                className="w-full pl-9 pr-3 py-2.5 bg-[#f0fdf4] border border-emerald-100 hover:border-emerald-300 focus:border-[#16a34a] rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            {/* Nom de la boutique */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Store className="w-3.5 h-3.5 text-[#16a34a]" />
              </div>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Nom boutique"
                className="w-full pl-9 pr-3 py-2.5 bg-[#f0fdf4] border border-emerald-100 hover:border-emerald-300 focus:border-[#16a34a] rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Téléphone WhatsApp */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-3.5 h-3.5 text-[#25d366]" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp (+229...)"
                className="w-full pl-9 pr-3 py-2.5 bg-[#f0fdf4] border border-emerald-100 hover:border-emerald-300 focus:border-[#16a34a] rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            {/* Ville */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-[#16a34a]" />
              </div>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#f0fdf4] border border-emerald-100 hover:border-emerald-300 focus:border-[#16a34a] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white transition-all"
              >
                <option value="Cotonou">Cotonou</option>
                <option value="Abomey-Calavi">Abomey-Calavi</option>
                <option value="Porto-Novo">Porto-Novo</option>
                <option value="Lokossa">Lokossa (Mono)</option>
                <option value="Parakou">Parakou</option>
                <option value="Autre">Autre ville</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5 text-[#16a34a]" />
              </div>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="Adresse email"
                className="w-full pl-9 pr-3 py-2.5 bg-[#f0fdf4] border border-emerald-100 hover:border-emerald-300 focus:border-[#16a34a] rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5 text-[#16a34a]" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full pl-9 pr-8 py-2.5 bg-[#f0fdf4] border border-emerald-100 hover:border-emerald-300 focus:border-[#16a34a] rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bouton de soumission Vert ENO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 mt-1"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Créer un compte partenaire"
            )}
          </button>

          {/* Switch vers connexion */}
          <p className="text-center text-xs text-slate-500 font-medium pt-1">
            Déjà un compte ?{" "}
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className="font-bold text-[#16a34a] hover:underline"
            >
              Se connecter
            </button>
          </p>
        </form>
      ) : (
        /* ══════════════════════════════════════════════════════ */
        /* 🔐 FORMULAIRE DE CONNEXION */
        /* ══════════════════════════════════════════════════════ */
        <form onSubmit={handleLogin} className="space-y-3">
          {/* Champ Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4 text-[#16a34a]" />
            </div>
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Adresse email"
              className="w-full pl-10 pr-4 py-3 bg-[#f0fdf4] border border-emerald-100 hover:border-emerald-300 focus:border-[#16a34a] rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4 text-[#16a34a]" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full pl-10 pr-10 py-3 bg-[#f0fdf4] border border-emerald-100 hover:border-emerald-300 focus:border-[#16a34a] rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Mot de passe oublié */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="text-xs font-medium text-slate-500 hover:text-[#16a34a] transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Bouton Se connecter avec distinction visuelle ébène / vert */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 cursor-pointer ${
              role === "agence"
                ? "bg-black hover:bg-neutral-900 text-white shadow-lg shadow-black/15"
                : "bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md shadow-emerald-600/25"
            }`}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : role === "agence" ? (
              "Se connecter à l'agence"
            ) : (
              "Se connecter"
            )}
          </button>

          {/* 🔘 SECTION BAS DE FORMULAIRE */}
          {role === "agence" ? (
            <p className="pt-3 text-center text-xs text-slate-500 font-medium tracking-tight">
              Accès réservé à l&apos;équipe GuinéeGo LAT
            </p>
          ) : (
            <>
              {/* Séparateur OU */}
              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 relative">
                  OU
                </span>
              </div>

              {/* Bouton Google */}
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Continuer avec Google</span>
              </button>

              {/* Switch vers inscription */}
              <p className="text-center text-xs text-slate-500 font-medium pt-1">
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-bold text-[#16a34a] hover:underline"
                >
                  Créer un compte
                </button>
              </p>
            </>
          )}
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden grid lg:grid-cols-2 bg-white selection:bg-[#16a34a] selection:text-white font-sans">
      {/* LEFT COLUMN (Fixed, 100% visible on a single page, no scroll needed) */}
      <div className="relative hidden lg:flex flex-col justify-between p-6 xl:p-10 bg-[#0f291e] text-white border-r border-emerald-950 h-screen max-h-screen overflow-y-auto scrollbar-none select-none">
        {/* Glow ambient */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#16a34a]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="relative z-10 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500 bg-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Image
                src="/images/guineego_logo.jpg"
                alt="Logo GuinéeGo LAT"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <span className="text-lg font-black text-white block tracking-tight leading-none">
                ENO <span className="text-[#22c55e]">LIVRAISON</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400">
                VOS COLIS, NOTRE PRIORITÉ
              </span>
            </div>
          </div>
        </div>

        {/* Main Pitch & 2x2 Micro-Grid */}
        <div className="relative z-10 my-auto py-3 space-y-3.5 max-w-lg">
          <div>
            <h1 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-tight">
              Gérez votre activité <br />
              <span className="text-[#22c55e]">en toute sérénité</span>
            </h1>
            <p className="text-emerald-100/70 text-xs mt-1.5 leading-relaxed font-normal">
              Rejoignez le réseau GuinéeGo LAT et accédez à des outils puissants pour automatiser votre closing, stockage et vos livraisons express au Bénin.
            </p>
          </div>

          {/* 4 Feature Cards in a Compact 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-900/70 backdrop-blur space-y-1">
              <div className="w-8 h-8 rounded-xl bg-[#16a34a]/20 text-[#86efac] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Commandes</h4>
              <p className="text-[10px] text-emerald-200/70 leading-snug">Suivi en temps réel</p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-900/70 backdrop-blur space-y-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Statistiques</h4>
              <p className="text-[10px] text-emerald-200/70 leading-snug">Rapports & finances</p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-900/70 backdrop-blur space-y-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Closing 15 min</h4>
              <p className="text-[10px] text-emerald-200/70 leading-snug">Confirmation & appels</p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-900/70 backdrop-blur space-y-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">Reversements</h4>
              <p className="text-[10px] text-emerald-200/70 leading-snug">Cash MoMo quotidien</p>
            </div>
          </div>
        </div>

        {/* Social Proof & Real Agencies Footer */}
        <div className="relative z-10 pt-3 border-t border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-emerald-700 shrink-0">
              <Image
                src="/images/eno_card_1.png"
                alt="Flotte GuinéeGo LAT"
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                Plus de 1 An d&apos;expertise terrain au Bénin
              </p>
              <p className="text-[10px] text-emerald-300/80 truncate">
                Cotonou : <strong className="text-white">01 64 29 18 84</strong> • Lokossa : <strong className="text-white">01 67 51 00 82</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN (Auth Form - 100% Statique, sans défilement) */}
      <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-6 bg-white select-none">
        <div className="max-w-[420px] w-full mx-auto my-auto">
          <Suspense fallback={<div className="text-center text-slate-400 text-xs py-10">Chargement...</div>}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
