/*
  # Fix devices_with_relations view

  1. Problem
    - The devices_with_relations view does not exist in the database
    - This causes errors when fetching device data

  2. Solution
    - Create the devices_with_relations view with proper joins
    - Include all necessary columns for the application
    - Grant proper permissions

  3. Security
    - Grant SELECT permissions to authenticated users
*/

-- Drop the view if it exists to avoid conflicts
DROP VIEW IF EXISTS devices_with_relations;

-- Create the devices_with_relations view
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

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON devices_with_relations TO authenticated;