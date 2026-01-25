-- CRM Database Schema for Dental Clinic
-- This schema extends the existing Quotation Tool database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CRM Leads (linked to quotations via customer data)
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  country TEXT DEFAULT 'VN',

  -- Lead Info
  source TEXT CHECK (source IN ('facebook', 'google', 'referral', 'walkin', 'website', 'chat')),
  source_detail TEXT,
  interest TEXT,
  estimated_value DECIMAL(15,2),
  priority TEXT DEFAULT 'warm' CHECK (priority IN ('hot', 'warm', 'cold')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'negotiating', 'won', 'lost')),

  -- Chat Integration
  chat_channel TEXT CHECK (chat_channel IN ('zalo', 'whatsapp', 'messenger', 'phone')),
  chat_conversation_id TEXT,
  last_chat_message TEXT,
  last_chat_time TIMESTAMPTZ,

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Follow-up
  next_follow_up TIMESTAMPTZ,
  last_contact TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Creator
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- CRM Activities (audit trail and interactions)
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'status_change', 'quotation_created', 'quotation_sent', 'quotation_accepted')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link CRM Leads to Quotations (existing table)
-- Only run this if quotations table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotations') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'crm_lead_id') THEN
      ALTER TABLE quotations ADD COLUMN crm_lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_priority ON crm_leads(priority);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_updated_at ON crm_leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_follow_up ON crm_leads(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_crm_leads_phone ON crm_leads(phone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON crm_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(type);

-- Index for quotations if column was added
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'crm_lead_id') THEN
    CREATE INDEX IF NOT EXISTS idx_quotations_crm_lead_id ON quotations(crm_lead_id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Users can view all leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can create leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can update leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can delete leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can view all activities" ON crm_activities;
DROP POLICY IF EXISTS "Users can create activities" ON crm_activities;

-- RLS Policies for crm_leads
CREATE POLICY "Users can view all leads" ON crm_leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create leads" ON crm_leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update leads" ON crm_leads
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete leads" ON crm_leads
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for crm_activities
CREATE POLICY "Users can view all activities" ON crm_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create activities" ON crm_activities
  FOR INSERT TO authenticated WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update status_updated_at when status changes
CREATE OR REPLACE FUNCTION update_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on crm_leads
DROP TRIGGER IF EXISTS update_crm_leads_updated_at ON crm_leads;
CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update status_updated_at when status changes
DROP TRIGGER IF EXISTS update_crm_leads_status_updated_at ON crm_leads;
CREATE TRIGGER update_crm_leads_status_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_status_updated_at();

-- Function to automatically create activity when lead status changes
CREATE OR REPLACE FUNCTION create_status_change_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO crm_activities (lead_id, type, title, description, metadata, created_by)
    VALUES (
      NEW.id,
      'status_change',
      'Status changed to ' || NEW.status,
      'Lead status updated from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
      NEW.assigned_to
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create activity on status change
DROP TRIGGER IF EXISTS create_lead_status_activity ON crm_leads;
CREATE TRIGGER create_lead_status_activity
  AFTER UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION create_status_change_activity();

-- Comments for documentation
COMMENT ON TABLE crm_leads IS 'CRM leads for the dental clinic sales pipeline';
COMMENT ON TABLE crm_activities IS 'Activity log and audit trail for CRM leads';
COMMENT ON COLUMN crm_leads.status IS 'Lead status in the sales pipeline: new, contacted, qualified, quoted, negotiating, won, lost';
COMMENT ON COLUMN crm_leads.priority IS 'Lead priority/temperature: hot, warm, cold';
COMMENT ON COLUMN crm_leads.source IS 'Lead acquisition source: facebook, google, referral, walkin, website, chat';
