-- ==========================================================
-- GuinéeGo LAT 2027 — SCHEMA DE BASE DE DONNEES POSTGRESQL
-- Compatible : Supabase / Neon.tech / PostgreSQL 15+
-- Coût hébergement : 0 GNF (Free Tier)
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('PDG', 'SUPER_ADMIN', 'ADMIN', 'TREASURY_MANAGER', 'CLOSEUSE', 'LIVREUR', 'PARTNER')),
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    partner_id VARCHAR(64),
    livreur_id VARCHAR(64),
    closeuse_id VARCHAR(64),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(64) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(32) NOT NULL,
    city VARCHAR(64) DEFAULT 'Conakry',
    address TEXT,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    reserved_balance NUMERIC(15, 2) DEFAULT 0.00,
    default_delivery_fee NUMERIC(10, 2) DEFAULT 1500.00,
    default_closing_fee NUMERIC(10, 2) DEFAULT 500.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(32) NOT NULL,
    zone VARCHAR(128) NOT NULL,
    secondary_zones TEXT[],
    vehicle VARCHAR(64) DEFAULT 'Moto',
    license_plate VARCHAR(32),
    cash_collected_today NUMERIC(15, 2) DEFAULT 0.00,
    assigned_orders_count INT DEFAULT 0,
    delivered_today_count INT DEFAULT 0,
    commission_per_delivery NUMERIC(10, 2) DEFAULT 1000.00,
    status VARCHAR(32) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'IN_TRANSIT', 'PAUSED', 'OFFLINE', 'UNAVAILABLE')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS closers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(32) NOT NULL,
    calls_today_count INT DEFAULT 0,
    confirmed_today_count INT DEFAULT 0,
    conversion_rate NUMERIC(5, 2) DEFAULT 0.00,
    commission_per_confirmation NUMERIC(10, 2) DEFAULT 500.00,
    status VARCHAR(32) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BUSY', 'PAUSED', 'OFFLINE', 'UNAVAILABLE')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(32) NOT NULL,
    region VARCHAR(128),
    city VARCHAR(64) NOT NULL,
    address TEXT NOT NULL,
    products TEXT NOT NULL,
    quantity INT DEFAULT 1,
    total_price NUMERIC(15, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 1500.00,
    service_fee NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'LIVREE', 'A_RAPPELER', 'REFUSEE', 'ANNULEE', 'RETOURNEE')),
    comment TEXT,
    partner_id VARCHAR(64) REFERENCES partners(id) ON DELETE RESTRICT,
    assigned_closeuse_id VARCHAR(64) REFERENCES closers(id) ON DELETE SET NULL,
    assigned_livreur_id VARCHAR(64) REFERENCES drivers(id) ON DELETE SET NULL,
    cod_collected BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_livreur ON orders(assigned_livreur_id);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(64) PRIMARY KEY,
    tx_reference VARCHAR(64) UNIQUE NOT NULL,
    partner_id VARCHAR(64) REFERENCES partners(id) ON DELETE RESTRICT,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('CREDIT_LIVRAISON', 'DEBIT_RETRAIT', 'DEBIT_COMMISSION', 'AJUSTEMENT', 'RETOUR_REMBOURSEMENT')),
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2),
    balance_after NUMERIC(15, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_partner ON financial_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_tx_reference ON financial_transactions(tx_reference);

CREATE TABLE IF NOT EXISTS payout_requests (
    id VARCHAR(64) PRIMARY KEY,
    partner_id VARCHAR(64) NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    partner_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    operator VARCHAR(32) NOT NULL DEFAULT 'LEEKPAY' CHECK (operator IN ('LEEKPAY', 'MTN', 'MOOV', 'WAVE', 'BINANCE_PAY', 'USDT')),
    phone VARCHAR(32),
    leekpay_phone VARCHAR(32),
    leekpay_country VARCHAR(8) DEFAULT 'BJ',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_VERIFICATION', 'APPROVED', 'IN_TREATMENT', 'VALIDATED', 'PAID', 'REJECTED', 'FAILED')),
    balance_before NUMERIC(15, 2),
    balance_after NUMERIC(15, 2),
    payment_reference VARCHAR(128),
    tx_reference VARCHAR(128),
    rejection_reason TEXT,
    internal_note TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payouts_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payouts_partner ON payout_requests(partner_id);

CREATE TABLE IF NOT EXISTS cod_remittances (
    id VARCHAR(64) PRIMARY KEY,
    livreur_id VARCHAR(64) NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    livreur_name VARCHAR(255) NOT NULL,
    amount_declared NUMERIC(15, 2) NOT NULL,
    amount_received NUMERIC(15, 2) DEFAULT 0.00,
    discrepancy NUMERIC(15, 2) DEFAULT 0.00,
    discrepancy_justification TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECEIVED', 'VALIDATED', 'DISCREPANCY_FLAGGED')),
    treasury_manager_id VARCHAR(64),
    treasury_manager_name VARCHAR(255),
    declared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    action_label VARCHAR(255) NOT NULL,
    module VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    entity_reference VARCHAR(128),
    severity VARCHAR(16) DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    result VARCHAR(16) DEFAULT 'SUCCESS' CHECK (result IN ('SUCCESS', 'FAILURE')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
