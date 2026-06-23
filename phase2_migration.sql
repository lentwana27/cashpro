-- ==========================================
-- CASHUP PRO V2 - PHASE 2 MIGRATION SCRIPT
-- RLS, Triggers, Indexes & Realtime Schema
-- ==========================================

-- 1. UPDATE ENUMS
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'HEAD_ACCOUNTANT';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'DIRECTOR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'AUDITOR';

-- 2. CREATE NEW TABLES FOR REAL-TIME & NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id), -- Null means role-based broadcast
    role_target user_role, -- Target specific roles if user_id is null
    branch_id UUID REFERENCES branches(id),
    event_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE variance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) NOT NULL,
    recon_date DATE NOT NULL,
    variance_amount NUMERIC(15, 2) NOT NULL,
    threshold_exceeded BOOLEAN DEFAULT TRUE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL, -- Generic entity reference (e.g., recon_id)
    entity_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_recon_dates_status ON daily_reconciliations(branch_id, recon_date, status);
CREATE INDEX idx_notifications_user_date ON notifications(user_id, created_at);
CREATE INDEX idx_exchange_rates_lookup ON exchange_rates(currency_code, valid_from);
CREATE INDEX idx_variance_alerts_branch_date ON variance_alerts(branch_id, recon_date);
CREATE INDEX idx_activity_feed_entity ON activity_feed(entity_id, entity_type);

-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE variance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Drop old basic policies from Phase 1 to apply comprehensive ones
DROP POLICY IF EXISTS "Supervisors read own branch recons" ON daily_reconciliations;
DROP POLICY IF EXISTS "Supervisors update evening shift" ON daily_reconciliations;
DROP POLICY IF EXISTS "Accountants view all recons" ON daily_reconciliations;
DROP POLICY IF EXISTS "Accountants update morning shift" ON daily_reconciliations;

-- POLICY: SUPERVISORS
-- Can only view/edit their own branch's reconciliations
CREATE POLICY "Supervisors view own branch" ON daily_reconciliations
    FOR SELECT TO authenticated
    USING (branch_id IN (SELECT branch_id FROM users WHERE id = auth.uid() AND role = 'SUPERVISOR'));

CREATE POLICY "Supervisors edit own branch pending" ON daily_reconciliations
    FOR UPDATE TO authenticated
    USING (branch_id IN (SELECT branch_id FROM users WHERE id = auth.uid() AND role = 'SUPERVISOR') 
           AND status IN ('PENDING_SUPERVISOR_APPROVAL', 'AMENDMENT_REQUIRED'));

-- POLICY: ACCOUNTANTS
-- Can view all, but edit only pending accountant status + amendment notes
CREATE POLICY "Accountants view all" ON daily_reconciliations
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ACCOUNTANT'));

CREATE POLICY "Accountants edit pending" ON daily_reconciliations
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ACCOUNTANT') 
           AND status = 'PENDING_ACCOUNTANT');

-- POLICY: HEAD ACCOUNTANTS
-- Can approve/flag any, mandate amendments
CREATE POLICY "Head Accountants view all" ON daily_reconciliations
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'HEAD_ACCOUNTANT'));

CREATE POLICY "Head Accountants edit all" ON daily_reconciliations
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'HEAD_ACCOUNTANT'));

-- POLICY: DIRECTORS
-- Can view all data, manage exchange rates
CREATE POLICY "Directors view all" ON daily_reconciliations
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'DIRECTOR'));

CREATE POLICY "Directors manage exchange rates" ON exchange_rates
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'DIRECTOR'));

-- POLICY: AUDITORS
-- Read-only access to all reconciliations and logs
CREATE POLICY "Auditors view all" ON daily_reconciliations
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'AUDITOR'));

CREATE POLICY "Auditors view logs" ON system_logs
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'AUDITOR'));

-- POLICY: ADMIN
-- Full access to everything
CREATE POLICY "Admins full access" ON daily_reconciliations
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));


-- 5. DATABASE TRIGGERS

-- A. Trigger: Notification on Status Change
CREATE OR REPLACE FUNCTION trg_notify_status_change() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Insert notification for role based on next step
        INSERT INTO notifications (role_target, branch_id, event_type, data)
        VALUES (
            CASE 
                WHEN NEW.status = 'PENDING_ACCOUNTANT' THEN 'ACCOUNTANT'::user_role 
                WHEN NEW.status = 'AMENDMENT_REQUIRED' THEN 'SUPERVISOR'::user_role
                WHEN NEW.status = 'APPROVED' THEN 'DIRECTOR'::user_role
                ELSE NULL
            END,
            NEW.branch_id,
            'STATUS_CHANGE',
            jsonb_build_object('recon_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_recon_status_change
    AFTER UPDATE OF status ON daily_reconciliations
    FOR EACH ROW EXECUTE FUNCTION trg_notify_status_change();

-- B. Trigger: Variance Alert if > 5%
CREATE OR REPLACE FUNCTION trg_check_variance() RETURNS TRIGGER AS $$
DECLARE
    threshold NUMERIC := 0.05;
    variance_pct NUMERIC;
BEGIN
    IF NEW.expected_cash_base > 0 THEN
        variance_pct := ABS(NEW.variance_base) / NEW.expected_cash_base;
        IF variance_pct > threshold THEN
            INSERT INTO variance_alerts (branch_id, recon_date, variance_amount, threshold_exceeded)
            VALUES (NEW.branch_id, NEW.recon_date, NEW.variance_base, TRUE);
            
            -- Notify Head Accountant and Director
            INSERT INTO notifications (role_target, branch_id, event_type, data)
            VALUES ('HEAD_ACCOUNTANT'::user_role, NEW.branch_id, 'HIGH_VARIANCE', jsonb_build_object('recon_id', NEW.id, 'variance', NEW.variance_base));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_variance_calculated
    AFTER UPDATE OF expected_cash_base, physical_cash_base ON daily_reconciliations
    FOR EACH ROW EXECUTE FUNCTION trg_check_variance();

-- C. Trigger: System Audit Logger
CREATE OR REPLACE FUNCTION trg_audit_log() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_logs (user_id, recon_id, action, table_name, old_data, new_data)
    VALUES (
        auth.uid(), -- Capture user from Supabase session
        NEW.id,
        TG_OP,
        TG_TABLE_NAME,
        row_to_json(OLD)::jsonb,
        row_to_json(NEW)::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_recon_changes
    AFTER UPDATE ON daily_reconciliations
    FOR EACH ROW EXECUTE FUNCTION trg_audit_log();

-- D. Trigger: Log Amendment Requests
CREATE OR REPLACE FUNCTION trg_log_amendment() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_feed (user_id, action_type, entity_id, entity_type)
    VALUES (auth.uid(), 'AMENDMENT_REQUESTED', NEW.id, 'AMENDMENT');
    
    INSERT INTO notifications (role_target, branch_id, event_type, data)
    VALUES ('SUPERVISOR'::user_role, (SELECT branch_id FROM daily_reconciliations WHERE id = NEW.recon_id), 'AMENDMENT_REQUIRED', jsonb_build_object('amendment_id', NEW.id, 'reason', NEW.reason));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_amendment_created
    AFTER INSERT ON amendments
    FOR EACH ROW EXECUTE FUNCTION trg_log_amendment();

-- 6. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE variance_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
