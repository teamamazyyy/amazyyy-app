'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { FaUser, FaSnowflake, FaRuler, FaShoePrints, FaAngleRight } from 'react-icons/fa';
import dynamic from 'next/dynamic';

const StanceVisualizer = dynamic(() => import('./StanceVisualizer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

const StanceGuide = dynamic(() => import('./StanceGuide'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function SnowboarderProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    boot_size: '',
    stance: 'regular',
    stance_width: '',
    board_length: '',
    board_type: 'all-mountain',
    binding_size: '',
    front_binding_angle: '',
    back_binding_angle: '',
    preferred_terrain: 'all-mountain',
    riding_style: 'freestyle',
    experience_level: 'beginner'
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('snowboarding_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') { // No profile found
          // Create a new profile with default values
          const defaultProfile = {
            user_id: user.id,
            height: null,
            weight: null,
            shoe_size: null,
            stance: 'regular',
            stance_width: null,
            board_length: null,
            board_type: 'all-mountain',
            boot_size: null,
            binding_size: null,
            front_binding_angle: null,
            back_binding_angle: null,
            preferred_terrain: 'all-mountain',
            riding_style: 'freestyle',
            experience_level: 'beginner',
            favorite_tutorials: []
          };

          const { data: newProfile, error: insertError } = await supabase
            .from('snowboarding_profiles')
            .insert([defaultProfile])
            .select()
            .single();

          if (insertError) throw insertError;
          
          setProfile(newProfile);
          // Set form data with empty strings for form inputs
          setFormData({
            height: '',
            weight: '',
            boot_size: '',
            stance: 'regular',
            stance_width: '',
            board_length: '',
            board_type: 'all-mountain',
            binding_size: '',
            front_binding_angle: '',
            back_binding_angle: '',
            preferred_terrain: 'all-mountain',
            riding_style: 'freestyle',
            experience_level: 'beginner'
          });
        } else {
          throw checkError;
        }
      } else {
        setProfile(existingProfile);
        // Convert null values to empty strings for form inputs
        setFormData({
          height: existingProfile.height?.toString() || '',
          weight: existingProfile.weight?.toString() || '',
          boot_size: existingProfile.boot_size?.toString() || '',
          stance: existingProfile.stance || 'regular',
          stance_width: existingProfile.stance_width?.toString() || '',
          board_length: existingProfile.board_length?.toString() || '',
          board_type: existingProfile.board_type || 'all-mountain',
          binding_size: existingProfile.binding_size || '',
          front_binding_angle: existingProfile.front_binding_angle?.toString() || '',
          back_binding_angle: existingProfile.back_binding_angle?.toString() || '',
          preferred_terrain: existingProfile.preferred_terrain || 'all-mountain',
          riding_style: existingProfile.riding_style || 'freestyle',
          experience_level: existingProfile.experience_level || 'beginner'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Convert empty strings to null for numeric fields
      const processedFormData = {
        ...formData,
        height: formData.height === '' ? null : Number(formData.height),
        weight: formData.weight === '' ? null : Number(formData.weight),
        boot_size: formData.boot_size === '' ? null : Number(formData.boot_size),
        stance_width: formData.stance_width === '' ? null : Number(formData.stance_width),
        board_length: formData.board_length === '' ? null : Number(formData.board_length),
        front_binding_angle: formData.front_binding_angle === '' ? null : Number(formData.front_binding_angle),
        back_binding_angle: formData.back_binding_angle === '' ? null : Number(formData.back_binding_angle),
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('snowboarding_profiles')
        .upsert(processedFormData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to save profile');
      }

      setProfile(data);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FaUser className="text-blue-500 text-xl" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Snowboarder Profile
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Your personal snowboarding specifications
            </p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto px-4 py-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            Edit Profile
            <FaAngleRight />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Measurements */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Measurements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter height"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter weight"
                />
              </div>
            </div>
          </div>

          {/* Sizing */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sizing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Board Length (cm)
                </label>
                <input
                  type="number"
                  value={formData.board_length}
                  onChange={(e) =>
                    setFormData({ ...formData, board_length: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter board length"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Board Type
                </label>
                <select
                  value={formData.board_type}
                  onChange={(e) =>
                    setFormData({ ...formData, board_type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all-mountain">All Mountain</option>
                  <option value="freestyle">Freestyle</option>
                  <option value="freeride">Freeride</option>
                  <option value="powder">Powder</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Boot Size (US)
                </label>
                <input
                  type="number"
                  value={formData.boot_size}
                  onChange={(e) =>
                    setFormData({ ...formData, boot_size: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter boot size"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Binding Size
                </label>
                <input
                  type="text"
                  value={formData.binding_size}
                  onChange={(e) =>
                    setFormData({ ...formData, binding_size: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter binding size"
                />
              </div>
            </div>
          </div>

          {/* Stance Settings */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Stance Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stance
                </label>
                <select
                  value={formData.stance}
                  onChange={(e) =>
                    setFormData({ ...formData, stance: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="regular">Regular</option>
                  <option value="goofy">Goofy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stance Width (cm)
                </label>
                <input
                  type="number"
                  value={formData.stance_width}
                  onChange={(e) =>
                    setFormData({ ...formData, stance_width: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter stance width"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Front Binding Angle
                </label>
                <input
                  type="number"
                  value={formData.front_binding_angle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      front_binding_angle: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter front binding angle"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Back Binding Angle
                </label>
                <input
                  type="number"
                  value={formData.back_binding_angle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      back_binding_angle: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter back binding angle"
                />
              </div>
            </div>
            <StanceGuide
              stance={formData.stance || "regular"}
              frontAngle={Number(formData.front_binding_angle) || 0}
              backAngle={Number(formData.back_binding_angle) || 0}
            />
          </div>

          {/* Riding Preferences */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Riding Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Terrain
                </label>
                <select
                  value={formData.preferred_terrain}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_terrain: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all-mountain">All Mountain</option>
                  <option value="groomers">Groomers</option>
                  <option value="powder">Powder</option>
                  <option value="park">Park</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Riding Style
                </label>
                <select
                  value={formData.riding_style}
                  onChange={(e) =>
                    setFormData({ ...formData, riding_style: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="freestyle">Freestyle</option>
                  <option value="freeride">Freeride</option>
                  <option value="carving">Carving</option>
                  <option value="all-around">All Around</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Experience Level
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_level: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData(profile);
                setError(null);
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          {/* Personal Measurements */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Measurements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Height
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                  {profile?.height ? `${profile.height} cm` : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Weight
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                  {profile?.weight ? `${profile.weight} kg` : "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Sizing */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sizing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Board Length
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                  {profile?.board_length
                    ? `${profile.board_length} cm`
                    : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Board Type
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white capitalize">
                  {profile?.board_type?.replace("-", " ") || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Boot Size
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                  {profile?.boot_size ? `US ${profile.boot_size}` : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Binding Size
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                  {profile?.binding_size || "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Stance Settings */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Stance Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Stance
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white capitalize">
                  {profile?.stance || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Stance Width
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                  {profile?.stance_width
                    ? `${profile.stance_width} cm`
                    : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Front Binding Angle
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                  {profile?.front_binding_angle
                    ? `${profile.front_binding_angle}°`
                    : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Back Binding Angle
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                  {profile?.back_binding_angle
                    ? `${profile.back_binding_angle}°`
                    : "Not set"}
                </p>
              </div>
            </div>
            <div>
              <StanceGuide
                stance={profile?.stance || "regular"}
                frontAngle={Number(profile?.front_binding_angle) || 0}
                backAngle={Number(profile?.back_binding_angle) || 0}
              />
            </div>
          </div>

          {/* Riding Preferences */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Riding Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Preferred Terrain
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white capitalize">
                  {profile?.preferred_terrain?.replace("-", " ") || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Riding Style
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white capitalize">
                  {profile?.riding_style?.replace("-", " ") || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Experience Level
                </span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white capitalize">
                  {profile?.experience_level || "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 