import { supabase } from './supabase';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export async function searchYouTubeTutorials(skillName) {
  try {
    // First check if we have recent results in the database (less than 60 days old)
    const { data: existingTutorials, error: fetchError } = await supabase
      .from('snowboarding_tutorials')
      .select('*')
      .eq('skill_name', skillName)
      .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('view_count', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching from database:', fetchError);
      // If the error is due to missing column, try without skill_name
      if (fetchError.message.includes('column "skill_name" does not exist')) {
        const { data: fallbackTutorials, error: fallbackError } = await supabase
          .from('snowboarding_tutorials')
          .select('*')
          .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
          .order('view_count', { ascending: false })
          .limit(10);

        if (fallbackError) {
          console.error('Error in fallback query:', fallbackError);
          throw new Error('Failed to fetch tutorials from database');
        }

        return fallbackTutorials || [];
      }
      throw new Error('Failed to fetch tutorials from database');
    }

    // If we have recent results, return them
    if (existingTutorials && existingTutorials.length > 0) {
      return existingTutorials;
    }

    // If no recent results, search YouTube API
    const searchQuery = `${skillName} snowboarding tutorial`;
    const response = await fetch(
      `${YOUTUBE_API_URL}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('YouTube API search error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`YouTube API search failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn('No videos found for:', skillName);
      return [];
    }

    const videoIds = data.items.map(item => item.id.videoId).join(',');

    // Get detailed video information
    const videoResponse = await fetch(
      `${YOUTUBE_API_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!videoResponse.ok) {
      const errorData = await videoResponse.json().catch(() => ({}));
      console.error('YouTube API video details error:', {
        status: videoResponse.status,
        statusText: videoResponse.statusText,
        error: errorData
      });
      throw new Error(`YouTube API video details failed: ${videoResponse.statusText}`);
    }

    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
      console.warn('No video details found for:', skillName);
      return [];
    }

    // Format the results
    const tutorials = videoData.items.map(video => ({
      video_id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail_url: video.snippet.thumbnails.high.url,
      duration: video.contentDetails.duration,
      view_count: parseInt(video.statistics.viewCount),
      published_at: video.snippet.publishedAt,
      skill_name: skillName
    }));

    // Get the skill_id for the current skill
    const { data: skillData, error: skillError } = await supabase
      .from('snowboarding_skills')
      .select('id')
      .eq('skill_name', skillName)
      .single();

    if (skillError) {
      console.error('Error getting skill_id:', {
        error: skillError,
        skillName,
        message: skillError.message,
        details: skillError.details,
        hint: skillError.hint
      });
      
      // If the skill doesn't exist, try to create it
      if (skillError.code === 'PGRST116') { // PGRST116 is the code for "no rows returned"
        const { data: newSkill, error: createError } = await supabase
          .from('snowboarding_skills')
          .insert([{ skill_name: skillName }])
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating new skill:', createError);
          return tutorials;
        }

        // Add skill_id to each tutorial
        const tutorialsWithSkillId = tutorials.map(tutorial => ({
          ...tutorial,
          skill_id: newSkill.id
        }));

        // Store the tutorials in the database
        const { error: insertError } = await supabase
          .from('snowboarding_tutorials')
          .insert(tutorialsWithSkillId);

        if (insertError) {
          console.error('Error storing tutorials in database:', insertError);
          return tutorials;
        }

        return tutorials;
      }
      
      return tutorials;
    }

    // Add skill_id to each tutorial
    const tutorialsWithSkillId = tutorials.map(tutorial => ({
      ...tutorial,
      skill_id: skillData.id
    }));

    // Store the tutorials in the database
    const { error: insertError } = await supabase
      .from('snowboarding_tutorials')
      .insert(tutorialsWithSkillId);

    if (insertError) {
      console.error('Error storing tutorials in database:', insertError);
      // Don't throw here, just return the results without storing
      return tutorials;
    }

    return tutorials;
  } catch (error) {
    console.error('Error in searchYouTubeTutorials:', {
      error: error.message,
      stack: error.stack,
      skillName
    });
    return [];
  }
}

export function formatDuration(duration) {
  try {
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    let result = '';
    if (hours) result += `${hours}:`;
    result += `${minutes.padStart(2, '0')}:`;
    result += seconds.padStart(2, '0');
    
    return result;
  } catch (error) {
    console.error('Error formatting duration:', error);
    return '0:00';
  }
}

export function formatViewCount(count) {
  try {
    if (!count || isNaN(count)) return '0';
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  } catch (error) {
    console.error('Error formatting view count:', error);
    return '0';
  }
} 