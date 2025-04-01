'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { FaSnowflake, FaCheck, FaTimes, FaPlay, FaYoutube, FaChevronLeft, FaChevronRight, FaPlus, FaStar } from 'react-icons/fa';
import { ensureDefaultSkills } from '@/lib/snowboarding';
import { supabase } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';
import { searchYouTubeTutorials, formatDuration, formatViewCount } from '@/lib/youtube';

export default function SnowboardingPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tutorials, setTutorials] = useState({});
  const [loadingTutorials, setLoadingTutorials] = useState({});
  const [hasMoreTutorials, setHasMoreTutorials] = useState({});
  const [tutorialPage, setTutorialPage] = useState({});
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    description: '',
    level: 1
  });
  const [favorites, setFavorites] = useState({});
  const [loadingFavorites, setLoadingFavorites] = useState({});
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    if (user) {
      initializeSkills();
    }
  }, [user]);

  useEffect(() => {
    if (skills.length > 0) {
      loadAllTutorials();
      loadAllFavorites();
    }
  }, [skills]);

  const loadAllTutorials = async () => {
    for (const skill of skills) {
      if (!tutorials[skill.id] && !loadingTutorials[skill.id]) {
        await loadTutorials(skill.id, skill.skill_name);
      }
    }
  };

  const loadAllFavorites = async () => {
    for (const skill of skills) {
      if (!favorites[skill.id] && !loadingFavorites[skill.id]) {
        await loadFavorites(skill.id);
      }
    }
  };

  const initializeSkills = async () => {
    try {
      // First ensure default skills exist
      await ensureDefaultSkills(user.id);
      
      // Then fetch all skills
      const { data, error } = await supabase
        .from('snowboarding_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('level', { ascending: true });

      if (error) throw error;
      setSkills(data);
    } catch (error) {
      console.error('Error initializing skills:', error);
      setError('Failed to load skills');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const toggleSkillCompletion = async (skillId, isCompleted) => {
    try {
      const { data, error } = await supabase
        .from('snowboarding_skills')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', skillId)
        .select();

      if (error) throw error;

      setSkills(prevSkills =>
        prevSkills.map(skill =>
          skill.id === skillId ? { ...skill, is_completed: isCompleted, completed_at: data[0].completed_at } : skill
        )
      );
    } catch (error) {
      console.error('Error updating skill:', error);
      setError('Failed to update skill');
    }
  };

  const getLevelProgress = (level) => {
    const levelSkills = skills.filter(skill => skill.level === level);
    const completedSkills = levelSkills.filter(skill => skill.is_completed);
    return {
      total: levelSkills.length,
      completed: completedSkills.length,
      percentage: (completedSkills.length / levelSkills.length) * 100
    };
  };

  const levelNames = {
    1: 'Beginner',
    2: 'Novice',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
    6: 'Master'
  };

  const loadTutorials = async (skillId, skillName, page = 1) => {
    if (loadingTutorials[skillId]) return;

    setLoadingTutorials(prev => ({ ...prev, [skillId]: true }));
    try {
      const results = await searchYouTubeTutorials(skillName, page);
      setTutorials(prev => ({
        ...prev,
        [skillId]: page === 1 ? results : [...(prev[skillId] || []), ...results]
      }));
      setHasMoreTutorials(prev => ({
        ...prev,
        [skillId]: results.length === 10 // Assuming 10 is our page size
      }));
      setTutorialPage(prev => ({
        ...prev,
        [skillId]: page
      }));
    } catch (error) {
      console.error('Error loading tutorials:', error);
    } finally {
      setLoadingTutorials(prev => ({ ...prev, [skillId]: false }));
    }
  };

  const loadFavorites = async (skillId) => {
    if (favorites[skillId] || loadingFavorites[skillId]) return;

    setLoadingFavorites(prev => ({ ...prev, [skillId]: true }));
    try {
      const { data, error } = await supabase
        .from('favorite_tutorials')
        .select('video_id')
        .eq('skill_id', skillId);

      if (error) {
        console.error('Database error loading favorites:', {
          error,
          skillId,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        console.warn('No favorites data returned for skill:', skillId);
        setFavorites(prev => ({
          ...prev,
          [skillId]: {}
        }));
        return;
      }

      setFavorites(prev => ({
        ...prev,
        [skillId]: data.reduce((acc, fav) => ({ ...acc, [fav.video_id]: true }), {})
      }));
    } catch (error) {
      console.error('Error loading favorites:', {
        error,
        skillId,
        message: error.message,
        stack: error.stack
      });
      // Set empty favorites for this skill to prevent infinite retries
      setFavorites(prev => ({
        ...prev,
        [skillId]: {}
      }));
    } finally {
      setLoadingFavorites(prev => ({ ...prev, [skillId]: false }));
    }
  };

  const toggleFavorite = async (skillId, tutorial) => {
    const isFavorited = favorites[skillId]?.[tutorial.video_id];
    
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorite_tutorials')
          .delete()
          .eq('skill_id', skillId)
          .eq('video_id', tutorial.video_id);

        if (error) throw error;

        setFavorites(prev => ({
          ...prev,
          [skillId]: {
            ...prev[skillId],
            [tutorial.video_id]: false
          }
        }));
      } else {
        const { error } = await supabase
          .from('favorite_tutorials')
          .insert([
            {
              user_id: user.id,
              skill_id: skillId,
              video_id: tutorial.video_id,
              title: tutorial.title,
              description: tutorial.description,
              thumbnail_url: tutorial.thumbnail_url,
              duration: tutorial.duration,
              view_count: tutorial.view_count,
              published_at: tutorial.published_at
            }
          ]);

        if (error) throw error;

        setFavorites(prev => ({
          ...prev,
          [skillId]: {
            ...prev[skillId],
            [tutorial.video_id]: true
          }
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Failed to update favorite status');
    }
  };

  const addCustomSkill = async () => {
    try {
      const { data, error } = await supabase
        .from('snowboarding_skills')
        .insert([
          {
            user_id: user.id,
            skill_name: newSkill.skill_name,
            description: newSkill.description,
            level: newSkill.level,
            is_completed: false
          }
        ])
        .select();

      if (error) throw error;

      setSkills(prevSkills => [...prevSkills, data[0]]);
      setShowAddSkill(false);
      setNewSkill({ skill_name: '', description: '', level: 1 });
    } catch (error) {
      console.error('Error adding skill:', error);
      setError('Failed to add skill');
    }
  };

  const updateSkillLevel = async (skillId, newLevel) => {
    try {
      const { data, error } = await supabase
        .from('snowboarding_skills')
        .update({ level: newLevel })
        .eq('id', skillId)
        .select();

      if (error) throw error;

      setSkills(prevSkills =>
        prevSkills.map(skill =>
          skill.id === skillId ? { ...skill, level: newLevel } : skill
        )
      );
    } catch (error) {
      console.error('Error updating skill level:', error);
      setError('Failed to update skill level');
    }
  };

  const handleVideoClick = (e, tutorial) => {
    e.preventDefault(); // Prevent default link behavior
    setSelectedVideo(tutorial);
    setShowVideoModal(true);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-2 sm:px-6 py-4 sm:py-8 pt-20 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center text-gray-900 dark:text-white">
                <FaSnowflake className="mr-2 sm:mr-3 text-blue-500 text-4xl sm:text-5xl" />
                Snowboarding Path
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                Follow the path to master snowboarding skills
              </p>
            </div>
            <button
              onClick={() => setShowAddSkill(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Skill
            </button>
          </div>

          {/* Add Skill Modal */}
          {showAddSkill && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New Skill</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Skill Name
                    </label>
                    <input
                      type="text"
                      value={newSkill.skill_name}
                      onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter skill name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newSkill.description}
                      onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      rows="3"
                      placeholder="Enter skill description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Level
                    </label>
                    <select
                      value={newSkill.level}
                      onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <option key={level} value={level}>
                          Level {level}: {levelNames[level]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddSkill(false);
                      setNewSkill({ skill_name: '', description: '', level: 1 });
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomSkill}
                    disabled={!newSkill.skill_name.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 sm:px-6 py-3 sm:py-4 rounded-lg relative mb-4 sm:mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Learning Path */}
          <div className="relative">
            {/* Path Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            {/* Skills Path */}
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((level) => {
                const levelSkills = skills.filter(skill => skill.level === level);
                const progress = getLevelProgress(level);
                
                return (
                  <div key={level} className="relative">
                    {/* Level Header */}
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm">
                          Level {level}
                        </div>
                        <div className="ml-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                            {levelNames[level]}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                            {progress.completed}/{progress.total} skills completed
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {levelSkills.map((skill, index) => (
                        <motion.div
                          key={skill.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-200"
                        >
                          {/* Skill Content */}
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {skill.skill_name}
                                  </h3>
                                  {!skill.is_default && (
                                    <select
                                      value={skill.level}
                                      onChange={(e) => updateSkillLevel(skill.id, parseInt(e.target.value))}
                                      className="text-sm px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      {[1, 2, 3, 4, 5, 6].map((level) => (
                                        <option key={level} value={level}>
                                          Level {level}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                  {skill.description}
                                </p>
                                {skill.completed_at && (
                                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
                                    <FaCheck className="mr-2" />
                                    Completed on {new Date(skill.completed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => toggleSkillCompletion(skill.id, !skill.is_completed)}
                                className={`ml-4 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                  skill.is_completed
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400'
                                }`}
                              >
                                {skill.is_completed ? (
                                  <span className="flex items-center">
                                    <FaCheck className="mr-2" />
                                    Done
                                  </span>
                                ) : (
                                  <FaCheck />
                                )}
                              </button>
                            </div>

                            {/* Tutorials Section */}
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-3">
                                <div className="flex items-center">
                                  <FaYoutube className="mr-2" />
                                  <span className="font-medium text-sm">Tutorials</span>
                                </div>
                                {hasMoreTutorials[skill.id] && (
                                  <button
                                    onClick={() => loadTutorials(skill.id, skill.skill_name, (tutorialPage[skill.id] || 1) + 1)}
                                    className="text-sm text-blue-500 hover:text-blue-600 flex items-center"
                                  >
                                    Load More
                                    <FaChevronRight className="ml-1" />
                                  </button>
                                )}
                              </div>

                              {loadingTutorials[skill.id] && tutorialPage[skill.id] === 1 ? (
                                <div className="flex items-center justify-center py-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                              ) : tutorials[skill.id]?.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <div className="flex space-x-3">
                                    {tutorials[skill.id].map((tutorial) => (
                                      <div key={tutorial.video_id} className="group relative w-40 sm:w-48 flex-shrink-0">
                                        <a
                                          href={`https://www.youtube.com/watch?v=${tutorial.video_id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block"
                                          onClick={(e) => handleVideoClick(e, tutorial)}
                                        >
                                          <div className="relative aspect-video rounded-lg overflow-hidden">
                                            <img
                                              src={tutorial.thumbnail_url}
                                              alt={tutorial.title}
                                              className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <FaPlay className="text-white text-xl" />
                                            </div>
                                          </div>
                                          <div className="mt-2">
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                                              {tutorial.title}
                                            </h4>
                                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              <span>{formatDuration(tutorial.duration)}</span>
                                              <span className="mx-2">•</span>
                                              <span>{formatViewCount(tutorial.view_count)} views</span>
                                            </div>
                                          </div>
                                        </a>
                                        <button
                                          onClick={() => toggleFavorite(skill.id, tutorial)}
                                          className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                                            favorites[skill.id]?.[tutorial.video_id]
                                              ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                                              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-yellow-400'
                                          }`}
                                        >
                                          <FaStar className="text-sm" />
                                        </button>
                                      </div>
                                    ))}
                                    {loadingTutorials[skill.id] && tutorialPage[skill.id] > 1 && (
                                      <div className="w-40 sm:w-48 flex-shrink-0 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No tutorials available</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video Player Modal */}
          {showVideoModal && selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => {
                setShowVideoModal(false);
                setSelectedVideo(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl overflow-hidden shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setSelectedVideo(null);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 transition-colors z-10 shadow-sm"
                >
                  <FaTimes className="text-xl" />
                </button>

                {/* Video Player */}
                <div className="relative pt-[56.25%] bg-black">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${selectedVideo.video_id}?autoplay=1`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Video Info */}
                <div className="p-6 border-t border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                          {selectedVideo.title}
                        </h3>
                        <button
                          onClick={() => toggleFavorite(selectedVideo.skill_id, selectedVideo)}
                          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center ${
                            favorites[selectedVideo.skill_id]?.[selectedVideo.video_id]
                              ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-yellow-400'
                          }`}
                          title={favorites[selectedVideo.skill_id]?.[selectedVideo.video_id] ? "Remove from favorites" : "Add to favorites"}
                        >
                          <FaStar className="mr-2" />
                          {favorites[selectedVideo.skill_id]?.[selectedVideo.video_id] ? 'Favorited' : 'Favorite'}
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {selectedVideo.description}
                      </p>
                      <div className="flex items-center justify-between text-gray-500 text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <FaPlay className="mr-2" />
                            {formatDuration(selectedVideo.duration)}
                          </span>
                          <span className="flex items-center">
                            <FaYoutube className="mr-2" />
                            {formatViewCount(selectedVideo.view_count)} views
                          </span>
                        </div>
                        <a
                          href={`https://www.youtube.com/watch?v=${selectedVideo.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 flex items-center text-sm"
                        >
                          <FaYoutube className="mr-2" />
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}
