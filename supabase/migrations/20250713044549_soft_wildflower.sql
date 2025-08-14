/*
  # Ajout des fonctionnalités de gestion de fichiers et relations

  1. Nouvelles tables
    - `device_files` - Fichiers de spécifications techniques pour les appareils
    - `intervention_files` - Fichiers de compte-rendu pour les interventions
    - `client_orders` - Historique des commandes clients

  2. Relations
    - Liens entre clients et devis/factures
    - Historique des commandes clients
    - Fichiers attachés aux appareils et interventions

  3. Sécurité
    - RLS activé sur toutes les nouvelles tables
    - Politiques appropriées pour les opérateurs
*/

-- Table pour les fichiers de spécifications techniques des appareils
CREATE TABLE IF NOT EXISTS device_files (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT,
  file_url TEXT,
  file_data BYTEA,
  uploaded_by BIGINT REFERENCES operators(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les fichiers de compte-rendu d'interventions
CREATE TABLE IF NOT EXISTS intervention_files (
  id BIGSERIAL PRIMARY KEY,
  intervention_id BIGINT REFERENCES interventions(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT,
  file_url TEXT,
  file_data BYTEA,
  uploaded_by BIGINT REFERENCES operators(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour l'historique des commandes clients
CREATE TABLE IF NOT EXISTS client_orders (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'En cours',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE device_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_orders ENABLE ROW LEVEL SECURITY;

-- Politiques pour device_files
CREATE POLICY "Operators can manage device files"
  ON device_files FOR ALL
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

-- Politiques pour intervention_files
CREATE POLICY "Operators can manage intervention files"
  ON intervention_files FOR ALL
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

-- Politiques pour client_orders
CREATE POLICY "Operators can manage client orders"
  ON client_orders FOR ALL
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

-- Triggers pour updated_at
CREATE TRIGGER update_device_files_updated_at
    BEFORE UPDATE ON device_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_files_updated_at
    BEFORE UPDATE ON intervention_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_orders_updated_at
    BEFORE UPDATE ON client_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_device_files_device_id ON device_files(device_id);
CREATE INDEX IF NOT EXISTS idx_intervention_files_intervention_id ON intervention_files(intervention_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_client_id ON client_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_order_number ON client_orders(order_number);

-- Vue pour les clients avec leurs commandes et factures
CREATE OR REPLACE VIEW clients_with_orders AS
SELECT 
  c.*,
  COALESCE(COUNT(DISTINCT co.id), 0) as order_count,
  COALESCE(COUNT(DISTINCT qi.id), 0) as invoice_count,
  COALESCE(SUM(qi.amount), 0) as total_invoiced
FROM clients c
LEFT JOIN client_orders co ON c.id = co.client_id
LEFT JOIN quotes_invoices qi ON c.id = qi.client_id
GROUP BY c.id;

-- Vue pour les appareils avec leurs fichiers
CREATE OR REPLACE VIEW devices_with_files AS
SELECT 
  d.*,
  o.full_name as operator_name,
  COALESCE(COUNT(DISTINCT i.id), 0) as intervention_count,
  MAX(i.intervention_date) as last_intervention_date,
  COALESCE(COUNT(DISTINCT df.id), 0) as file_count
FROM devices d
LEFT JOIN operators o ON d.operator_id = o.id
LEFT JOIN interventions i ON d.id = i.device_id
LEFT JOIN device_files df ON d.id = df.device_id
GROUP BY d.id, o.id, o.full_name;

-- Vue pour les interventions avec leurs fichiers
CREATE OR REPLACE VIEW interventions_with_files AS
SELECT 
  i.*,
  d.brand as device_brand,
  d.model as device_model,
  d.category as device_category,
  o.full_name as operator_name,
  COALESCE(COUNT(DISTINCT if.id), 0) as file_count
FROM interventions i
LEFT JOIN devices d ON i.device_id = d.id
LEFT JOIN operators o ON i.operator_id = o.id
LEFT JOIN intervention_files if ON i.id = if.intervention_id
GROUP BY i.id, d.brand, d.model, d.category, o.full_name;

-- Donner les permissions sur les nouvelles vues
GRANT SELECT ON clients_with_orders TO authenticated;
GRANT SELECT ON devices_with_files TO authenticated;
GRANT SELECT ON interventions_with_files TO authenticated;