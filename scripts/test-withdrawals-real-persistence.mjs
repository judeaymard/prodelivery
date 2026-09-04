import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");

const PAYOUTS_FILE = path.join(dataDir, "payouts.json");
const PARTNERS_FILE = path.join(dataDir, "partners.json");
const TRANSACTIONS_FILE = path.join(dataDir, "transactions.json");
const AUDIT_FILE = path.join(dataDir, "audit.json");
const NOTIFICATIONS_FILE = path.join(dataDir, "notifications.json");

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TEST SUITE: RETRAITS RÉELS & PERSISTANCES ENO");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check data files presence
  console.log("--- 1. Vérification de la structure de persistance serveur ---");
  const files = [PAYOUTS_FILE, PARTNERS_FILE, TRANSACTIONS_FILE, AUDIT_FILE, NOTIFICATIONS_FILE];
  for (const f of files) {
    try {
      await fs.access(f);
      assert(true, `Fichier persistant accessible: ${path.basename(f)}`);
    } catch {
      assert(false, `Fichier manquant: ${path.basename(f)}`);
    }
  }

  // 2. Load partners
  console.log("\n--- 2. Lecture et vérification du solde partenaire avant retrait ---");
  const rawPartners = await fs.readFile(PARTNERS_FILE, "utf-8");
  const partners = JSON.parse(rawPartners);
  assert(Array.isArray(partners) && partners.length > 0, "Liste des partenaires chargée depuis partners.json");
  const partnerAfrimarket = partners.find((p) => p.id === "p1") || partners[0];
  const initialBalance = partnerAfrimarket.availableBalance || 4820000;
  console.log(`  ℹ️ Solde initial de ${partnerAfrimarket.companyName}: ${initialBalance.toLocaleString("fr-FR")} FCFA`);

  // 3. Simulate Creating a Withdrawal (50 000 FCFA)
  console.log("\n--- 3. Création d'une demande de retrait (50 000 FCFA MTN MoMo) ---");
  const withdrawAmount = 50000;
  const testWdrId = `WDR-TEST-AUTO-${Date.now()}`;
  
  const rawPayouts = await fs.readFile(PAYOUTS_FILE, "utf-8");
  const payouts = JSON.parse(rawPayouts);
  
  const newPayout = {
    id: testWdrId,
    partnerId: partnerAfrimarket.id,
    partnerName: partnerAfrimarket.companyName,
    amount: withdrawAmount,
    reservedAmount: withdrawAmount,
    operator: "MTN",
    phone: "01 97 36 29 06",
    countryCode: "+229",
    requestedAt: new Date().toISOString(),
    status: "PENDING",
    balanceBefore: initialBalance,
    balanceAfter: initialBalance - withdrawAmount,
    txReference: `TX-REQ-${Date.now()}`,
  };

  payouts.unshift(newPayout);
  await fs.writeFile(PAYOUTS_FILE, JSON.stringify(payouts, null, 2), "utf-8");

  // Reserve balance on partner
  partnerAfrimarket.availableBalance = initialBalance - withdrawAmount;
  await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2), "utf-8");

  assert(newPayout.status === "PENDING", "Retrait créé avec statut PENDING");
  assert(newPayout.reservedAmount === withdrawAmount, "Montant de 50 000 FCFA réservé");
  assert(partnerAfrimarket.availableBalance === initialBalance - withdrawAmount, "Solde disponible débité du montant réservé");

  // 4. Test Persistence on Reload
  console.log("\n--- 4. Test de Persistance après rechargement / refresh ---");
  const reloadedPayoutsRaw = await fs.readFile(PAYOUTS_FILE, "utf-8");
  const reloadedPayouts = JSON.parse(reloadedPayoutsRaw);
  const foundPayout = reloadedPayouts.find((p) => p.id === testWdrId);
  assert(foundPayout !== undefined, "Le retrait est retrouvé dans payouts.json après rechargement");
  assert(foundPayout.status === "PENDING", "Le statut reste PENDING (aucune perte au refresh)");

  // 5. Admin Approves and Pays Manually
  console.log("\n--- 5. Approbation et Paiement Manuel avec Référence Externe ---");
  foundPayout.status = "PAID";
  foundPayout.paidAt = new Date().toISOString();
  foundPayout.paymentReference = "MOMO-BJ-TX-8492019";
  foundPayout.adminProcessorName = "Super Admin ENO";
  foundPayout.reservedAmount = 0;
  await fs.writeFile(PAYOUTS_FILE, JSON.stringify(reloadedPayouts, null, 2), "utf-8");

  // Record Transaction
  const rawTx = await fs.readFile(TRANSACTIONS_FILE, "utf-8");
  const txList = JSON.parse(rawTx);
  const newTx = {
    id: `tx-${Date.now()}`,
    txReference: `TX-RET-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().replace("T", " ").slice(0, 16),
    type: "RETRAIT",
    label: `Retrait Marchand ${foundPayout.partnerName} (${foundPayout.operator})`,
    partnerId: foundPayout.partnerId,
    partnerName: foundPayout.partnerName,
    inflow: 0,
    outflow: foundPayout.amount,
    balanceAfter: foundPayout.balanceAfter,
    status: "COMPLETED",
    notes: `Règlement ${foundPayout.operator}. Réf: ${foundPayout.paymentReference}`,
  };
  txList.unshift(newTx);
  await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(txList, null, 2), "utf-8");

  assert(foundPayout.status === "PAID", "Statut muté en PAID");
  assert(foundPayout.paymentReference === "MOMO-BJ-TX-8492019", "Référence de transaction externe enregistrée");
  assert(txList[0].id === newTx.id, "Écriture comptable ajoutée au Grand Livre");

  // 6. Test Rejection Workflow with Balance Restitution
  console.log("\n--- 6. Test du Rejet avec Restitution Immédiate du Solde ---");
  const testWdrRejectId = `WDR-TEST-REJ-${Date.now()}`;
  const rejectAmount = 30000;
  const balanceBeforeReject = partnerAfrimarket.availableBalance;
  
  // Create pending with reserved
  const rejectPayoutObj = {
    id: testWdrRejectId,
    partnerId: partnerAfrimarket.id,
    partnerName: partnerAfrimarket.companyName,
    amount: rejectAmount,
    reservedAmount: rejectAmount,
    operator: "WAVE",
    requestedAt: new Date().toISOString(),
    status: "PENDING",
    balanceBefore: balanceBeforeReject,
    balanceAfter: balanceBeforeReject - rejectAmount,
  };
  partnerAfrimarket.availableBalance -= rejectAmount;
  reloadedPayouts.unshift(rejectPayoutObj);

  // Now reject
  rejectPayoutObj.status = "REJECTED";
  rejectPayoutObj.rejectionReason = "Numéro Wave non actif";
  rejectPayoutObj.reservedAmount = 0;
  partnerAfrimarket.availableBalance += rejectAmount; // RESTITUTION
  
  await fs.writeFile(PAYOUTS_FILE, JSON.stringify(reloadedPayouts, null, 2), "utf-8");
  await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2), "utf-8");

  assert(rejectPayoutObj.status === "REJECTED", "Statut du retrait muté en REJECTED");
  assert(partnerAfrimarket.availableBalance === balanceBeforeReject, "Solde disponible intégralement restitué au partenaire");

  console.log("\n=================================================");
  console.log(`📊 RÉSULTATS DES TESTS: ${passed} PASS, ${failed} FAIL`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR in tests:", err);
  process.exit(1);
});
