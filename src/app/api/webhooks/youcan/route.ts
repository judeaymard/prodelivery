import { NextRequest, NextResponse } from "next/server";
import { saveOrder, saveNotification, saveGlobalAuditLog, getPartners } from "@/lib/server-db";
import { Order } from "@/lib/types";

// YouCan sends order data via webhook when a new order is created
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract order data from YouCan webhook payload
    const orderData = body.payload || body.data || body;

    const order = {
      externalId: orderData.id?.toString() || orderData.ref || "",
      orderNumber: orderData.ref || orderData.id?.toString() || "",
      platform: "YouCan",
      clientName: [orderData.first_name, orderData.last_name]
        .filter(Boolean)
        .join(" ") || orderData.customer_name || "Client YouCan",
      clientPhone: orderData.phone || orderData.customer_phone || "",
      clientEmail: orderData.email || orderData.customer_email || "",
      address: [
        orderData.address,
        orderData.city,
        orderData.state,
      ]
        .filter(Boolean)
        .join(", ") || "",
      city: orderData.city || "",
      products: Array.isArray(orderData.variants || orderData.products || orderData.items)
        ? (orderData.variants || orderData.products || orderData.items)
            .map((item: { product_name?: string; name?: string; title?: string }) =>
              item.product_name || item.name || item.title
            )
            .join(", ")
        : "",
      quantity: Array.isArray(orderData.variants || orderData.products || orderData.items)
        ? (orderData.variants || orderData.products || orderData.items).reduce(
            (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
            0
          )
        : 1,
      totalPrice: parseFloat(orderData.total_price || orderData.price || "0") || 0,
      currency: orderData.currency || "XOF",
      paymentMethod: orderData.payment_method || "COD",
      status: "EN_ATTENTE",
      createdAt: orderData.created_at || new Date().toISOString(),
      rawPayload: body,
    };

    const partners = await getPartners();
    const matchedPartner = partners.find(
      (p) => p.companyName.toLowerCase().includes("youcan") || p.id === body.partnerId
    ) || partners[0];

    // 1. Enregistrement réel dans la base de données
    const createdOrder: Order = {
      id: `cmd_yc_${Date.now()}`,
      orderNumber: order.orderNumber || `YC-${Date.now().toString().slice(-4)}`,
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      region: "Littoral",
      city: order.city || "Conakry",
      address: order.address,
      products: order.products || "",
      quantity: order.quantity || 1,
      totalPrice: order.totalPrice || 0,
      deliveryFee: matchedPartner?.deliveryFeeDefault || 0,
      serviceFee: matchedPartner?.agencyCommissionDefault || 0,
      status: "EN_ATTENTE",
      partnerId: matchedPartner?.id || "",
      partnerName: matchedPartner?.companyName || "YouCan",
      source: "YouCan",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
      comment: "Commande synchronisée automatiquement depuis YouCan",
    };

    await saveOrder(createdOrder);

    // 2. Notification temps réel pour l'Admin / PDG et la Closeuse
    await saveNotification({
      id: `notif-yc-${Date.now()}`,
      category: "COMMANDES",
      priority: "URGENT",
      title: "📦 Nouvelle commande YouCan reçue",
      description: `Commande ${createdOrder.orderNumber} pour ${createdOrder.clientName} (${createdOrder.clientPhone}) à ${createdOrder.city}. Montant: ${createdOrder.totalPrice.toLocaleString("fr-FR")} GNF.`,
      createdAt: "À l'instant",
      isoDate: new Date().toISOString(),
      isRead: false,
      actionUrl: "/admin/commandes",
      referenceType: "ORDER",
      referenceId: createdOrder.id,
    });

    // 3. Journal d'audit global
    await saveGlobalAuditLog({
      id: `aud-yc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isoDate: new Date().toISOString(),
      actor: { id: "SYSTEM-YOUCAN", name: "YouCan Webhook", role: "Super Admin", type: "SYSTEM" },
      action: "ORDER_CREATED",
      actionLabel: "Import commande YouCan",
      module: "COMMANDES",
      entityType: "ORDER",
      entityId: createdOrder.id,
      entityReference: createdOrder.orderNumber,
      severity: "INFO",
      result: "SUCCESS",
      description: `Commande YouCan ${createdOrder.orderNumber} enregistrée avec succès.`,
    });

    return NextResponse.json(
      { received: true, success: true, orderNumber: createdOrder.orderNumber, orderId: createdOrder.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("[YouCan Webhook Error]", error);
    return NextResponse.json({ received: true, error: "Processing error" }, { status: 200 });
  }
}
