/*
  # Correction complète des erreurs de base de données

  1. Corrections des contraintes de clés étrangères
    - Ajout de CASCADE pour toutes les suppressions
    - Correction des relations entre tables

  2. Réinitialisation des données
    - Suppression de toutes les données sauf les opérateurs
    - Réinitialisation des séquences d'ID

  3. Amélioration de la structure
    - Vérification et correction des index
    - Optimisation des performances
*/

-- Supprimer toutes les contraintes de clés étrangères existantes
ALTER TABLE interventions DROP CONSTRAINT IF EXISTS interventions_device_id_fkey;
ALTER TABLE interventions DROP CONSTRAINT IF EXISTS interventions_operator_id_fkey;
ALTER TABLE intervention_history DROP CONSTRAINT IF EXISTS intervention_history_device_id_fkey;
ALTER TABLE intervention_history DROP CONSTRAINT IF EXISTS intervention_history_operator_id_fkey;
ALTER TABLE intervention_history DROP CONSTRAINT IF EXISTS intervention_history_intervention_id_fkey;
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_operator_id_fkey;
ALTER TABLE invoices_quotes DROP CONSTRAINT IF EXISTS invoices_quotes_client_id_fkey;

-- Supprimer toutes les données sauf les opérateurs
TRUNCATE TABLE intervention_history RESTART IDENTITY CASCADE;
TRUNCATE TABLE interventions RESTART IDENTITY CASCADE;
TRUNCATE TABLE devices RESTART IDENTITY CASCADE;
TRUNCATE TABLE clients RESTART IDENTITY CASCADE;
TRUNCATE TABLE invoices_quotes RESTART IDENTITY CASCADE;

-- Recréer les contraintes avec CASCADE approprié
ALTER TABLE devices 
ADD CONSTRAINT devices_operator_id_fkey 
FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE SET NULL;

ALTER TABLE interventions 
ADD CONSTRAINT interventions_device_id_fkey 
FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE interventions 
ADD CONSTRAINT interventions_operator_id_fkey 
FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE;

ALTER TABLE intervention_history 
ADD CONSTRAINT intervention_history_device_id_fkey 
FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE intervention_history 
ADD CONSTRAINT intervention_history_operator_id_fkey 
FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE;

ALTER TABLE intervention_history 
ADD CONSTRAINT intervention_history_intervention_id_fkey 
FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE;

ALTER TABLE invoices_quotes 
ADD CONSTRAINT invoices_quotes_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Recréer les index pour optimiser les performances
DROP INDEX IF EXISTS idx_devices_operator_id;
DROP INDEX IF EXISTS idx_interventions_device_id;
DROP INDEX IF EXISTS idx_interventions_operator_id;
DROP INDEX IF EXISTS idx_intervention_history_device_id;
DROP INDEX IF EXISTS idx_intervention_history_operator_id;
DROP INDEX IF EXISTS idx_intervention_history_intervention_id;
DROP INDEX IF EXISTS idx_invoices_quotes_client_id;

CREATE INDEX idx_devices_operator_id ON devices(operator_id);
CREATE INDEX idx_devices_category ON devices(category);
CREATE INDEX idx_devices_code ON devices(code);
CREATE INDEX idx_devices_in_stock ON devices(in_stock);
CREATE INDEX idx_interventions_device_id ON interventions(device_id);
CREATE INDEX idx_interventions_operator_id ON interventions(operator_id);
CREATE INDEX idx_interventions_status ON interventions(status);
CREATE INDEX idx_interventions_date ON interventions(intervention_date);
CREATE INDEX idx_intervention_history_device_id ON intervention_history(device_id);
CREATE INDEX idx_intervention_history_operator_id ON intervention_history(operator_id);
CREATE INDEX idx_intervention_history_intervention_id ON intervention_history(intervention_id);
CREATE INDEX idx_invoices_quotes_client_id ON invoices_quotes(client_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_company ON clients(company);

-- Mettre à jour les vues existantes
DROP VIEW IF EXISTS devices_with_relations;
DROP VIEW IF EXISTS interventions_with_relations;
DROP VIEW IF EXISTS operators_with_relations;

CREATE VIEW devices_with_relations AS
SELECT 
  d.*,
  o.full_name as operator_name,
  COALESCE(COUNT(DISTINCT i.id), 0) as intervention_count,
  MAX(i.intervention_date) as last_intervention_date
FROM devices d
LEFT JOIN operators o ON d.operator_id = o.id
LEFT JOIN interventions i ON d.id = i.device_id
GROUP BY d.id, o.id, o.full_name;

CREATE VIEW interventions_with_relations AS
SELECT 
  i.*,
  d.brand as device_brand,
  d.model as device_model,
  d.category as device_category,
  o.full_name as operator_name
FROM interventions i
LEFT JOIN devices d ON i.device_id = d.id
LEFT JOIN operators o ON i.operator_id = o.id;

CREATE VIEW operators_with_relations AS
SELECT 
  o.*,
  COALESCE(COUNT(DISTINCT d.id), 0) as device_count,
  COALESCE(COUNT(DISTINCT i.id), 0) as intervention_count
FROM operators o
LEFT JOIN devices d ON o.id = d.operator_id
LEFT JOIN interventions i ON o.id = i.operator_id
GROUP BY o.id;

-- Donner les permissions sur les vues
GRANT SELECT ON devices_with_relations TO authenticated;
GRANT SELECT ON interventions_with_relations TO authenticated;
GRANT SELECT ON operators_with_relations TO authenticated;

-- Fonction pour vérifier l'intégrité des données
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(table_name TEXT, issue TEXT, count BIGINT) AS $$
BEGIN
  -- Vérifier les appareils sans opérateur valide
  RETURN QUERY
  SELECT 'devices'::TEXT, 'devices with invalid operator_id'::TEXT, COUNT(*)
  FROM devices d
  WHERE d.operator_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM operators o WHERE o.id = d.operator_id);
  
  -- Vérifier les interventions sans appareil valide
  RETURN QUERY
  SELECT 'interventions'::TEXT, 'interventions with invalid device_id'::TEXT, COUNT(*)
  FROM interventions i
  WHERE NOT EXISTS (SELECT 1 FROM devices d WHERE d.id = i.device_id);
  
  -- Vérifier les interventions sans opérateur valide
  RETURN QUERY
  SELECT 'interventions'::TEXT, 'interventions with invalid operator_id'::TEXT, COUNT(*)
  FROM interventions i
  WHERE NOT EXISTS (SELECT 1 FROM operators o WHERE o.id = i.operator_id);
END;
$$ LANGUAGE plpgsql;