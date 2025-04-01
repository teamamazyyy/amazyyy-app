import { supabase } from '@/lib/supabase';

export const defaultSkills = [
  // Level 1: Beginner
  { level: 1, skill_name: 'Basic Stance', description: 'Learn the correct stance and balance on a snowboard' },
  { level: 1, skill_name: 'Skating', description: 'Learn to skate on flat terrain' },
  { level: 1, skill_name: 'Straight Gliding', description: 'Learn to glide straight down gentle slopes' },
  { level: 1, skill_name: 'Basic Turns', description: 'Learn to make basic turns on gentle slopes' },
  
  // Level 2: Novice
  { level: 2, skill_name: 'Linked Turns', description: 'Learn to link turns consistently' },
  { level: 2, skill_name: 'Speed Control', description: 'Learn to control speed using turns' },
  { level: 2, skill_name: 'Basic Carving', description: 'Introduction to edge control and carving' },
  
  // Level 3: Intermediate
  { level: 3, skill_name: 'Advanced Carving', description: 'Master carving on steeper slopes' },
  { level: 3, skill_name: 'Bumps and Moguls', description: 'Learn to ride through bumps and moguls' },
  { level: 3, skill_name: 'Switch Riding', description: 'Learn to ride in switch stance' },
  
  // Level 4: Advanced
  { level: 4, skill_name: 'Advanced Switch', description: 'Master riding switch on all terrain' },
  { level: 4, skill_name: 'Steep Terrain', description: 'Learn to ride steep slopes confidently' },
  { level: 4, skill_name: 'Basic Jumps', description: 'Learn to perform basic jumps' },
  
  // Level 5: Expert
  { level: 5, skill_name: 'Advanced Jumps', description: 'Master advanced jumping techniques' },
  { level: 5, skill_name: 'Rail Riding', description: 'Learn to ride rails and boxes' },
  { level: 5, skill_name: 'Backcountry Basics', description: 'Introduction to backcountry riding' },
  
  // Level 6: Master
  { level: 6, skill_name: 'Advanced Backcountry', description: 'Master backcountry riding techniques' },
  { level: 6, skill_name: 'Freestyle Mastery', description: 'Master advanced freestyle tricks' },
  { level: 6, skill_name: 'Competition Level', description: 'Prepare for competitive riding' }
];

export async function ensureDefaultSkills(userId) {
  try {
    // Check if user has any skills
    const { data: existingSkills, error: fetchError } = await supabase
      .from('snowboarding_skills')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (fetchError) throw fetchError;

    // If no skills exist, create default skills
    if (!existingSkills || existingSkills.length === 0) {
      const skillsToInsert = defaultSkills.map(skill => ({
        ...skill,
        user_id: userId,
        is_completed: false,
        completed_at: null
      }));

      const { error: insertError } = await supabase
        .from('snowboarding_skills')
        .insert(skillsToInsert);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error ensuring default skills:', error);
    throw error;
  }
} 