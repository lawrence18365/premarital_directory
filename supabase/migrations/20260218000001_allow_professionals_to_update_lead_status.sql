-- Allow professionals to update the status of their own leads.
-- Without this, the status dropdown in LeadsPage silently fails (RLS blocks UPDATE).
CREATE POLICY "Professionals can update their own lead status." ON profile_leads
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );
