/*
  # Add address fields to clients table

  1. New Columns
    - `number` (text) - Street number
    - `street` (text) - Street name  
    - `postal_code` (text) - Postal code
    - `city` (text) - City name

  2. Changes
    - Add individual address components for better filtering
    - Keep existing address field for backward compatibility
*/

-- Add new address fields to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'number'
  ) THEN
    ALTER TABLE clients ADD COLUMN number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'street'
  ) THEN
    ALTER TABLE clients ADD COLUMN street text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE clients ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'city'
  ) THEN
    ALTER TABLE clients ADD COLUMN city text;
  END IF;
END $$;