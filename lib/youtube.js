import { supabase } from './supabase';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
const CACHE_DURATION = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

export async function searchYouTubeTutorials(skillName) {
  try {
    // First check if we have recent results in the database
    const { data: existingTutorials, error: fetchError } = await supabase
      .from('snowboarding_tutorials')
      .select('*')
      .eq('skill_name', skillName)
      .gte('created_at', new Date(Date.now() - CACHE_DURATION).toISOString())
      .order('view_count', { ascending: false })
      .limit(10);

    if (!fetchError && existingTutorials?.length > 0) {
      return existingTutorials;
    }

    // If no cached results or error, search YouTube API
    const searchQuery = `${skillName} snowboarding tutorial`;
    
    // Combine both API calls into a single Promise.all
    const [searchResponse, skillData] = await Promise.all([
      fetch(`${YOUTUBE_API_URL}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`),
      supabase
        .from('snowboarding_skills')
        .select('id')
        .eq('skill_name', skillName)
        .single()
        .catch(() => ({ data: null, error: null })) // Handle missing skill gracefully
    ]);

    if (!searchResponse.ok) {
      throw new Error(`YouTube API search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items?.length) {
      return [];
    }

    // Get video details in a single API call
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    const videoResponse = await fetch(
      `${YOUTUBE_API_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!videoResponse.ok) {
      throw new Error(`YouTube API video details failed: ${videoResponse.statusText}`);
    }

    const videoData = await videoResponse.json();
    
    if (!videoData.items?.length) {
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
      skill_name: skillName,
      skill_id: skillData?.data?.id || null
    }));

    // Only store tutorials if we have a valid skill_id
    if (skillData?.data?.id) {
      // Store the tutorials in the database, but don't wait for it
      supabase
        .from('snowboarding_tutorials')
        .insert(tutorials)
        .then(() => {
          console.log('Cached tutorials for:', skillName);
        })
        .catch(error => {
          console.error('Error caching tutorials:', error);
        });
    }

    return tutorials;
  } catch (error) {
    console.error('Error in searchYouTubeTutorials:', error);
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