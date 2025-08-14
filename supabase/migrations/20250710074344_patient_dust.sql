/*
  # Fix Device Deletion Foreign Key Constraint

  1. Problem
    - Cannot delete devices that have associated interventions
    - Foreign key constraint "interventions_device_id_fkey" prevents deletion

  2. Solution
    - Drop the existing foreign key constraint
    - Recreate it with ON DELETE CASCADE
    - This will automatically delete associated interventions when a device is deleted

  3. Impact
    - Allows devices to be deleted even with existing interventions
    - Associated intervention records will be automatically removed
    - Maintains referential integrity while enabling deletion
*/

-- Drop the existing foreign key constraint
ALTER TABLE interventions 
DROP CONSTRAINT IF EXISTS interventions_device_id_fkey;

-- Recreate the constraint with CASCADE deletion
ALTER TABLE interventions 
ADD CONSTRAINT interventions_device_id_fkey 
FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

-- Also update intervention_history table for consistency
ALTER TABLE intervention_history 
DROP CONSTRAINT IF EXISTS intervention_history_device_id_fkey;

ALTER TABLE intervention_history 
ADD CONSTRAINT intervention_history_device_id_fkey 
FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

-- Update intervention_history to cascade when intervention is deleted too
ALTER TABLE intervention_history 
DROP CONSTRAINT IF EXISTS intervention_history_intervention_id_fkey;

ALTER TABLE intervention_history 
ADD CONSTRAINT intervention_history_intervention_id_fkey 
FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE;