// Configuration & utilitaires des pièces jointes réelles — GuinéeGo LAT

import { ChatAttachment } from "./types";

// Limite maximale configurable par fichier (20 MB)
export const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20 MB en octets
export const MAX_ATTACHMENT_SIZE_LABEL = "20 MB";

// Whitelist des types MIME autorisés
export const ALLOWED_MIME_TYPES: Record<string, "IMAGE" | "PDF" | "DOC"> = {
  // Images
  "image/jpeg": "IMAGE",
  "image/jpg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "image/gif": "IMAGE",
  // PDF
  "application/pdf": "PDF",
  // Documents bureautiques courants
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOC",
  "application/vnd.ms-excel": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "DOC",
  "text/csv": "DOC",
  "text/plain": "DOC",
};

// Whitelist des extensions de fichiers autorisées
export const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "txt",
];

// Liste noire des fichiers exécutables / dangereux
export const BLOCKED_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "sh",
  "ps1",
  "msi",
  "scr",
  "vbs",
  "js",
  "jar",
  "com",
  "pif",
];

/**
 * Formate la taille en octets en chaîne lisible (KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Détermine le type de fichier (IMAGE, PDF, DOC) à partir du mimeType ou de l'extension.
 */
export function getAttachmentType(mimeType: string, fileName: string): "IMAGE" | "PDF" | "DOC" {
  if (ALLOWED_MIME_TYPES[mimeType]) {
    return ALLOWED_MIME_TYPES[mimeType];
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "IMAGE";
  if (ext === "pdf") return "PDF";
  return "DOC";
}

/**
 * Valide un fichier sélectionné par l'utilisateur.
 * Retourne null si valide, ou le message d'erreur sinon.
 */
export function validateAttachmentFile(file: File): { isValid: boolean; error?: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  // 1. Vérifier si l'extension est dangereuse
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Le format .${ext} est bloqué pour des raisons de sécurité.`,
    };
  }

  // 2. Vérifier la taille
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      isValid: false,
      error: `Ce fichier dépasse la taille maximale autorisée de ${MAX_ATTACHMENT_SIZE_LABEL} (${formatFileSize(file.size)}).`,
    };
  }

  // 3. Vérifier le MIME type ou l'extension
  const isMimeAllowed = Boolean(ALLOWED_MIME_TYPES[file.type]);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (!isMimeAllowed && !isExtAllowed) {
    return {
      isValid: false,
      error: `Format non supporté (.${ext}). Formats autorisés : JPG, PNG, WEBP, PDF, Word, Excel, CSV.`,
    };
  }

  return { isValid: true };
}

/**
 * Fonction d'upload réelle avec suivi de progression XMLHttpRequest
 */
export function uploadAttachmentReal(
  file: File,
  conversationId: string,
  uploadedBy: string,
  onProgress: (percent: number) => void,
  uploadedByRole?: string
): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const validation = validateAttachmentFile(file);
    if (!validation.isValid) {
      reject(new Error(validation.error || "Fichier invalide"));
      return;
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);
    formData.append("uploadedBy", uploadedBy);
    if (uploadedByRole) {
      formData.append("uploadedByRole", uploadedByRole);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.attachment);
        } catch (err) {
          reject(new Error("Réponse serveur invalide"));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error || `Erreur serveur (${xhr.status})`));
        } catch {
          reject(new Error(`Erreur lors de l'envoi (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Échec de connexion au serveur"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload annulé"));
    });

    xhr.open("POST", "/api/conversations/upload");
    xhr.send(formData);
  });
}
