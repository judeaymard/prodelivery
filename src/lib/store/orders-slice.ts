import { Order, OrderStatus } from "../types";

export interface OrdersFilterOptions {
  status?: OrderStatus;
  searchQuery?: string;
  partnerId?: string;
  livreurId?: string;
}

export function filterOrders(orders: Order[], options: OrdersFilterOptions): Order[] {
  return orders.filter((o) => {
    if (options.status && o.status !== options.status) return false;
    if (options.partnerId && o.partnerId !== options.partnerId) return false;
    if (options.livreurId && o.assignedLivreurId !== options.livreurId) return false;
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      const match =
        o.id.toLowerCase().includes(q) ||
        o.orderNumber?.toLowerCase().includes(q) ||
        o.clientName?.toLowerCase().includes(q) ||
        o.clientPhone?.includes(q) ||
        o.city?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}
