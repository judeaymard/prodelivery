import { NextRequest, NextResponse } from "next/server";
import { saveOrder, saveNotification, saveGlobalAuditLog, getPartners } from "@/lib/server-db";
import { Order } from "@/lib/types";

// Shopify sends order data via webhook when a new order is created
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract order data from Shopify webhook payload
    const order = {
      externalId: body.id?.toString() || "",
      orderNumber: body.name || body.order_number?.toString() || "",
      platform: "Shopify",
      clientName: `${body.customer?.first_name || ""} ${body.customer?.last_name || ""}`.trim() || "Client Shopify",
      clientPhone: body.customer?.phone || body.shipping_address?.phone || body.billing_address?.phone || "",
      clientEmail: body.customer?.email || body.contact_email || "",
      address: [
        body.shipping_address?.address1,
        body.shipping_address?.address2,
        body.shipping_address?.city,
        body.shipping_address?.province,
      ]
        .filter(Boolean)
        .join(", ") || "Adresse non renseignée",
      city: body.shipping_address?.city || "",
      products: (body.line_items || [])
        .map((item: { name?: string; title?: string }) => item.name || item.title)
        .join(", "),
      quantity: (body.line_items || []).reduce(
        (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
        0
      ),
      totalPrice: parseFloat(body.total_price || "0"),
      currency: body.currency || "XOF",
      paymentMethod: body.gateway || "COD",
      status: "EN_ATTENTE",
      createdAt: body.created_at || new Date().toISOString(),
      rawPayload: body,
    };

    const partners = await getPartners();
    const matchedPartner = partners.find(
      (p) => p.companyName.toLowerCase().includes("shopify") || p.id === body.partnerId
    ) || partners[0];

    // 1. Enregistrement réel dans la base de données serveur
    const createdOrder: Order = {
      id: `cmd_shp_${Date.now()}`,
      orderNumber: order.orderNumber || `SHP-${Date.now().toString().slice(-4)}`,
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
      partnerName: matchedPartner?.companyName || "Shopify",
      source: "Shopify",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
      comment: "Commande synchronisée automatiquement depuis Shopify",
    };

    await saveOrder(createdOrder);

    // 2. Notification temps réel pour l'Admin / PDG et la Closeuse
    await saveNotification({
      id: `notif-shp-${Date.now()}`,
      category: "COMMANDES",
      priority: "URGENT",
      title: "🛍️ Nouvelle commande Shopify reçue",
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
      id: `aud-shp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isoDate: new Date().toISOString(),
      actor: { id: "SYSTEM-SHOPIFY", name: "Shopify Webhook", role: "Super Admin", type: "SYSTEM" },
      action: "ORDER_CREATED",
      actionLabel: "Import commande Shopify",
      module: "COMMANDES",
      entityType: "ORDER",
      entityId: createdOrder.id,
      entityReference: createdOrder.orderNumber,
      severity: "INFO",
      result: "SUCCESS",
      description: `Commande Shopify ${createdOrder.orderNumber} enregistrée avec succès.`,
    });

    // Return 200 OK (Shopify expects this to confirm receipt)
    return NextResponse.json(
      { received: true, success: true, orderNumber: createdOrder.orderNumber, orderId: createdOrder.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Shopify Webhook Error]", error);
    return NextResponse.json({ received: true, error: "Processing error" }, { status: 200 });
  }
}
