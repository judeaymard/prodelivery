import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";

function readJsonFile(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}

let totalTests = 0;
let passedTests = 0;

function assertProof(condition, description, proofData = {}) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  🟢 [PASS] ${description}`);
    if (Object.keys(proofData).length > 0) {
      console.log(`     ↳ Preuve : ${JSON.stringify(proofData)}`);
    }
  } else {
    console.error(`  🔴 [FAIL] ${description}`);
    console.error(`     ↳ Données de l'échec :`, proofData);
    throw new Error(`Échec du test : ${description}`);
  }
}

async function runReportingTestSuite() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("📊 SUITE DE TESTS COMPLÈTE : RAPPORTS & ANALYTICS (PHASE 2)");
  console.log("═════════════════════════════════════════════════════════════════\n");

  const ordersDisk = readJsonFile("data/orders.json");
  const transactionsDisk = readJsonFile("data/transactions.json");
  const payoutsDisk = readJsonFile("data/payouts.json");
  const partnersDisk = readJsonFile("data/partners.json");
  const driversDisk = readJsonFile("data/drivers.json");
  const closersDisk = readJsonFile("data/closers.json");

  try {
    // -------------------------------------------------------------------------
    // TEST 1 : GET /api/reports?type=overview
    // -------------------------------------------------------------------------
    console.log("📌 TEST 1 : Overview Global & Cohérence des Commandes");
    const overviewRes = await fetch(`${BASE_URL}/api/reports?type=overview&period=YEAR`);
    const overviewJson = await overviewRes.json();
    assertProof(overviewJson.success === true, "GET /api/reports?type=overview retourne un statut de succès");
    assertProof(overviewJson.data.totalOrders >= ordersDisk.length, "Total commandes correspond au disque", {
      apiTotal: overviewJson.data.totalOrders,
      diskTotal: ordersDisk.length,
    });
    assertProof(overviewJson.data.deliveredOrders > 0, "Commandes livrées calculées avec succès", {
      deliveredOrders: overviewJson.data.deliveredOrders,
      deliverySuccessRate: `${overviewJson.data.deliverySuccessRate}%`,
    });
    assertProof(Array.isArray(overviewJson.data.timeSeries) && overviewJson.data.timeSeries.length > 0, "Série temporelle générée dynamiquement", {
      pointsCount: overviewJson.data.timeSeries.length,
    });

    // -------------------------------------------------------------------------
    // TEST 2 : GET /api/reports?type=delivery (Delivery Analytics)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 2 : Delivery Analytics & Performance Flotte");
    const deliveryRes = await fetch(`${BASE_URL}/api/reports?type=delivery&period=YEAR`);
    const deliveryJson = await deliveryRes.json();
    assertProof(deliveryJson.success === true, "GET /api/reports?type=delivery retourne un succès");
    assertProof(Array.isArray(deliveryJson.data.driverPerformances), "Performances livreurs calculées", {
      driversCount: deliveryJson.data.driverPerformances.length,
    });
    assertProof(Array.isArray(deliveryJson.data.zoneBreakdown), "Répartition par zone calculée", {
      zonesCount: deliveryJson.data.zoneBreakdown.length,
    });

    // -------------------------------------------------------------------------
    // TEST 3 : GET /api/reports?type=closers (Closer Analytics)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 3 : Closer Analytics & Pôle Télévente");
    const closersRes = await fetch(`${BASE_URL}/api/reports?type=closers&period=YEAR`);
    const closersJson = await closersRes.json();
    assertProof(closersJson.success === true, "GET /api/reports?type=closers retourne un succès");
    assertProof(Array.isArray(closersJson.data.closerPerformances), "Performances closeuses calculées", {
      closersCount: closersJson.data.closerPerformances.length,
    });

    // -------------------------------------------------------------------------
    // TEST 4 : GET /api/reports?type=merchants (Merchant Analytics)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 4 : Merchant Analytics & E-commerçants");
    const merchantsRes = await fetch(`${BASE_URL}/api/reports?type=merchants&period=YEAR`);
    const merchantsJson = await merchantsRes.json();
    assertProof(merchantsJson.success === true, "GET /api/reports?type=merchants retourne un succès");
    assertProof(merchantsJson.data.totalMerchants === partnersDisk.length, "Nombre total de marchands exact", {
      apiMerchants: merchantsJson.data.totalMerchants,
      diskMerchants: partnersDisk.length,
    });
    assertProof(merchantsJson.data.totalGMV >= 0, "GMV total agrégé", {
      totalGMV: merchantsJson.data.totalGMV,
      totalCommissions: merchantsJson.data.totalCommissions,
      netRevenue: merchantsJson.data.totalNetRevenue,
    });

    // -------------------------------------------------------------------------
    // TEST 5 : GET /api/reports?type=finance (Financial Analytics & Grand Livre)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 5 : Financial Analytics & Grand Livre");
    const financeRes = await fetch(`${BASE_URL}/api/reports?type=finance&period=YEAR`);
    const financeJson = await financeRes.json();
    assertProof(financeJson.success === true, "GET /api/reports?type=finance retourne un succès");
    assertProof(financeJson.data.transactionsCount >= transactionsDisk.length, "Nombre de transactions concorde avec le disque", {
      apiTxCount: financeJson.data.transactionsCount,
      diskTxCount: transactionsDisk.length,
    });
    assertProof(Array.isArray(financeJson.data.operatorBreakdown), "Répartition des retraits par opérateur calculée", {
      operators: financeJson.data.operatorBreakdown,
    });

    // -------------------------------------------------------------------------
    // TEST 6 : Filtrage Temporel Combinable (TODAY, 7D, 30D, THIS_MONTH, CUSTOM)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 6 : Filtrage Temporel (TODAY, 7D, 30D, THIS_MONTH, CUSTOM)");
    const [tToday, t7D, t30D, tMonth, tCustom] = await Promise.all([
      fetch(`${BASE_URL}/api/reports?type=overview&period=TODAY`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/reports?type=overview&period=7D`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/reports?type=overview&period=30D`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/reports?type=overview&period=THIS_MONTH`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/reports?type=overview&period=CUSTOM&startDate=2026-09-01&endDate=2026-09-04`).then((r) => r.json()),
    ]);
    assertProof(tToday.success && t7D.success && t30D.success && tMonth.success && tCustom.success, "Tous les modes de période répondent avec succès");
    assertProof(tCustom.data.timeSeries.length === 4, "CUSTOM génère exactement le nombre de jours demandé (4 jours)", {
      points: tCustom.data.timeSeries.map((p) => p.date),
    });

    // -------------------------------------------------------------------------
    // TEST 7 : Filtrage par Marchand (partnerId)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 7 : Filtrage par Marchand Spécifique");
    const partnerP1Res = await fetch(`${BASE_URL}/api/reports?type=overview&period=YEAR&partnerId=p1`);
    const partnerP1Json = await partnerP1Res.json();
    const p1OrdersDisk = ordersDisk.filter((o) => o.partnerId === "p1");
    assertProof(partnerP1Json.data.totalOrders === p1OrdersDisk.length, "Filtrage strict sur partnerId=p1", {
      p1ApiOrders: partnerP1Json.data.totalOrders,
      p1DiskOrders: p1OrdersDisk.length,
    });

    // -------------------------------------------------------------------------
    // TEST 8 : Filtrage par Livreur & Zone Géographique
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 8 : Filtrage par Livreur & Zone Géographique");
    const cityRes = await fetch(`${BASE_URL}/api/reports?type=overview&period=YEAR&city=Cotonou`);
    const cityJson = await cityRes.json();
    const cotonouOrdersDisk = ordersDisk.filter((o) => o.city?.toLowerCase() === "cotonou");
    assertProof(cityJson.data.totalOrders === cotonouOrdersDisk.length, "Filtrage géographique sur city=Cotonou", {
      apiOrders: cityJson.data.totalOrders,
      diskOrders: cotonouOrdersDisk.length,
    });

    // -------------------------------------------------------------------------
    // TEST 9 : Sécurité & Contrôle des Rôles Serveur (Isolation Marchand)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 9 : Sécurité & Isolation Marchand Côté Serveur");
    // Un utilisateur avec rôle PARTNER et authPartnerId=p2 qui tente d'accéder à partnerId=p1
    const securePartnerRes = await fetch(`${BASE_URL}/api/reports?type=overview&period=YEAR&partnerId=p1`, {
      headers: {
        "x-user-role": "PARTNER",
        "x-partner-id": "p2",
      },
    });
    const securePartnerJson = await securePartnerRes.json();
    const p2OrdersDisk = ordersDisk.filter((o) => o.partnerId === "p2");
    assertProof(securePartnerJson.data.totalOrders === p2OrdersDisk.length, "Le serveur a forcé l'isolation et retourné les données de p2 au lieu de p1", {
      demandeUrl: "partnerId=p1",
      roleHeader: "PARTNER / x-partner-id=p2",
      resultatRetourneOrdersCount: securePartnerJson.data.totalOrders,
    });

    // -------------------------------------------------------------------------
    // TEST 10 : Export CSV Réel
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 10 : Export CSV Réel");
    const exportCsvRes = await fetch(`${BASE_URL}/api/reports?type=export&target=merchants&period=YEAR`);
    const csvContent = await exportCsvRes.text();
    assertProof(exportCsvRes.status === 200 && csvContent.includes("Partenaire_ID;Boutique;Contact"), "Génération du rapport CSV d'exportation réussie", {
      contentLength: csvContent.length,
      sampleLine: csvContent.split("\r\n")[0],
    });

    // -------------------------------------------------------------------------
    // TEST 11 : État Vide Propre (Filtre Inexistant)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 11 : Gestion Propre de l'État Vide");
    const emptyRes = await fetch(`${BASE_URL}/api/reports?type=overview&period=YEAR&partnerId=p-non-existent`);
    const emptyJson = await emptyRes.json();
    assertProof(
      emptyJson.data.totalOrders === 0 && emptyJson.data.totalCODCollected === 0 && emptyJson.data.deliverySuccessRate === 0,
      "Filtre sans données retourne 0 sans crash ni fallback fictif",
      emptyJson.data
    );

    // -------------------------------------------------------------------------
    // TEST 12 : Réconciliation Comptable Grand Livre (Anti-Divergence)
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST 12 : Réconciliation Comptable (Anti-Divergence)");
    const totalDeliveredCODDisk = ordersDisk
      .filter((o) => o.status === "LIVREE")
      .reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    assertProof(overviewJson.data.totalCODCollected === totalDeliveredCODDisk, "Total COD collecté dans Overview = Total des commandes livrées sur disque", {
      overviewCOD: overviewJson.data.totalCODCollected,
      diskOrdersCOD: totalDeliveredCODDisk,
    });

    console.log("\n═════════════════════════════════════════════════════════════════");
    console.log(`🎉 SUCCÈS TOTAL : ${passedTests}/${totalTests} TESTS DE REPORTING & ANALYTICS VALIDÉS !`);
    console.log("═════════════════════════════════════════════════════════════════\n");
  } catch (err) {
    console.error("\n❌ ÉCHEC DE LA SUITE DE TESTS :", err);
    process.exit(1);
  }
}

runReportingTestSuite();
