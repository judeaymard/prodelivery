"use client";

import React, { useState } from "react";
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Camera,
  Check,
  Smartphone,
  Lock,
} from "lucide-react";
import { useOperations } from "@/lib/store";

export default function ProfilPage() {
  const { activePartner, currentPartner, updatePartner, changePassword } = useOperations();
  const partner = activePartner || currentPartner;

  const [fullName, setFullName] = useState(partner.fullName);
  const [companyName, setCompanyName] = useState(partner.companyName);
  const [email, setEmail] = useState(partner.email);
  const [phone, setPhone] = useState(partner.phone);
  const [address, setAddress] = useState(partner.address);

  // Mobile Money Numbers
  const [momoNumber, setMomoNumber] = useState(partner.phone || "");
  const [moovNumber, setMoovNumber] = useState("");
  const [preferredPayout, setPreferredPayout] = useState("MTN");

  // Passwords
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePartner(partner.id, {
      fullName,
      companyName,
      email,
      phone,
      address,
    });
    if (newPassword.trim()) {
      changePassword(newPassword.trim());
      setOldPassword("");
      setNewPassword("");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      {/* 🏛️ HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#EAE6DD]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#787163]">
            <span>Paramètres Partenaire</span>
            <span>•</span>
            <span className="text-[#e52320]">Compte Certifié GuinéeGo LAT Guinée</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-[#141A17] tracking-tight mt-1">
            Identité Partenaire
          </h2>
          <p className="text-xs text-[#787163] mt-1">
            Coordonnées d&apos;entreprise, comptes de réception Mobile Money et sécurité.
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#e52320] text-[#e52320] text-xs font-bold shadow-2xs">
            <Check className="w-4 h-4 text-[#e52320]" /> Modifications enregistrées
          </span>
        )}
      </div>

      <div className="bg-white border border-[#EAE6DD] rounded-3xl overflow-hidden shadow-2xs">
        {/* BRAND MINIMAL NOBLE BANNER */}
        <div className="h-32 bg-[#e52320] relative overflow-hidden flex items-end p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
            Maison Partenaire Enregistrée • Conakry, Guinée
          </div>
        </div>

        {/* PROFILE HEADER & AVATAR */}
        <div className="px-6 sm:px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-6">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white flex items-center justify-center text-[#e52320] text-2xl font-black shadow-md">
                  {companyName.charAt(0)}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-lg bg-[#141A17] hover:bg-[#e52320] text-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
                  title="Changer le logo"
                >
                  <Camera className="w-3 h-3 text-[#C5A059]" />
                </button>
              </div>

              <div className="space-y-1 pb-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#141A17]">{companyName}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F5] border border-[#EAE6DD] text-[#e52320] text-[10px] font-bold uppercase tracking-wider">
                    Boutique Active
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F5] border border-[#EAE6DD] text-[#787163] text-[10px] font-bold uppercase tracking-wider">
                    ID: #GG-{partner.id.slice(0, 6)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT FORM */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* SECTION 1: ENTREPRISE */}
            <div className="space-y-4 pt-2 border-t border-[#EAE6DD]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#e52320] uppercase tracking-wider">
                <Building className="w-4 h-4" /> Coordonnées Générales
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Nom de la Boutique</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Gérant Principal</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Email de Contact</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Téléphone Appel / WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Adresse Principale (Siège)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: MOBILE MONEY PAYOUT */}
            <div className="space-y-4 pt-4 border-t border-[#EAE6DD]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#e52320] uppercase tracking-wider">
                <Smartphone className="w-4 h-4" /> Paramètres des Reversements MoMo
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Numéro MTN Mobile Money</label>
                  <input
                    type="text"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Numéro Moov Money</label>
                  <input
                    type="text"
                    value={moovNumber}
                    onChange={(e) => setMoovNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Opérateur Préféré par Défaut</label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#141A17]">
                      <input
                        type="radio"
                        name="preferredPayout"
                        checked={preferredPayout === "MTN"}
                        onChange={() => setPreferredPayout("MTN")}
                        className="accent-[#e52320]"
                      />
                      <span>MTN MoMo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#141A17]">
                      <input
                        type="radio"
                        name="preferredPayout"
                        checked={preferredPayout === "MOOV"}
                        onChange={() => setPreferredPayout("MOOV")}
                        className="accent-[#e52320]"
                      />
                      <span>Moov Money</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#141A17]">
                      <input
                        type="radio"
                        name="preferredPayout"
                        checked={preferredPayout === "WAVE"}
                        onChange={() => setPreferredPayout("WAVE")}
                        className="accent-[#e52320]"
                      />
                      <span>Wave</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: SÉCURITÉ */}
            <div className="space-y-4 pt-4 border-t border-[#EAE6DD]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#e52320] uppercase tracking-wider">
                <Lock className="w-4 h-4" /> Sécurité & Mot de passe
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Mot de Passe Actuel</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141A17] uppercase">Nouveau Mot de Passe</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#EAE6DD] rounded-xl text-xs font-bold text-[#141A17] focus:outline-none focus:border-[#e52320] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-[#141A17] hover:bg-[#e52320] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
              >
                Enregistrer les Modifications
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
