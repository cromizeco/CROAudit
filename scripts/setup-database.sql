-- Create audits table
CREATE TABLE IF NOT EXISTS audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  desktop_screenshot TEXT,
  mobile_screenshot TEXT,
  desktop_annotated TEXT,
  mobile_annotated TEXT,
  findings JSONB,
  status TEXT DEFAULT 'pending'
);

-- Create index for faster URL lookups
CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
