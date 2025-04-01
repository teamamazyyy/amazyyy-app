-- Create snowboarder_profiles table
CREATE TABLE IF NOT EXISTS snowboarder_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    height DECIMAL,
    weight DECIMAL,
    shoe_size DECIMAL,
    stance TEXT CHECK (stance IN ('regular', 'goofy')),
    stance_width DECIMAL,
    board_length DECIMAL,
    board_type TEXT CHECK (board_type IN ('all-mountain', 'freestyle', 'freeride', 'powder')),
    boot_size DECIMAL,
    binding_size TEXT,
    preferred_terrain TEXT CHECK (preferred_terrain IN ('all-mountain', 'groomers', 'powder', 'park')),
    riding_style TEXT CHECK (riding_style IN ('freestyle', 'freeride', 'carving', 'all-around')),
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE snowboarder_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
    ON snowboarder_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON snowboarder_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON snowboarder_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_snowboarder_profiles_updated_at
    BEFORE UPDATE ON snowboarder_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 