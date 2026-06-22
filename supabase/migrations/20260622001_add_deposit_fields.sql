ALTER TABLE tenants
  ADD COLUMN deposit_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN deposit_type text CHECK (deposit_type IN ('percent', 'fixed')) DEFAULT 'percent',
  ADD COLUMN deposit_value numeric(10,0) DEFAULT NULL;
