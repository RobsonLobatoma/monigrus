-- Deactivate orphaned groups that were never synced from WhatsApp (no instance_id)
UPDATE grupos SET ativo = false WHERE instance_id IS NULL AND ativo = true;