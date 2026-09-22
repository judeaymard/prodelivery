"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import Image from "next/image";
import {
  Upload,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface MediaImagePickerProps {
  label: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  onChange: (newUrl: string) => void;
  aspectRatio?: "video" | "square" | "wide" | "contain";
  recommendedSize?: string;
  recommendedMinWidth?: number;
  slot?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileNameFromUrl(url?: string): string {
  if (!url) return "";
  try {
    const clean = url.split("?")[0];
    const parts = clean.split("/");
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

export function MediaImagePicker({
  label,
  description,
  value,
  defaultValue,
  onChange,
  aspectRatio = "video",
  recommendedSize,
  recommendedMinWidth,
  slot = "media",
}: MediaImagePickerProps) {
  const inputId = useId();
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvancedUrl, setShowAdvancedUrl] = useState(false);

  // Métadonnées d'image
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrl = (value || "").trim();
  const isDefault = Boolean(defaultValue && currentUrl === defaultValue);
  const hasCustomValue = Boolean(currentUrl && !isDefault);

  // Déterminer le ratio d'affichage
  let ratioClass = "aspect-video";
  if (aspectRatio === "square") ratioClass = "aspect-square max-w-[220px]";
  else if (aspectRatio === "wide") ratioClass = "aspect-[21/9]";
  else if (aspectRatio === "contain") ratioClass = "h-32 w-auto min-w-[140px]";

  // Calculer automatiquement les dimensions réelles dans le navigateur
  useEffect(() => {
    if (!currentUrl) {
      setDimensions(null);
      setImageError(false);
      return;
    }

    const img = new window.Image();
    img.src = currentUrl;
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImageError(false);
    };
    img.onerror = () => {
      setImageError(true);
    };
  }, [currentUrl]);

  // Upload d'un fichier sélectionné ou glissé-déposé
  const uploadFile = async (file: File) => {
    if (!file) return;

    // Vérification préliminaire du type
    if (!file.type.startsWith("image/") && !file.name.endsWith(".ico")) {
      setUploadError("Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP, AVIF, SVG, ICO).");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setImageError(false);
    setCustomFileName(file.name);
    setFileSize(file.size);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slot", slot);

      const res = await fetch("/api/brand-config/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement de l'image.");
      }

      if (data.url) {
        onChange(data.url);
        if (data.dimensions) {
          setDimensions(data.dimensions);
        }
        if (data.size) {
          setFileSize(data.size);
        }
        if (data.fileName) {
          setCustomFileName(data.fileName);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de l'upload.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  // Support Glisser-Déposer (Drag & Drop)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleResetDefault = () => {
    if (defaultValue) {
      onChange(defaultValue);
      setImageError(false);
      setUploadError(null);
      setFileSize(null);
      setCustomFileName(null);
    }
  };

  const handleClear = () => {
    onChange("");
    setImageError(false);
    setUploadError(null);
    setDimensions(null);
    setFileSize(null);
    setCustomFileName(null);
  };

  const activeFileName = customFileName || getFileNameFromUrl(currentUrl);

  // Diagnostic de résolution selon les recommandations
  const minWidth = recommendedMinWidth || (aspectRatio === "wide" || aspectRatio === "video" ? 1200 : 512);
  const isWidthSufficient = dimensions ? dimensions.width >= minWidth : null;

  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 transition-all">
      {/* 1. En-tête avec label et recommandation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div>
          <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 brand-text-primary" />
            <span>{label}</span>
          </label>
          {description && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        {recommendedSize && (
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-lg shrink-0">
            Recommandé : {recommendedSize}
          </span>
        )}
      </div>

      {/* 2. Zone Aperçu Visuel avec Drag & Drop et Clic direct */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all flex items-center justify-center min-h-[160px] max-h-[280px] ${
          isDragging
            ? "border-2 border-dashed border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/10"
            : "border border-slate-200 bg-slate-950/5 hover:border-slate-400 hover:shadow-xs"
        }`}
        title="Cliquez ou glissez-déposez pour remplacer cette image depuis votre ordinateur"
      >
        {currentUrl && !imageError ? (
          <div className={`relative w-full ${ratioClass} overflow-hidden flex items-center justify-center`}>
            <Image
              src={currentUrl}
              alt={label}
              fill
              className={aspectRatio === "contain" ? "object-contain p-3" : "object-cover"}
              onError={() => setImageError(true)}
              unoptimized={true}
            />

            {/* Badge de statut direct */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isDefault ? "Image par défaut" : "Image personnalisée"}</span>
            </div>

            {/* Overlay au survol */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-1 p-4 text-center">
              <Upload className="w-6 h-6 text-white animate-bounce" />
              <span className="text-xs font-black">Remplacer l&apos;image</span>
              <span className="text-[10px] text-slate-200">Cliquez ou glissez un fichier depuis votre PC</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 text-slate-400 group-hover:text-slate-600 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                {imageError ? "Image non trouvée" : "Aucune image sélectionnée"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cliquez ou glissez une image depuis votre ordinateur
              </p>
            </div>
            {defaultValue && (
              <p className="text-[10px] text-slate-400 font-mono">
                Fallback : {getFileNameFromUrl(defaultValue)}
              </p>
            )}
          </div>
        )}

        {/* Animation de chargement pendant l'upload */}
        {isUploading && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2.5 z-20">
            <div className="w-7 h-7 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
            <span className="text-xs font-black tracking-wide">Importation de l&apos;image originale...</span>
            <span className="text-[10px] text-slate-300">Qualité 100% préservée sans compression</span>
          </div>
        )}
      </div>

      {/* 3. Input fichier masqué déclenché par bouton ou clic zone */}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/gif,image/x-icon"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 4. Message d'erreur s'il y a lieu */}
      {uploadError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="leading-relaxed">{uploadError}</span>
        </div>
      )}

      {/* 5. Carte d'informations de l'image (Nom, Dimensions, Poids, Statut & Actions) */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900 truncate" title={activeFileName || currentUrl}>
              {activeFileName || (currentUrl ? "Image configurée" : "Aucun fichier")}
            </p>
            {hasCustomValue && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                Personnalisée
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-600 text-[11px]">
            {dimensions && (
              <span className="font-mono font-semibold text-slate-700">
                {dimensions.width} × {dimensions.height}
              </span>
            )}
            {fileSize && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-600">{formatBytes(fileSize)}</span>
              </>
            )}
          </div>

          {/* Diagnostic de résolution conforme aux exigences */}
          {dimensions && (
            <div className="pt-0.5">
              {isWidthSufficient ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Résolution adaptée ({dimensions.width} × {dimensions.height})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <Info className="w-3 h-3 text-amber-600" />
                  <span>Résolution actuelle : {dimensions.width}px • Recommandé : {minWidth}px+</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Boutons d'Action Principaux */}
        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{currentUrl ? "Remplacer l'image" : "Importer une image"}</span>
          </button>

          {hasCustomValue && defaultValue && (
            <button
              type="button"
              onClick={handleResetDefault}
              disabled={isUploading}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              title="Restaurer l'image originale par défaut"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Restaurer</span>
            </button>
          )}

          {currentUrl && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isUploading}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Vider l'emplacement"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 6. Option avancée : Saisie manuelle d'URL (discrète et repliée par défaut) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvancedUrl(!showAdvancedUrl)}
          className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedUrl ? "rotate-180" : ""}`} />
          <span>Options avancées (saisie manuelle d&apos;URL ou chemin)</span>
        </button>

        {showAdvancedUrl && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => {
                  onChange(e.target.value);
                  setImageError(false);
                  setUploadError(null);
                  setCustomFileName(null);
                  setFileSize(null);
                }}
                placeholder="Chemin (/images/...) ou URL https://..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
              {currentUrl && (
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ouvrir</span>
                </a>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Note : L&apos;import direct ci-dessus est la méthode recommandée pour conserver la qualité maximale.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
