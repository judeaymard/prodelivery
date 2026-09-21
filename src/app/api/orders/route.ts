import { NextRequest, NextResponse } from "next/server";
import {
  getOrders,
  saveOrder,
  updateOrder,
  getPlatformSettings,
  getPartners,
  updatePartner,
  getTransactions,
  saveTransaction,
  saveNotification,
  saveGlobalAuditLog,
} from "@/lib/server-db";
import {
  calculateDeliveryFee,
  calculateClosingFee,
  calculateCommission,
  calculateOrderTotal,
} from "@/lib/pricing-service";
import { Order, OrderStatus, FinancialTransaction } from "@/lib/types";

/**
 * Endpoint API Central des Commandes & Livraisons
 * GuinéeGo LAT 2027
 * Source de Vérité Unique pour les Commandes, Livraisons, Commissions et Encaissements
 */

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Erreur GET /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des commandes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName,
      clientPhone,
      region = "Littoral",
      city = "Conakry",
      address = "Adresse client",
      products = "Produit standard",
      quantity = 1,
      totalPrice = 15000,
      partnerId = "p1",
      partnerName = "Boutique Partenaire",
      assignedCloseuseId,
      assignedCloseuseName,
      assignedLivreurId,
      assignedLivreurName,
      deliveryFee: overrideDeliveryFee,
      serviceFee: overrideClosingFee,
      comment,
    } = body;

    const [settings, partnersList, existingOrders] = await Promise.all([
      getPlatformSettings(),
      getPartners(),
      getOrders(),
    ]);

    const partner = partnersList.find((p) => p.id === partnerId);
    const count = existingOrders.length + 1;
    const orderNumber = `CMD-BJ${String(count).padStart(4, "0")}`;

    // Tarification dynamique depuis la Source de Vérité Centrale
    const deliveryFee = calculateDeliveryFee(
      settings,
      { deliveryFee: overrideDeliveryFee },
      partner
    );
    const serviceFee = calculateClosingFee(
      settings,
      { closingFee: overrideClosingFee },
      partner
    );

    const newOrder: Order = {
      id: body.id || `cmd_${Date.now()}`,
      orderNumber: body.orderNumber || orderNumber,
      clientName,
      clientPhone,
      region,
      city,
      address,
      products,
      quantity,
      totalPrice: calculateOrderTotal(Number(totalPrice), deliveryFee, serviceFee),
      deliveryFee,
      serviceFee,
      status: "EN_ATTENTE",
      partnerId,
      partnerName: partnerName || partner?.companyName || "Marchand",
      assignedCloseuseId,
      assignedCloseuseName,
      assignedLivreurId,
      assignedLivreurName,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
      comment: comment || "Commande créée via la plateforme",
    };

    await saveOrder(newOrder);

    // Notification si activée
    if (settings.notifications?.orders?.newOrder) {
      await saveNotification({
        id: `notif-cmd-${Date.now()}`,
        category: "COMMANDES",
        priority: "INFO",
        title: "📦 Nouvelle commande enregistrée",
        description: `Commande ${newOrder.orderNumber} créée pour ${clientName} (${city}). Montant: ${newOrder.totalPrice.toLocaleString("fr-FR")} GNF.`,
        createdAt: "À l'instant",
        isoDate: new Date().toISOString(),
        isRead: false,
        actionUrl: "/admin/commandes",
        referenceType: "ORDER",
        referenceId: newOrder.id,
      });
    }

    // Traçabilité Audit
    await saveGlobalAuditLog({
      id: `aud-cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isoDate: new Date().toISOString(),
      actor: {
        id: partnerId,
        name: partnerName,
        role: "Marchand",
        type: "USER",
      },
      action: "ORDER_CREATED",
      actionLabel: "Création de commande",
      module: "COMMANDES",
      entityType: "ORDER",
      entityId: newOrder.id,
      entityReference: newOrder.orderNumber,
      severity: "INFO",
      result: "SUCCESS",
      description: `Commande ${newOrder.orderNumber} créée pour ${clientName}. Montant: ${newOrder.totalPrice} GNF (Livraison: ${deliveryFee}, Closing: ${serviceFee}).`,
      afterState: newOrder as any,
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    console.error("Erreur POST /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la création de la commande." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const effectiveOrderId = body.orderId || body.id;
    const updatesObj = body.updates || body;
    const status = updatesObj.status || body.status;
    const assignedLivreurId = updatesObj.assignedLivreurId ?? body.assignedLivreurId;
    const assignedLivreurName = updatesObj.assignedLivreurName ?? body.assignedLivreurName;
    const assignedCloseuseId = updatesObj.assignedCloseuseId ?? body.assignedCloseuseId;
    const assignedCloseuseName = updatesObj.assignedCloseuseName ?? body.assignedCloseuseName;
    const deliveryTimeSlot = updatesObj.deliveryTimeSlot ?? body.deliveryTimeSlot;
    const closingNotes = updatesObj.closingNotes ?? body.closingNotes;
    const comment = updatesObj.comment ?? body.comment;

    const [orders, settings, partnersList] = await Promise.all([
      getOrders(),
      getPlatformSettings(),
      getPartners(),
    ]);

    const existingOrder = orders.find((o) => o.id === effectiveOrderId);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Commande introuvable." },
        { status: 404 }
      );
    }

    const updates: Partial<Order> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updates.status = status as OrderStatus;
    if (assignedLivreurId !== undefined) updates.assignedLivreurId = assignedLivreurId;
    if (assignedLivreurName !== undefined) updates.assignedLivreurName = assignedLivreurName;
    if (assignedCloseuseId !== undefined) updates.assignedCloseuseId = assignedCloseuseId;
    if (assignedCloseuseName !== undefined) updates.assignedCloseuseName = assignedCloseuseName;
    if (deliveryTimeSlot !== undefined) updates.deliveryTimeSlot = deliveryTimeSlot;
    if (closingNotes !== undefined) updates.closingNotes = closingNotes;
    if (comment !== undefined) updates.comment = comment;
    if (updatesObj.scheduledCallback !== undefined || body.scheduledCallback !== undefined) updates.scheduledCallback = updatesObj.scheduledCallback ?? body.scheduledCallback;
    if (updatesObj.lastCallResult !== undefined || body.lastCallResult !== undefined) updates.lastCallResult = updatesObj.lastCallResult ?? body.lastCallResult;
    if (updatesObj.lastCallAt !== undefined || body.lastCallAt !== undefined) updates.lastCallAt = updatesObj.lastCallAt ?? body.lastCallAt;
    if (updatesObj.callCount !== undefined || body.callCount !== undefined) updates.callCount = updatesObj.callCount ?? body.callCount;
    if (updatesObj.priority !== undefined || body.priority !== undefined) updates.priority = updatesObj.priority ?? body.priority;
    if (updatesObj.source !== undefined || body.source !== undefined) updates.source = updatesObj.source ?? body.source;

    // Si la commande passe à LIVREE
    if (status === "LIVREE" && existingOrder.status !== "LIVREE") {
      updates.deliveredAt = new Date().toISOString();
      updates.codCollected = true;

      // Calcul de commission agence et crédit marchand
      const commission = calculateCommission(settings, existingOrder.totalPrice);
      const netCredit = Math.max(
        0,
        existingOrder.totalPrice -
          (existingOrder.deliveryFee || 2000) -
          (existingOrder.serviceFee || 800) -
          commission
      );

      // Créditer le solde du marchand
      if (existingOrder.partnerId) {
        const partner = partnersList.find((p) => p.id === existingOrder.partnerId);
        if (partner) {
          const newBalance = (partner.availableBalance || 0) + netCredit;
          await updatePartner(partner.id, { availableBalance: newBalance });
        }
      }

      // Enregistrer la transaction financière
      const existingTxs = await getTransactions();
      const lastBalance = existingTxs.length > 0 ? (existingTxs[0].balanceAfter || 0) : 0;
      const tx: FinancialTransaction = {
        id: `tx-del-${Date.now()}`,
        txReference: `TX-CMD-${existingOrder.orderNumber || Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
        type: "LIVRAISON_ENCAISSEE",
        label: `Encaissement ${existingOrder.orderNumber} - ${existingOrder.clientName}`,
        partnerId: existingOrder.partnerId,
        partnerName: existingOrder.partnerName,
        inflow: existingOrder.totalPrice,
        outflow: (existingOrder.deliveryFee || 2000) + (existingOrder.serviceFee || 800) + commission,
        balanceAfter: lastBalance + existingOrder.totalPrice,
        status: "COMPLETED",
        notes: `Commande livrée. Commission GuinéeGo: ${commission} GNF (${settings.financial?.defaultCommissionRate ?? 5}%). Crédit net marchand: ${netCredit} GNF.`,
      };
      await saveTransaction(tx);

      // Notification
      if (settings.notifications?.orders?.orderDelivered) {
        await saveNotification({
          id: `notif-del-${Date.now()}`,
          category: "COMMANDES",
          priority: "INFO",
          title: "📦 Commande livrée & fonds encaissés",
          description: `${existingOrder.orderNumber} livrée avec succès à ${existingOrder.clientName}. Net crédité: ${netCredit.toLocaleString("fr-FR")} GNF.`,
          createdAt: "À l'instant",
          isoDate: new Date().toISOString(),
          isRead: false,
          actionUrl: "/admin/commandes",
          referenceType: "ORDER",
          referenceId: existingOrder.id,
        });
      }
    }

    const updatedOrder = await updateOrder(effectiveOrderId, updates);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Erreur PATCH /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la mise à jour de la commande." },
      { status: 500 }
    );
  }
}
