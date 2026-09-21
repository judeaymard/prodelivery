import { LeekPayClient } from "../src/lib/leekpay.js";

async function testLeekPay() {
  console.log("=== TEST LEEKPAY SANDBOX & DETECTION OPERATEURS ===");
  const client = new LeekPayClient();

  const opMtn = client.detectOperator("+229 01 97 36 29 06");
  const opMoov = client.detectOperator("+229 01 95 12 34 56");
  console.log("Detection MTN:", opMtn === "MTN" ? "PASS" : "FAIL");
  console.log("Detection MOOV:", opMoov === "MOOV" ? "PASS" : "FAIL");

  const payoutResult = await client.transfer({
    amount: 150000,
    phone: "+229 01 97 36 29 06",
    reference: "TEST-WD-001",
    description: "Test Virement E-commercant",
  });

  console.log("Virement Status:", payoutResult.status);
  console.log("Virement Transaction ID:", payoutResult.transactionId);
  console.log("Virement Message:", payoutResult.message);
  console.log("Test global LeekPay:", payoutResult.success ? "REUSSI (100%)" : "ECHOUE");
}

testLeekPay();
