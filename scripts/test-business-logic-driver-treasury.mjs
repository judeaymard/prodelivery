// Verification of the business rules for Treasury Drivers
import { initialCodCollections, initialCodRemittances, livreurs } from "../src/lib/mock-data.ts";

console.log("=== TEST MÉTIER SECTION 30 : CALCUL DES FONDS LIVREUR ===");

const driverId = "liv-1"; // Rachad ADECHINA
const driver = livreurs.find((l) => l.id === driverId);

console.log(`Livreur testé : ${driver?.name} (${driverId})`);

// 1. Calcul initial
const driverRemittances = initialCodRemittances.filter((r) => r.livreurId === driverId);
const validatedRemittances = driverRemittances.filter(
  (r) => r.status === "VALIDATED" || r.status === "PARTIALLY_VALIDATED"
);
const totalFundsRemitted = validatedRemittances.reduce(
  (sum, r) => sum + (r.amountValidated ?? r.receivedAmount ?? r.amountDeclared ?? 0),
  0
);

const driverCols = initialCodCollections.filter((c) => c.livreurId === driverId);
const unremittedCols = driverCols.filter(
  (c) => c.remittanceStatus !== "VALIDATED" && c.collectionStatus !== "NOT_COLLECTED"
);
const fundsToRemit = unremittedCols.reduce((sum, c) => sum + Math.max(0, c.collectedAmount), 0);
const totalCodCollected = totalFundsRemitted + fundsToRemit;

console.log("\n--- ÉTAT INITIAL ---");
console.log(`Total collecté : ${totalCodCollected.toLocaleString("fr-FR")} FCFA (Attendu: 350 000 FCFA)`);
console.log(`Total remis     : ${totalFundsRemitted.toLocaleString("fr-FR")} FCFA (Attendu: 200 000 FCFA)`);
console.log(`Fonds détenus   : ${fundsToRemit.toLocaleString("fr-FR")} FCFA (Attendu: 150 000 FCFA)`);

const diff = totalCodCollected - totalFundsRemitted;
console.log(`Vérification formule : ${totalCodCollected} - ${totalFundsRemitted} = ${diff} FCFA`);

if (totalCodCollected !== 350000) {
  throw new Error(`Total collecté incorrect: ${totalCodCollected}`);
}
if (totalFundsRemitted !== 200000) {
  throw new Error(`Total remis incorrect: ${totalFundsRemitted}`);
}
if (fundsToRemit !== 150000 || diff !== 150000) {
  throw new Error(`Fonds détenus incorrect: ${fundsToRemit}`);
}
console.log("✓ Étape 1 validée : 350 000 - 200 000 = 150 000 FCFA");

// 2. Simulation de remise de 100 000 FCFA
console.log("\n--- SIMULATION REMISE DE 100 000 FCFA ---");
const newRemittanceAmount = 100000;
const postRemittances = [
  ...validatedRemittances,
  {
    id: "rem-test-100k",
    livreurId: driverId,
    amountValidated: newRemittanceAmount,
    status: "VALIDATED",
  },
];

const postTotalRemitted = postRemittances.reduce(
  (sum, r) => sum + (r.amountValidated ?? 0),
  0
);

// Déduction sur les collections non remises (comme fait par receiveDriverRemittance)
let remainingToDeduct = newRemittanceAmount;
const postCols = unremittedCols.map((c) => {
  if (remainingToDeduct >= c.collectedAmount && c.collectedAmount > 0) {
    remainingToDeduct -= c.collectedAmount;
    return { ...c, remittanceStatus: "VALIDATED", remainingAmount: 0 };
  } else if (remainingToDeduct > 0) {
    const remaining = c.collectedAmount - remainingToDeduct;
    remainingToDeduct = 0;
    return { ...c, remittanceStatus: "PARTIALLY_REMITTED", collectedAmount: remaining };
  }
  return c;
});

const postUnremitted = postCols.filter((c) => c.remittanceStatus !== "VALIDATED");
const postFundsToRemit = postUnremitted.reduce((sum, c) => sum + c.collectedAmount, 0);
const postTotalCollected = postTotalRemitted + postFundsToRemit;

console.log(`Nouveau Total remis     : ${postTotalRemitted.toLocaleString("fr-FR")} FCFA (Attendu: 300 000 FCFA)`);
console.log(`Nouveaux Fonds détenus   : ${postFundsToRemit.toLocaleString("fr-FR")} FCFA (Attendu: 50 000 FCFA)`);
console.log(`Total collecté conservé : ${postTotalCollected.toLocaleString("fr-FR")} FCFA (Attendu: 350 000 FCFA)`);

if (postFundsToRemit !== 50000) {
  throw new Error(`Fonds détenus après remise incorrect: ${postFundsToRemit}`);
}
if (postTotalRemitted !== 300000) {
  throw new Error(`Total remis après remise incorrect: ${postTotalRemitted}`);
}
if (postTotalCollected !== 350000) {
  throw new Error(`Total collecté après remise incorrect: ${postTotalCollected}`);
}

console.log("✓ Étape 2 validée : Fonds détenus passent exactement à 50 000 FCFA !");
console.log("\n==========================================");
console.log("✓ TEST MÉTIER CONFORME À 100%");
console.log("==========================================");
