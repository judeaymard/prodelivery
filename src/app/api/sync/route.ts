import { NextRequest, NextResponse } from "next/server";
import {
  getOrders,
  getPartners,
  getDrivers,
  getClosers,
  getTreasuryManagers,
  getPayoutRequests,
  getTransactions,
  getCodRemittances,
  getGlobalAuditLogs,
  saveOrder,
  savePartner,
  savePayoutRequest,
  saveTransaction,
  saveCodRemittance,
  saveGlobalAuditLog,
} from "@/lib/server-db";
import { verifySessionToken } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("eno_session")?.value;
    const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

    const [
      orders,
      partners,
      drivers,
      closers,
      treasuryManagers,
      payoutRequests,
      transactions,
      remittances,
      auditLogs,
    ] = await Promise.all([
      getOrders(),
      getPartners(),
      getDrivers(),
      getClosers(),
      getTreasuryManagers(),
      getPayoutRequests(),
      getTransactions(),
      getCodRemittances(),
      getGlobalAuditLogs(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        partners,
        drivers,
        closers,
        treasuryManagers,
        payoutRequests,
        transactions,
        remittances,
        auditLogs,
      },
      authenticated: !!session,
      user: session ? { id: session.userId, role: session.role } : null,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur API GET /api/sync:", error);
    return NextResponse.json(
      { success: false, error: "Erreur récupération des données serveur." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json(
        { success: false, error: "Action et payload requis pour la synchronisation." },
        { status: 400 }
      );
    }

    switch (action) {
      case "SAVE_ORDER":
        await saveOrder(payload);
        break;
      case "SAVE_PARTNER":
        await savePartner(payload);
        break;
      case "SAVE_PAYOUT":
        await savePayoutRequest(payload);
        break;
      case "SAVE_TRANSACTION":
        await saveTransaction(payload);
        break;
      case "SAVE_REMITTANCE":
        await saveCodRemittance(payload);
        break;
      case "SAVE_AUDIT":
        await saveGlobalAuditLog(payload);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Action de synchronisation non reconnue: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} synchronisée avec succès sur la base serveur.`,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur API POST /api/sync:", error);
    return NextResponse.json(
      { success: false, error: "Erreur écriture des données serveur." },
      { status: 500 }
    );
  }
}
