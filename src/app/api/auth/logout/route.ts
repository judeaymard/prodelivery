import { NextRequest, NextResponse } from "next/server";
import { buildClearSessionCookie, verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-service";
import { saveGlobalAuditLog } from "@/lib/server-db";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

    if (session) {
      await saveGlobalAuditLog({
        id: `aud-logout-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isoDate: new Date().toISOString(),
        actor: {
          id: session.userId,
          name: session.name,
          role: session.role,
          type: "USER",
        },
        action: "LOGOUT",
        actionLabel: "Déconnexion utilisateur",
        module: "AUTH",
        entityType: "USER",
        entityId: session.userId,
        entityReference: session.email,
        severity: "INFO",
        result: "SUCCESS",
        description: `Déconnexion de l'utilisateur ${session.name}.`,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Déconnexion réussie.",
    });

    response.headers.set("Set-Cookie", buildClearSessionCookie());
    return response;
  } catch (error) {
    console.error("Erreur POST /api/auth/logout:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la déconnexion." },
      { status: 500 }
    );
  }
}
