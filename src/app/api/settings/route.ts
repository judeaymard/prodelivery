import { NextRequest, NextResponse } from "next/server";
import {
  getPlatformSettings,
  savePlatformSettings,
  getRolePermissions,
  saveRolePermissions,
  saveGlobalAuditLog,
} from "@/lib/server-db";
import { platformRoles, platformPermissions } from "@/lib/mock-data";

export async function GET() {
  try {
    const [settings, rolePermissions] = await Promise.all([
      getPlatformSettings(),
      getRolePermissions(),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      rolePermissions,
      roles: platformRoles,
      permissions: platformPermissions,
    });
  } catch (error) {
    console.error("Erreur API GET /api/settings:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer les paramètres" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }

    if (body.type === "ROLE_PERMISSIONS" && body.roleId && Array.isArray(body.permissions)) {
      const updatedMap = await saveRolePermissions(body.roleId, body.permissions);
      await saveGlobalAuditLog({
        id: `aud-perm-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isoDate: new Date().toISOString(),
        actor: { id: "USR-PDG-001", name: body.updatedBy || "Jude S. (PDG)", role: "Super Admin", type: "USER" },
        action: "PERMISSIONS_UPDATED",
        actionLabel: "Modification des habilitations",
        module: "PARAMETRES",
        entityType: "ROLE",
        entityId: body.roleId,
        entityReference: `ROLE-${body.roleId}`,
        severity: "WARNING",
        result: "SUCCESS",
        description: `Mise à jour des permissions pour le rôle ${body.roleId}.`,
      });
      return NextResponse.json({
        success: true,
        message: "Permissions mises à jour avec succès",
        rolePermissions: updatedMap,
      });
    }

    // Default: update entire settings or section
    const current = await getPlatformSettings();
    const updatedSettings = {
      ...current,
      ...body.settings,
      lastUpdated: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      updatedBy: body.updatedBy || "Jude S. (PDG)",
    };

    const saved = await savePlatformSettings(updatedSettings);

    await saveGlobalAuditLog({
      id: `aud-set-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isoDate: new Date().toISOString(),
      actor: { id: "USR-PDG-001", name: updatedSettings.updatedBy, role: "Super Admin", type: "USER" },
      action: "SETTINGS_UPDATED",
      actionLabel: "Modification des Paramètres Plateforme",
      module: "PARAMETRES",
      entityType: "SETTING",
      entityId: "SYSTEM_SETTINGS",
      entityReference: "GLOBAL_CONFIG",
      severity: "WARNING",
      result: "SUCCESS",
      description: `Mise à jour de la configuration centrale par ${updatedSettings.updatedBy}. Nouveaux paramètres actifs.`,
      beforeState: current as any,
      afterState: saved as any,
    });

    return NextResponse.json({
      success: true,
      message: "Paramètres enregistrés avec succès",
      settings: saved,
    });
  } catch (error) {
    console.error("Erreur API PUT /api/settings:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement des paramètres" },
      { status: 500 }
    );
  }
}
