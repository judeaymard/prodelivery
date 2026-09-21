import { NextRequest, NextResponse } from "next/server";
import {
  getPlatformUsers,
  savePlatformUser,
  updatePlatformUser,
} from "@/lib/server-db";
import { PlatformUser } from "@/lib/types";

export async function GET() {
  try {
    const users = await getPlatformUsers();
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Erreur API GET /api/users:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les utilisateurs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.email || !body.firstName || !body.lastName || !body.role) {
      return NextResponse.json(
        { success: false, error: "Données utilisateur incomplètes (Prénom, Nom, Email, Rôle requis)" },
        { status: 400 }
      );
    }

    const newUser: PlatformUser = {
      id: body.id || `usr-${Date.now()}`,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      name: `${body.firstName.trim()} ${body.lastName.trim()}`,
      email: body.email.trim().toLowerCase(),
      phone: body.phone ? body.phone.trim() : "",
      role: body.role,
      roleLabel: body.roleLabel || body.role,
      status: body.status || "active",
      zone: body.zone || "Conakry",
      createdAt: new Date().toISOString().slice(0, 10),
      lastActiveAt: "Nouveau compte",
      is2FAEnabled: body.is2FAEnabled ?? false,
      notes: body.notes || "",
    };

    const saved = await savePlatformUser(newUser);

    return NextResponse.json(
      {
        success: true,
        message: "Utilisateur créé avec succès",
        user: saved,
        notice: "BACKEND REQUIRED: L'envoi automatique d'email d'invitation et le hash de mot de passe sécurisé nécessitent un serveur de production SMTP/Auth.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur API POST /api/users:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: "Identifiant utilisateur requis" },
        { status: 400 }
      );
    }

    const updated = await updatePlatformUser(body.id, body.updates || {});
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      user: updated,
    });
  } catch (error) {
    console.error("Erreur API PATCH /api/users:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}
