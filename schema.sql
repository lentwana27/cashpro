-- ==========================================
-- CASHUP PRO V2 - POSTGRESQL SCHEMA PHASE 1
-- Optimized for Supabase Realtime & RLS
-- ==========================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('SUPERVISOR', 'ACCOUNTANT', 'ADMIN');
CREATE TYPE recon_status AS ENUM ('PENDING_SUPERVISOR_APPROVAL', 'PENDING_ACCOUNTANT', 'APPROVED', 'FLAGGED', 'AMENDMENT_REQUIRED');

-- 2. CORE SETUP TABLES
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    branch_id UUID REFERENCES branches(id), -- Only NOT NULL for supervisors
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE currencies (
    code VARCHAR(3) PRIMARY KEY, -- e.g., 'USD', 'ZAR', 'ZMW'
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5),
    is_base BOOLEAN DEFAULT FALSE
);

CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_code VARCHAR(3) REFERENCES currencies(code),
    rate_to_base NUMERIC(10, 6) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ, -- Null means current active rate
    updated_by UUID REFERENCES users(id)
);

-- 3. MAIN RECONCILIATION RECORD (State Machine & Rollup)
CREATE TABLE daily_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) NOT NULL,
    recon_date DATE NOT NULL,
    status recon_status DEFAULT 'PENDING_SUPERVISOR_APPROVAL',
    supervisor_id UUID REFERENCES users(id),
    accountant_id UUID REFERENCES users(id),
    
    -- Instant Calculation Fields (Base Currency)
    expected_cash_base NUMERIC(15, 2) DEFAULT 0,
    physical_cash_base NUMERIC(15, 2) DEFAULT 0,
    variance_base NUMERIC(15, 2) DEFAULT 0, -- physical - expected
    
    -- Metadata
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, recon_date)
);

-- Indexes for performance
CREATE INDEX idx_recon_branch_date ON daily_reconciliations(branch_id, recon_date);
CREATE INDEX idx_recon_status ON daily_reconciliations(status);
CREATE INDEX idx_recon_date ON daily_reconciliations(recon_date);

-- 4. EVENING SHIFT (SUPERVISOR DATA ENTRY)
CREATE TABLE recon_physical_cash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id) ON DELETE CASCADE,
    currency_code VARCHAR(3) REFERENCES currencies(code),
    amount NUMERIC(15, 2) NOT NULL,
    exchange_rate_used NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Business Logic: Base Value = amount / exchange_rate_used
);

CREATE TABLE recon_deposits_received (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id) ON DELETE CASCADE,
    deposit_reference VARCHAR(255) NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code),
    amount NUMERIC(15, 2) NOT NULL,
    exchange_rate_used NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recon_debtors_collected (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id) ON DELETE CASCADE,
    debtor_name VARCHAR(255) NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code),
    amount NUMERIC(15, 2) NOT NULL,
    exchange_rate_used NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recon_returns_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id) ON DELETE CASCADE,
    original_receipt_no VARCHAR(255),
    currency_code VARCHAR(3) REFERENCES currencies(code),
    amount NUMERIC(15, 2) NOT NULL,
    reason TEXT,
    exchange_rate_used NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MORNING SHIFT (ACCOUNTANT DATA ENTRY)
CREATE TABLE recon_sales_figures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- 'CASH', 'CARD', 'MOBILE_MONEY'
    currency_code VARCHAR(3) REFERENCES currencies(code),
    amount NUMERIC(15, 2) NOT NULL,
    exchange_rate_used NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recon_deposit_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id) ON DELETE CASCADE,
    claim_reference VARCHAR(255),
    currency_code VARCHAR(3) REFERENCES currencies(code),
    amount NUMERIC(15, 2) NOT NULL,
    exchange_rate_used NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recon_operational_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    currency_code VARCHAR(3) REFERENCES currencies(code),
    amount NUMERIC(15, 2) NOT NULL,
    exchange_rate_used NUMERIC(10, 6) NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recon_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code),
    amount NUMERIC(15, 2) NOT NULL,
    exchange_rate_used NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SYSTEM LOGS & AMENDMENT TRACKING
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    recon_id UUID REFERENCES daily_reconciliations(id),
    action VARCHAR(50) NOT NULL, -- e.g., 'STATUS_CHANGE', 'VALUE_UPDATE'
    table_name VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recon_id UUID REFERENCES daily_reconciliations(id),
    requested_by UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    previous_status recon_status NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WEBSOCKET REAL-TIME NOTIFICATIONS
CREATE TABLE websocket_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID REFERENCES users(id), -- Null means broadcast to role
    target_role user_role, -- Null means broadcast to specific user
    branch_id UUID REFERENCES branches(id),
    event_type VARCHAR(100) NOT NULL, -- 'STATUS_UPDATED', 'VARIANCE_FLAGGED'
    payload JSONB NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
