'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaHeart, FaBook, FaClock, FaEdit, FaCheck, FaTimes, FaUser, FaEgg, FaFire, FaShare, FaTwitter, FaWhatsapp, FaLinkedin, FaLink } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../../components/Navbar';

// Import RubyText component and utility functions from read/page.js
const RubyText = ({ part, preferenceState }) => {
  if (!part || part.type !== 'ruby' || !part.kanji || !part.reading) {
    return null;
  }
  return (
    <ruby className="group">
      {part.kanji}
      <rt className={`${preferenceState?.show_furigana ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        {part.reading}
      </rt>
    </ruby>
  );
};

// Import processContent utility from read/page.js
const processContent = (content) => {
  if (!Array.isArray(content)) return [];
  return content.map((part, index) => {
    if (part?.type === 'ruby') {
      return {
        type: 'ruby',
        kanji: part.kanji,
        reading: part.reading
      };
    } else if (part?.type === 'text') {
      return {
        type: 'text',
        content: part.content
      };
    }
    return null;
  }).filter(Boolean);
};

// Helper function to format time duration
const formatDuration = (minutes) => {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
};

// Helper function to format date
const formatDate = (dateString, type = 'finished') => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const suffix = type === 'saved' ? 'saved article' : 'finished article';
  
  if (diffDays === 0) {
    return ['Today at ' + timeStr, suffix];
  } else if (diffDays === 1) {
    return ['Yesterday at ' + timeStr, suffix];
  } else if (diffDays < 7) {
    return [`${diffDays} days ago at ${timeStr}`, suffix];
  } else {
    return [
      date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }) + ' at ' + timeStr,
      suffix
    ];
  }
};

// Import formatJapaneseDate from read/page.js
const formatJapaneseDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}時${String(date.getMinutes()).padStart(2, '0')}分`;
  } catch (e) {
    return dateStr;
  }
};

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [savedNews, setSavedNews] = useState([]);
  const [finishedNews, setFinishedNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);
  const [stats, setStats] = useState({
    totalReadingTime: 0,
    totalArticlesRead: 0,
    totalSavedArticles: 0,
    totalFinishedArticles: 0,
    longestStreak: 0,
    currentStreak: 0
  });

  // Add getActivityItems function to handle the timeline items
  const getActivityItems = () => {
    const items = [
      // Add joined event
      {
        type: 'joined',
        date: profile?.created_at,
        data: {}
      },
      // Add saved articles
      ...(savedNews || []).map(item => ({
        type: 'saved',
        date: item.created_at,
        data: {
          url: item.article?.url || '',
          article: item.article,
          reading_time: item.reading_time
        }
      })),
      // Add finished articles
      ...(finishedNews || []).map(item => ({
        type: 'finished',
        date: item.finished_at,
        data: {
          url: item.article?.url || '',
          article: item.article
        }
      }))
    ];

    // Sort all items by date, most recent first
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Add function to calculate longest streak
  const calculateLongestStreak = (finishedArticles) => {
    if (!finishedArticles?.length) return 0;

    // Get unique dates (in YYYY-MM-DD format) when articles were finished
    const dates = finishedArticles.map(article => {
      const date = new Date(article.finished_at);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const uniqueDates = [...new Set(dates)].sort();

    let currentStreak = 1;
    let longestStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(currDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  };

  // Add function to calculate current streak
  const calculateStreaks = (finishedArticles) => {
    if (!finishedArticles?.length) return { longest: 0, current: 0 };

    // Get unique dates (in YYYY-MM-DD format) when articles were finished
    const dates = finishedArticles.map(article => {
      const date = new Date(article.finished_at);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const uniqueDates = [...new Set(dates)].sort().reverse(); // Sort in descending order for current streak

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    // Calculate current streak
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if the most recent activity was today or yesterday
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffTime = Math.abs(prevDate - currDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    // Calculate longest streak
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(prevDate - currDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { longest: longestStreak, current: currentStreak };
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!params.email) return;
      
      try {
        setIsLoading(true);
        const identifier = decodeURIComponent(params.email);
        let profileQuery = supabase.from('profiles').select(`
          id,
          username,
          email,
          created_at,
          theme,
          self_introduction,
          japanese_level,
          duolingo_username,
          avatar_url
        `);

        // Check if the identifier is an email or username
        if (identifier.includes('@')) {
          profileQuery = profileQuery.eq('email', identifier);
        } else {
          profileQuery = profileQuery.eq('username', identifier);
        }

        const { data: profiles, error: profileError } = await profileQuery.maybeSingle();

        if (!isMounted) return;

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // Don't set error, just use default profile
        }

        // If no profile found, create a default one
        const defaultProfile = {
          id: identifier,
          username: identifier.includes('@') ? identifier.split('@')[0] : identifier,
          email: identifier.includes('@') ? identifier : null,
          created_at: new Date().toISOString(),
          theme: 'light'
        };

        const profileData = profiles || defaultProfile;
        setProfile(profileData);
        setTheme(profileData.theme || 'light');

        // Log profile data for debugging
        console.log('Profile Data:', profileData);

        // Fetch user's saved news with article data
        const { data: saved, error: savedError } = await supabase
          .from('saved_articles')
          .select(`
            *,
            article:articles (
              id,
              url,
              title,
              publish_date,
              images
            )
          `)
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (savedError) {
          console.error('Error fetching saved news:', savedError);
        }

        // Fetch user's finished articles with article data
        const { data: finished, error: finishedArticlesError } = await supabase
          .from('finished_articles')
          .select(`
            *,
            article:articles (
              id,
              url,
              title,
              publish_date,
              images
            )
          `)
          .eq('user_id', profileData.id)
          .order('finished_at', { ascending: false });

        if (!isMounted) return;

        if (finishedArticlesError) {
          console.error('Error fetching finished articles:', finishedArticlesError);
        }

        setSavedNews(saved || []);
        setFinishedNews(finished || []);

        // Fetch user's reading stats
        const { data: readingStats, error: statsError } = await supabase
          .from('reading_stats')
          .select('total_reading_time, total_articles_read')
          .eq('user_id', profileData.id)
          .maybeSingle();

        if (!isMounted) return;

        if (statsError && statsError.code !== 'PGRST116') {
          console.error('Error fetching reading stats:', statsError);
        }

        // Fetch finished articles count
        const { count: finishedCount, error: finishedError } = await supabase
          .from('finished_articles')
          .select('id', { count: 'exact' })
          .eq('user_id', profileData.id);

        if (finishedError) {
          console.error('Error fetching finished articles:', finishedError);
        }

        setStats({
          totalReadingTime: readingStats?.total_reading_time || 0,
          totalArticlesRead: readingStats?.total_articles_read || 0,
          totalSavedArticles: saved?.length || 0,
          totalFinishedArticles: finishedCount || 0,
          longestStreak: calculateLongestStreak(finished || []),
          currentStreak: calculateStreaks(finished || []).current
        });

        // Log all profile data after everything is fetched
        console.log('Profile Data:', {
          profile: profileData,
          readingStats: readingStats || {},
          stats: {
            totalReadingTime: readingStats?.total_reading_time || 0,
            totalArticlesRead: readingStats?.total_articles_read || 0,
            totalSavedArticles: saved?.length || 0,
            totalFinishedArticles: finishedCount || 0,
            longestStreak: calculateLongestStreak(finished || []),
            currentStreak: calculateStreaks(finished || []).current
          },
          savedArticles: {
            count: saved?.length || 0,
            items: saved || []
          },
          finishedArticles: {
            count: finished?.length || 0,
            items: finished || []
          }
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('Error in profile loading:', error);
        // Don't set error state, use default values instead
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [params.email]);

  // Add click outside handler for share menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    }

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showShareMenu]);

  // Add share functions
  const getShareUrl = () => {
    return `${window.location.origin}/profile/${profile?.username || profile?.email}`;
  };

  const copyToClipboard = async () => {
    try {
      const url = getShareUrl();
      const text = `Checkout my reading progress on #Amazyyy\n${url}`;
      await navigator.clipboard.writeText(text);
      setShowShareMenu(false);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToTwitter = () => {
    const url = getShareUrl();
    const isOwnProfile = currentUser?.id === profile?.id;
    const text = isOwnProfile
      ? `Check out my Japanese reading progress on Amazyyy! Currently on a ${stats.currentStreak}-day streak and have read ${stats.totalFinishedArticles} articles.\n\n${url}\n\n#Amazyyy #Japanese #LearnJapanese`
      : `Check out ${profile?.username || 'this reader'}'s Japanese reading progress on Amazyyy! They've finished ${stats.totalFinishedArticles} articles with a ${stats.longestStreak}-day best streak.\n\n${url}\n\n#Amazyyy #Japanese #LearnJapanese`;
    
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      '_blank'
    );
    setShowShareMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[rgb(19,31,36)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[rgb(19,31,36)] mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Add processForDisplay function
  const processForDisplay = (sentence) => {
    // Filter out hiragana readings that follow kanji
    const result = [];
    let skipNext = false;

    sentence.forEach((part, index) => {
      if (skipNext) {
        skipNext = false;
        return;
      }

      if (part.type === 'ruby') {
        const nextPart = sentence[index + 1];
        // If next part is the hiragana reading of this kanji, skip it
        if (nextPart?.type === 'text' && nextPart.content === part.reading) {
          skipNext = true;
        }
        result.push(part);
      } else {
        result.push(part);
      }
    });

    return result;
  };

  const renderTitle = (title) => {
    if (Array.isArray(title)) {
      return title.map((part, i) => {
        if (part.type === "ruby") {
          return (
            <RubyText
              key={i}
              part={part}
              preferenceState={{ show_furigana: true }}
            />
          );
        } else {
          return <span key={i}>{part.content}</span>;
        }
      });
    }
    return title;
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[rgb(19,31,36)]' : 'bg-gray-50'}`}>
      <Navbar theme={theme} hideNewsListButton={true} />
      
      <div className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Profile header */}
          <div className={`mb-16 relative ${theme === 'dark' ? 'bg-[rgb(19,31,36)]' : 'bg-gray-50'}`}>
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 rounded-3xl blur-3xl" />
            
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-10">
                <div className="flex flex-col items-center sm:items-start">
                  {profile?.avatar_url ? (
                    <div className="relative">
                      <img
                        src={profile.avatar_url}
                        alt={profile?.username || 'Profile'}
                        className={`w-32 h-32 rounded-[32px] object-cover shadow-lg transition-all duration-300 hover:scale-[1.01] ${
                          theme === 'dark' ? 'ring-1 ring-white/10' : 'ring-1 ring-black/5'
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className={`w-32 h-32 rounded-[32px] flex items-center justify-center text-5xl font-bold shadow-lg transition-all duration-300 hover:scale-[1.01] ${
                        theme === 'dark' ? 'bg-gray-800/80 text-gray-200' : 'bg-white text-gray-700'
                      }`}>
                        {profile?.username?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
                    <h1 className={`text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${
                      theme === 'dark' 
                        ? 'from-gray-100 to-gray-300'
                        : 'from-gray-700 to-gray-900'
                    }`}>
                      {profile?.username || 'Anonymous User'}
                    </h1>
                  </div>
                  <p className={`mt-3 text-sm font-medium tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Joined {new Date(profile?.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>

                  {/* Self Introduction */}
                  {profile?.self_introduction && (
                    <div className={`mt-8 transition-all duration-500 ${
                      theme === 'dark' 
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }`}>
                      <div className="flex gap-2">
                        <div className={`text-4xl font-serif ${theme === 'dark' ? 'text-gray-600/50' : 'text-gray-300/70'}`}>"</div>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap italic tracking-wide ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {profile.self_introduction.toUpperCase()}
                        </p>
                        <div className={`text-4xl font-serif self-end ${theme === 'dark' ? 'text-gray-600/50' : 'text-gray-300/70'}`}>"</div>
                      </div>
                    </div>
                  )}

                  {/* Japanese Level, Duolingo Username, and Share button */}
                  <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    {profile?.japanese_level && (
                      <div className={`inline-flex h-10 items-center px-5 rounded-xl text-sm font-medium tracking-wide backdrop-blur-sm transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200/50'
                      }`}>
                        <span>JLPT {profile.japanese_level}</span>
                      </div>
                    )}

                    {profile?.duolingo_username && (
                      <a
                        href={`https://www.duolingo.com/profile/${encodeURIComponent(profile.duolingo_username)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group relative inline-flex h-10 items-center gap-2.5 px-5 rounded-xl text-sm font-medium tracking-wide backdrop-blur-sm transition-all duration-300 ${
                          theme === 'dark'
                            ? 'bg-[#58CC02]/10 text-[#58CC02] hover:bg-[#58CC02]/20 border border-[#58CC02]/20'
                            : 'bg-[#58CC02]/10 text-[#58CC02] hover:bg-[#58CC02]/20 border border-[#58CC02]/20'
                        }`}
                      >
                        <img 
                          src="/icons/duolingo-long-text.svg" 
                          alt="Duolingo" 
                          className="h-4 w-auto"
                        />
                        <span className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          theme === 'dark'
                            ? 'bg-gray-800/95 text-gray-200 border border-gray-700/50'
                            : 'bg-white/95 text-gray-700 border border-gray-200/50'
                        }`}>
                          View Duolingo profile (opens in new tab)
                          <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${
                            theme === 'dark'
                              ? 'bg-gray-800/95 border-r border-b border-gray-700/50'
                              : 'bg-white/95 border-r border-b border-gray-200/50'
                          }`}></span>
                        </span>
                      </a>
                    )}

                    {/* Share button */}
                    <div className="relative" ref={shareMenuRef}>
                      <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className={`h-10 px-5 rounded-xl backdrop-blur-sm transition-all duration-300 inline-flex items-center ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-gray-700/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/70 border border-gray-200/50'
                        }`}
                        title="Share profile"
                      >
                        <FaShare className="w-4 h-4" />
                      </button>
                      {showShareMenu && (
                        <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-1.5 z-10 backdrop-blur-sm ${
                          theme === 'dark'
                            ? 'bg-gray-800/95 border border-gray-700/50'
                            : 'bg-white/95 border border-gray-200/50'
                        }`}>
                          <button
                            onClick={copyToClipboard}
                            className={`w-full px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-700/50'
                                : 'text-gray-700 hover:bg-gray-50/50'
                            }`}
                          >
                            <FaLink className="w-4 h-4" />
                            Copy Link
                          </button>
                          <button
                            onClick={shareToTwitter}
                            className={`w-full px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-700/50'
                                : 'text-gray-700 hover:bg-gray-50/50'
                            }`}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              fill="currentColor"
                            >
                              <path d="M13.3174 10.7749L19.1457 4H17.7646L12.7039 9.88256L8.66193 4H4L10.1122 12.8955L4 20H5.38119L10.7254 13.7878L14.994 20H19.656L13.3171 10.7749H13.3174ZM11.4257 12.9738L10.8064 12.0881L5.87886 5.03974H8.00029L11.9769 10.728L12.5962 11.6137L17.7652 19.0075H15.6438L11.4257 12.9742V12.9738Z" />
                            </svg>
                            Share on X
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="pt-12 sm:pt-16">
                <div className={`relative p-8 sm:p-10 rounded-3xl shadow-xl backdrop-blur-sm transition-all duration-500 group hover:scale-[1.01] ${
                  theme === 'dark' 
                    ? 'bg-gray-800/80 hover:bg-gray-800/90 border border-gray-700/50' 
                    : 'bg-white/90 hover:shadow-2xl border border-gray-200/50'
                }`}>
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
                    <div>
                      <div className={`text-3xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${
                        theme === 'dark' 
                          ? 'from-gray-100 to-gray-300'
                          : 'from-gray-700 to-gray-900'
                      }`}>
                        {stats.longestStreak} days
                      </div>
                      <div className={`text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <FaFire className="w-4 h-4 text-orange-500" />
                        Best Streak
                      </div>
                      <div className={`mt-3 text-xs flex items-center gap-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className={`px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors duration-300 ${
                          stats.currentStreak > 0
                            ? theme === 'dark'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/20'
                              : 'bg-orange-100 text-orange-700 border border-orange-200/50'
                            : theme === 'dark'
                            ? 'bg-gray-700 text-gray-400 border border-gray-600/50'
                            : 'bg-gray-100 text-gray-500 border border-gray-200/50'
                        }`}>
                          {stats.currentStreak} days current
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className={`text-3xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${
                        theme === 'dark' 
                          ? 'from-gray-100 to-gray-300'
                          : 'from-gray-700 to-gray-900'
                      }`}>
                        {stats.totalFinishedArticles}
                      </div>
                      <div className={`text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <FaCheck className="w-4 h-4 text-green-500" />
                        Finished Read
                      </div>
                    </div>
                    <div>
                      <div className={`text-3xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${
                        theme === 'dark' 
                          ? 'from-gray-100 to-gray-300'
                          : 'from-gray-700 to-gray-900'
                      }`}>
                        {formatDuration(stats.totalReadingTime)}
                      </div>
                      <div className={`text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <FaClock className="w-4 h-4 text-blue-500" />
                        Total Reading Time
                      </div>
                    </div>
                    <div>
                      <div className={`text-3xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${
                        theme === 'dark' 
                          ? 'from-gray-100 to-gray-300'
                          : 'from-gray-700 to-gray-900'
                      }`}>
                        {stats.totalSavedArticles}
                      </div>
                      <div className={`text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <FaHeart className="w-4 h-4 text-red-500" />
                        Saved Articles
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 bg-clip-text text-transparent bg-gradient-to-r ${
            theme === 'dark' 
              ? 'from-gray-100 to-gray-300'
              : 'from-gray-700 to-gray-900'
          }`}>
            Journey
          </h2>

          <div className="relative">
            {/* Timeline line with gradient - only visible on sm and up */}
            <div className={`absolute hidden sm:block left-0 top-0 bottom-0 w-0.5 ${
              theme === 'dark'
                ? 'bg-gradient-to-b from-gray-700/50 via-gray-600/50 to-gray-700/50'
                : 'bg-gradient-to-b from-gray-200/70 via-gray-300/70 to-gray-200/70'
            }`} />

            <div className="space-y-4 sm:space-y-8">
              {/* Activity items */}
              {getActivityItems().map((item, index) => (
                <div key={`${item.type}-${index}`} className="relative sm:flex sm:gap-6">
                  {/* Timeline dot and date - only visible on sm and up */}
                  <div className="hidden sm:block relative flex-shrink-0">
                    <div className={`absolute left-0 top-1 w-4 h-4 -ml-2 rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110 ${
                      theme === 'dark' ? 'border-gray-800' : 'border-white'
                    } ${
                      item.type === "saved" 
                        ? "bg-gradient-to-br from-red-400 to-red-600"
                        : item.type === "finished"
                        ? "bg-gradient-to-br from-green-400 to-green-600"
                        : "bg-gradient-to-br from-yellow-400 to-yellow-600"
                    }`} />
                    <div className={`pl-6 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.type === 'joined' ? (
                        (() => {
                          const date = new Date(item.date);
                          return [
                            date.toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                            }) +
                              ' at ' +
                              date.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }),
                            'joined Amazyyy as Reader',
                          ].map((text, i) => (
                            <div key={i} className={i === 1 ? 'text-sm font-medium flex items-center gap-2' : 'text-xs opacity-75'}>
                              {text}
                              {i === 1 && (
                                <FaEgg className="w-3.5 h-3.5 text-yellow-500" />
                              )}
                            </div>
                          ));
                        })()
                      ) : (
                        formatDate(item.date, item.type).map((text, i) => (
                          <div key={i} className={
                            i === 1
                              ? "text-sm font-medium flex items-center gap-2"
                              : "text-xs opacity-75"
                          }>
                            {text}
                            {i === 1 &&
                              (item.type === "saved" ? (
                                <FaHeart className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <FaCheck className="w-3.5 h-3.5 text-green-500" />
                              ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Article content */}
                  {item.type !== 'joined' ? (
                    <button onClick={() =>
                      router.push(
                        `/read?source=${encodeURIComponent(item.data.url)}`
                      )
                    } className={`w-full sm:flex-1 p-4 sm:p-6 rounded-xl sm:rounded-2xl backdrop-blur-sm transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-800/30 hover:bg-gray-800/40 border border-gray-700/50' 
                        : 'bg-white/90 hover:bg-white/95 border border-gray-200/50'
                    }`}>
                      <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Mobile date and status display */}
                        <div className="flex sm:hidden items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-gray-400">
                            <span>{formatDate(item.date, item.type)[0]}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.type === "saved" ? (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-red-50 text-red-600'
                              }`}>
                                <FaHeart className="w-3 h-3" />
                                <span>Saved</span>
                              </div>
                            ) : (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-green-50 text-green-600'
                              }`}>
                                <FaCheck className="w-3 h-3" />
                                <span>Finished</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          <div className="block w-full sm:w-40 h-32 sm:h-32 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100/50">
                            {item.data.article?.images?.[0] ? (
                              <img src={item.data.article.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => {
                                e.target.parentElement.style.display = "none";
                              }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100/50">
                                <FaBook className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className={`text-base sm:text-lg font-medium mb-2 sm:mb-3 break-words line-clamp-2 ${theme === 'dark' ? 'text-gray-100' : 'text-[rgb(19,31,36)]'}`}>
                              {(() => {
                                try {
                                  let title =
                                    item.data.article?.title || item.data.title;

                                  if (
                                    typeof title === "string" &&
                                    (title.startsWith("[") || title.startsWith("{"))
                                  ) {
                                    try {
                                      title = JSON.parse(title);
                                    } catch (e) {
                                      return title || "Untitled Article";
                                    }
                                  }

                                  if (Array.isArray(title)) {
                                    return processContent(title).map((part, i) => {
                                      if (part.type === "ruby") {
                                        return (
                                          <RubyText
                                            key={i}
                                            part={part}
                                            preferenceState={{
                                              show_furigana: true,
                                            }}
                                          />
                                        );
                                      }
                                      return <span key={i}>{part.content}</span>;
                                    });
                                  }

                                  return title || "Untitled Article";
                                } catch (e) {
                                  return "Untitled Article";
                                }
                              })()}
                            </h3>
                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.data.article?.publish_date
                                  ? formatJapaneseDate(
                                      item.data.article.publish_date
                                    )
                                  : "No date"}
                              </p>
                              {item.type === "saved" &&
                                item.data.reading_time > 0 && (
                                  <div className={`flex items-center gap-1.5 sm:gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FaClock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                    <span className="whitespace-nowrap">
                                      Read for{" "}
                                      {formatDuration(item.data.reading_time)}
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    // Mobile joined card
                    <div className="sm:hidden mb-4 p-4 rounded-xl backdrop-blur-sm ${theme === 'dark' ? 'bg-gray-800/30 border border-gray-700/50' : 'bg-white/90 border border-gray-200/50'}">
                      <div className="flex items-center gap-2 text-sm">
                        <FaEgg className="w-4 h-4 text-yellow-500" />
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Joined Amazyyy as Reader</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  )}
                  {item.type === 'joined' && <div className="hidden sm:block flex-1" />}
                </div>
              ))}

              {(savedNews.length === 0 && finishedNews.length === 0) && (
                <div className={`text-center py-12 sm:py-20 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <FaBook className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className="text-lg sm:text-xl font-medium tracking-wide">No reading activity yet</p>
                  <p className="text-xs sm:text-sm mt-2 sm:mt-3 text-gray-500">
                    This reader's journey will be shown here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-24 pb-4 w-full text-center">
        <span className={`text-[8px] opacity-30 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          The Duolingo logo and brand are trademarks of Duolingo, Inc. Amazyyy is not affiliated with, endorsed, or sponsored by Duolingo.
        </span>
      </div>
    </div>
  );
} 