-- Add is_default column to snowboarding_skills table
ALTER TABLE snowboarding_skills
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Update existing skills to be marked as default
UPDATE snowboarding_skills
SET is_default = TRUE
WHERE skill_name IN (
    'Basic Stance',
    'Straight Running',
    'Skating',
    'Side Slipping',
    'Garland',
    'Basic Turns',
    'Carved Turns',
    'Short Turns',
    'Long Turns',
    'Bumps',
    'Steep Slopes',
    'Powder Snow',
    'Jumps',
    'Halfpipe',
    'Rails',
    'Backcountry',
    'Avalanche Safety'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_snowboarding_skills_is_default ON snowboarding_skills(is_default); 