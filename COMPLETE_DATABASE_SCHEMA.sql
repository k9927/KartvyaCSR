-- =============================================
-- COMPLETE DATABASE SCHEMA FOR NEON POSTGRESQL
-- =============================================
-- This file contains all table definitions needed for the Kartvya CSR Platform
-- Run this script on your Neon PostgreSQL database to set up the complete schema
-- =============================================

-- =============================================
-- 1. USERS TABLE (Base authentication table)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user', 'ngo', 'corporate'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- =============================================
-- 2. NGO PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ngo_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  pan_number VARCHAR(20),
  phone VARCHAR(20),
  description TEXT,
  establishment_year INTEGER,
  focus_area VARCHAR(100), -- education, healthcare, environment, etc.
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  -- Enhanced fields for Corporate Dashboard
  tagline VARCHAR(255),
  impact_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 5.0
  verified BOOLEAN DEFAULT false,
  logo_path VARCHAR(500),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_ngo_profiles_user_id ON ngo_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_profiles_focus_area ON ngo_profiles(focus_area);
CREATE INDEX IF NOT EXISTS idx_ngo_profiles_verified ON ngo_profiles(verified);

-- =============================================
-- 3. CORPORATE PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS corporate_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  cin_number VARCHAR(50),
  website VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  csr_budget VARCHAR(50), -- e.g., "0-50L", "50L-1Cr"
  committee_size INTEGER,
  primary_focus_area VARCHAR(100), -- education, healthcare, etc.
  preferred_region VARCHAR(100), -- north, south, east, west, central, northeast
  -- Enhanced fields
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  logo_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_corporate_profiles_user_id ON corporate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_corporate_profiles_focus_area ON corporate_profiles(primary_focus_area);

-- =============================================
-- 4. PROJECTS TABLE (NGO Projects)
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  ngo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- references users table
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  focus_area VARCHAR(100) NOT NULL,
  target_region VARCHAR(100), -- north, south, etc.
  budget_required NUMERIC(15,2),
  duration_months INTEGER,
  status VARCHAR(50) DEFAULT 'draft', -- draft, open, active, completed, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- Additional fields for enhanced functionality
  location VARCHAR(255), -- "Mumbai, Maharashtra"
  region VARCHAR(100), -- north, south, etc. (if different from target_region)
  budget_display VARCHAR(50), -- "₹ 35,00,000" for display
  beneficiaries_count INTEGER,
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0 -- 0-100
);

CREATE INDEX IF NOT EXISTS idx_projects_ngo_id ON projects(ngo_id);
CREATE INDEX IF NOT EXISTS idx_projects_focus_area ON projects(focus_area);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_target_region ON projects(target_region);
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);

-- =============================================
-- 5. CSR REQUESTS TABLE
-- =============================================
-- Corporates send funding requests to NGOs (before acceptance)
CREATE TABLE IF NOT EXISTS csr_requests (
  id SERIAL PRIMARY KEY,
  corporate_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, -- optional: for specific project
  proposed_budget NUMERIC(15,2) NOT NULL,
  budget_display VARCHAR(50), -- "₹ 15,00,000"
  message TEXT, -- optional message from corporate
  description VARCHAR(500), -- "Mobile Health Clinics for Rural Areas"
  status VARCHAR(50) DEFAULT 'pending', -- pending | accepted | rejected | withdrawn
  corporate_feedback TEXT,
  ngo_response TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  CONSTRAINT unique_pending_request UNIQUE NULLS NOT DISTINCT (corporate_user_id, ngo_user_id, status) 
    WHERE status = 'pending'
);

CREATE INDEX IF NOT EXISTS idx_csr_requests_corporate ON csr_requests(corporate_user_id);
CREATE INDEX IF NOT EXISTS idx_csr_requests_ngo ON csr_requests(ngo_user_id);
CREATE INDEX IF NOT EXISTS idx_csr_requests_status ON csr_requests(status);
CREATE INDEX IF NOT EXISTS idx_csr_requests_project ON csr_requests(project_id);

-- =============================================
-- 6. CSR FUNDING TABLE
-- =============================================
-- Tracks committed/disbursed funding (after CSR request is accepted)
CREATE TABLE IF NOT EXISTS csr_funding (
  id SERIAL PRIMARY KEY,
  corporate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  funding_amount NUMERIC(15,2) NOT NULL,
  funding_status VARCHAR(50) DEFAULT 'committed', -- committed, disbursed, completed
  committed_date DATE,
  disbursed_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csr_funding_corporate ON csr_funding(corporate_id);
CREATE INDEX IF NOT EXISTS idx_csr_funding_project ON csr_funding(project_id);
CREATE INDEX IF NOT EXISTS idx_csr_funding_status ON csr_funding(funding_status);

-- =============================================
-- 7. ACTIVE PARTNERSHIPS TABLE
-- =============================================
-- When CSR request is accepted, create an active partnership
CREATE TABLE IF NOT EXISTS active_partnerships (
  id SERIAL PRIMARY KEY,
  csr_request_id INTEGER REFERENCES csr_requests(id) ON DELETE CASCADE,
  csr_funding_id INTEGER REFERENCES csr_funding(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  corporate_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partnership_name VARCHAR(255), -- name of collaboration
  agreed_budget NUMERIC(15,2) NOT NULL,
  budget_display VARCHAR(50), -- "₹ 3,00,000"
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active | completed | terminated
  progress INTEGER DEFAULT 0, -- 0-100
  corporate_contact JSONB, -- { name, email, phone }
  ngo_contact JSONB, -- { name, email, phone }
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partnerships_corporate ON active_partnerships(corporate_user_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_ngo ON active_partnerships(ngo_user_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON active_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_partnerships_funding ON active_partnerships(csr_funding_id);

-- =============================================
-- 8. DOCUMENTS TABLE
-- =============================================
-- Store files related to partnerships/projects (MoU, reports, proposals)
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  document_type_id INTEGER, -- references document_types if you have that table
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  upload_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  verification_notes TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  -- Additional fields for linking to projects/partnerships
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  partnership_id INTEGER REFERENCES active_partnerships(id) ON DELETE CASCADE,
  csr_request_id INTEGER REFERENCES csr_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_partnership ON documents(partnership_id);
CREATE INDEX IF NOT EXISTS idx_documents_csr_request ON documents(csr_request_id);

-- =============================================
-- 9. PARTNERSHIP UPDATES TABLE
-- =============================================
-- Track progress updates, milestones, communication
CREATE TABLE IF NOT EXISTS partnership_updates (
  id SERIAL PRIMARY KEY,
  partnership_id INTEGER NOT NULL REFERENCES active_partnerships(id) ON DELETE CASCADE,
  posted_by_user_id INTEGER NOT NULL REFERENCES users(id),
  update_type VARCHAR(50), -- progress_update, milestone, message, document_upload
  title VARCHAR(255),
  content TEXT NOT NULL,
  progress_percentage INTEGER, -- if progress update
  attachments JSONB, -- array of document IDs or file paths
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_updates_partnership ON partnership_updates(partnership_id);
CREATE INDEX IF NOT EXISTS idx_updates_posted_by ON partnership_updates(posted_by_user_id);

-- =============================================
-- 10. CORPORATE SAVED NGOS TABLE
-- =============================================
-- Corporates can save/bookmark NGOs for later
CREATE TABLE IF NOT EXISTS corporate_saved_ngos (
  id SERIAL PRIMARY KEY,
  corporate_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (corporate_user_id, ngo_user_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_ngos_corporate ON corporate_saved_ngos(corporate_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_ngos_ngo ON corporate_saved_ngos(ngo_user_id);

-- =============================================
-- 11. PROJECT MESSAGES TABLE
-- =============================================
-- Messages between corporates and NGOs about projects
CREATE TABLE IF NOT EXISTS project_messages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_type VARCHAR(20), -- 'corporate' or 'ngo'
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_messages_project ON project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_sender ON project_messages(sender_id);

-- =============================================
-- 12. CORPORATE ACTIVITY LOG TABLE
-- =============================================
-- Activity log for corporate dashboard
CREATE TABLE IF NOT EXISTS corporate_activity_log (
  id SERIAL PRIMARY KEY,
  corporate_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  icon VARCHAR(10) DEFAULT 'ℹ️',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_corporate ON corporate_activity_log(corporate_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON corporate_activity_log(created_at);

-- =============================================
-- 13. DOCUMENT TYPES TABLE
-- =============================================
-- Document type definitions for categorization
CREATE TABLE IF NOT EXISTS document_types (
  id SERIAL PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Registration Certificate', 'PAN Card', 'CSR Policy'
  description TEXT,
  category VARCHAR(50), -- 'registration', 'verification', 'partnership', etc.
  is_required BOOLEAN DEFAULT false,
  applicable_to VARCHAR(50), -- 'ngo', 'corporate', 'both'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert common document types
INSERT INTO document_types (type_name, description, category, is_required, applicable_to) VALUES
  ('Registration Certificate', 'Organization registration certificate', 'registration', true, 'ngo'),
  ('PAN Card', 'Permanent Account Number card', 'verification', true, 'both'),
  ('CSR Policy', 'Corporate Social Responsibility policy document', 'registration', true, 'corporate'),
  ('Trust Deed', 'Trust deed certificate', 'verification', false, 'ngo'),
  ('12A Certificate', '12A tax exemption certificate', 'verification', false, 'ngo'),
  ('80G Certificate', '80G tax exemption certificate', 'verification', false, 'ngo'),
  ('16A Certificate', '16A tax exemption certificate', 'verification', false, 'ngo'),
  ('MoU', 'Memorandum of Understanding', 'partnership', false, 'both'),
  ('Progress Report', 'Project progress report', 'partnership', false, 'both'),
  ('Financial Statement', 'Financial statements and reports', 'verification', false, 'both')
ON CONFLICT (type_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_document_types_category ON document_types(category);
CREATE INDEX IF NOT EXISTS idx_document_types_applicable_to ON document_types(applicable_to);

-- Update documents table to reference document_types (if constraint doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_document_type_id_fkey'
  ) THEN
    ALTER TABLE documents 
    ADD CONSTRAINT documents_document_type_id_fkey 
    FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================
-- 14. USER ACTIVITY LOGS TABLE
-- =============================================
-- General audit trail for all user activities
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'register', 'update_profile', 'create_project', etc.
  description TEXT,
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  metadata JSONB, -- Additional activity-specific data
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- =============================================
-- 15. USER STATUS LOGS TABLE (Optional - for admin tracking)
-- =============================================
-- Track status changes made by admins
CREATE TABLE IF NOT EXISTS user_status_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Admin who made the change
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL, -- 'pending', 'verified', 'rejected', 'suspended'
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_status_logs_user_id ON user_status_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_logs_changed_by ON user_status_logs(changed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_logs_created_at ON user_status_logs(created_at);

-- =============================================
-- END OF SCHEMA
-- =============================================
-- 
-- To use this schema on Neon:
-- 1. Create a new PostgreSQL database on Neon
-- 2. Copy the connection string from Neon dashboard
-- 3. Update your .env file with the connection details:
--    PGHOST=your-neon-host.neon.tech
--    PGDATABASE=your-database-name
--    PGUSER=your-username
--    PGPASSWORD=your-password
--    PGPORT=5432
-- 4. Run this SQL file in Neon's SQL Editor or via psql
-- 5. Your database will be ready to use!
-- =============================================

