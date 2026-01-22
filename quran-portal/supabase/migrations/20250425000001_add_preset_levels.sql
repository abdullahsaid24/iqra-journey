
-- Add level and is_adult columns to notification_presets
ALTER TABLE notification_presets 
ADD COLUMN level integer DEFAULT 1,
ADD COLUMN is_adult boolean DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_notification_presets_level ON notification_presets(level);
CREATE INDEX idx_notification_presets_is_adult ON notification_presets(is_adult);
