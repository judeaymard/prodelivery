import {
  getOrders,
  getTransactions,
  getPayoutRequests,
  getPartners,
  getDrivers,
  getClosers,
  getPlatformSettings,
} from "./server-db";
import {
  Order,
  OrderStatus,
  FinancialTransaction,
  PayoutRequest,
  Partner,
  LivreurProfile,
  CloseuseProfile,
  PayoutOperator,
} from "./types";

// =============================================================================
// 📊 TYPES & INTERFACES DU REPORTING SERVICE
// =============================================================================

export type ReportPeriod =
  | "TODAY"
  | "7D"
  | "30D"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "YEAR"
  | "CUSTOM";

export interface ReportFilterParams {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  partnerId?: string;
  livreurId?: string;
  closeuseId?: string;
  city?: string;
  region?: string;
  status?: OrderStatus;
  operator?: PayoutOperator;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  ordersCount: number;
  deliveredCount: number;
  codAmount: number;
  commissionsAmount: number;
  inflow: number;
  outflow: number;
}

export interface OverviewMetrics {
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  inDeliveryOrders: number;
  cancelledOrders: number;
  callbackOrders: number;
  deliverySuccessRate: number;
  totalCODCollected: number;
  totalEnoCommissions: number;
  totalNetMerchants: number;
  pendingPayoutsCount: number;
  pendingPayoutsAmount: number;
  timeSeries: TimeSeriesPoint[];
}

export interface DriverPerformanceMetric {
  driverId: string;
  driverName: string;
  phone: string;
  zone: string;
  assignedCount: number;
  deliveredCount: number;
  failedCount: number;
  successRate: number;
  cashCollected: number;
  avgDeliveryTimeMinutes: number;
}

export interface ZoneBreakdownMetric {
  zone: string;
  totalOrders: number;
  deliveredOrders: number;
  successRate: number;
  totalCOD: number;
}

export interface DeliveryAnalytics {
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
  successRate: number;
  avgDeliveryTimeMinutes: number;
  driverPerformances: DriverPerformanceMetric[];
  zoneBreakdown: ZoneBreakdownMetric[];
}

export interface CloserPerformanceMetric {
  closerId: string;
  closerName: string;
  phone: string;
  assignedOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  conversionRate: number;
  callCount: number;
}

export interface CloserAnalytics {
  totalAssigned: number;
  totalCalls: number;
  confirmedCount: number;
  cancelledCount: number;
  conversionRate: number;
  closerPerformances: CloserPerformanceMetric[];
}

export interface MerchantPerformanceMetric {
  partnerId: string;
  companyName: string;
  contactName: string;
  phone: string;
  city?: string;
  totalOrders: number;
  deliveredOrders: number;
  successRate: number;
  totalGMV: number;
  enoCommissions: number;
  netRevenue: number;
  availableBalance: number;
  pendingBalance: number;
  paidPayoutsTotal: number;
  pendingPayoutsTotal: number;
}

export interface MerchantAnalytics {
  totalMerchants: number;
  activeMerchantsCount: number;
  totalGMV: number;
  totalCommissions: number;
  totalNetRevenue: number;
  totalAvailableBalances: number;
  merchantPerformances: MerchantPerformanceMetric[];
}

export interface FinancialAnalytics {
  grossVolumeCOD: number;
  enoRevenue: number;
  netMerchants: number;
  paidPayoutsTotal: number;
  pendingPayoutsTotal: number;
  totalExpenses: number;
  netTreasuryBalance: number;
  transactionsCount: number;
  cashFlowTimeSeries: {
    date: string;
    label: string;
    inflow: number;
    outflow: number;
    balanceAfter: number;
  }[];
  operatorBreakdown: {
    operator: string;
    count: number;
    totalAmount: number;
  }[];
}

// =============================================================================
// 🛠️ UTILITAIRES DE FILTRAGE TEMPOREL ET COMBINATOIRE
// =============================================================================

export function getDateRangeFromPeriod(
  period: ReportPeriod = "30D",
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  if (period === "CUSTOM" && customStart) {
    const s = new Date(customStart);
    const e = customEnd ? new Date(customEnd) : end;
    e.setHours(23, 59, 59, 999);
    return { start: isNaN(s.getTime()) ? start : s, end: isNaN(e.getTime()) ? end : e };
  }

  switch (period) {
    case "TODAY":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case "7D":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    case "30D":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    case "THIS_MONTH":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case "LAST_MONTH":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end.setTime(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime());
      break;
    case "YEAR":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

function parseItemDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const lower = dateStr.toLowerCase().trim();
  const now = new Date();

  // Gestion des libellés relatifs français (données mock)
  if (lower.includes("aujourd'hui") || lower.startsWith("il y a")) {
    return new Date(now);
  }
  if (lower.startsWith("hier")) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Normalise "2026-09-03 19:10" → "2026-09-03T19:10"
  const normalized = dateStr.trim().replace(" ", "T");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function isWithinRange(dateStr: string | undefined, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = parseItemDate(dateStr);
  if (!d) return false;
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

/**
 * Filtre les commandes selon les critères combinables
 */
function filterOrders(orders: Order[], filters: ReportFilterParams): Order[] {
  const { start, end } = getDateRangeFromPeriod(
    filters.period,
    filters.startDate,
    filters.endDate
  );

  return orders.filter((order) => {
    // 1. Filtre temporel (sur createdAt ou deliveredAt)
    const dateToCompare = order.createdAt || order.updatedAt;
    if (!isWithinRange(dateToCompare, start, end)) {
      return false;
    }

    // 2. Filtre Partenaire
    if (filters.partnerId && filters.partnerId !== "ALL" && order.partnerId !== filters.partnerId) {
      return false;
    }

    // 3. Filtre Livreur
    if (filters.livreurId && filters.livreurId !== "ALL" && order.assignedLivreurId !== filters.livreurId) {
      return false;
    }

    // 4. Filtre Closeuse
    if (filters.closeuseId && filters.closeuseId !== "ALL" && order.assignedCloseuseId !== filters.closeuseId) {
      return false;
    }

    // 5. Filtre Ville / Zone
    if (filters.city && filters.city !== "ALL" && order.city?.toLowerCase() !== filters.city.toLowerCase()) {
      return false;
    }

    // 6. Filtre Région
    if (filters.region && filters.region !== "ALL" && order.region?.toLowerCase() !== filters.region.toLowerCase()) {
      return false;
    }

    // 7. Filtre Statut
    if (filters.status && order.status !== filters.status) {
      return false;
    }

    return true;
  });
}

export async function getFilteredOrders(filters: ReportFilterParams = {}): Promise<Order[]> {
  const allOrders = await getOrders();
  return filterOrders(allOrders, filters);
}

/**
 * Filtre les transactions selon les critères combinables
 */
function filterTransactions(txs: FinancialTransaction[], filters: ReportFilterParams): FinancialTransaction[] {
  const { start, end } = getDateRangeFromPeriod(
    filters.period,
    filters.startDate,
    filters.endDate
  );

  return txs.filter((tx) => {
    // 1. Filtre temporel
    if (!isWithinRange(tx.date, start, end)) {
      return false;
    }

    // 2. Filtre Partenaire
    if (filters.partnerId && filters.partnerId !== "ALL" && tx.partnerId !== filters.partnerId) {
      return false;
    }

    // 3. Filtre Livreur
    if (filters.livreurId && filters.livreurId !== "ALL" && tx.livreurId !== filters.livreurId) {
      return false;
    }

    return true;
  });
}

/**
 * Filtre les retraits selon les critères combinables
 */
function filterPayouts(payouts: PayoutRequest[], filters: ReportFilterParams): PayoutRequest[] {
  const { start, end } = getDateRangeFromPeriod(
    filters.period,
    filters.startDate,
    filters.endDate
  );

  return payouts.filter((p) => {
    // 1. Filtre temporel (sur requestedAt ou paidAt)
    const dateToCompare = p.requestedAt || p.paidAt;
    if (!isWithinRange(dateToCompare, start, end)) {
      return false;
    }

    // 2. Filtre Partenaire
    if (filters.partnerId && filters.partnerId !== "ALL" && p.partnerId !== filters.partnerId) {
      return false;
    }

    // 3. Filtre Opérateur
    if (filters.operator && p.operator !== filters.operator) {
      return false;
    }

    return true;
  });
}

// =============================================================================
// 📈 1. OVERVIEW METRICS & SÉRIES TEMPORELLES
// =============================================================================

export async function getOverview(filters: ReportFilterParams = {}): Promise<OverviewMetrics> {
  const [allOrders, allTxs, allPayouts] = await Promise.all([
    getOrders(),
    getTransactions(),
    getPayoutRequests(),
  ]);

  const orders = filterOrders(allOrders, filters);
  const txs = filterTransactions(allTxs, filters);
  const payouts = filterPayouts(allPayouts, filters);

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === "LIVREE").length;
  const pendingOrders = orders.filter((o) => o.status === "EN_ATTENTE").length;
  const inDeliveryOrders = orders.filter((o) => o.status === "EN_COURS" || o.status === "CONFIRMEE").length;
  const cancelledOrders = orders.filter((o) => o.status === "ANNULEE" || o.status === "REFUSEE" || o.status === "RETOURNEE").length;
  const callbackOrders = orders.filter((o) => o.status === "A_RAPPELER").length;

  const resolvedCount = deliveredOrders + cancelledOrders;
  const deliverySuccessRate = resolvedCount > 0 ? Math.round((deliveredOrders / resolvedCount) * 100) : 0;

  // Calculs financiers réels basés sur les commandes livrées
  const deliveredOrdersList = orders.filter((o) => o.status === "LIVREE");
  const totalCODCollected = deliveredOrdersList.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  
  // Commissions calculées à partir des champs persistés réels de la commande
  const totalEnoCommissions = deliveredOrdersList.reduce(
    (acc, o) => acc + (o.deliveryFee || 0) + (o.serviceFee || 0),
    0
  );
  const totalNetMerchants = Math.max(0, totalCODCollected - totalEnoCommissions);

  // Retraits en attente
  const pendingPayoutsList = payouts.filter((p) => p.status === "PENDING" || p.status === "APPROVED");
  const pendingPayoutsCount = pendingPayoutsList.length;
  const pendingPayoutsAmount = pendingPayoutsList.reduce((acc, p) => acc + p.amount, 0);

  // Génération de la série temporelle réelle
  const timeSeriesMap = new Map<string, TimeSeriesPoint>();
  const { start, end } = getDateRangeFromPeriod(filters.period, filters.startDate, filters.endDate);

  // Initialisation des dates dans l'intervalle (pour avoir des points continus)
  const curr = new Date(start);
  while (curr.getTime() <= end.getTime()) {
    const key = curr.toISOString().slice(0, 10);
    const label = curr.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    timeSeriesMap.set(key, {
      date: key,
      label,
      ordersCount: 0,
      deliveredCount: 0,
      codAmount: 0,
      commissionsAmount: 0,
      inflow: 0,
      outflow: 0,
    });
    curr.setDate(curr.getDate() + 1);
  }

  // Remplissage avec les vraies commandes
  orders.forEach((o) => {
    const dateKey = (o.createdAt || o.updatedAt || "").slice(0, 10);
    const entry = timeSeriesMap.get(dateKey);
    if (entry) {
      entry.ordersCount += 1;
      if (o.status === "LIVREE") {
        entry.deliveredCount += 1;
        entry.codAmount += o.totalPrice || 0;
        entry.commissionsAmount += (o.deliveryFee || 0) + (o.serviceFee || 0);
      }
    }
  });

  // Remplissage avec les vraies transactions financières
  txs.forEach((t) => {
    const dateKey = (t.date || "").slice(0, 10);
    const entry = timeSeriesMap.get(dateKey);
    if (entry) {
      entry.inflow += t.inflow || 0;
      entry.outflow += t.outflow || 0;
    }
  });

  const timeSeries = Array.from(timeSeriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalOrders,
    deliveredOrders,
    pendingOrders,
    inDeliveryOrders,
    cancelledOrders,
    callbackOrders,
    deliverySuccessRate,
    totalCODCollected,
    totalEnoCommissions,
    totalNetMerchants,
    pendingPayoutsCount,
    pendingPayoutsAmount,
    timeSeries,
  };
}

// =============================================================================
// 🛵 2. DELIVERY ANALYTICS & PERFORMANCE LIVREURS
// =============================================================================

export async function getDeliveryAnalytics(filters: ReportFilterParams = {}): Promise<DeliveryAnalytics> {
  const [allOrders, allDrivers] = await Promise.all([
    getOrders(),
    getDrivers(),
  ]);

  const orders = filterOrders(allOrders, filters);

  const totalDeliveries = orders.length;
  const deliveredList = orders.filter((o) => o.status === "LIVREE");
  const failedList = orders.filter((o) => o.status === "REFUSEE" || o.status === "ANNULEE" || o.status === "RETOURNEE");
  const deliveredCount = deliveredList.length;
  const failedCount = failedList.length;

  const resolved = deliveredCount + failedCount;
  const successRate = resolved > 0 ? Math.round((deliveredCount / resolved) * 100) : 0;

  // Calcul du délai moyen de livraison uniquement sur les commandes ayant createdAt et deliveredAt valides
  let totalDeliveryMinutes = 0;
  let countWithTimestamps = 0;
  deliveredList.forEach((o) => {
    if (o.createdAt && o.deliveredAt) {
      const cDate = parseItemDate(o.createdAt);
      const dDate = parseItemDate(o.deliveredAt);
      if (cDate && dDate && dDate.getTime() >= cDate.getTime()) {
        const minutes = Math.round((dDate.getTime() - cDate.getTime()) / (1000 * 60));
        // Borne raisonnable (ex: < 48 heures)
        if (minutes > 0 && minutes < 2880) {
          totalDeliveryMinutes += minutes;
          countWithTimestamps += 1;
        }
      }
    }
  });
  const avgDeliveryTimeMinutes = countWithTimestamps > 0 ? Math.round(totalDeliveryMinutes / countWithTimestamps) : 120;

  // Performances individuelles par livreur
  const driverPerformances: DriverPerformanceMetric[] = allDrivers
    .filter((d) => !filters.livreurId || filters.livreurId === "ALL" || d.id === filters.livreurId)
    .map((driver) => {
      const driverOrders = orders.filter((o) => o.assignedLivreurId === driver.id || o.assignedLivreurName?.toLowerCase() === driver.name.toLowerCase());
      const driverDelivered = driverOrders.filter((o) => o.status === "LIVREE");
      const driverFailed = driverOrders.filter((o) => o.status === "REFUSEE" || o.status === "ANNULEE" || o.status === "RETOURNEE");
      const driverResolved = driverDelivered.length + driverFailed.length;
      const driverRate = driverResolved > 0 ? Math.round((driverDelivered.length / driverResolved) * 100) : (driver.successRate ?? 0);
      const cashCollected = driverDelivered.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

      return {
        driverId: driver.id,
        driverName: driver.name,
        phone: driver.phone,
        zone: driver.zone,
        assignedCount: driverOrders.length,
        deliveredCount: driverDelivered.length,
        failedCount: driverFailed.length,
        successRate: driverRate,
        cashCollected,
        avgDeliveryTimeMinutes: driver.avgDeliveryTimeMinutes || avgDeliveryTimeMinutes,
      };
    });

  // Répartition par zone géographique
  const zoneMap = new Map<string, { total: number; delivered: number; cod: number }>();
  orders.forEach((o) => {
    const z = o.city || o.region || "Non spécifiée";
    const current = zoneMap.get(z) || { total: 0, delivered: 0, cod: 0 };
    current.total += 1;
    if (o.status === "LIVREE") {
      current.delivered += 1;
      current.cod += o.totalPrice || 0;
    }
    zoneMap.set(z, current);
  });

  const zoneBreakdown: ZoneBreakdownMetric[] = Array.from(zoneMap.entries()).map(([zone, data]) => ({
    zone,
    totalOrders: data.total,
    deliveredOrders: data.delivered,
    successRate: data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0,
    totalCOD: data.cod,
  }));

  return {
    totalDeliveries,
    deliveredCount,
    failedCount,
    successRate,
    avgDeliveryTimeMinutes,
    driverPerformances,
    zoneBreakdown,
  };
}

// =============================================================================
// 📞 3. CLOSER ANALYTICS & PÔLE TÉLÉVENTE
// =============================================================================

export async function getCloserAnalytics(filters: ReportFilterParams = {}): Promise<CloserAnalytics> {
  const [allOrders, allClosers] = await Promise.all([
    getOrders(),
    getClosers(),
  ]);

  const orders = filterOrders(allOrders, filters);

  const closerPerformances: CloserPerformanceMetric[] = allClosers
    .filter((c) => !filters.closeuseId || filters.closeuseId === "ALL" || c.id === filters.closeuseId)
    .map((closer) => {
      const closerOrders = orders.filter((o) => o.assignedCloseuseId === closer.id || o.assignedCloseuseName?.toLowerCase() === closer.name.toLowerCase());
      const confirmed = closerOrders.filter((o) => o.status === "CONFIRMEE" || o.status === "EN_COURS" || o.status === "LIVREE").length;
      const cancelled = closerOrders.filter((o) => o.status === "ANNULEE" || o.status === "REFUSEE").length;
      const totalAssigned = closerOrders.length;
      const rate = totalAssigned > 0 ? Math.round((confirmed / totalAssigned) * 100) : (closer.conversionRate ?? 0);
      const totalCalls = closerOrders.reduce((acc, o) => acc + (o.callCount || 1), 0);

      return {
        closerId: closer.id,
        closerName: closer.name,
        phone: closer.phone,
        assignedOrders: totalAssigned,
        confirmedOrders: confirmed,
        cancelledOrders: cancelled,
        conversionRate: rate,
        callCount: totalCalls,
      };
    });

  const totalAssigned = closerPerformances.reduce((acc, c) => acc + c.assignedOrders, 0);
  const totalCalls = closerPerformances.reduce((acc, c) => acc + c.callCount, 0);
  const confirmedCount = closerPerformances.reduce((acc, c) => acc + c.confirmedOrders, 0);
  const cancelledCount = closerPerformances.reduce((acc, c) => acc + c.cancelledOrders, 0);
  const conversionRate = totalAssigned > 0 ? Math.round((confirmedCount / totalAssigned) * 100) : 0;

  return {
    totalAssigned,
    totalCalls,
    confirmedCount,
    cancelledCount,
    conversionRate,
    closerPerformances,
  };
}

// =============================================================================
// 🏢 4. MERCHANT ANALYTICS & E-COMMERÇANTS
// =============================================================================

export async function getMerchantAnalytics(filters: ReportFilterParams = {}): Promise<MerchantAnalytics> {
  const [allOrders, allPartners, allPayouts] = await Promise.all([
    getOrders(),
    getPartners(),
    getPayoutRequests(),
  ]);

  const orders = filterOrders(allOrders, filters);
  const payouts = filterPayouts(allPayouts, filters);

  const merchantPerformances: MerchantPerformanceMetric[] = allPartners
    .filter((p) => !filters.partnerId || filters.partnerId === "ALL" || p.id === filters.partnerId)
    .map((partner) => {
      const partnerOrders = orders.filter((o) => o.partnerId === partner.id);
      const delivered = partnerOrders.filter((o) => o.status === "LIVREE");
      const successRate = partnerOrders.length > 0 ? Math.round((delivered.length / partnerOrders.length) * 100) : (partner.deliverySuccessRate ?? 0);
      
      const totalGMV = delivered.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
      const enoCommissions = delivered.reduce((acc, o) => acc + (o.deliveryFee || 0) + (o.serviceFee || 0), 0);
      const netRevenue = Math.max(0, totalGMV - enoCommissions);

      const partnerPayouts = payouts.filter((p) => p.partnerId === partner.id);
      const paidPayoutsTotal = partnerPayouts.filter((p) => p.status === "PAID").reduce((acc, p) => acc + p.amount, 0);
      const pendingPayoutsTotal = partnerPayouts.filter((p) => p.status === "PENDING" || p.status === "APPROVED").reduce((acc, p) => acc + p.amount, 0);

      return {
        partnerId: partner.id,
        companyName: partner.companyName,
        contactName: partner.fullName,
        phone: partner.phone,
        city: partner.city,
        totalOrders: partnerOrders.length,
        deliveredOrders: delivered.length,
        successRate,
        totalGMV,
        enoCommissions,
        netRevenue,
        availableBalance: partner.availableBalance ?? 0,
        pendingBalance: partner.pendingBalance ?? 0,
        paidPayoutsTotal,
        pendingPayoutsTotal,
      };
    });

  const totalMerchants = allPartners.length;
  const activeMerchantsCount = allPartners.filter((p) => p.isActive).length;
  const totalGMV = merchantPerformances.reduce((acc, m) => acc + m.totalGMV, 0);
  const totalCommissions = merchantPerformances.reduce((acc, m) => acc + m.enoCommissions, 0);
  const totalNetRevenue = merchantPerformances.reduce((acc, m) => acc + m.netRevenue, 0);
  const totalAvailableBalances = merchantPerformances.reduce((acc, m) => acc + m.availableBalance, 0);

  return {
    totalMerchants,
    activeMerchantsCount,
    totalGMV,
    totalCommissions,
    totalNetRevenue,
    totalAvailableBalances,
    merchantPerformances,
  };
}

// =============================================================================
// 💰 5. FINANCIAL ANALYTICS & GRAND LIVRE
// =============================================================================

export async function getFinancialAnalytics(filters: ReportFilterParams = {}): Promise<FinancialAnalytics> {
  const [allOrders, allTxs, allPayouts] = await Promise.all([
    getOrders(),
    getTransactions(),
    getPayoutRequests(),
  ]);

  const orders = filterOrders(allOrders, filters);
  const txs = filterTransactions(allTxs, filters);
  const payouts = filterPayouts(allPayouts, filters);

  const deliveredOrders = orders.filter((o) => o.status === "LIVREE");
  const grossVolumeCOD = deliveredOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const enoRevenue = deliveredOrders.reduce((acc, o) => acc + (o.deliveryFee || 0) + (o.serviceFee || 0), 0);
  const netMerchants = Math.max(0, grossVolumeCOD - enoRevenue);

  const paidPayoutsTotal = payouts.filter((p) => p.status === "PAID").reduce((acc, p) => acc + p.amount, 0);
  const pendingPayoutsTotal = payouts.filter((p) => p.status === "PENDING" || p.status === "APPROVED").reduce((acc, p) => acc + p.amount, 0);

  const expensesTxs = txs.filter((t) => t.type === "DEPENSE");
  const totalExpenses = expensesTxs.reduce((acc, t) => acc + (t.outflow || 0), 0);

  const totalInflows = txs.reduce((acc, t) => acc + (t.inflow || 0), 0);
  const totalOutflows = txs.reduce((acc, t) => acc + (t.outflow || 0), 0);
  const netTreasuryBalance = totalInflows - totalOutflows;

  // Répartition des retraits par opérateur
  const opMap = new Map<string, { count: number; amount: number }>();
  payouts.forEach((p) => {
    const op = p.operator || "AUTRE";
    const current = opMap.get(op) || { count: 0, amount: 0 };
    current.count += 1;
    current.amount += p.amount || 0;
    opMap.set(op, current);
  });

  const operatorBreakdown = Array.from(opMap.entries()).map(([operator, data]) => ({
    operator,
    count: data.count,
    totalAmount: data.amount,
  }));

  // Cash Flow Time Series
  const cashFlowMap = new Map<string, { date: string; label: string; inflow: number; outflow: number; balanceAfter: number }>();
  txs.forEach((t) => {
    const dateKey = (t.date || "").slice(0, 10);
    if (!dateKey) return;
    const current = cashFlowMap.get(dateKey) || {
      date: dateKey,
      label: new Date(dateKey).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      inflow: 0,
      outflow: 0,
      balanceAfter: t.balanceAfter || 0,
    };
    current.inflow += t.inflow || 0;
    current.outflow += t.outflow || 0;
    current.balanceAfter = t.balanceAfter || current.balanceAfter;
    cashFlowMap.set(dateKey, current);
  });

  const cashFlowTimeSeries = Array.from(cashFlowMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    grossVolumeCOD,
    enoRevenue,
    netMerchants,
    paidPayoutsTotal,
    pendingPayoutsTotal,
    totalExpenses,
    netTreasuryBalance,
    transactionsCount: txs.length,
    cashFlowTimeSeries,
    operatorBreakdown,
  };
}

// =============================================================================
// 📑 6. GÉNÉRATEUR D'EXPORTS CSV RÉELS
// =============================================================================

export function generateCsvReport(type: string, data: any): string {
  if (!data) return "";

  const headers: string[] = [];
  const rows: string[][] = [];

  if (type === "orders" || type === "overview") {
    headers.push("Numero", "Date", "Client", "Telephone", "Ville", "Total_FCFA", "Livraison_FCFA", "Closing_FCFA", "Statut", "Partenaire");
    const ordersList: Order[] = Array.isArray(data) ? data : data.orders || [];
    ordersList.forEach((o) => {
      rows.push([
        `"${o.orderNumber}"`,
        `"${o.createdAt?.slice(0, 10) || ""}"`,
        `"${o.clientName || ""}"`,
        `"${o.clientPhone || ""}"`,
        `"${o.city || ""}"`,
        String(o.totalPrice || 0),
        String(o.deliveryFee || 0),
        String(o.serviceFee || 0),
        `"${o.status}"`,
        `"${o.partnerName || o.partnerId || ""}"`,
      ]);
    });
  } else if (type === "delivery") {
    headers.push("Livreur_ID", "Nom", "Telephone", "Zone", "Colis_Assignes", "Colis_Livres", "Colis_Echoues", "Taux_Succes_Pct", "Cash_Collecte_FCFA");
    const list: DriverPerformanceMetric[] = data.driverPerformances || [];
    list.forEach((d) => {
      rows.push([
        `"${d.driverId}"`,
        `"${d.driverName}"`,
        `"${d.phone}"`,
        `"${d.zone}"`,
        String(d.assignedCount),
        String(d.deliveredCount),
        String(d.failedCount),
        String(d.successRate),
        String(d.cashCollected),
      ]);
    });
  } else if (type === "closers") {
    headers.push("Closeuse_ID", "Nom", "Telephone", "Commandes_Assignees", "Confirmees", "Annulees", "Taux_Conversion_Pct", "Appels");
    const list: CloserPerformanceMetric[] = data.closerPerformances || [];
    list.forEach((c) => {
      rows.push([
        `"${c.closerId}"`,
        `"${c.closerName}"`,
        `"${c.phone}"`,
        String(c.assignedOrders),
        String(c.confirmedOrders),
        String(c.cancelledOrders),
        String(c.conversionRate),
        String(c.callCount),
      ]);
    });
  } else if (type === "merchants") {
    headers.push("Partenaire_ID", "Boutique", "Contact", "Telephone", "Commandes_Total", "Livrees", "Taux_Succes_Pct", "GMV_FCFA", "Commissions_ENO_FCFA", "Net_Marchand_FCFA", "Solde_Disponible_FCFA");
    const list: MerchantPerformanceMetric[] = data.merchantPerformances || [];
    list.forEach((m) => {
      rows.push([
        `"${m.partnerId}"`,
        `"${m.companyName}"`,
        `"${m.contactName}"`,
        `"${m.phone}"`,
        String(m.totalOrders),
        String(m.deliveredOrders),
        String(m.successRate),
        String(m.totalGMV),
        String(m.enoCommissions),
        String(m.netRevenue),
        String(m.availableBalance),
      ]);
    });
  } else if (type === "finance") {
    headers.push("Date", "Label", "Entrees_FCFA", "Sorties_FCFA", "Solde_Apres_FCFA");
    const list = data.cashFlowTimeSeries || [];
    list.forEach((item: any) => {
      rows.push([
        `"${item.date}"`,
        `"${item.label}"`,
        String(item.inflow || 0),
        String(item.outflow || 0),
        String(item.balanceAfter || 0),
      ]);
    });
  }

  const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  return csvContent;
}
