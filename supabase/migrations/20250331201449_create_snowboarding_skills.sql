-- Create snowboarding_skills table
CREATE TABLE snowboarding_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER CHECK (level BETWEEN 1 AND 6),
  skill_name TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on user_id for better performance
CREATE INDEX idx_snowboarding_skills_user_id ON snowboarding_skills(user_id);

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER set_snowboarding_skills_updated_at
BEFORE UPDATE ON snowboarding_skills
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up row level security
ALTER TABLE snowboarding_skills ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own skills
CREATE POLICY "Users can read only their own skills"
  ON snowboarding_skills FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert only their own skills
CREATE POLICY "Users can insert only their own skills"
  ON snowboarding_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update only their own skills
CREATE POLICY "Users can update only their own skills"
  ON snowboarding_skills FOR UPDATE
  USING (auth.uid() = user_id); 