export type ReadingLevel = 'beginner' | 'intermediate' | 'advanced';
export type Theme = 'light' | 'dark' | 'yellow';
export type FontSize = 'medium' | 'large' | 'x-large' | 'xx-large';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  theme: Theme;
  self_introduction: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
}
