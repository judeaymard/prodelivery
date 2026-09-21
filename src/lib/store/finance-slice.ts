import { FinancialTransaction } from "../types";

export interface FinanceState {
  transactions: FinancialTransaction[];
}

export function calculatePartnerBalances(partnerId: string, transactions: FinancialTransaction[]) {
  const partnerTx = transactions.filter((t) => t.partnerId === partnerId);
  const totalInflow = partnerTx.reduce((sum, t) => sum + (t.inflow || 0), 0);
  const totalOutflow = partnerTx.reduce((sum, t) => sum + (t.outflow || 0), 0);

  return {
    totalInflow,
    totalOutflow,
    availableBalance: Math.max(0, totalInflow - totalOutflow),
  };
}
