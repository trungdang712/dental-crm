-- Add RLS policies for users table
-- This allows authenticated users to read user profiles

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Allow authenticated users to read all user profiles
-- This is needed for displaying assigned user names, etc.
CREATE POLICY "Users can view all users" ON users
  FOR SELECT TO authenticated USING (true);

-- Comment for documentation
COMMENT ON POLICY "Users can view all users" ON users IS 'Allow authenticated users to read user profiles for CRM features';
