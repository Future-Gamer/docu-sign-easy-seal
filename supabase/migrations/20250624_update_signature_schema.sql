
-- Update signatures table to support the new workflow
ALTER TABLE signatures 
ADD COLUMN IF NOT EXISTS signature_type text DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS field_type text DEFAULT 'signature',
ADD COLUMN IF NOT EXISTS color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS font_style text DEFAULT 'cursive',
ADD COLUMN IF NOT EXISTS is_required boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS width double precision DEFAULT 200,
ADD COLUMN IF NOT EXISTS height double precision DEFAULT 80;

-- Create signature_sessions table for managing signing workflows
CREATE TABLE IF NOT EXISTS signature_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  session_type text NOT NULL DEFAULT 'self', -- 'self' or 'multiple'
  status text NOT NULL DEFAULT 'preparing', -- 'preparing', 'ready', 'signing', 'completed'
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create signature_fields table for field definitions
CREATE TABLE IF NOT EXISTS signature_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES signature_sessions(id) ON DELETE CASCADE,
  field_type text NOT NULL, -- 'signature', 'initials', 'name', 'date', 'text', 'company_stamp'
  label text,
  position_x double precision NOT NULL,
  position_y double precision NOT NULL,
  width double precision DEFAULT 200,
  height double precision DEFAULT 80,
  page_number integer DEFAULT 1,
  is_required boolean DEFAULT true,
  assigned_to text, -- email of signer
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE signature_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_fields ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own signature sessions" ON signature_sessions
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can manage signature fields for their sessions" ON signature_fields
  FOR ALL USING (
    session_id IN (
      SELECT id FROM signature_sessions WHERE created_by = auth.uid()
    )
  );
