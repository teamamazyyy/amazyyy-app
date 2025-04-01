--! Previous: 20250331201460_move_favorite_tutorials
--! Hash: [your_hash]

-- Rename the table
ALTER TABLE IF EXISTS snowboarder_profiles RENAME TO snowboarding_profiles;

-- Update RLS policies to use new table name
ALTER POLICY "Users can view their own profile" ON snowboarding_profiles RENAME TO "Users can view their own snowboarding profile";
ALTER POLICY "Users can insert their own profile" ON snowboarding_profiles RENAME TO "Users can insert their own snowboarding profile";
ALTER POLICY "Users can update their own profile" ON snowboarding_profiles RENAME TO "Users can update their own snowboarding profile"; 