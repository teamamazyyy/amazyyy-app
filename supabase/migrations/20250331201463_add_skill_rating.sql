--! Previous: 20250331201462_add_favorite_tutorials_refs
-- Update skill_rating constraints and defaults
ALTER TABLE snowboarding_skills 
  ALTER COLUMN skill_rating SET DEFAULT 0,
  ALTER COLUMN skill_rating SET NOT NULL,
  ADD CONSTRAINT skill_rating_range CHECK (skill_rating >= 0 AND skill_rating <= 5);

-- Update existing records to ensure they meet the new constraints
UPDATE snowboarding_skills 
SET skill_rating = 0 
WHERE skill_rating IS NULL OR skill_rating < 0;

UPDATE snowboarding_skills 
SET skill_rating = 5 
WHERE skill_rating > 5; 