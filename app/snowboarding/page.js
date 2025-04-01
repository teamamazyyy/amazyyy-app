'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { FaSnowflake, FaCheck, FaTimes, FaPlay, FaYoutube, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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

  useEffect(() => {
    if (user) {
      initializeSkills();
    }
  }, [user]);

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

  const loadTutorials = async (skillId, skillName) => {
    if (tutorials[skillId] || loadingTutorials[skillId]) return;

    setLoadingTutorials(prev => ({ ...prev, [skillId]: true }));
    try {
      const results = await searchYouTubeTutorials(skillName);
      setTutorials(prev => ({ ...prev, [skillId]: results }));
    } catch (error) {
      console.error('Error loading tutorials:', error);
    } finally {
      setLoadingTutorials(prev => ({ ...prev, [skillId]: false }));
    }
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center text-gray-900 dark:text-white">
            <FaSnowflake className="mr-2 sm:mr-3 text-blue-500 text-4xl sm:text-5xl" />
            Snowboarding Skills
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-base sm:text-lg">
            Track your progress through different skill levels
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 sm:px-6 py-3 sm:py-4 rounded-lg relative mb-4 sm:mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Skills List by Level */}
          <div className="space-y-4 sm:space-y-10">
            {[1, 2, 3, 4, 5, 6].map((level) => {
              const levelSkills = skills.filter(skill => skill.level === level);
              const progress = getLevelProgress(level);
              
              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: level * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  {/* Level Header */}
                  <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-3 sm:px-8 py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{levelNames[level]}</h2>
                        <p className="text-blue-100 text-xs sm:text-sm">
                          Level {level} • {progress.completed}/{progress.total} skills completed
                        </p>
                      </div>
                      <div className="text-white text-xl sm:text-2xl font-bold">
                        {Math.round(progress.percentage)}%
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 sm:mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>
                  </div>

                  {/* Skills List */}
                  <div className="p-3 sm:p-8 space-y-3 sm:space-y-4">
                    {levelSkills.map((skill, index) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col p-3 sm:p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-100 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                              {skill.skill_name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                              {skill.description}
                            </p>
                            {skill.completed_at && (
                              <p className="text-sm text-green-600 dark:text-green-400 mt-3 flex items-center">
                                <FaCheck className="mr-2" />
                                Completed on {new Date(skill.completed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => toggleSkillCompletion(skill.id, !skill.is_completed)}
                            className={`ml-4 sm:ml-6 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                              skill.is_completed
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg shadow-gray-500/10'
                            }`}
                            title={skill.is_completed ? "Completed" : "Mark as Complete"}
                          >
                            {skill.is_completed ? (
                              <span className="flex items-center text-sm sm:text-base">
                                <FaCheck className="mr-2" />
                                Completed
                              </span>
                            ) : (
                              <FaCheck className="text-lg sm:text-xl" />
                            )}
                          </button>
                        </div>

                        {/* Tutorials Section */}
                        <div className="mt-4 sm:mt-6">
                          <button
                            onClick={() => loadTutorials(skill.id, skill.skill_name)}
                            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-3 sm:mb-4"
                          >
                            <FaYoutube className="mr-2 text-lg sm:text-xl" />
                            <span className="font-medium text-sm sm:text-base">Show Tutorials</span>
                          </button>

                          {loadingTutorials[skill.id] ? (
                            <div className="flex items-center justify-center py-3 sm:py-4">
                              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                          ) : tutorials[skill.id]?.length > 0 ? (
                            <div className="relative">
                              <div className="overflow-x-auto pb-3 sm:pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4">
                                <div className="flex space-x-3 sm:space-x-4 min-w-max">
                                  {tutorials[skill.id].map((tutorial) => (
                                    <a
                                      key={tutorial.video_id}
                                      href={`https://www.youtube.com/watch?v=${tutorial.video_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 w-[280px] sm:w-[300px] flex-shrink-0"
                                    >
                                      <div className="relative aspect-video">
                                        <img
                                          src={tutorial.thumbnail_url}
                                          alt={tutorial.title}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                          <FaPlay className="text-white text-3xl sm:text-4xl" />
                                        </div>
                                      </div>
                                      <div className="p-3 sm:p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 text-sm sm:text-base">
                                          {tutorial.title}
                                        </h4>
                                        <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                          <span>{formatDuration(tutorial.duration)}</span>
                                          <span className="mx-2">•</span>
                                          <span>{formatViewCount(tutorial.view_count)} views</span>
                                        </div>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                              {/* Scroll indicators */}
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                <FaChevronLeft className="text-gray-600 dark:text-gray-300 text-sm sm:text-base" />
                              </div>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                <FaChevronRight className="text-gray-600 dark:text-gray-300 text-sm sm:text-base" />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}
