-- Old reports have no attributable owner or verified update timestamp.
-- Preserve their original observation age instead of treating migration as a new verification.
UPDATE reports SET updated_at=created_at WHERE owner_email IS NULL;
