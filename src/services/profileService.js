import { supabase } from './supabaseClient.js';

/**
 * Service for fetching and updating user profiles in Supabase public.profiles.
 */
export const profileService = {
  /**
   * Fetches a user profile by ID.
   * @param {string} userId
   * @returns {Promise<{ data: any, error: any }>}
   */
  async getProfile(userId) {
    try {
      if (!userId) throw new Error('User ID is required to fetch profile.');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[profileService.getProfile Error]:', err.message);
      return { data: null, error: { message: err.message } };
    }
  },

  /**
   * Updates fields for the current user's profile in public.profiles.
   * @param {string} userId
   * @param {Object} updates
   * @returns {Promise<{ data: any, error: any }>}
   */
  async updateProfile(userId, updates) {
    try {
      if (!userId) throw new Error('User ID is required to update profile.');

      const cleanUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(cleanUpdates)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[profileService.updateProfile Error]:', err.message);
      return { data: null, error: { message: err.message } };
    }
  },

  /**
   * Fetches the active authenticated user's profile.
   * @returns {Promise<{ data: any, error: any }>}
   */
  async getCurrentUserProfile() {
    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        return { data: null, error: authErr || { message: 'No active session' } };
      }

      return await this.getProfile(user.id);
    } catch (err) {
      console.error('[profileService.getCurrentUserProfile Error]:', err.message);
      return { data: null, error: { message: err.message } };
    }
  },
};

export default profileService;
