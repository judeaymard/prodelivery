import { NextRequest, NextResponse } from "next/server";
import { savePartner, savePlatformUser, getPartners, getPlatformUsers, saveGlobalAuditLog } from "@/lib/server-db";
import { createSessionToken, buildSessionCookie } from "@/lib/auth-service";
import { checkRateLimit } from "@/lib/rate-limiter";
import { Partner, PlatformUser, GlobalAuditLog } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = checkRateLimit(`register_${ip}`, 10, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Trop de tentatives d'inscription. Réessayez dans ${rateLimit.resetSeconds} secondes.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.resetSeconds) },
        }
      );
    }

    const body = await req.json();
    const { fullName, shopName, email, phone, password, city } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom complet du gérant est obligatoire." },
        { status: 400 }
      );
    }

    if (!shopName || !shopName.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom de la boutique ou entreprise est obligatoire." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Une adresse email valide est obligatoire." },
        { status: 400 }
      );
    }

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: "Un numéro de téléphone valide (ex: +229 01...) est obligatoire." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Le mot de passe doit comporter au moins 6 caractères." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanShop = shopName.trim();
    const cleanName = fullName.trim();
    const cleanCity = city?.trim() || "Conakry";

    const [existingPartners, existingUsers] = await Promise.all([
      getPartners(),
      getPlatformUsers(),
    ]);

    const emailTaken = existingPartners.some((p) => p.email?.toLowerCase() === cleanEmail) ||
      existingUsers.some((u) => u.email?.toLowerCase() === cleanEmail);

    if (emailTaken) {
      return NextResponse.json(
        { success: false, error: "Un compte partenaire existe déjà avec cette adresse email." },
        { status: 409 }
      );
    }

    const timestamp = Date.now();
    const partnerId = `usr-partner-${timestamp.toString().slice(-6)}`;
    const userId = `usr-${timestamp.toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const newPartner: Partner = {
      id: partnerId,
      fullName: cleanName,
      companyName: cleanShop,
      email: cleanEmail,
      phone: cleanPhone,
      address: `${cleanCity}, Guinée`,
      city: cleanCity,
      isActive: true,
      isApproved: true,
      status: "ACTIVE",
      createdAt: nowIso,
      availableBalance: 0,
      pendingBalance: 0,
      ordersCountToday: 0,
      ordersCountMonth: 0,
      deliverySuccessRate: 100,
    };

    const nameParts = cleanName.split(" ");
    const firstName = nameParts[0] || cleanName;
    const lastName = nameParts.slice(1).join(" ") || cleanName;

    const newPlatformUser: PlatformUser = {
      id: userId,
      firstName,
      lastName,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: "PARTNER",
      roleLabel: "Partenaire E-commerçant",
      status: "active",
      createdAt: nowIso,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };

    await Promise.all([
      savePartner(newPartner),
      savePlatformUser(newPlatformUser),
    ]);

    const auditEntry: GlobalAuditLog = {
      id: `audit-${timestamp}`,
      timestamp: new Date().toLocaleString("fr-FR"),
      isoDate: nowIso,
      actor: {
        id: partnerId,
        name: cleanName,
        role: "PARTNER",
        type: "USER",
      },
      action: "REGISTER_PARTNER",
      actionLabel: "Nouvelle inscription partenaire",
      module: "ECOMMERCE",
      entityType: "PARTNER",
      entityId: partnerId,
      entityReference: cleanShop,
      severity: "INFO",
      result: "SUCCESS",
      description: `Inscription partenaire : ${cleanShop} (${cleanEmail})`,
      ipAddress: ip,
      partnerId: partnerId,
      partnerName: cleanShop,
    };

    await saveGlobalAuditLog(auditEntry).catch(() => {});

    const token = await createSessionToken({
      userId: partnerId,
      email: cleanEmail,
      name: cleanShop,
      role: "PARTNER",
      partnerId: partnerId,
    });

    const cookieString = buildSessionCookie(token);

    const response = NextResponse.json({
      success: true,
      message: "Compte partenaire créé avec succès.",
      user: {
        id: partnerId,
        name: cleanShop,
        email: cleanEmail,
        role: "PARTNER",
      },
      redirectUrl: "/dashboard",
    });

    response.headers.set("Set-Cookie", cookieString);
    return response;
  } catch (error: any) {
    console.error("Erreur API inscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Une erreur interne est survenue lors de la création du compte.",
      },
      { status: 500 }
    );
  }
}
