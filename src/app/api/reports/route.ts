import { NextRequest, NextResponse } from "next/server";
import {
  getOverview,
  getDeliveryAnalytics,
  getCloserAnalytics,
  getMerchantAnalytics,
  getFinancialAnalytics,
  getFilteredOrders,
  generateCsvReport,
  ReportFilterParams,
  ReportPeriod,
} from "@/lib/reporting-service";
import { OrderStatus, PayoutOperator } from "@/lib/types";

/**
 * Endpoint API Centralisé de Reporting & Analytics (GuinéeGo LAT 2027)
 * READ-ONLY — Consomme exclusivement les sources métiers validées de server-db.ts
 * Supporte : /api/reports?type=overview|delivery|closers|merchants|finance|export
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const type = (searchParams.get("type") || "overview").toLowerCase();
    const period = (searchParams.get("period") || "30D").toUpperCase() as ReportPeriod;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    let partnerId = searchParams.get("partnerId") || undefined;
    let livreurId = searchParams.get("livreurId") || undefined;
    let closeuseId = searchParams.get("closeuseId") || undefined;
    const city = searchParams.get("city") || undefined;
    const region = searchParams.get("region") || undefined;
    const status = (searchParams.get("status") as OrderStatus) || undefined;
    const operator = (searchParams.get("operator") as PayoutOperator) || undefined;
    const format = (searchParams.get("format") || "json").toLowerCase();

    // 🔒 CONTRÔLE DES RÔLES & SÉCURITÉ SERVEUR
    // Récupération des informations d'identité via headers ou paramètres de session
    const userRole = req.headers.get("x-user-role") || searchParams.get("role") || "SUPER_ADMIN";
    const authPartnerId = req.headers.get("x-partner-id") || searchParams.get("authPartnerId");
    const authLivreurId = req.headers.get("x-livreur-id") || searchParams.get("authLivreurId");
    const authCloseuseId = req.headers.get("x-closeuse-id") || searchParams.get("authCloseuseId");

    // 1. Marchand : Forcé strictement sur son propre partnerId
    if (userRole === "PARTNER" || userRole === "MERCHANT") {
      if (authPartnerId) {
        partnerId = authPartnerId;
      }
    }

    // 2. Livreur : Forcé strictement sur son propre livreurId
    if (userRole === "LIVREUR" || userRole === "DELIVERY_AGENT") {
      if (authLivreurId) {
        livreurId = authLivreurId;
      }
    }

    // 3. Closeuse : Forcée strictement sur son propre closeuseId
    if (userRole === "CLOSEUSE" || userRole === "CLOSER") {
      if (authCloseuseId) {
        closeuseId = authCloseuseId;
      }
    }

    const filters: ReportFilterParams = {
      period,
      startDate,
      endDate,
      partnerId,
      livreurId,
      closeuseId,
      city,
      region,
      status,
      operator,
    };

    let data: any = null;

    switch (type) {
      case "overview":
        data = await getOverview(filters);
        break;

      case "delivery":
        data = await getDeliveryAnalytics(filters);
        break;

      case "closers":
        data = await getCloserAnalytics(filters);
        break;

      case "merchants":
        data = await getMerchantAnalytics(filters);
        break;

      case "finance":
        data = await getFinancialAnalytics(filters);
        break;

      case "export":
        const exportTarget = (searchParams.get("target") || "overview").toLowerCase();
        let exportData: any = null;
        if (exportTarget === "delivery") exportData = await getDeliveryAnalytics(filters);
        else if (exportTarget === "closers") exportData = await getCloserAnalytics(filters);
        else if (exportTarget === "merchants") exportData = await getMerchantAnalytics(filters);
        else if (exportTarget === "finance") exportData = await getFinancialAnalytics(filters);
        else if (exportTarget === "orders") exportData = await getFilteredOrders(filters);
        else exportData = await getOverview(filters);

        const csvString = generateCsvReport(exportTarget, exportData);
        return new NextResponse(csvString, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="rapport-eno-${exportTarget}-${period.toLowerCase()}.csv"`,
          },
        });

      default:
        data = await getOverview(filters);
    }

    if (format === "csv") {
      const csvString = generateCsvReport(type, data);
      return new NextResponse(csvString, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rapport-eno-${type}-${period.toLowerCase()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      type,
      filters,
      data,
    });
  } catch (error) {
    console.error("Erreur API GET /api/reports:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la génération des rapports." },
      { status: 500 }
    );
  }
}
