/*
  # Create devices_with_relations view

  1. New View
    - `devices_with_relations` - Combines devices with operator and intervention data
    
  2. Security
    - Grant SELECT permissions to authenticated users
*/

-- Drop the view if it exists to recreate it
DROP VIEW IF EXISTS devices_with_relations;

-- Create the devices_with_relations view
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

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON devices_with_relations TO authenticated;