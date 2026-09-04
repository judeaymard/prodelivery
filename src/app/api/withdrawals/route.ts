import { NextRequest, NextResponse } from "next/server";
import {
  getPayoutRequests,
  savePayoutRequest,
  updatePayoutRequest,
  getPlatformSettings,
  saveTransaction,
  getTransactions,
  saveGlobalAuditLog,
  saveNotification,
  getPartners,
  updatePartner,
} from "@/lib/server-db";
import { validateWithdrawalRequest } from "@/lib/pricing-service";
import { getPaymentProvider } from "@/lib/payment-providers";
import {
  PayoutRequest,
  PayoutStatus,
  PayoutOperator,
  FinancialTransaction,
  GlobalAuditLog,
  PlatformNotification,
  Partner,
} from "@/lib/types";

/**
 * Endpoint API Central des Retraits E-commerçants
 * ENO Livraison 2027 (Section 36.7 - 36.23)
 * Source de Vérité Unique pour l'Admin, l'E-commerçant et la Trésorerie
 */

export async function GET() {
  try {
    const [payouts, partners, transactions] = await Promise.all([
      getPayoutRequests(),
      getPartners(),
      getTransactions(),
    ]);
    return NextResponse.json({ success: true, payouts, partners, transactions });
  } catch (error) {
    console.error("Erreur GET /api/withdrawals:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des retraits." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      partnerId,
      partnerName,
      amount,
      operator,
      phone,
      countryCode = "+229",
      cryptoAddress,
      cryptoNetwork,
      binancePayId,
      binanceEmail,
      idempotencyKey,
    } = body;

    const [settings, partnersList, existingPayouts] = await Promise.all([
      getPlatformSettings(),
      getPartners(),
      getPayoutRequests(),
    ]);

    const realPartner = partnersList.find((p) => p.id === partnerId) || {
      id: partnerId || "p-default",
      companyName: partnerName || "Boutique Partenaire",
      isActive: true,
      availableBalance: 5000000,
    } as Partner;

    // 1. Validation stricte côté serveur avec la configuration active
    const validation = validateWithdrawalRequest(
      settings,
      realPartner,
      Number(amount),
      operator as PayoutOperator,
      { phone, cryptoAddress, cryptoNetwork, binancePayId, binanceEmail }
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(" | "), errors: validation.errors },
        { status: 400 }
      );
    }

    // 2. Contrôle d'Idempotence (éviter les doubles soumissions)
    const payoutId = idempotencyKey || `WDR-${Date.now().toString().slice(-6)}`;
    const duplicate = existingPayouts.find((p) => p.id === payoutId || p.txReference === idempotencyKey);
    if (duplicate) {
      return NextResponse.json({
        success: true,
        payout: duplicate,
        partner: realPartner,
        isDuplicate: true,
        message: "Demande de retrait déjà existante (Idempotence respectée).",
      });
    }

    // 3. Détermination du statut initial selon le mode de validation
    const initialStatus: PayoutStatus = validation.isAutoApproved ? "APPROVED" : "PENDING";
    const balanceBefore = realPartner.availableBalance ?? 0;
    const balanceAfter = Math.max(0, balanceBefore - Number(amount));

    // 🔒 Verrouillage Transactionnel du Solde Partenaire
    const updatedPartner = await updatePartner(realPartner.id, {
      availableBalance: balanceAfter,
    });

    const newPayout: PayoutRequest = {
      id: payoutId,
      partnerId: realPartner.id,
      partnerName: realPartner.companyName,
      amount: Number(amount),
      reservedAmount: Number(amount), // Verrouillage transactionnel
      operator: operator as PayoutOperator,
      phone,
      countryCode,
      cryptoAddress,
      cryptoNetwork,
      cryptoEstimatedUsdt: cryptoAddress ? Math.round(Number(amount) / 655) : undefined,
      binancePayId,
      binanceEmail,
      requestedAt: new Date().toISOString(),
      status: initialStatus,
      balanceBefore,
      balanceAfter,
      txReference: `TX-REQ-${Date.now().toString().slice(-6)}`,
    };

    await savePayoutRequest(newPayout);

    // 4. Notification centralisée
    const notif: PlatformNotification = {
      id: `notif-wdr-${Date.now()}`,
      category: "FINANCES",
      priority: validation.requiresDoubleValidation ? "CRITICAL" : "INFO",
      title: "Nouvelle demande de retrait",
      description: `Demande de retrait de ${Number(amount).toLocaleString("fr-FR")} FCFA initiée par ${realPartner.companyName} (${operator}).`,
      createdAt: "À l'instant",
      isoDate: new Date().toISOString(),
      isRead: false,
      actionUrl: "/admin/retraits",
      referenceType: "WITHDRAWAL",
      referenceId: newPayout.id,
    };
    await saveNotification(notif);

    // 5. Audit centralisé
    const audit: GlobalAuditLog = {
      id: `aud-wdr-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isoDate: new Date().toISOString(),
      actor: {
        id: realPartner.id,
        name: realPartner.companyName,
        role: "Marchand",
        type: "USER",
      },
      action: "WITHDRAWAL_CREATED",
      actionLabel: "Création de demande de retrait",
      module: "FINANCES",
      entityType: "PAYOUT",
      entityId: newPayout.id,
      entityReference: newPayout.id,
      severity: "INFO",
      result: "SUCCESS",
      description: `Demande de ${Number(amount).toLocaleString("fr-FR")} FCFA par ${operator}. Statut initial: ${initialStatus}. Solde réservé: ${Number(amount).toLocaleString("fr-FR")} FCFA.`,
      afterState: newPayout as any,
    };
    await saveGlobalAuditLog(audit);

    return NextResponse.json({
      success: true,
      payout: newPayout,
      partner: updatedPartner || realPartner,
      validation,
    });
  } catch (error) {
    console.error("Erreur POST /api/withdrawals:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la création du retrait." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      payoutId,
      action,
      paymentReference,
      confirmedAmount,
      rejectionReason,
      internalNote,
      adminName = "Direction ENO (Super Admin)",
    } = body;

    const [payouts, settings, partnersList] = await Promise.all([
      getPayoutRequests(),
      getPlatformSettings(),
      getPartners(),
    ]);

    const payout = payouts.find((p) => p.id === payoutId);
    if (!payout) {
      return NextResponse.json({ success: false, error: "Retrait introuvable." }, { status: 404 });
    }

    const partner = partnersList.find((p) => p.id === payout.partnerId);
    let updatedPayout: PayoutRequest | null = null;
    let updatedPartner: Partner | null = partner || null;

    if (action === "APPROVE") {
      updatedPayout = await updatePayoutRequest(payoutId, {
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
        internalNote: internalNote || payout.internalNote,
      });

      await saveGlobalAuditLog({
        id: `aud-app-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isoDate: new Date().toISOString(),
        actor: { id: "USR-PDG-001", name: adminName, role: "Super Admin", type: "USER" },
        action: "WITHDRAWAL_APPROVED",
        actionLabel: "Approbation de retrait",
        module: "FINANCES",
        entityType: "PAYOUT",
        entityId: payoutId,
        entityReference: payoutId,
        severity: "WARNING",
        result: "SUCCESS",
        description: `Demande de retrait de ${payout.amount.toLocaleString("fr-FR")} FCFA approuvée par la direction. Prêt pour décaissement.`,
      });
    } else if (action === "PROCESS_PAYOUT" || action === "PAY") {
      // Idempotency check: Don't repay if already paid
      if (payout.status === "PAID") {
        return NextResponse.json({
          success: true,
          payout,
          partner: updatedPartner,
          message: "Ce retrait est déjà marqué comme payé.",
        });
      }

      const isManual = Boolean(paymentReference);

      let providerRef = paymentReference || `REF-${Date.now().toString().slice(-6)}`;
      let executionSuccess = true;
      let executionMessage = "Virement manuel confirmé.";

      if (!isManual) {
        // Mode automatique: appel de l'adaptateur
        const provider = getPaymentProvider(payout.operator, settings);
        const execution = await provider.createPayout({
          payoutId: payout.id,
          amount: confirmedAmount || payout.amount,
          currency: "FCFA",
          recipient: {
            name: payout.partnerName,
            phone: payout.phone,
            countryCode: payout.countryCode,
            binancePayId: payout.binancePayId,
            binanceEmail: payout.binanceEmail,
            cryptoAddress: payout.cryptoAddress,
            cryptoNetwork: payout.cryptoNetwork,
          },
          idempotencyKey: payout.id,
        });

        executionSuccess = execution.status === "PAID";
        providerRef = execution.providerReference || providerRef;
        executionMessage = execution.message;
      }

      if (executionSuccess) {
        const finalStatus: PayoutStatus = "PAID";

        updatedPayout = await updatePayoutRequest(payoutId, {
          status: finalStatus,
          paidAt: new Date().toISOString(),
          paymentReference: providerRef,
          adminProcessorName: adminName,
          reservedAmount: 0,
          txReference: providerRef,
        });

        // Mettre à jour la date de dernier virement du partenaire
        if (payout.partnerId) {
          updatedPartner = await updatePartner(payout.partnerId, {
            lastPayoutDate: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
          });
        }

        // Écriture de la transaction financière
        const tx: FinancialTransaction = {
          id: `tx-${Date.now()}`,
          txReference: `TX-RET-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().replace("T", " ").slice(0, 16),
          type: "RETRAIT",
          label: `Retrait Marchand ${payout.partnerName} (${payout.operator})`,
          partnerId: payout.partnerId,
          partnerName: payout.partnerName,
          inflow: 0,
          outflow: payout.amount,
          balanceAfter: payout.balanceAfter ?? (updatedPartner?.availableBalance ?? 0),
          status: "COMPLETED",
          notes: `Règlement ${payout.operator}. Réf: ${providerRef}. ${executionMessage}. Traité par ${adminName}.`,
        };
        await saveTransaction(tx);

        // Notification
        await saveNotification({
          id: `notif-paid-${Date.now()}`,
          category: "FINANCES",
          priority: "INFO",
          title: "🏦 Retrait effectué",
          description: `Votre retrait de ${payout.amount.toLocaleString("fr-FR")} FCFA (${payout.operator}) a été payé avec succès. Réf: ${providerRef}.`,
          createdAt: "À l'instant",
          isoDate: new Date().toISOString(),
          isRead: false,
          actionUrl: "/admin/retraits",
          referenceType: "WITHDRAWAL",
          referenceId: payoutId,
        });

        // Audit
        await saveGlobalAuditLog({
          id: `aud-paid-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          isoDate: new Date().toISOString(),
          actor: { id: "USR-PDG-001", name: adminName, role: "Super Admin", type: "USER" },
          action: "WITHDRAWAL_PAID",
          actionLabel: "Paiement de retrait effectué",
          module: "FINANCES",
          entityType: "PAYOUT",
          entityId: payoutId,
          entityReference: payoutId,
          severity: "INFO",
          result: "SUCCESS",
          description: `Virement de ${payout.amount.toLocaleString("fr-FR")} FCFA validé (${payout.operator}). Réf: ${providerRef}.`,
        });
      } else {
        // Échec de l'exécution automatique
        updatedPayout = await updatePayoutRequest(payoutId, {
          status: "FAILED",
          rejectionReason: `Échec passerelle: ${executionMessage}`,
          reservedAmount: 0,
        });

        // Restitution du solde en cas d'échec
        if (payout.partnerId && partner) {
          const restoredBalance = (partner.availableBalance ?? 0) + (payout.reservedAmount ?? payout.amount);
          updatedPartner = await updatePartner(payout.partnerId, {
            availableBalance: restoredBalance,
          });
        }

        await saveGlobalAuditLog({
          id: `aud-fail-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          isoDate: new Date().toISOString(),
          actor: { id: "USR-PDG-001", name: adminName, role: "Super Admin", type: "USER" },
          action: "WITHDRAWAL_FAILED",
          actionLabel: "Échec du paiement de retrait",
          module: "FINANCES",
          entityType: "PAYOUT",
          entityId: payoutId,
          entityReference: payoutId,
          severity: "CRITICAL",
          result: "FAILED",
          description: `Échec du virement automatique de ${payout.amount} FCFA (${payout.operator}): ${executionMessage}. Solde restitué au marchand.`,
        });

        return NextResponse.json(
          {
            success: false,
            error: `Échec du virement automatique: ${executionMessage}`,
            payout: updatedPayout,
            partner: updatedPartner,
          },
          { status: 422 }
        );
      }
    } else if (action === "REJECT") {
      // Restitution du solde réservé
      updatedPayout = await updatePayoutRequest(payoutId, {
        status: "REJECTED",
        reservedAmount: 0,
        rejectionReason: rejectionReason || "Demande rejetée par la direction.",
      });

      if (payout.partnerId && partner) {
        const restoredBalance = (partner.availableBalance ?? 0) + (payout.reservedAmount ?? payout.amount);
        updatedPartner = await updatePartner(payout.partnerId, {
          availableBalance: restoredBalance,
        });
      }

      await saveNotification({
        id: `notif-rej-${Date.now()}`,
        category: "FINANCES",
        priority: "URGENT",
        title: "⚠️ Retrait rejeté",
        description: `Votre demande de retrait de ${payout.amount.toLocaleString("fr-FR")} FCFA a été rejetée. Motif: ${rejectionReason || "Non conforme"}. Les fonds ont été réintégrés à votre solde.`,
        createdAt: "À l'instant",
        isoDate: new Date().toISOString(),
        isRead: false,
        actionUrl: "/admin/retraits",
        referenceType: "WITHDRAWAL",
        referenceId: payoutId,
      });

      await saveGlobalAuditLog({
        id: `aud-rej-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isoDate: new Date().toISOString(),
        actor: { id: "USR-PDG-001", name: adminName, role: "Super Admin", type: "USER" },
        action: "WITHDRAWAL_REJECTED",
        actionLabel: "Demande de retrait rejetée",
        module: "FINANCES",
        entityType: "PAYOUT",
        entityId: payoutId,
        entityReference: payoutId,
        severity: "WARNING",
        result: "SUCCESS",
        description: `Retrait rejeté : ${rejectionReason || "Motif administratif"}. Montant restitué au solde marchand.`,
      });
    }

    return NextResponse.json({
      success: true,
      payout: updatedPayout,
      partner: updatedPartner,
    });
  } catch (error) {
    console.error("Erreur PATCH /api/withdrawals:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la mise à jour du retrait." },
      { status: 500 }
    );
  }
}
