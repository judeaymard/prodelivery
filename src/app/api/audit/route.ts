import { NextRequest, NextResponse } from "next/server";
import { getGlobalAuditLogs, saveGlobalAuditLog } from "@/lib/server-db";
import { GlobalAuditLog } from "@/lib/types";

/**
 * Endpoint API Central du Journal d'Audit Global
 * GuinéeGo LAT 2027
 */

export async function GET() {
  try {
    const logs = await getGlobalAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Erreur GET /api/audit:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des logs d'audit." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: GlobalAuditLog = await req.json();
    const log = await saveGlobalAuditLog(body);
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Erreur POST /api/audit:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement du log d'audit." },
      { status: 500 }
    );
  }
}
