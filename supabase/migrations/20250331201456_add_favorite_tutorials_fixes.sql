-- Create favorite tutorials table if it doesn't exist
CREATE TABLE IF NOT EXISTS favorite_tutorials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    skill_id UUID REFERENCES snowboarding_skills(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT NOT NULL,
    duration TEXT,
    view_count INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_favorite_tutorials_user_id ON favorite_tutorials(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_tutorials_skill_id ON favorite_tutorials(skill_id);

-- Ensure RLS is enabled
ALTER TABLE favorite_tutorials ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own favorite tutorials" ON favorite_tutorials;
DROP POLICY IF EXISTS "Users can insert their own favorite tutorials" ON favorite_tutorials;
DROP POLICY IF EXISTS "Users can delete their own favorite tutorials" ON favorite_tutorials;

-- Create policies
CREATE POLICY "Users can view their own favorite tutorials"
    ON favorite_tutorials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite tutorials"
    ON favorite_tutorials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite tutorials"
    ON favorite_tutorials FOR DELETE
    USING (auth.uid() = user_id); 