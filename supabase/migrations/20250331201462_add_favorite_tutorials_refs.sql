--! Previous: 20250331201461_rename_profiles_table
--! Hash: [your_hash]

-- Add favorite_tutorials column to snowboarding_profiles
ALTER TABLE snowboarding_profiles
ADD COLUMN favorite_tutorials JSONB DEFAULT '[]'::jsonb;

-- Create a function to validate tutorial references
CREATE OR REPLACE FUNCTION validate_tutorial_refs()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all referenced tutorials exist
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(NEW.favorite_tutorials) AS tutorial
    WHERE NOT EXISTS (
      SELECT 1 FROM snowboarding_tutorials
      WHERE video_id = (tutorial->>'video_id')::text
    )
  ) THEN
    RAISE EXCEPTION 'Referenced tutorial does not exist in snowboarding_tutorials';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate tutorial references
CREATE TRIGGER validate_favorite_tutorials
  BEFORE INSERT OR UPDATE ON snowboarding_profiles
  FOR EACH ROW
  WHEN (NEW.favorite_tutorials IS NOT NULL)
  EXECUTE FUNCTION validate_tutorial_refs();

-- Migrate existing data from favorite_tutorials table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'favorite_tutorials'
  ) THEN
    WITH grouped_favorites AS (
      SELECT 
        ft.user_id,
        jsonb_agg(
          jsonb_build_object(
            'video_id', ft.video_id,
            'skill_id', ft.skill_id,
            'created_at', ft.created_at
          )
        ) as favorites
      FROM favorite_tutorials ft
      WHERE EXISTS (
        SELECT 1 FROM snowboarding_tutorials st
        WHERE st.video_id = ft.video_id
      )
      GROUP BY ft.user_id
    )
    UPDATE snowboarding_profiles sp
    SET favorite_tutorials = COALESCE(gf.favorites, '[]'::jsonb)
    FROM grouped_favorites gf
    WHERE sp.user_id = gf.user_id;

    -- Drop the old table if it exists
    DROP TABLE favorite_tutorials;
  END IF;
END $$; 