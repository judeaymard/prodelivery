import { NextRequest, NextResponse } from "next/server";
import { createLocalBackupSnapshot, listLocalBackupSnapshots } from "@/lib/backup-service";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
  try {
    const snapshots = await listLocalBackupSnapshots();
    return NextResponse.json({
      success: true,
      snapshots,
      totalCount: snapshots.length,
    });
  } catch (error) {
    console.error("Erreur GET /api/backup:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer les sauvegardes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;
    const triggeredBy = session?.name || "ADMIN_MANUAL";

    const snapshot = await createLocalBackupSnapshot(triggeredBy);

    return NextResponse.json({
      success: true,
      message: "Snapshot de sauvegarde créé avec succès.",
      snapshot,
    });
  } catch (error) {
    console.error("Erreur POST /api/backup:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de la sauvegarde." },
      { status: 500 }
    );
  }
}
