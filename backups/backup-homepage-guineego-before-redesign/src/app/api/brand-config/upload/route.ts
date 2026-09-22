import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-service";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 Mo max (Haute Résolution acceptée)
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "svg", "gif", "ico"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

/**
 * Validation des octets magiques réels du fichier pour bloquer les faux fichiers d'images.
 */
function isValidImageBuffer(buffer: Buffer, ext: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  if (ext === "jpg" || ext === "jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === "png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (ext === "gif") {
    return buffer.subarray(0, 4).toString("ascii") === "GIF8";
  }
  if (ext === "webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (ext === "avif") {
    if (buffer.length < 16) return false;
    const box = buffer.subarray(4, 16).toString("ascii");
    return box.includes("ftyp") && (box.includes("avif") || box.includes("avis") || box.includes("mif1"));
  }
  if (ext === "svg") {
    const head = buffer.subarray(0, Math.min(buffer.length, 1024)).toString("utf-8");
    return head.includes("<svg") || head.includes("<?xml");
  }
  if (ext === "ico") {
    return buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00;
  }

  return false;
}

/**
 * Extraction native rapide des dimensions réelles de l'image.
 */
function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    if (!buffer || buffer.length < 16) return null;

    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      if (buffer.length >= 24) {
        return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
      }
    }

    // GIF
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      if (buffer.length >= 10) {
        return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
      }
    }

    // WEBP
    if (
      buffer.length >= 30 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
      const chunkType = buffer.subarray(12, 16).toString("ascii");
      if (chunkType === "VP8 " && buffer.length >= 30) {
        return {
          width: buffer.readUInt16LE(26) & 0x3fff,
          height: buffer.readUInt16LE(28) & 0x3fff,
        };
      } else if (chunkType === "VP8L" && buffer.length >= 25) {
        const b1 = buffer[21],
          b2 = buffer[22],
          b3 = buffer[23],
          b4 = buffer[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        return { width, height };
      } else if (chunkType === "VP8X" && buffer.length >= 30) {
        const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
        const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
        return { width, height };
      }
    }

    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7),
          };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
  } catch {
    // Si parsing échoue, le client fournira ses dimensions via naturalWidth/naturalHeight
    return null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentification & Sécurité : vérification session administrateur
    const parsedCookieFromHeader = req.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.split("=")[1];
    const sessionCookie =
      req.cookies?.get(SESSION_COOKIE_NAME)?.value || parsedCookieFromHeader;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Non authentifié. Session requise pour téléverser une image." },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(sessionCookie);

    if (!session || (session.role !== "PDG" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Accès refusé. Habilitation administrative requise." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slot = (formData.get("slot") as string | null) || "media";

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier image fourni." },
        { status: 400 }
      );
    }

    // 2. Contrôle de la taille du fichier
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          error: `L'image dépasse la taille maximale autorisée de 10 Mo (${(
            file.size /
            (1024 * 1024)
          ).toFixed(1)} Mo).`,
        },
        { status: 400 }
      );
    }

    // 3. Contrôle de l'extension
    const originalName = file.name || "media";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Format .${ext} non autorisé. Formats acceptés : JPG, PNG, WEBP, AVIF, SVG, GIF, ICO.`,
        },
        { status: 400 }
      );
    }

    // 4. Contrôle du type MIME
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `Type MIME ${file.type} invalide.` },
        { status: 400 }
      );
    }

    // 5. Lecture du buffer et validation stricte du contenu binaire
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageBuffer(buffer, ext)) {
      return NextResponse.json(
        {
          error:
            "Le contenu binaire du fichier ne correspond pas à une image valide du format déclaré.",
        },
        { status: 400 }
      );
    }

    // 6. Extraction des dimensions
    const dimensions = getImageDimensions(buffer);

    // 7. Création du dossier cible public/uploads/brand
    const uploadDir = path.join(process.cwd(), "public", "uploads", "brand");
    await fs.mkdir(uploadDir, { recursive: true });

    // 8. Génération d'un nom unique et sécurisé conservant l'original
    const sanitizedSlot =
      slot
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 24) || "media";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `${sanitizedSlot}-${timestamp}-${randomId}-original.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // 9. Écriture directe du buffer d'origine sans perte ni re-compression
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/brand/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      originalName,
      size: file.size,
      mimeType: file.type || `image/${ext}`,
      dimensions,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de média de marque:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement de l'image." },
      { status: 500 }
    );
  }
}
