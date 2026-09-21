"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  User,
  Phone,
  PhoneCall,
  PhoneOff,
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  SlidersHorizontal,
  RotateCcw,
  MapPin,
  Package,
  Store,
  Truck,
  Copy,
  Check,
  Eye,
  ArrowUpDown,
  X,
  Flame,
  ChevronRight,
  Sparkles,
  History,
  CheckCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useOperations } from "@/lib/store";
import { Order, OrderStatus } from "@/lib/types";

// Formatage GNF standardisé
function formatCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Normalisation du téléphone pour déduplication fiable
function normalizePhone(phone?: string): string {
  if (!phone) return "";
  return phone.replace(/[^0-9]/g, "");
}

// Formatage d'une date ISO
function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " à " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return dateStr;
  }
}

// Structure d'un client dédoublé et agrégé
interface AggregatedClient {
  id: string; // key normalisée
  name: string;
  phone: string;
  normalizedPhone: string;
  orders: Order[];
  cities: string[];
  addresses: string[];
  partners: { id: string; name: string; count: number }[];
  totalOrders: number;
  deliveredCount: number;
  inDeliveryCount: number;
  pendingActionCount: number;
  cancelledCount: number;
  totalSpent: number;
  averageBasket: number;
  firstOrderDate: string;
  lastOrderDate: string;
  lastCallAt?: string;
  lastCallResult?: string;
  scheduledCallback?: string;
  hasPendingAction: boolean;
  isRecurring: boolean;
  activitySegment: "ACTIF" | "RECENT" | "INACTIF";
}

// Badge de Statut Commande
function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "EN_ATTENTE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
          <PhoneCall className="w-2.5 h-2.5" />
          À appeler
        </span>
      );
    case "A_RAPPELER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold border border-orange-200">
          <RefreshCw className="w-2.5 h-2.5" />
          À relancer
        </span>
      );
    case "CONFIRMEE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Confirmée
        </span>
      );
    case "EN_COURS":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
          <Truck className="w-2.5 h-2.5" />
          En cours
        </span>
      );
    case "LIVREE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <ShieldCheck className="w-2.5 h-2.5" />
          Livrée
        </span>
      );
    case "ANNULEE":
    case "REFUSEE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
          <XCircle className="w-2.5 h-2.5" />
          Annulée
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
          {status}
        </span>
      );
  }
}

// Badge de qualification d'appel
function getLastResultBadge(result?: string) {
  switch (result) {
    case "CONTACT_ESTABLISHED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          Joint & Confirmé
        </span>
      );
    case "NO_ANSWER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
          <PhoneOff className="w-2.5 h-2.5 text-amber-600" />
          Sans réponse
        </span>
      );
    case "CALLBACK_REQUESTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 text-[10px] font-bold border border-orange-200">
          <CalendarClock className="w-2.5 h-2.5 text-orange-600" />
          Rappel demandé
        </span>
      );
    case "WRONG_NUMBER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
          Numéro faux
        </span>
      );
    case "CLIENT_REFUSED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
          <XCircle className="w-2.5 h-2.5 text-slate-500" />
          Refus client
        </span>
      );
    default:
      return null;
  }
}

export default function ClientsPage() {
  const router = useRouter();
  const {
    orders,
    partners,
    logClosingCall,
    scheduleCallback,
    createOrder,
    activePartnerId,
  } = useOperations();

  // États de recherche & filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedSegment, setSelectedSegment] = useState<"ALL" | "RECURRING" | "SINGLE" | "ACTION_REQUIRED">("ALL");
  const [selectedFollowup, setSelectedFollowup] = useState<"ALL" | "TO_CALL" | "CALLBACK" | "DONE">("ALL");
  const [sortBy, setSortBy] = useState<"LAST_ORDER" | "ORDERS_COUNT" | "TOTAL_SPENT" | "NAME">("LAST_ORDER");
  const [showFilters, setShowFilters] = useState(false);

  // Tiroir détail client
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"OVERVIEW" | "ORDERS" | "TIMELINE">("OVERVIEW");

  // Modals d'actions
  const [clientForCall, setClientForCall] = useState<AggregatedClient | null>(null);
  const [clientForReschedule, setClientForReschedule] = useState<AggregatedClient | null>(null);
  const [clientForNewOrder, setClientForNewOrder] = useState<AggregatedClient | null>(null);

  // Formulaire d'appel rapide
  const [callResult, setCallResult] = useState<"CONTACT_ESTABLISHED" | "NO_ANSWER" | "CALLBACK_REQUESTED" | "WRONG_NUMBER" | "CLIENT_REFUSED">("CONTACT_ESTABLISHED");
  const [callNotes, setCallNotes] = useState("");
  const [callRescheduleDate, setCallRescheduleDate] = useState("");
  const [callRescheduleSlot, setCallRescheduleSlot] = useState("10h - 12h");

  // Formulaire de reprogrammation
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("14h - 16h");
  const [rescheduleNote, setRescheduleNote] = useState("");

  // Formulaire de nouvelle commande
  const [newOrderProduct, setNewOrderProduct] = useState("");
  const [newOrderPrice, setNewOrderPrice] = useState(15000);
  const [newOrderCity, setNewOrderCity] = useState("Conakry");
  const [newOrderAddress, setNewOrderAddress] = useState("");
  const [newOrderPartnerId, setNewOrderPartnerId] = useState("");

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // 1. DÉDOUBLONNAGE ET AGRÉGATION DES CLIENTS DEPUIS LES COMMANDES
  // -------------------------------------------------------------
  const aggregatedClients = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      phone: string;
      normalizedPhone: string;
      orders: Order[];
      citiesSet: Set<string>;
      addressesSet: Set<string>;
      partnersMap: Map<string, { id: string; name: string; count: number }>;
      firstOrderDate: string;
      lastOrderDate: string;
      lastCallAt?: string;
      lastCallResult?: string;
      scheduledCallback?: string;
    }>();

    orders.forEach((o) => {
      const normPhone = normalizePhone(o.clientPhone);
      const key = normPhone || (o.clientName || "inconnu").trim().toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: o.clientName || "Client Sans Nom",
          phone: o.clientPhone || "",
          normalizedPhone: normPhone,
          orders: [],
          citiesSet: new Set<string>(),
          addressesSet: new Set<string>(),
          partnersMap: new Map(),
          firstOrderDate: o.createdAt || "2026-09-01",
          lastOrderDate: o.createdAt || "2026-09-01",
          lastCallAt: o.lastCallAt,
          lastCallResult: o.lastCallResult,
          scheduledCallback: o.scheduledCallback,
        });
      }

      const client = map.get(key)!;
      client.orders.push(o);

      if (o.city) client.citiesSet.add(o.city.trim());
      if (o.address) client.addressesSet.add(o.address.trim());

      const pId = o.partnerId || "eno_direct";
      const pName = o.partnerName || "ENO Direct";
      const existingPartner = client.partnersMap.get(pId);
      if (existingPartner) {
        existingPartner.count++;
      } else {
        client.partnersMap.set(pId, { id: pId, name: pName, count: 1 });
      }

      if (o.createdAt && o.createdAt < client.firstOrderDate) {
        client.firstOrderDate = o.createdAt;
      }
      if (o.createdAt && o.createdAt > client.lastOrderDate) {
        client.lastOrderDate = o.createdAt;
      }
      if (o.lastCallAt && (!client.lastCallAt || o.lastCallAt > client.lastCallAt)) {
        client.lastCallAt = o.lastCallAt;
        client.lastCallResult = o.lastCallResult;
      }
      if (o.scheduledCallback && (!client.scheduledCallback || o.scheduledCallback > client.scheduledCallback)) {
        client.scheduledCallback = o.scheduledCallback;
      }
    });

    const list: AggregatedClient[] = [];

    map.forEach((item) => {
      // Trier les commandes par date décroissante
      const sortedOrders = [...item.orders].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });

      let deliveredCount = 0;
      let inDeliveryCount = 0;
      let pendingActionCount = 0;
      let cancelledCount = 0;
      let totalSpent = 0;

      sortedOrders.forEach((ord) => {
        if (ord.status === "LIVREE") deliveredCount++;
        else if (ord.status === "EN_COURS" || ord.status === "CONFIRMEE") inDeliveryCount++;
        else if (ord.status === "EN_ATTENTE" || ord.status === "A_RAPPELER") pendingActionCount++;
        else if (ord.status === "ANNULEE" || ord.status === "REFUSEE" || ord.status === "RETOURNEE") cancelledCount++;

        totalSpent += ord.totalPrice || 0;
      });

      const totalOrders = sortedOrders.length;
      const averageBasket = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
      const hasPendingAction = pendingActionCount > 0;
      const isRecurring = totalOrders > 1;

      // Détermination du segment d'activité
      let activitySegment: "ACTIF" | "RECENT" | "INACTIF" = "INACTIF";
      const now = new Date();
      const lastDate = new Date(item.lastOrderDate);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 30) {
        activitySegment = "ACTIF";
      } else if (diffDays <= 90) {
        activitySegment = "RECENT";
      }

      list.push({
        id: item.id,
        name: item.name,
        phone: item.phone,
        normalizedPhone: item.normalizedPhone,
        orders: sortedOrders,
        cities: Array.from(item.citiesSet),
        addresses: Array.from(item.addressesSet),
        partners: Array.from(item.partnersMap.values()),
        totalOrders,
        deliveredCount,
        inDeliveryCount,
        pendingActionCount,
        cancelledCount,
        totalSpent,
        averageBasket,
        firstOrderDate: item.firstOrderDate,
        lastOrderDate: item.lastOrderDate,
        lastCallAt: item.lastCallAt,
        lastCallResult: item.lastCallResult,
        scheduledCallback: item.scheduledCallback,
        hasPendingAction,
        isRecurring,
        activitySegment,
      });
    });

    return list;
  }, [orders]);

  // -------------------------------------------------------------
  // 2. VILLES & PARTENAIRES DISPONIBLES POUR LES FILTRES
  // -------------------------------------------------------------
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    aggregatedClients.forEach((c) => c.cities.forEach((ci) => set.add(ci)));
    return Array.from(set).sort();
  }, [aggregatedClients]);

  const availablePartners = useMemo(() => {
    const pMap = new Map<string, string>();
    aggregatedClients.forEach((c) => {
      c.partners.forEach((p) => pMap.set(p.id, p.name));
    });
    return Array.from(pMap.entries()).map(([id, name]) => ({ id, name }));
  }, [aggregatedClients]);

  // -------------------------------------------------------------
  // 3. KPI DYNAMIQUES RÉELS
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    const total = aggregatedClients.length;
    const recurring = aggregatedClients.filter((c) => c.isRecurring).length;
    const active = aggregatedClients.filter((c) => c.activitySegment === "ACTIF").length;
    const actionRequired = aggregatedClients.filter((c) => c.hasPendingAction).length;
    const newClients = aggregatedClients.filter((c) => !c.isRecurring).length;

    return {
      total,
      recurring,
      active,
      actionRequired,
      newClients,
    };
  }, [aggregatedClients]);

  // -------------------------------------------------------------
  // 4. FILTRAGE ET RECHERCHE TOLÉRANTE MULTI-CHAMPS
  // -------------------------------------------------------------
  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const queryDigits = query.replace(/[^0-9]/g, "");

    return aggregatedClients.filter((client) => {
      // 1. Recherche
      if (query) {
        const nameMatch = client.name.toLowerCase().includes(query);
        const cityMatch = client.cities.some((c) => c.toLowerCase().includes(query));
        const addressMatch = client.addresses.some((a) => a.toLowerCase().includes(query));
        const orderMatch = client.orders.some((o) =>
          o.orderNumber.toLowerCase().includes(query) || (o.products && o.products.toLowerCase().includes(query))
        );
        const phoneMatch = queryDigits ? client.normalizedPhone.includes(queryDigits) : false;

        if (!nameMatch && !cityMatch && !addressMatch && !orderMatch && !phoneMatch) {
          return false;
        }
      }

      // 2. Segment
      if (selectedSegment === "RECURRING" && !client.isRecurring) return false;
      if (selectedSegment === "SINGLE" && client.isRecurring) return false;
      if (selectedSegment === "ACTION_REQUIRED" && !client.hasPendingAction) return false;

      // 3. Ville
      if (selectedCity !== "ALL" && !client.cities.includes(selectedCity)) {
        return false;
      }

      // 4. Partenaire
      if (selectedPartner !== "ALL" && !client.partners.some((p) => p.id === selectedPartner)) {
        return false;
      }

      // 5. Suivi / Relance
      if (selectedFollowup === "TO_CALL") {
        const hasToCall = client.orders.some((o) => o.status === "EN_ATTENTE");
        if (!hasToCall) return false;
      } else if (selectedFollowup === "CALLBACK") {
        const hasCallback = client.orders.some((o) => o.status === "A_RAPPELER" || !!o.scheduledCallback);
        if (!hasCallback) return false;
      } else if (selectedFollowup === "DONE") {
        if (client.hasPendingAction) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "LAST_ORDER") {
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      }
      if (sortBy === "ORDERS_COUNT") {
        return b.totalOrders - a.totalOrders;
      }
      if (sortBy === "TOTAL_SPENT") {
        return b.totalSpent - a.totalSpent;
      }
      if (sortBy === "NAME") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [
    aggregatedClients,
    searchQuery,
    selectedSegment,
    selectedCity,
    selectedPartner,
    selectedFollowup,
    sortBy,
  ]);

  // Client sélectionné pour le tiroir de détail
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return aggregatedClients.find((c) => c.id === selectedClientId) || null;
  }, [aggregatedClients, selectedClientId]);

  // Commande prioritaire pour le client en cours d'action
  const getClientPendingOrder = (client: AggregatedClient): Order | null => {
    // 1. Chercher A_RAPPELER ou EN_ATTENTE
    const pending = client.orders.find((o) => o.status === "A_RAPPELER" || o.status === "EN_ATTENTE");
    if (pending) return pending;
    // 2. Sinon la plus récente
    return client.orders[0] || null;
  };

  // Copier téléphone
  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    showToast(`Numéro ${phone} copié`);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedPartner("ALL");
    setSelectedCity("ALL");
    setSelectedSegment("ALL");
    setSelectedFollowup("ALL");
    setSortBy("LAST_ORDER");
    showToast("Tous les filtres ont été réinitialisés");
  };

  // -------------------------------------------------------------
  // ACTIONS OPÉRATIONNELLES CONNECTÉES
  // -------------------------------------------------------------

  // Sauvegarder appel
  const handleSaveCallInteraction = () => {
    if (!clientForCall) return;
    const targetOrder = getClientPendingOrder(clientForCall);
    if (!targetOrder) return;

    let targetStatus: OrderStatus = "A_RAPPELER";
    let commentStr = "";
    let callbackDateToPersist: string | undefined = undefined;

    switch (callResult) {
      case "CONTACT_ESTABLISHED":
        targetStatus = "CONFIRMEE";
        commentStr = callNotes ? `Client joint et commande confirmée : ${callNotes}` : "Client joint et commande validée au téléphone";
        break;
      case "NO_ANSWER":
        targetStatus = "A_RAPPELER";
        commentStr = callNotes ? `Tentative appel sans réponse : ${callNotes}` : "Appel sans réponse (sonne dans le vide ou occupé)";
        break;
      case "CALLBACK_REQUESTED":
        targetStatus = "A_RAPPELER";
        callbackDateToPersist = callRescheduleDate ? `${callRescheduleDate}T10:00:00.000Z` : new Date().toISOString();
        commentStr = `Rappel demandé (${callRescheduleSlot || "créneau convenu"}). Note: ${callNotes || "Sans note"}`;
        break;
      case "WRONG_NUMBER":
        targetStatus = "ANNULEE";
        commentStr = callNotes ? `Numéro incorrect : ${callNotes}` : "Numéro faux, faux numéro ou injoignable définitivement";
        break;
      case "CLIENT_REFUSED":
        targetStatus = "ANNULEE";
        commentStr = callNotes ? `Refus client au téléphone : ${callNotes}` : "Le client a refusé la commande lors de l'appel";
        break;
    }

    logClosingCall(
      targetOrder.id,
      commentStr,
      targetStatus,
      undefined,
      targetStatus === "CONFIRMEE" ? "10h - 13h" : undefined,
      callbackDateToPersist,
      callResult
    );

    showToast(`Interaction téléphonique enregistrée pour ${clientForCall.name}`);
    setClientForCall(null);
    setCallNotes("");
    setCallRescheduleDate("");
  };

  // Reprogrammer relance
  const handleSaveReschedule = () => {
    if (!clientForReschedule) return;
    const targetOrder = getClientPendingOrder(clientForReschedule);
    if (!targetOrder) return;

    if (!rescheduleDate) {
      showToast("Veuillez sélectionner une date de relance");
      return;
    }

    const scheduledIso = `${rescheduleDate}T10:00:00.000Z`;
    const noteText = rescheduleNote
      ? `Relance planifiée au ${formatDate(rescheduleDate)} (${rescheduleSlot}) : ${rescheduleNote}`
      : `Relance planifiée au ${formatDate(rescheduleDate)} (${rescheduleSlot})`;

    scheduleCallback(targetOrder.id, scheduledIso, noteText);
    showToast(`Rappel programmé pour ${clientForReschedule.name} le ${formatDate(rescheduleDate)}`);
    setClientForReschedule(null);
    setRescheduleDate("");
    setRescheduleNote("");
  };

  // Créer une nouvelle commande pour ce client
  const handleCreateOrderForClient = () => {
    if (!clientForNewOrder) return;
    if (!newOrderProduct.trim()) {
      showToast("Veuillez indiquer le nom du produit");
      return;
    }

    const created = createOrder({
      clientName: clientForNewOrder.name,
      clientPhone: clientForNewOrder.phone,
      city: newOrderCity || clientForNewOrder.cities[0] || "",
      address: newOrderAddress || clientForNewOrder.addresses[0] || "",
      region: "Littoral",
      products: newOrderProduct.trim(),
      quantity: 1,
      totalPrice: Number(newOrderPrice) || 0,
      partnerId: newOrderPartnerId || clientForNewOrder.partners[0]?.id || activePartnerId,
      source: "ENO",
      status: "EN_ATTENTE",
      comment: `Commande créée directement depuis la fiche client ${clientForNewOrder.name}`,
    });

    showToast(`Commande ${created.orderNumber} créée avec succès pour ${clientForNewOrder.name}`);
    setClientForNewOrder(null);
    setNewOrderProduct("");
    setNewOrderAddress("");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* -------------------------------------------------------------
          HEADER DU MODULE CLIENTS
          ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/commercial" className="hover:text-slate-700">Command Center</Link>
            <span>/</span>
            <span className="text-slate-700">Clients</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Clients
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Retrouvez vos clients et consultez l'ensemble de leur historique avec GuinéeGo LAT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
              showFilters
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtres</span>
            {(selectedCity !== "ALL" || selectedPartner !== "ALL" || selectedSegment !== "ALL" || selectedFollowup !== "ALL") && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          <Link
            href="/commercial/commandes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Voir commandes</span>
          </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------
          5 KPI DYNAMIQUES & INTERACTIFS
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total clients */}
        <button
          onClick={() => {
            setSelectedSegment("ALL");
            setSelectedFollowup("ALL");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedSegment === "ALL" && selectedFollowup === "ALL"
              ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total clients</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Identifiés et dédoublés</div>
        </button>

        {/* Nouveaux clients */}
        <button
          onClick={() => {
            setSelectedSegment("SINGLE");
            setSelectedFollowup("ALL");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedSegment === "SINGLE"
              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Nouveaux clients</span>
            <User className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.newClients}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">1ère commande unique</div>
        </button>

        {/* Clients récurrents */}
        <button
          onClick={() => {
            setSelectedSegment("RECURRING");
            setSelectedFollowup("ALL");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedSegment === "RECURRING"
              ? "bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Clients récurrents</span>
            <RepeatIcon className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.recurring}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-0.5">&gt; 1 commande passée</div>
        </button>

        {/* Clients actifs */}
        <button
          onClick={() => {
            setSelectedSegment("ALL");
            setSelectedFollowup("ALL");
          }}
          className="p-3.5 rounded-2xl border border-slate-200 bg-white text-left shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Clients actifs</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.active}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Activité &lt; 30 jours</div>
        </button>

        {/* Clients à suivre */}
        <button
          onClick={() => {
            setSelectedSegment("ACTION_REQUIRED");
            setSelectedFollowup("ALL");
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedSegment === "ACTION_REQUIRED"
              ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700">Clients à suivre</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">{metrics.actionRequired}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Appel ou relance requis</div>
        </button>
      </div>

      {/* -------------------------------------------------------------
          BARRE DE RECHERCHE ET TIROIR DE FILTRES
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Champ recherche tolérante */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, téléphone (+229...), ville, adresse, référence de commande..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 w-full sm:w-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-400">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="LAST_ORDER">Dernière commande</option>
                <option value="ORDERS_COUNT">Nb de commandes</option>
                <option value="TOTAL_SPENT">Montant dépensé</option>
                <option value="NAME">Nom (A-Z)</option>
              </select>
            </div>

            {(searchQuery || selectedPartner !== "ALL" || selectedCity !== "ALL" || selectedSegment !== "ALL" || selectedFollowup !== "ALL") && (
              <button
                onClick={handleResetFilters}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                title="Réinitialiser tous les filtres"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tiroir de filtres déroulant */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Filtre Ville / Zone */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Ville / Zone
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Toutes les villes ({availableCities.length})</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Filtre E-commerçant */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                E-commerçant Partenaire
              </label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Tous les marchands ({availablePartners.length})</option>
                {availablePartners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Filtre Segment d'activité */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Segment Client
              </label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Tous les segments</option>
                <option value="RECURRING">Clients récurrents (&gt; 1 cmd)</option>
                <option value="SINGLE">Nouvelle commande unique (1 cmd)</option>
                <option value="ACTION_REQUIRED">Action commerciale requise</option>
              </select>
            </div>

            {/* Filtre Suivi & Relance */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Statut de Suivi
              </label>
              <select
                value={selectedFollowup}
                onChange={(e) => setSelectedFollowup(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Tous les suivis</option>
                <option value="TO_CALL">Nécessite un appel (À confirmer)</option>
                <option value="CALLBACK">Relance / Rappel programmé</option>
                <option value="DONE">Aucune action en attente</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          TABLEAU PRINCIPAL DES CLIENTS
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {filteredClients.length} client{filteredClients.length > 1 ? "s" : ""} trouvé{filteredClients.length > 1 ? "s" : ""}
            </span>
            {selectedSegment !== "ALL" && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                Segment filtré
              </span>
            )}
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Aucun client trouvé</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aucun client ne correspond à votre recherche ou aux filtres sélectionnés. Modifiez vos critères ou réinitialisez les filtres.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3 h-3" />
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Client & Contact</th>
                  <th className="py-3 px-3">Villes & Adresses</th>
                  <th className="py-3 px-3">E-commerçants</th>
                  <th className="py-3 px-3">Commandes</th>
                  <th className="py-3 px-3">Total Achats</th>
                  <th className="py-3 px-3">Dernière interaction</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const pendingOrder = getClientPendingOrder(client);

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => setSelectedClientId(client.id)}
                    >
                      {/* Client & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            client.isRecurring
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {client.name}
                              </span>
                              {client.isRecurring && (
                                <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[9px] font-black border border-purple-200">
                                  Récurrent ({client.totalOrders})
                                </span>
                              )}
                              {client.hasPendingAction && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Action commerciale requise" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[11px]">
                              <span>{client.phone}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPhone(client.id, client.phone);
                                }}
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                                title="Copier le numéro"
                              >
                                {copiedPhoneId === client.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Villes & Adresses */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5 max-w-[180px]">
                          <div className="flex items-center gap-1 text-slate-800 font-semibold truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{client.cities.join(", ") || "Non spécifiée"}</span>
                          </div>
                          {client.addresses.length > 0 && (
                            <div className="text-[10px] text-slate-400 truncate pl-4">
                              {client.addresses[0]}
                              {client.addresses.length > 1 && ` (+${client.addresses.length - 1})`}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* E-commerçants */}
                      <td className="py-3 px-3">
                        <div className="space-y-1 max-w-[170px]">
                          {client.partners.slice(0, 2).map((p) => (
                            <div key={p.id} className="flex items-center gap-1 text-[11px] text-slate-700 font-medium truncate">
                              <Store className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{p.name}</span>
                              {p.count > 1 && (
                                <span className="text-[9px] text-slate-400 font-bold">({p.count})</span>
                              )}
                            </div>
                          ))}
                          {client.partners.length > 2 && (
                            <div className="text-[10px] text-slate-400 pl-4">
                              +{client.partners.length - 2} autre{client.partners.length - 2 > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Commandes */}
                      <td className="py-3 px-3">
                        <div>
                          <div className="font-black text-slate-900">
                            {client.totalOrders} commande{client.totalOrders > 1 ? "s" : ""}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                            {client.deliveredCount > 0 && (
                              <span className="text-emerald-700 font-semibold" title="Livrées">
                                {client.deliveredCount} liv.
                              </span>
                            )}
                            {client.inDeliveryCount > 0 && (
                              <span className="text-blue-700 font-semibold" title="En cours / Confirmées">
                                {client.inDeliveryCount} en cours
                              </span>
                            )}
                            {client.pendingActionCount > 0 && (
                              <span className="text-amber-700 font-black" title="À traiter / Relance">
                                {client.pendingActionCount} à faire
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Achats */}
                      <td className="py-3 px-3">
                        <div>
                          <div className="font-black text-slate-900">
                            {formatCFA(client.totalSpent)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            P. moyen: {formatCFA(client.averageBasket)}
                          </div>
                        </div>
                      </td>

                      {/* Dernière interaction */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-800">
                            {formatDate(client.lastOrderDate)}
                          </div>
                          {client.lastCallResult ? (
                            <div>{getLastResultBadge(client.lastCallResult)}</div>
                          ) : client.scheduledCallback ? (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-800 text-[10px] font-bold border border-orange-200">
                              <Clock className="w-2.5 h-2.5 text-orange-600" />
                              Rappel {formatDate(client.scheduledCallback)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">Aucun appel récent</div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`tel:${client.phone}`}
                            onClick={() => {
                              setClientForCall(client);
                              setCallResult("CONTACT_ESTABLISHED");
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white transition-colors"
                            title="Appeler et consigner l'appel"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => {
                              setClientForReschedule(client);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-orange-600 hover:text-white transition-colors"
                            title="Planifier une relance"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setClientForNewOrder(client);
                              setNewOrderCity(client.cities[0] || "Conakry");
                              setNewOrderAddress(client.addresses[0] || "");
                              setNewOrderPartnerId(client.partners[0]?.id || activePartnerId);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                            title="Créer une commande pour ce client"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedClientId(client.id)}
                            className="p-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                            title="Voir la fiche détaillée"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          FICHE CLIENT DÉTAILLÉE (TIROIR LATÉRAL DROIT)
          ------------------------------------------------------------- */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-full sm:max-w-lg lg:max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header du Drawer */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm sm:text-base font-black shrink-0">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">{selectedClient.name}</h3>
                    {selectedClient.isRecurring && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black border border-purple-200">
                        Client VIP / Récurrent
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono font-medium">{selectedClient.phone}</span>
                    <span>•</span>
                    <span>Client depuis {formatDate(selectedClient.firstOrderDate)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${selectedClient.phone}`}
                  onClick={() => {
                    setClientForCall(selectedClient);
                    setCallResult("CONTACT_ESTABLISHED");
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Appeler</span>
                </a>
                <button
                  onClick={() => setSelectedClientId(null)}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Onglets du Drawer */}
            <div className="flex items-center border-b border-slate-100 px-3 sm:px-5 bg-white overflow-x-auto no-scrollbar">
              <button
                onClick={() => setDetailTab("OVERVIEW")}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  detailTab === "OVERVIEW"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Vue d'ensemble & Stats
              </button>
              <button
                onClick={() => setDetailTab("ORDERS")}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  detailTab === "ORDERS"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Commandes</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                  {selectedClient.totalOrders}
                </span>
              </button>
              <button
                onClick={() => setDetailTab("TIMELINE")}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  detailTab === "TIMELINE"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Historique Commercial
              </button>
            </div>

            {/* Contenu de la Fiche Client */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {detailTab === "OVERVIEW" && (
                <div className="space-y-5">
                  {/* Cartes métriques réelles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dépensé</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{formatCFA(selectedClient.totalSpent)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Sur {selectedClient.totalOrders} commande{selectedClient.totalOrders > 1 ? "s" : ""}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Panier Moyen</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{formatCFA(selectedClient.averageBasket)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Par commande passée</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taux de Succès</div>
                      <div className="text-lg font-black text-emerald-600 mt-1">
                        {selectedClient.totalOrders > 0
                          ? `${Math.round((selectedClient.deliveredCount / selectedClient.totalOrders) * 100)}%`
                          : "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{selectedClient.deliveredCount} livrée{selectedClient.deliveredCount > 1 ? "s" : ""}</div>
                    </div>
                  </div>

                  {/* Localisation & Adresses connues */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Villes & Adresses de livraison
                    </h4>
                    <div className="space-y-2 pt-1">
                      {selectedClient.addresses.map((addr, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="w-5 h-5 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900">{addr}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Ville : {selectedClient.cities[idx] || selectedClient.cities[0] || "Conakry"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marchands fréquentés */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-600" />
                      E-commerçants fréquentés
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {selectedClient.partners.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-bold border border-slate-200">
                            {p.count} commande{p.count > 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suivi opérationnel & Prochaines actions */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-orange-600" />
                      Statut d'action & Relances
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {selectedClient.hasPendingAction ? "Action commerciale immédiate requise" : "Client à jour"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {selectedClient.scheduledCallback
                            ? `Relance planifiée pour le ${formatDateTime(selectedClient.scheduledCallback)}`
                            : selectedClient.lastCallAt
                            ? `Dernier appel le ${formatDateTime(selectedClient.lastCallAt)}`
                            : "Aucun appel ni relance en cours"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setClientForReschedule(selectedClient)}
                          className="px-2.5 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold hover:bg-orange-100 transition-colors"
                        >
                          Programmer rappel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "ORDERS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Historique des {selectedClient.orders.length} commandes
                    </span>
                    <button
                      onClick={() => {
                        setClientForNewOrder(selectedClient);
                        setNewOrderCity(selectedClient.cities[0] || "Conakry");
                        setNewOrderAddress(selectedClient.addresses[0] || "");
                        setNewOrderPartnerId(selectedClient.partners[0]?.id || activePartnerId);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Nouvelle commande
                    </button>
                  </div>

                  {selectedClient.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-xs">{ord.orderNumber}</span>
                          {getStatusBadge(ord.status)}
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-800">{formatCFA(ord.totalPrice)}</span>
                      </div>

                      <div className="text-xs text-slate-600">
                        <div className="font-medium text-slate-800">{ord.products}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ord.city} — {ord.address}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Marchand : {ord.partnerName || "N/A"}</span>
                        <span>{formatDateTime(ord.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === "TIMELINE" && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-500 mb-2">Historique d'activité & d'appels</div>
                  <div className="space-y-3">
                    {selectedClient.orders.map((ord) => (
                      <div key={ord.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">{ord.orderNumber}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(ord.createdAt)}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          <div>Statut actuel : <strong className="text-slate-900">{ord.status}</strong></div>
                          {ord.lastCallResult && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span>Dernier appel :</span>
                              {getLastResultBadge(ord.lastCallResult)}
                            </div>
                          )}
                          {ord.closingNotes && (
                            <div className="mt-1.5 p-2 rounded-xl bg-white border border-slate-200 text-[11px] italic text-slate-700">
                              "{ord.closingNotes}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pied du Drawer avec Actions Directes */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sticky bottom-0">
              <button
                onClick={() => {
                  setClientForCall(selectedClient);
                  setCallResult("CONTACT_ESTABLISHED");
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                Appeler client
              </button>
              <button
                onClick={() => setClientForReschedule(selectedClient)}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Programmer relance
              </button>
              <button
                onClick={() => {
                  setClientForNewOrder(selectedClient);
                  setNewOrderCity(selectedClient.cities[0] || "Conakry");
                  setNewOrderAddress(selectedClient.addresses[0] || "");
                  setNewOrderPartnerId(selectedClient.partners[0]?.id || activePartnerId);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Créer une commande"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Commande</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 1: APPELER ET QUALIFIER L'INTERACTION
          ------------------------------------------------------------- */}
      {clientForCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-full sm:max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Enregistrer l'Appel</h3>
                  <p className="text-[11px] text-slate-500">Client : {clientForCall.name}</p>
                </div>
              </div>
              <button
                onClick={() => setClientForCall(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Numéro Client</div>
                  <div className="text-sm font-mono font-bold text-emerald-950">{clientForCall.phone}</div>
                </div>
                <a
                  href={`tel:${clientForCall.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <Phone className="w-3 h-3" />
                  Composer
                </a>
              </div>

              {/* Sélection du Résultat d'Appel */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Résultat de la communication :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCallResult("CONTACT_ESTABLISHED")}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      callResult === "CONTACT_ESTABLISHED"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400 font-bold"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Joint & Confirmé</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Valide la commande</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallResult("NO_ANSWER")}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      callResult === "NO_ANSWER"
                        ? "bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400 font-bold"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <PhoneOff className="w-3.5 h-3.5 text-amber-600" />
                      <span>Sans réponse</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Reste à relancer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallResult("CALLBACK_REQUESTED")}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      callResult === "CALLBACK_REQUESTED"
                        ? "bg-orange-50 border-orange-400 text-orange-900 ring-1 ring-orange-400 font-bold"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <CalendarClock className="w-3.5 h-3.5 text-orange-600" />
                      <span>Rappel demandé</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Programmer date</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallResult("CLIENT_REFUSED")}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      callResult === "CLIENT_REFUSED"
                        ? "bg-slate-100 border-slate-400 text-slate-900 ring-1 ring-slate-400 font-bold"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Refus client</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Annule la commande</div>
                  </button>
                </div>
              </div>

              {/* Si rappel demandé */}
              {callResult === "CALLBACK_REQUESTED" && (
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 space-y-2">
                  <div className="text-xs font-bold text-orange-900">Quand rappeler le client ?</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={callRescheduleDate}
                      onChange={(e) => setCallRescheduleDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-orange-300 text-xs font-bold text-slate-800"
                    />
                    <select
                      value={callRescheduleSlot}
                      onChange={(e) => setCallRescheduleSlot(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-orange-300 text-xs font-bold text-slate-800"
                    >
                      <option value="08h - 10h">Matin (08h - 10h)</option>
                      <option value="10h - 12h">Midi (10h - 12h)</option>
                      <option value="14h - 16h">Après-midi (14h - 16h)</option>
                      <option value="16h - 19h">Soir (16h - 19h)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Note d'appel */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note d'appel & Détails :
                </label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Client disponible demain matin à Cadjehoun, valider 2 unités..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setClientForCall(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors text-center"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveCallInteraction}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                Enregistrer l'interaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 2: PROGRAMMER UNE RELANCE
          ------------------------------------------------------------- */}
      {clientForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-full sm:max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Programmer un Rappel</h3>
                  <p className="text-[11px] text-slate-500">{clientForReschedule.name}</p>
                </div>
              </div>
              <button
                onClick={() => setClientForReschedule(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date de relance :
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Créneau horaire :
                </label>
                <select
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="08h - 10h">Matinée (08h - 10h)</option>
                  <option value="10h - 12h">Fin de matinée (10h - 12h)</option>
                  <option value="14h - 16h">Après-midi (14h - 16h)</option>
                  <option value="16h - 19h">Fin d'après-midi (16h - 19h)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instruction / Motif :
                </label>
                <input
                  type="text"
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  placeholder="Ex: Le client est en réunion, rappeler impérativement"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setClientForReschedule(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors text-center"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveReschedule}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors shadow-xs"
              >
                Confirmer la relance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 3: CRÉER COMMANDE POUR CE CLIENT
          ------------------------------------------------------------- */}
      {clientForNewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-full sm:max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Nouvelle Commande Client</h3>
                  <p className="text-[11px] text-slate-500">{clientForNewOrder.name} ({clientForNewOrder.phone})</p>
                </div>
              </div>
              <button
                onClick={() => setClientForNewOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Produit(s) commandé(s) :
                </label>
                <input
                  type="text"
                  value={newOrderProduct}
                  onChange={(e) => setNewOrderProduct(e.target.value)}
                  placeholder="Ex: Montre Connectée Pro V3"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prix Total (GNF) :
                  </label>
                  <input
                    type="number"
                    value={newOrderPrice}
                    onChange={(e) => setNewOrderPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ville :
                  </label>
                  <select
                    value={newOrderCity}
                    onChange={(e) => setNewOrderCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value="Conakry">Cotonou</option>
                    <option value="Kankan">Kankan</option>
                    <option value="Mamou">Mamou</option>
                    <option value="Ouidah">Ouidah</option>
                    <option value="Parakou">Parakou</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse de livraison :
                </label>
                <input
                  type="text"
                  value={newOrderAddress}
                  onChange={(e) => setNewOrderAddress(e.target.value)}
                  placeholder="Ex: Haie Vive, Rue 450"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marchand Partenaire :
                </label>
                <select
                  value={newOrderPartnerId}
                  onChange={(e) => setNewOrderPartnerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.companyName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setClientForNewOrder(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors text-center"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateOrderForClient}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
              >
                Enregistrer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper pour l'icône Repeat
function RepeatIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
