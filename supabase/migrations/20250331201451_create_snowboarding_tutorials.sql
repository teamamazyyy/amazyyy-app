-- Create snowboarding_tutorials table
CREATE TABLE snowboarding_tutorials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    skill_id UUID REFERENCES snowboarding_skills(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration TEXT,
    view_count INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_snowboarding_tutorials_skill_id ON snowboarding_tutorials(skill_id);
CREATE INDEX idx_snowboarding_tutorials_skill_name ON snowboarding_tutorials(skill_name);

-- Enable Row Level Security
ALTER TABLE snowboarding_tutorials ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view tutorials for their skills
CREATE POLICY "Users can view tutorials for their skills"
    ON snowboarding_tutorials FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM snowboarding_skills
            WHERE snowboarding_skills.id = snowboarding_tutorials.skill_id
            AND snowboarding_skills.user_id = auth.uid()
        )
    );