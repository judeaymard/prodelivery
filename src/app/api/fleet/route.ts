import { NextRequest, NextResponse } from "next/server";
import {
  getDrivers,
  saveDriver,
  updateDriver,
  getClosers,
  saveCloser,
  updateCloser,
  getTreasuryManagers,
  saveTreasuryManager,
  updateTreasuryManager,
  deleteTreasuryManager,
  getCodRemittances,
  saveCodRemittance,
  updateCodRemittance,
  saveGlobalAuditLog,
  saveNotification,
} from "@/lib/server-db";

/**
 * Endpoint API Central de la Flotte & Équipes (Livreurs, Closeuses, Trésorerie & Remises COD)
 * GuinéeGo LAT 2027
 */

export async function GET() {
  try {
    const [drivers, closers, treasuryManagers, remittances] = await Promise.all([
      getDrivers(),
      getClosers(),
      getTreasuryManagers(),
      getCodRemittances(),
    ]);
    return NextResponse.json({
      success: true,
      drivers,
      closers,
      treasuryManagers,
      remittances,
    });
  } catch (error) {
    console.error("Erreur GET /api/fleet:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des équipes et remises." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === "DRIVER") {
      const newDriver = await saveDriver(data);
      await saveGlobalAuditLog({
        id: `aud-drv-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isoDate: new Date().toISOString(),
        actor: { id: "USR-PDG-001", name: "Super Admin GuinéeGo", role: "Super Admin", type: "USER" },
        action: "DRIVER_CREATED",
        actionLabel: "Ajout d'un nouveau coursier",
        module: "LIVREURS",
        entityType: "LIVREUR",
        entityId: newDriver.id,
        entityReference: newDriver.name,
        severity: "INFO",
        result: "SUCCESS",
        description: `Nouveau coursier ${newDriver.name} enregistré pour la zone ${newDriver.zone}.`,
      });
      return NextResponse.json({ success: true, driver: newDriver });
    }

    if (type === "CLOSER") {
      const newCloser = await saveCloser(data);
      await saveGlobalAuditLog({
        id: `aud-cls-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isoDate: new Date().toISOString(),
        actor: { id: "USR-PDG-001", name: "Super Admin GuinéeGo", role: "Super Admin", type: "USER" },
        action: "CLOSER_CREATED",
        actionLabel: "Ajout d'une nouvelle closeuse",
        module: "CLOSEUSES",
        entityType: "CLOSEUSE",
        entityId: newCloser.id,
        entityReference: newCloser.name,
        severity: "INFO",
        result: "SUCCESS",
        description: `Nouvelle closeuse ${newCloser.name} enregistrée avec succès.`,
      });
      return NextResponse.json({ success: true, closer: newCloser });
    }

    if (type === "TREASURY_MANAGER") {
      const newManager = await saveTreasuryManager(data);
      return NextResponse.json({ success: true, treasuryManager: newManager });
    }

    if (type === "REMITTANCE") {
      const newRemittance = await saveCodRemittance(data);
      const remittanceAmt = newRemittance.receivedAmount || newRemittance.amountDeclared || 0;
      await saveNotification({
        id: `notif-rem-${Date.now()}`,
        category: "FINANCES",
        priority: "INFO",
        title: "💵 Remise d'espèces enregistrée",
        description: `Remise de ${remittanceAmt.toLocaleString("fr-FR")} GNF reçue du coursier ${newRemittance.livreurName}.`,
        createdAt: "À l'instant",
        isoDate: new Date().toISOString(),
        isRead: false,
        actionUrl: "/admin/finance",
        referenceType: "TRANSACTION",
        referenceId: newRemittance.id,
      });
      return NextResponse.json({ success: true, remittance: newRemittance });
    }

    return NextResponse.json({ success: false, error: "Type d'entité non supporté." }, { status: 400 });
  } catch (error) {
    console.error("Erreur POST /api/fleet:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la création." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, updates } = body;

    if (type === "DRIVER") {
      const updated = await updateDriver(id, updates);
      return NextResponse.json({ success: true, driver: updated });
    }

    if (type === "CLOSER") {
      const updated = await updateCloser(id, updates);
      return NextResponse.json({ success: true, closer: updated });
    }

    if (type === "TREASURY_MANAGER") {
      const updated = await updateTreasuryManager(id, updates);
      return NextResponse.json({ success: true, treasuryManager: updated });
    }

    if (type === "REMITTANCE") {
      const updated = await updateCodRemittance(id, updates);
      return NextResponse.json({ success: true, remittance: updated });
    }

    return NextResponse.json({ success: false, error: "Type d'entité non supporté." }, { status: 400 });
  } catch (error) {
    console.error("Erreur PATCH /api/fleet:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la mise à jour." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (type === "TREASURY_MANAGER" && id) {
      const deleted = await deleteTreasuryManager(id);
      return NextResponse.json({ success: true, deleted });
    }

    return NextResponse.json({ success: false, error: "Action non supportée." }, { status: 400 });
  } catch (error) {
    console.error("Erreur DELETE /api/fleet:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la suppression." },
      { status: 500 }
    );
  }
}
