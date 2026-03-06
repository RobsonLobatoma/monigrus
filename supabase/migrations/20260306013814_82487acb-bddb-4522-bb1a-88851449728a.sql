-- Link active grupos that have whatsapp_group_id to the connected instance
UPDATE grupos 
SET instance_id = 'af1606c4-3d53-423e-bfda-c283265f6c64'
WHERE ativo = true 
  AND instance_id IS NULL 
  AND whatsapp_group_id IS NOT NULL;