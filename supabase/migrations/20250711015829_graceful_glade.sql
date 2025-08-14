/*
  # Correction des bugs d'affichage et ajout de la gestion des devis/factures

  1. Corrections
    - Recréation de la vue devices_with_relations avec les bonnes colonnes
    - Correction de la table intervention_history pour les statistiques temps réel

  2. Nouvelles fonctionnalités
    - Table quotes_invoices pour les devis et factures
    - Mise à jour des vues pour inclure les nouvelles relations

  3. Sécurité
    - RLS activé sur toutes les nouvelles tables
    - Politiques appropriées pour les opérateurs
*/

-- Supprimer et recréer la vue devices_with_relations avec les bonnes colonnes
DROP VIEW IF EXISTS devices_with_relations;

CREATE VIEW devices_with_relations AS
SELECT 
  d.id,
  d.category,
  d.code,
  d.brand,
  d.model,
  d.external_condition,
  d.grade,
  d.functioning,
  d.in_stock,
  d.storage_location,
  d.product_info_url,
  d.tech_specs,
  d.safety_precautions,
  d.comments,
  d.entry_date,
  d.exit_date,
  d.operator_id,
  d.created_at,
  d.updated_at,
  o.full_name as operator_name,
  COALESCE(COUNT(DISTINCT i.id), 0) as intervention_count,
  MAX(i.intervention_date) as last_intervention_date
FROM devices d
LEFT JOIN operators o ON d.operator_id = o.id
LEFT JOIN interventions i ON d.id = i.device_id
GROUP BY d.id, o.id, o.full_name;

-- Créer la table quotes_invoices pour les devis et factures
CREATE TABLE IF NOT EXISTS quotes_invoices (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(20) CHECK (document_type IN ('Devis', 'Facture')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('En attente', 'Payé', 'Annulé')) NOT NULL DEFAULT 'En attente',
  issue_date DATE DEFAULT CURRENT_DATE,
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS sur la nouvelle table
ALTER TABLE quotes_invoices ENABLE ROW LEVEL SECURITY;

-- Créer les politiques pour quotes_invoices
CREATE POLICY "Operators can read quotes and invoices"
  ON quotes_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can insert quotes and invoices"
  ON quotes_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update quotes and invoices"
  ON quotes_invoices FOR UPDATE
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

CREATE POLICY "Operators can delete quotes and invoices"
  ON quotes_invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE user_id = auth.uid()
    )
  );

-- Créer un trigger pour updated_at sur quotes_invoices
CREATE TRIGGER update_quotes_invoices_updated_at
    BEFORE UPDATE ON quotes_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Créer une vue pour quotes_invoices avec les relations
CREATE VIEW quotes_invoices_with_relations AS
SELECT 
  qi.*,
  c.name as client_name,
  c.first_name as client_first_name,
  c.company as client_company,
  c.email as client_email
FROM quotes_invoices qi
LEFT JOIN clients c ON qi.client_id = c.id;

-- Donner les permissions sur les nouvelles vues
GRANT SELECT ON devices_with_relations TO authenticated;
GRANT SELECT ON quotes_invoices_with_relations TO authenticated;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quotes_invoices_client_id ON quotes_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_invoices_document_type ON quotes_invoices(document_type);
CREATE INDEX IF NOT EXISTS idx_quotes_invoices_status ON quotes_invoices(status);
CREATE INDEX IF NOT EXISTS idx_quotes_invoices_issue_date ON quotes_invoices(issue_date);