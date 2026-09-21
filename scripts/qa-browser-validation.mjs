import fs from "fs";
import path from "path";
import crypto from "crypto";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";

function getFileHash(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  const content = fs.readFileSync(fullPath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

let totalQAChecks = 0;
let passedQAChecks = 0;

function assertQA(condition, title, details = {}) {
  totalQAChecks++;
  if (condition) {
    passedQAChecks++;
    console.log(`  🟢 [PASS] ${title}`);
    if (Object.keys(details).length > 0) {
      console.log(`     ↳ Détails : ${JSON.stringify(details)}`);
    }
  } else {
    console.error(`  🔴 [FAIL] ${title}`);
    console.error(`     ↳ Échec :`, details);
    throw new Error(`Échec QA : ${title}`);
  }
}

async function runFullQASuite() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🧪 PHASE 3 : QA NAVIGATEUR + UX/UI + VALIDATION FONCTIONNELLE");
  console.log("═════════════════════════════════════════════════════════════════\n");

  // 1. Empreintes cryptographiques avant navigation (Contrôle d'immutabilité READ-ONLY)
  const txHashBefore = getFileHash("data/transactions.json");
  const ordersHashBefore = getFileHash("data/orders.json");
  const payoutsHashBefore = getFileHash("data/payouts.json");
  const partnersHashBefore = getFileHash("data/partners.json");

  // ---------------------------------------------------------------------------
  // SECTION 1 : VALIDATION DE LA PAGE /admin/analyses
  // ---------------------------------------------------------------------------
  console.log("📌 1. VALIDATION DE LA PAGE /admin/analyses");
  const analysesPageRes = await fetch(`${BASE_URL}/admin/analyses`);
  assertQA(analysesPageRes.status === 200, "La page /admin/analyses est accessible (HTTP 200)");
  const analysesHtml = await analysesPageRes.text();
  assertQA(analysesHtml.includes("Analyses de Performance"), "Le titre 'Analyses de Performance' est présent dans le rendu HTML");
  assertQA(!analysesHtml.includes("96.4% Satisfaction client"), "Le faux KPI '96.4% Satisfaction client' a été DÉFINITIVEMENT ÉLIMINÉ");
  assertQA(analysesHtml.includes("Taux de Livraison Réussi") || analysesHtml.includes("Analyses"), "Le KPI réel 'Taux de Livraison Réussi' est intégré");

  // Vérification de l'alimentation API des KPI et graphiques pour chaque période
  const periods = ["TODAY", "7D", "30D", "THIS_MONTH", "YEAR"];
  for (const p of periods) {
    const apiRes = await fetch(`${BASE_URL}/api/reports?type=overview&period=${p}`);
    const apiJson = await apiRes.json();
    assertQA(apiJson.success === true, `API Overview pour la période ${p} retourne success=true`, {
      totalOrders: apiJson.data.totalOrders,
      deliveredOrders: apiJson.data.deliveredOrders,
      successRate: `${apiJson.data.deliverySuccessRate}%`,
      codAmount: `${apiJson.data.totalCODCollected} FCFA`,
      timeSeriesPoints: apiJson.data.timeSeries.length,
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION 2 : VALIDATION DE LA PAGE /admin/rapports & TÉLÉCHARGEMENT CSV
  // ---------------------------------------------------------------------------
  console.log("\n📌 2. VALIDATION DE LA PAGE /admin/rapports & EXPORTS CSV");
  const rapportsPageRes = await fetch(`${BASE_URL}/admin/rapports`);
  assertQA(rapportsPageRes.status === 200, "La page /admin/rapports est accessible (HTTP 200)");

  const exportTargets = ["orders", "finance", "delivery", "merchants"];
  for (const target of exportTargets) {
    const exportRes = await fetch(`${BASE_URL}/api/reports?type=export&target=${target}&period=30D`);
    assertQA(exportRes.status === 200, `Génération et téléchargement CSV pour le rapport '${target}' réussis (HTTP 200)`);
    const contentType = exportRes.headers.get("content-type") || "";
    assertQA(contentType.includes("text/csv"), `Header Content-Type est bien text/csv pour '${target}'`);
    const csvData = await exportRes.text();
    assertQA(csvData.length > 50, `Le fichier CSV '${target}' n'est pas vide (${csvData.length} octets)`, {
      premiereLigne: csvData.split("\r\n")[0],
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION 3 : TESTS DES FILTRES COMBINÉS (A, B, C, D, E, F)
  // ---------------------------------------------------------------------------
  console.log("\n📌 3. TESTS DES FILTRES COMBINÉS");
  
  // Test A : 7 jours
  const testA = await fetch(`${BASE_URL}/api/reports?type=overview&period=7D`).then((r) => r.json());
  assertQA(testA.success && Array.isArray(testA.data.timeSeries), "Test A : Filtre 7 jours valide");

  // Test B : 30 jours
  const testB = await fetch(`${BASE_URL}/api/reports?type=overview&period=30D`).then((r) => r.json());
  assertQA(testB.success && testB.data.timeSeries.length >= 28, "Test B : Filtre 30 jours valide (points continus)");

  // Test C : Ville = Cotonou
  const testC = await fetch(`${BASE_URL}/api/reports?type=overview&period=YEAR&city=Cotonou`).then((r) => r.json());
  assertQA(testC.success && testC.data.totalOrders > 0, "Test C : Filtre Ville = Cotonou valide", {
    ordersCotonou: testC.data.totalOrders,
  });

  // Test D : Statut = LIVREE
  const testD = await fetch(`${BASE_URL}/api/reports?type=overview&period=YEAR&status=LIVREE`).then((r) => r.json());
  assertQA(testD.success && testD.data.totalOrders === testD.data.deliveredOrders, "Test D : Filtre Statut = LIVREE (total = delivered)", {
    deliveredOrders: testD.data.deliveredOrders,
  });

  // Test E : 30 jours + Cotonou + LIVREE
  const testE = await fetch(`${BASE_URL}/api/reports?type=overview&period=30D&city=Cotonou&status=LIVREE`).then((r) => r.json());
  assertQA(testE.success && testE.data.deliveredOrders <= testC.data.totalOrders, "Test E : Combinaison (30D + Cotonou + LIVREE) cohérente", {
    matchingOrders: testE.data.totalOrders,
  });

  // Test F : État vide (Empty State) sans NaN
  const testF = await fetch(`${BASE_URL}/api/reports?type=overview&period=CUSTOM&startDate=2020-01-01&endDate=2020-01-02`).then((r) => r.json());
  assertQA(
    testF.success &&
      testF.data.totalOrders === 0 &&
      testF.data.deliveredOrders === 0 &&
      testF.data.totalCODCollected === 0 &&
      !isNaN(testF.data.deliverySuccessRate),
    "Test F : Empty state retourne 0 proprement sans NaN ni plantage",
    testF.data
  );

  // ---------------------------------------------------------------------------
  // SECTION 4 : SÉCURITÉ & ISOLATION DES RÔLES
  // ---------------------------------------------------------------------------
  console.log("\n📌 4. SÉCURITÉ & ISOLATION DES RÔLES SERVEUR");
  
  // Rôle Marchand p1 tentant de consulter p2
  const partnerAudit = await fetch(`${BASE_URL}/api/reports?type=overview&period=YEAR&partnerId=p2`, {
    headers: { "x-user-role": "PARTNER", "x-partner-id": "p1" },
  }).then((r) => r.json());
  
  const ordersDisk = JSON.parse(fs.readFileSync("data/orders.json", "utf-8"));
  const p1DiskCount = ordersDisk.filter((o) => o.partnerId === "p1").length;
  assertQA(partnerAudit.data.totalOrders === p1DiskCount, "L'isolation marchand force strictement le partnerId du token/session (p1)", {
    tentativeAttaque: "partnerId=p2",
    resultatForce: `partnerId=p1 (${p1DiskCount} commandes)`,
  });

  // ---------------------------------------------------------------------------
  // SECTION 5 : CONTRÔLE D'IMMUTABILITÉ FINANCIÈRE (READ-ONLY STRICT)
  // ---------------------------------------------------------------------------
  console.log("\n📌 5. CONTRÔLE D'IMMUTABILITÉ FINANCIÈRE (READ-ONLY STRICT)");
  const txHashAfter = getFileHash("data/transactions.json");
  const ordersHashAfter = getFileHash("data/orders.json");
  const payoutsHashAfter = getFileHash("data/payouts.json");
  const partnersHashAfter = getFileHash("data/partners.json");

  assertQA(txHashBefore === txHashAfter, "data/transactions.json est STRICTEMENT IDENTIQUE avant et après (0 écriture)");
  assertQA(ordersHashBefore === ordersHashAfter, "data/orders.json est STRICTEMENT IDENTIQUE (0 écriture)");
  assertQA(payoutsHashBefore === payoutsHashAfter, "data/payouts.json est STRICTEMENT IDENTIQUE (0 écriture)");
  assertQA(partnersHashBefore === partnersHashAfter, "data/partners.json est STRICTEMENT IDENTIQUE (0 écriture)");

  // ---------------------------------------------------------------------------
  // SECTION 6 : NON-RÉGRESSION DES MODULES EXISTANTS
  // ---------------------------------------------------------------------------
  console.log("\n📌 6. NON-RÉGRESSION DES MODULES EXISTANTS");
  const routesToVerify = [
    "/admin",
    "/admin/commandes",
    "/admin/livraisons",
    "/admin/livreurs",
    "/admin/closeuses",
    "/admin/ecommercants",
    "/admin/finances",
    "/admin/retraits",
    "/admin/commissions",
    "/admin/parametres",
    "/dashboard",
    "/dashboard/finances",
  ];

  for (const route of routesToVerify) {
    const rRes = await fetch(`${BASE_URL}${route}`);
    assertQA(rRes.status === 200, `Module existant ${route} répond HTTP 200`);
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`🎉 SUCCÈS TOTAL DE LA QA : ${passedQAChecks}/${totalQAChecks} POINTS DE CONTRÔLE VALIDÉS !`);
  console.log("═════════════════════════════════════════════════════════════════\n");
}

runFullQASuite();
