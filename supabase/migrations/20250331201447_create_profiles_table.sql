-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  theme TEXT CHECK (theme IN ('light', 'dark', 'yellow')) DEFAULT 'light',
  self_introduction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on the user id for better performance
CREATE INDEX idx_profiles_id ON profiles(id);

-- Create a function to automatically set the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up row level security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own profile
CREATE POLICY "Users can read only their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to insert only their own profile
CREATE POLICY "Users can insert only their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update only their own profile
CREATE POLICY "Users can update only their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id); 