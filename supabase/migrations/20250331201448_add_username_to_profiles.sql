-- Add username field to profiles table (initially nullable)
ALTER TABLE profiles
ADD COLUMN username TEXT;

-- Create an index on username for better performance
CREATE INDEX idx_profiles_username ON profiles(username);

-- Update existing profiles with a default username based on their email
UPDATE profiles
SET username = 'user_' || SUBSTRING(id::text, 1, 8)
WHERE username IS NULL;

-- Add a check constraint to ensure username is not empty
ALTER TABLE profiles
ADD CONSTRAINT username_not_empty CHECK (username != '');

-- Add a check constraint to ensure username only contains alphanumeric characters, underscores, and hyphens
ALTER TABLE profiles
ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$');

-- Add unique constraint to username
ALTER TABLE profiles
ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- Now make the column NOT NULL after we've populated it
ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL; 