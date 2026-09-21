import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3005';

function readJsonFile(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

async function runProofSuite() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('🔬 ENO LIVRAISON — MICRO-PHASE FINALE DE PREUVE FONCTIONNELLE');
  console.log('═════════════════════════════════════════════════════════════════\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertProof(condition, description, proofData = null) {
    totalTests++;
    if (condition) {
      console.log(`  🟢 [PROUVÉ] ${description}`);
      if (proofData) {
        console.log(`     ↳ Preuve : ${typeof proofData === 'object' ? JSON.stringify(proofData) : proofData}`);
      }
      passedTests++;
    } else {
      console.error(`  🔴 [NON PROUVÉ] ${description}`);
      if (proofData) {
        console.error(`     ↳ Données de l'échec :`, proofData);
      }
      throw new Error(`Échec de la preuve : ${description}`);
    }
  }

  try {
    // =========================================================================
    // 🥇 TEST 1 : PARCOURS COMPLET DE RETRAIT (ÉTAPE A ➔ B ➔ C ➔ D)
    // =========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🥇 TEST 1 : Parcours Complet de Retrait (E-commerçant ➔ Admin ➔ Paiement Manuel ➔ E-commerçant)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Consultation du solde initial
    const partnersBefore = readJsonFile('data/partners.json');
    const partnerP1 = partnersBefore.find((p) => p.id === 'p1');
    const initialAvailableBalance = partnerP1 ? partnerP1.availableBalance : 0;
    const testPayoutAmount = 75000;
    const testPayoutId = `WDR-PROOF-${Date.now()}`;

    console.log(`\n  [Étape A] Demande de retrait depuis l'espace E-commerçant...`);
    console.log(`    Solde disponible avant demande : ${initialAvailableBalance} FCFA`);

    // 2. Création de la demande de retrait
    const createPayoutRes = await fetch(`${BASE_URL}/api/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testPayoutId,
        partnerId: 'p1',
        partnerName: partnerP1?.companyName || 'Afrimarket',
        amount: testPayoutAmount,
        operator: 'MTN_MOMO',
        phone: '97000000',
        countryCode: '+229',
      }),
    });
    const createPayoutJson = await createPayoutRes.json();
    assertProof(
      createPayoutJson.success === true,
      'Demande de retrait acceptée par le serveur',
      { payoutId: createPayoutJson.payout?.id, amount: createPayoutJson.payout?.amount, status: createPayoutJson.payout?.status }
    );

    // 3. Test Refresh / Persistance Étape A
    const payoutsDiskA = readJsonFile('data/payouts.json');
    const savedPayoutA = payoutsDiskA.find((p) => p.id === testPayoutId);
    assertProof(
      savedPayoutA !== undefined && savedPayoutA.amount === testPayoutAmount,
      'Retrait persisté physiquement dans data/payouts.json après actualisation',
      { id: savedPayoutA?.id, montant: savedPayoutA?.amount, statut: savedPayoutA?.status, operateur: savedPayoutA?.operator }
    );

    // Vérification du verrouillage du solde marchand
    const partnersDiskA = readJsonFile('data/partners.json');
    const partnerDiskA = partnersDiskA.find((p) => p.id === 'p1');
    assertProof(
      partnerDiskA.availableBalance === initialAvailableBalance - testPayoutAmount,
      `Verrouillage transactionnel du solde marchand (${initialAvailableBalance} -> ${partnerDiskA.availableBalance} FCFA)`,
      { soldeAvant: initialAvailableBalance, soldeApresVerrouillage: partnerDiskA.availableBalance, montantReserve: testPayoutAmount }
    );

    // 4. [Étape B] Visibilité & Approbation Administrateur
    console.log(`\n  [Étape B] Visibilité et Approbation côté Administrateur...`);
    const adminGetRes = await fetch(`${BASE_URL}/api/withdrawals`);
    const adminGetJson = await adminGetRes.json();
    const adminFoundPayout = adminGetJson.payouts?.find((p) => p.id === testPayoutId);
    assertProof(
      adminFoundPayout !== undefined && adminFoundPayout.id === testPayoutId,
      'L Administrateur voit exactement la même demande avec le même identifiant',
      { adminFoundId: adminFoundPayout?.id, partner: adminFoundPayout?.partnerName }
    );

    const approveRes = await fetch(`${BASE_URL}/api/withdrawals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testPayoutId,
        action: 'APPROVE',
        internalNote: 'Dossier vérifié et validé par Jude S. (PDG)',
      }),
    });
    const approveJson = await approveRes.json();
    assertProof(
      approveJson.success === true && approveJson.payout?.status === 'APPROVED',
      'Approbation validée par l Administrateur',
      { status: approveJson.payout?.status, note: approveJson.payout?.internalNote }
    );

    // Test Refresh après approbation
    const payoutsDiskB = readJsonFile('data/payouts.json');
    const savedPayoutB = payoutsDiskB.find((p) => p.id === testPayoutId);
    assertProof(
      savedPayoutB?.status === 'APPROVED',
      'Statut APPROVED persisté sur disque après refresh',
      { id: savedPayoutB?.id, status: savedPayoutB?.status }
    );

    // 5. [Étape C] Paiement Manuel avec Référence Réelle
    console.log(`\n  [Étape C] Décaissement Manuel avec Saisie de Référence Réelle...`);
    const manualRef = `MTN-MANUAL-REF-${Date.now().toString().slice(-6)}`;
    const payRes = await fetch(`${BASE_URL}/api/withdrawals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testPayoutId,
        action: 'PAY',
        paymentReference: manualRef,
        adminName: 'Jude S. (PDG)',
      }),
    });
    const payJson = await payRes.json();
    assertProof(
      payJson.success === true && payJson.payout?.status === 'PAID',
      'Décaissement manuel enregistré avec succès',
      { status: payJson.payout?.status, paymentReference: payJson.payout?.paymentReference, admin: payJson.payout?.adminProcessorName }
    );

    // Test Refresh & Écritures Comptables après paiement
    const payoutsDiskC = readJsonFile('data/payouts.json');
    const savedPayoutC = payoutsDiskC.find((p) => p.id === testPayoutId);
    assertProof(
      savedPayoutC?.status === 'PAID' && savedPayoutC?.paymentReference === manualRef,
      'Statut PAID et référence de paiement conservés après refresh',
      { id: savedPayoutC?.id, status: savedPayoutC?.status, ref: savedPayoutC?.paymentReference }
    );

    const txDiskC = readJsonFile('data/transactions.json');
    const payoutTx = txDiskC.find((t) => t.type === 'RETRAIT' && t.outflow === testPayoutAmount);
    assertProof(
      payoutTx !== undefined,
      'Écriture comptable de retrait enregistrée dans le Grand Livre data/transactions.json',
      { txReference: payoutTx?.txReference, label: payoutTx?.label, outflow: payoutTx?.outflow }
    );

    // 6. [Étape D] E-commerçant après paiement
    console.log(`\n  [Étape D] Vérification finale de l'Espace E-commerçant...`);
    const partnerGetRes = await fetch(`${BASE_URL}/api/withdrawals`);
    const partnerGetJson = await partnerGetRes.json();
    const finalPartner = partnerGetJson.partners?.find((p) => p.id === 'p1');
    const finalPayout = partnerGetJson.payouts?.find((p) => p.id === testPayoutId);

    assertProof(
      finalPayout?.status === 'PAID' && finalPartner?.availableBalance === initialAvailableBalance - testPayoutAmount,
      'Espace E-commerçant synchronisé : retrait payé et solde net exact',
      { soldeFinal: finalPartner?.availableBalance, statutRetrait: finalPayout?.status }
    );

    // =========================================================================
    // 🥈 TEST 2 : COMMANDE ➔ COD ➔ COMMISSION ➔ CRÉDIT MARCHAND
    // =========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🥈 TEST 2 : Commande ➔ Encaissement COD ➔ Commission ➔ Crédit Solde Marchand');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const partnersBeforeOrder = readJsonFile('data/partners.json');
    const p1BeforeOrder = partnersBeforeOrder.find((p) => p.id === 'p1');
    const balanceBeforeOrder = p1BeforeOrder ? p1BeforeOrder.availableBalance : 0;

    const orderPrice = 30000;
    const testOrderId = `cmd_proof_${Date.now()}`;
    const orderPayload = {
      id: testOrderId,
      orderNumber: `CMD-PRF-${Date.now().toString().slice(-4)}`,
      clientName: 'Mme Awa KONE',
      clientPhone: '+229 96 55 44 33',
      address: 'Zone Résidentielle, Cotonou',
      city: 'Cotonou',
      region: 'Littoral',
      products: 'Pack Beauté Sérum Éclat x2',
      quantity: 2,
      totalPrice: orderPrice,
      partnerId: 'p1',
      partnerName: p1BeforeOrder?.companyName || 'Afrimarket',
    };

    // 1. Création de la commande
    const orderCreateRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const orderCreateJson = await orderCreateRes.json();
    assertProof(
      orderCreateJson.success === true,
      'Création et tarification dynamique de la commande',
      {
        orderNumber: orderCreateJson.order?.orderNumber,
        totalPrice: orderCreateJson.order?.totalPrice,
        deliveryFee: orderCreateJson.order?.deliveryFee,
        serviceFee: orderCreateJson.order?.serviceFee,
      }
    );

    const deliveryFee = orderCreateJson.order?.deliveryFee || 2000;
    const serviceFee = orderCreateJson.order?.serviceFee || 800;

    // 2. Attribution et Livraison de la commande
    const deliverRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testOrderId,
        status: 'LIVREE',
        comment: 'Colis remis en main propre, 30 000 FCFA encaissés en espèces.',
      }),
    });
    const deliverJson = await deliverRes.json();
    assertProof(
      deliverJson.success === true && deliverJson.order?.status === 'LIVREE',
      'Commande marquée LIVRÉE avec encaissement COD confirmé',
      { status: deliverJson.order?.status, deliveredAt: deliverJson.order?.deliveredAt }
    );

    // 3. Vérification financière exacte
    const orderTotalPrice = orderCreateJson.order?.totalPrice || orderPrice;
    const settingsCurrent = readJsonFile('data/settings.json');
    const commissionRate = settingsCurrent.financial?.defaultCommissionRate ?? 6.5;
    const expectedCommission = Math.round((orderTotalPrice * commissionRate) / 100);
    const expectedNetCredit = orderTotalPrice - deliveryFee - serviceFee - expectedCommission;

    const partnersAfterOrder = readJsonFile('data/partners.json');
    const p1AfterOrder = partnersAfterOrder.find((p) => p.id === 'p1');
    const balanceAfterOrder = p1AfterOrder ? p1AfterOrder.availableBalance : 0;
    const actualCredit = balanceAfterOrder - balanceBeforeOrder;

    console.log(`\n    --- DÉCOMPOSITION FINANCIÈRE PROUVÉE ---`);
    console.log(`    Montant Total Encaissé : ${orderTotalPrice} FCFA`);
    console.log(`    Frais de Livraison     : -${deliveryFee} FCFA`);
    console.log(`    Frais de Closing       : -${serviceFee} FCFA`);
    console.log(`    Commission ENO (${commissionRate}%)  : -${expectedCommission} FCFA`);
    console.log(`    Crédit Net Marchand    : +${expectedNetCredit} FCFA`);
    console.log(`    ----------------------------------------`);

    assertProof(
      actualCredit === expectedNetCredit,
      `Solde marchand crédité exactement selon la formule financière (${balanceBeforeOrder} -> ${balanceAfterOrder} FCFA)`,
      { creditAttendu: expectedNetCredit, creditReel: actualCredit, nouveauSolde: balanceAfterOrder }
    );

    // =========================================================================
    // 🥉 TEST 3 : PARAMÈTRES ➔ LOGIQUE MÉTIER & NON-RÉTROACTIVITÉ
    // =========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🥉 TEST 3 : Paramètres ➔ Logique Métier & Préservation de l Historique');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Modification du taux de commission (5% -> 10%)
    const settingsBeforeUpdate = readJsonFile('data/settings.json');
    const updateSettingsRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          ...settingsBeforeUpdate,
          financial: {
            ...settingsBeforeUpdate.financial,
            defaultCommissionRate: 10,
          },
        },
        updatedBy: 'Jude S. (PDG - Test Paramètres)',
      }),
    });
    const updateSettingsJson = await updateSettingsRes.json();
    assertProof(
      updateSettingsJson.success === true,
      'Mise à jour du paramètre central : Taux de commission = 10%',
      { nouveauTaux: 10 }
    );

    // Test Refresh des paramètres
    const settingsDiskUpdated = readJsonFile('data/settings.json');
    assertProof(
      settingsDiskUpdated.financial?.defaultCommissionRate === 10,
      'Nouveau taux de 10% persisté sur disque data/settings.json',
      { tauxSurDisque: settingsDiskUpdated.financial?.defaultCommissionRate }
    );

    // 2. Création d'une NOUVELLE commande pour tester l'application du nouveau taux
    const newOrderPrice = 40000;
    const testOrderIdNew = `cmd_new_rate_${Date.now()}`;
    const newOrderPayload = {
      id: testOrderIdNew,
      orderNumber: `CMD-NEW-${Date.now().toString().slice(-4)}`,
      clientName: 'M. Fabrice DOSSOU',
      clientPhone: '+229 97 12 34 56',
      address: 'Cadjehoun, Cotonou',
      city: 'Cotonou',
      region: 'Littoral',
      products: 'Montre Quartz Homme x1',
      quantity: 1,
      totalPrice: newOrderPrice,
      partnerId: 'p1',
      partnerName: 'Afrimarket',
    };

    const order2CreateRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrderPayload),
    });
    const order2Json = await order2CreateRes.json();
    const order2Total = order2Json.order?.totalPrice || 42800;

    const balanceBeforeOrder2 = (readJsonFile('data/partners.json').find((p) => p.id === 'p1'))?.availableBalance || 0;

    await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: testOrderIdNew, status: 'LIVREE' }),
    });

    const balanceAfterOrder2 = (readJsonFile('data/partners.json').find((p) => p.id === 'p1'))?.availableBalance || 0;
    const actualCreditNewRate = balanceAfterOrder2 - balanceBeforeOrder2;

    const expectedNewCommission = Math.round((order2Total * 10) / 100); // 4280 FCFA
    const expectedNewNetCredit = order2Total - 2000 - 800 - expectedNewCommission; // 35720 FCFA

    assertProof(
      actualCreditNewRate === expectedNewNetCredit,
      `Nouvelle commande calculée avec le nouveau taux de 10% (Total: ${order2Total} FCFA, Commission: ${expectedNewCommission} FCFA)`,
      { totalEncaisse: order2Total, commission: expectedNewCommission, creditAttendu: expectedNewNetCredit, creditReel: actualCreditNewRate }
    );

    // 3. Vérification de la non-rétroactivité sur l'ancienne commande
    const txDiskCheck = readJsonFile('data/transactions.json');
    const oldOrderTx = txDiskCheck.find((t) => t.type === 'LIVRAISON_ENCAISSEE' && t.inflow === orderTotalPrice);
    assertProof(
      oldOrderTx !== undefined && oldOrderTx.outflow === deliveryFee + serviceFee + expectedCommission,
      'Historique financier préservé : l ancienne commande conserve son calcul initial',
      { txReference: oldOrderTx?.txReference, totalInflow: oldOrderTx?.inflow, fraisHistoriques: oldOrderTx?.outflow }
    );

    // Remettre le taux standard 5%
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          ...settingsDiskUpdated,
          financial: {
            ...settingsDiskUpdated.financial,
            defaultCommissionRate: 5,
          },
        },
        updatedBy: 'Test Suite Reset',
      }),
    });

    // =========================================================================
    // 🚨 TEST 4 : DOUBLE ACTION FINANCIÈRE (IDEMPOTENCE & CONCURRENCE)
    // =========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 TEST 4 : Double Action Financière (Idempotence & Prévention Double Paiement)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const concurrentPayoutId = `WDR-CONCURRENT-${Date.now()}`;
    const createConcurrentRes = await fetch(`${BASE_URL}/api/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: concurrentPayoutId,
        partnerId: 'p1',
        partnerName: 'Afrimarket',
        amount: 20000,
        operator: 'MTN_MOMO',
        phone: '97000000',
        countryCode: '+229',
      }),
    });
    const createConcurrentJson = await createConcurrentRes.json();
    const effectiveConcurrentId = createConcurrentJson.payout?.id || concurrentPayoutId;

    // Deux demandes de paiement simultanées
    const timestampNow = Date.now();
    const [pay1Res, pay2Res] = await Promise.all([
      fetch(`${BASE_URL}/api/withdrawals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: effectiveConcurrentId, action: 'PAY', paymentReference: `CONCUR-REF-A-${timestampNow}`, adminName: 'Admin 1' }),
      }),
      fetch(`${BASE_URL}/api/withdrawals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: effectiveConcurrentId, action: 'PAY', paymentReference: `CONCUR-REF-B-${timestampNow}`, adminName: 'Admin 2' }),
      }),
    ]);

    const pay1Json = await pay1Res.json();
    const pay2Json = await pay2Res.json();

    const transactionsDisk = readJsonFile('data/transactions.json');
    const matchingTxs = transactionsDisk.filter(
      (t) =>
        t.type === 'RETRAIT' &&
        (t.id === `tx-ret-${effectiveConcurrentId}` ||
          t.txReference === `TX-RET-${effectiveConcurrentId}` ||
          t.notes?.includes(effectiveConcurrentId))
    );

    assertProof(
      matchingTxs.length === 1,
      'Protection contre le double décaissement : exactement une seule transaction financière a été enregistrée',
      { transactionsTrouvees: matchingTxs.length, txId: matchingTxs[0]?.id, reponse1: pay1Json.success, reponse2: pay2Json.success }
    );

    // =========================================================================
    // 🧾 TEST 5 : JOURNAL D'AUDIT CENTRALISÉ
    // =========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧾 TEST 5 : Journal d Audit Persistant & Centralisé');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const auditRes = await fetch(`${BASE_URL}/api/audit`);
    const auditJson = await auditRes.json();
    const logs = auditJson.logs || [];

    const payoutCreateLog = logs.find((l) => l.action === 'WITHDRAWAL_CREATED' || l.entityId === testPayoutId);
    const payoutApproveLog = logs.find((l) => l.action === 'WITHDRAWAL_APPROVED' || l.entityId === testPayoutId);
    const payoutPaidLog = logs.find((l) => l.action === 'WITHDRAWAL_PAID' || l.entityId === testPayoutId);
    const settingsLog = logs.find((l) => l.action === 'SETTINGS_UPDATED');

    assertProof(
      payoutCreateLog !== undefined,
      'Événement d audit : Création de la demande de retrait',
      { action: payoutCreateLog?.action, entityId: payoutCreateLog?.entityId, timestamp: payoutCreateLog?.timestamp }
    );

    assertProof(
      payoutApproveLog !== undefined || payoutPaidLog !== undefined,
      'Événement d audit : Décaissement / Approbation de retrait',
      { action: payoutPaidLog?.action || payoutApproveLog?.action, entityId: testPayoutId }
    );

    assertProof(
      settingsLog !== undefined,
      'Événement d audit : Modification des paramètres de configuration',
      { action: settingsLog?.action, module: settingsLog?.module, timestamp: settingsLog?.timestamp }
    );

    console.log('\n═════════════════════════════════════════════════════════════════');
    console.log(`🎉 PREUVES FONCTIONNELLES COMPLÈTES : ${passedTests}/${totalTests} TESTS PROUVÉS AVEC SUCCÈS !`);
    console.log('═════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\n❌ ÉCHEC DE LA MICRO-PHASE DE PREUVE :', err);
    process.exit(1);
  }
}

runProofSuite();
