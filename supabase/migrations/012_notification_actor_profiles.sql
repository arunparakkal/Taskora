-- Allow notification recipients to read the profile of whoever acted on their
-- notifications (e.g. team lead who assigned rework). Without this, nested
-- profile joins return null for members and the UI shows "Someone".

CREATE POLICY "Users can read notification actor profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.recipient_id = auth.uid()
        AND n.actor_id = profiles.id
    )
  );
