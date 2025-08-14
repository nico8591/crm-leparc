/*
  # Corrections complètes pour l'application LPI CRM

  1. Réinitialisation des données
    - Suppression de tous les appareils existants
    - Réinitialisation des séquences d'ID
    - Nettoyage des données orphelines

  2. Correction des relations
    - Ajout de la relation client_id dans devices
    - Correction des contraintes de clés étrangères
    - Mise à jour des vues

  3. Sécurité
    - Maintien des politiques RLS
    - Permissions appropriées sur les vues
*/

-- Supprimer toutes les données des appareils et interventions pour réinitialiser
TRUNCATE TABLE intervention_history RESTART IDENTITY CASCADE;
TRUNCATE TABLE interventions RESTART IDENTITY CASCADE;
TRUNCATE TABLE devices RESTART IDENTITY CASCADE;

-- Ajouter la relation client_id dans devices si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE devices ADD COLUMN client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Supprimer et recréer la vue devices_with_relations
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
  d.client_id,
  d.created_at,
  d.updated_at,
  o.full_name as operator_name,
  c.name as client_name,
  c.first_name as client_first_name,
  COALESCE(COUNT(DISTINCT i.id), 0) as intervention_count,
  MAX(i.intervention_date) as last_intervention_date
FROM devices d
LEFT JOIN operators o ON d.operator_id = o.id
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN interventions i ON d.id = i.device_id
GROUP BY d.id, o.id, o.full_name, c.id, c.name, c.first_name;

-- Recréer la vue quotes_invoices_with_relations si elle n'existe pas
DROP VIEW IF EXISTS quotes_invoices_with_relations;

CREATE VIEW quotes_invoices_with_relations AS
SELECT 
  qi.*,
  c.name as client_name,
  c.first_name as client_first_name,
  c.company as client_company,
  c.email as client_email
FROM quotes_invoices qi
LEFT JOIN clients c ON qi.client_id = c.id;

-- Créer une vue pour les clients avec leurs appareils
DROP VIEW IF EXISTS clients_with_devices;

CREATE VIEW clients_with_devices AS
SELECT 
  c.*,
  COALESCE(COUNT(DISTINCT d.id), 0) as device_count,
  COALESCE(COUNT(DISTINCT qi.id), 0) as quote_invoice_count,
  COALESCE(SUM(qi.amount), 0) as total_amount
FROM clients c
LEFT JOIN devices d ON c.id = d.client_id
LEFT JOIN quotes_invoices qi ON c.id = qi.client_id
GROUP BY c.id;

-- Donner les permissions sur les vues
GRANT SELECT ON devices_with_relations TO authenticated;
GRANT SELECT ON quotes_invoices_with_relations TO authenticated;
GRANT SELECT ON clients_with_devices TO authenticated;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_devices_client_id ON devices(client_id);
CREATE INDEX IF NOT EXISTS idx_devices_category_code ON devices(category, code);
CREATE INDEX IF NOT EXISTS idx_devices_condition_grade ON devices(external_condition, grade);
CREATE INDEX IF NOT EXISTS idx_devices_functioning_stock ON devices(functioning, in_stock);
CREATE INDEX IF NOT EXISTS idx_interventions_status_type ON interventions(status, type);