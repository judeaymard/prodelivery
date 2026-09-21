import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3005';

async function runTests() {
  console.log('🚀 Démarrage des Tests Automatisés de Persistance Réelle ENO Livraison...\n');
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1 : Paramètres & Tarification Centrale
    // -------------------------------------------------------------
    console.log('📌 Test 1: Configuration & Paramètres Plateforme...');
    const settingsRes = await fetch(`${BASE_URL}/api/settings`);
    const settingsData = await settingsRes.json();
    assert(settingsData.success === true, 'GET /api/settings retourne un succès');
    assert(settingsData.settings !== undefined, 'Settings chargés depuis data/settings.json');

    const updateSettingsRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          ...settingsData.settings,
          operational: {
            ...settingsData.settings.operational,
            driverRemittanceCeiling: 150000,
          },
        },
        updatedBy: 'Test Runner PDG',
      }),
    });
    const updateSettingsData = await updateSettingsRes.json();
    assert(updateSettingsData.success === true, 'PUT /api/settings met à jour les paramètres');

    const settingsFileContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/settings.json'), 'utf-8'));
    assert(settingsFileContent.operational.driverRemittanceCeiling === 150000, 'data/settings.json a bien persisté la nouvelle valeur');

    // -------------------------------------------------------------
    // TEST 2 : Création & Cycle de Vie Commande
    // -------------------------------------------------------------
    console.log('\n📌 Test 2: Commandes, Tarification Dynamique & Persistance...');
    const testOrderId = `cmd_test_${Date.now()}`;
    const newOrderPayload = {
      id: testOrderId,
      orderNumber: `CMD-TEST-${Date.now().toString().slice(-4)}`,
      clientName: 'Amadou Diallo',
      clientPhone: '+229 97 00 11 22',
      address: 'Haie Vive, Cotonou',
      city: 'Cotonou',
      region: 'Littoral',
      products: 'Montre Luxe Or x1',
      quantity: 1,
      totalPrice: 25000,
      partnerId: 'p1',
      partnerName: 'Boutique Élégance Bénin',
    };

    const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrderPayload),
    });
    const createOrderData = await createOrderRes.json();
    assert(createOrderData.success === true, 'POST /api/orders crée la commande');
    assert(createOrderData.order.deliveryFee > 0, 'Tarification dynamique appliquée pour la livraison');
    assert(createOrderData.order.serviceFee > 0, 'Tarification dynamique appliquée pour le closing');

    // Vérification dans data/orders.json
    const ordersFile = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/orders.json'), 'utf-8'));
    const savedOrder = ordersFile.find((o) => o.id === testOrderId);
    assert(!!savedOrder, 'La commande est physiquement persistée dans data/orders.json');

    // -------------------------------------------------------------
    // TEST 3 : Livraison de la Commande & Crédit Marchand
    // -------------------------------------------------------------
    console.log('\n📌 Test 3: Livraison, Calcul de Commission & Portefeuille Marchand...');
    const partnersBefore = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/partners.json'), 'utf-8'));
    const p1Before = partnersBefore.find((p) => p.id === 'p1');
    const balanceBefore = p1Before ? (p1Before.availableBalance || 0) : 0;

    const deliverOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testOrderId,
        updates: {
          status: 'LIVREE',
          comment: 'Livré en main propre avec succès',
        },
      }),
    });
    const deliverOrderData = await deliverOrderRes.json();
    assert(deliverOrderData.success === true, 'PATCH /api/orders passe la commande à LIVREE');

    const partnersAfter = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/partners.json'), 'utf-8'));
    const p1After = partnersAfter.find((p) => p.id === 'p1');
    const balanceAfter = p1After ? (p1After.availableBalance || 0) : 0;
    assert(balanceAfter > balanceBefore, `Solde marchand crédité avec succès (${balanceBefore} -> ${balanceAfter} FCFA)`);

    // -------------------------------------------------------------
    // TEST 4 : Flotte & Équipes (Coursiers, Closeuses, Trésoriers)
    // -------------------------------------------------------------
    console.log('\n📌 Test 4: Gestion de la Flotte & Persistance Équipes...');
    const testDriverId = `liv_test_${Date.now()}`;
    const createDriverRes = await fetch(`${BASE_URL}/api/fleet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DRIVER',
        data: {
          id: testDriverId,
          name: 'Koffi Mensah Test',
          phone: '+229 95 11 22 33',
          zone: 'Akpakpa',
          status: 'ACTIF',
          activeDeliveries: 0,
          deliveredToday: 0,
          successRate: 100,
        },
      }),
    });
    const createDriverData = await createDriverRes.json();
    assert(createDriverData.success === true, 'POST /api/fleet crée le coursier');

    const driversFile = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/drivers.json'), 'utf-8'));
    assert(driversFile.some((d) => d.id === testDriverId), 'Coursier persisté dans data/drivers.json');

    // -------------------------------------------------------------
    // TEST 5 : Retrait Marchand Réel (Cycle Complet)
    // -------------------------------------------------------------
    console.log('\n📌 Test 5: Cycle de Retrait Complet (Création -> Approbation -> Décaissement Réel)...');
    const testPayoutId = `w_test_${Date.now()}`;
    const payoutAmount = 50000;

    const createPayoutRes = await fetch(`${BASE_URL}/api/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testPayoutId,
        partnerId: 'p1',
        partnerName: 'Boutique Élégance Bénin',
        amount: payoutAmount,
        operator: 'MTN_MOMO',
        phone: '97000000',
        countryCode: '+229',
      }),
    });
    const createPayoutData = await createPayoutRes.json();
    assert(createPayoutData.success === true, 'POST /api/withdrawals crée la demande de retrait');

    // Vérifier persistance statut initial (PENDING ou APPROVED selon règle métier)
    const effectivePayoutId = createPayoutData.payout?.id || testPayoutId;
    const payoutsFile1 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/payouts.json'), 'utf-8'));
    const savedPayout1 = payoutsFile1.find((p) => p.id === effectivePayoutId);
    assert(savedPayout1 && (savedPayout1.status === 'PENDING' || savedPayout1.status === 'APPROVED'), `Retrait persisté avec statut initial (${savedPayout1?.status})`);

    // Admin approuve et décaisse
    const payPayoutRes = await fetch(`${BASE_URL}/api/withdrawals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: effectivePayoutId,
        action: 'PAY',
        paymentReference: `MTN-TX-TEST-${Date.now()}`,
        adminName: 'Jude S. (PDG)',
      }),
    });
    const payPayoutData = await payPayoutRes.json();
    assert(payPayoutData.success === true, 'PATCH /api/withdrawals décaisse et paie le retrait');

    // Vérification finale persistance PAID
    const payoutsFile2 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/payouts.json'), 'utf-8'));
    const savedPayout2 = payoutsFile2.find((p) => p.id === effectivePayoutId);
    assert(savedPayout2 && savedPayout2.status === 'PAID', 'Statut PAID persisté dans data/payouts.json');
    assert(!!savedPayout2.paymentReference, 'Référence de paiement enregistrée de manière permanente');

    // -------------------------------------------------------------
    // TEST 6 : Journal Global d'Audit & Traçabilité
    // -------------------------------------------------------------
    console.log('\n📌 Test 6: Journal Global d Audit & Inaltérabilité...');
    const auditRes = await fetch(`${BASE_URL}/api/audit`);
    const auditData = await auditRes.json();
    assert(auditData.success === true, 'GET /api/audit retourne les logs d audit');
    assert(Array.isArray(auditData.logs) && auditData.logs.length > 0, 'Audit logs non vides');

    console.log(`\n======================================================`);
    console.log(`🎉 TOUS LES TESTS DE PERSISTANCE ONT RÉUSSI AVEC SUCCÈS ! (${passedCount}/${totalCount})`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error('\n❌ Échec du test :', error);
    process.exit(1);
  }
}

runTests();
