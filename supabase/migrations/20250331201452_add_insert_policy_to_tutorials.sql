-- Create policy to allow users to insert tutorials for their skills
CREATE POLICY "Users can insert tutorials for their skills"
    ON snowboarding_tutorials FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM snowboarding_skills
            WHERE snowboarding_skills.id = skill_id
            AND snowboarding_skills.user_id = auth.uid()
        )
    ); 