/*
  # Initial Schema Setup for LPI CRM

  1. Tables Created
    - devices: For tracking all equipment
    - operators: Staff members who handle devices
    - clients: Customer information
    - interventions: Work performed on devices
    - intervention_history: Historical record of all interventions
    - invoices_quotes: Financial documents

  2. Features
    - Comprehensive ENUM types for all categorical data
    - Timestamps for creation and updates
    - Foreign key relationships
    - Row Level Security (RLS) policies
    - Automatic updated_at timestamp updates

  3. Security
    - RLS enabled on all tables
    - Policies for authenticated users and operators
    - Proper separation of read/write permissions
*/

-- Enums
CREATE TYPE device_category AS ENUM (
  'Informatique', 'Lumière', 'Vidéo-Photo', 'Appareils-Numériques',
  'Son', 'Electro Ménager', 'Serveur-Stockage', 'périphérique', 'imprimante'
);

CREATE TYPE device_code AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J');
CREATE TYPE device_condition AS ENUM ('Cassé', 'Vétuste', 'Bon état', 'Très bon Etat', 'Comme neuf');
CREATE TYPE device_grade AS ENUM ('A+', 'A', 'B', 'C');
CREATE TYPE yes_no_unknown AS ENUM ('Oui', 'Non', 'NSP');
CREATE TYPE intervention_type AS ENUM (
  'Contrôle', 'Revalorisation', 'Dépannage', 'Réparation',
  'Configuration', 'Expertise', 'Marketing'
);
CREATE TYPE intervention_status AS ENUM ('En cours', 'Terminé', 'Échec');
CREATE TYPE difficulty_level AS ENUM ('Facile', 'Moyenne', 'Difficile', 'Impossible');
CREATE TYPE quality_rating AS ENUM ('Problème', 'Moyen', 'Bon', 'Très Bon');
CREATE TYPE document_type AS ENUM ('Devis', 'Facture');
CREATE TYPE payment_status AS ENUM ('En attente', 'Payé', 'Annulé');

-- Devices table
CREATE TABLE devices (
  id BIGSERIAL PRIMARY KEY,
  category device_category NOT NULL,
  code device_code NOT NULL,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  product_info_url TEXT,
  tech_specs TEXT,
  external_condition device_condition NOT NULL,
  grade device_grade NOT NULL,
  functioning yes_no_unknown NOT NULL DEFAULT 'NSP',
  safety_precautions TEXT,
  storage_location VARCHAR(255),
  in_stock BOOLEAN DEFAULT true,
  available_to_client BOOLEAN DEFAULT false,
  comments TEXT,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  exit_date TIMESTAMPTZ,
  operator_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operators table
CREATE TABLE operators (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  access_level VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(255),
  address TEXT,
  email VARCHAR(255) NOT NULL,
  expectations TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interventions table
CREATE TABLE interventions (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT REFERENCES devices NOT NULL,
  operator_id BIGINT REFERENCES operators NOT NULL,
  type intervention_type NOT NULL,
  report TEXT,
  status intervention_status NOT NULL DEFAULT 'En cours',
  destination intervention_type NOT NULL,
  operator_comments TEXT,
  difficulty difficulty_level,
  self_evaluation quality_rating,
  intervention_date TIMESTAMPTZ DEFAULT NOW(),
  verifier_name VARCHAR(255),
  verifier_rating quality_rating,
  verification_date TIMESTAMPTZ,
  verifier_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intervention History table
CREATE TABLE intervention_history (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT REFERENCES devices NOT NULL,
  operator_id BIGINT REFERENCES operators NOT NULL,
  intervention_id BIGINT REFERENCES interventions NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices and Quotes table
CREATE TABLE invoices_quotes (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients NOT NULL,
  document_type document_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'En attente',
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read devices"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can insert devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete devices"
  ON devices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can read operators"
  ON operators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage own profile"
  ON operators FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Operators can read clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can read interventions"
  ON interventions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can insert interventions"
  ON interventions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update interventions"
  ON interventions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete interventions"
  ON interventions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can read intervention history"
  ON intervention_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can insert intervention history"
  ON intervention_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can read invoices and quotes"
  ON invoices_quotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can insert invoices and quotes"
  ON invoices_quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update invoices and quotes"
  ON invoices_quotes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can delete invoices and quotes"
  ON invoices_quotes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
    BEFORE UPDATE ON operators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at
    BEFORE UPDATE ON interventions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_quotes_updated_at
    BEFORE UPDATE ON invoices_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();