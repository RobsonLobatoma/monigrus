-- Activate all remaining groups and link them to the connected instance
UPDATE grupos 
SET ativo = true, 
    instance_id = 'af1606c4-3d53-423e-bfda-c283265f6c64'
WHERE ativo = false 
  AND whatsapp_group_id IS NOT NULL;