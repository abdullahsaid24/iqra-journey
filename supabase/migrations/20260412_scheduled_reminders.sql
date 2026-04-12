-- Create scheduled_reminders table for storing editable weekly reminder messages
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_key TEXT UNIQUE NOT NULL,  -- e.g. 'wednesday_class', 'thursday_class'
  message TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  send_time TIME DEFAULT '17:00:00',  -- 5:00 PM local time (when the SMS fires)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default reminders
INSERT INTO scheduled_reminders (reminder_key, message, is_enabled, send_time) VALUES
  ('wednesday_class', 'Reminder Dugsi Day 6:15PM', true, '17:00:00'),
  ('thursday_class', 'Reminder Dugsi Day 6:15PM', true, '17:00:00')
ON CONFLICT (reminder_key) DO NOTHING;

-- Enable RLS
ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write
CREATE POLICY "Admins can manage scheduled_reminders"
  ON scheduled_reminders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_scheduled_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduled_reminders_updated_at
  BEFORE UPDATE ON scheduled_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_reminders_updated_at();
