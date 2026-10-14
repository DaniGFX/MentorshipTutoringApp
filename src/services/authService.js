import { supabase } from './supabaseClient.js';

/**
 * Service handling Supabase Authentication & Profile Synchronization.
 */
export const authService = {
  /**
   * Registers a new user with Supabase Auth and initializes their profile record.
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} params.fullName
   * @param {'student' | 'mentor'} params.role
   * @param {string} [params.schoolName]
   * @param {string} [params.educationLevel]
   * @returns {Promise<{ user: any, session: any, profile: any, error: any }>}
   */
  async signUp({ email, password, fullName, role = 'student', schoolName = 'University', educationLevel = 'college' }) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanFullName = fullName.trim();

      // 1. Create authentication credentials in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanFullName,
            account_type: role,
          },
        },
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) {
        throw new Error('Registration failed. Please check your credentials and try again.');
      }

      // 2. Initialize corresponding row in public.profiles table
      const profilePayload = {
        id: user.id,
        full_name: cleanFullName,
        email: cleanEmail,
        account_type: role,
        education_level: educationLevel,
        school_name: schoolName,
        is_tutor: role === 'mentor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('*')
        .single();

      if (profileError) {
        console.warn('[authService.signUp]: Profile upsert warning:', profileError.message);
      }

      // 3. If role is mentor, initialize public.tutor_profiles
      if (role === 'mentor') {
        const mentorPayload = {
          tutor_id: user.id,
          headline: 'Academic Peer Mentor',
          bio_experience: 'Passionate peer mentor ready to assist fellow students.',
          hourly_rate: 0.0,
          is_accepting_students: true,
          total_service_hours: 0.0,
          average_rating: 5.0,
          completed_sessions_count: 0,
          mentoring_style: 'one_on_one',
          years_experience: 1,
          profile_visibility: true,
          show_email: false,
        };

        const { error: tutorError } = await supabase
          .from('tutor_profiles')
          .upsert(mentorPayload, { onConflict: 'tutor_id' });

        if (tutorError) {
          console.warn('[authService.signUp]: Tutor profile upsert warning:', tutorError.message);
        }
      }

      return {
        user,
        session: authData.session,
        profile: profileData || profilePayload,
        error: null,
      };
    } catch (err) {
      console.error('[authService.signUp Error]:', err.message);
      return {
        user: null,
        session: null,
        profile: null,
        error: { message: err.message || 'An error occurred during sign up.' },
      };
    }
  },

  /**
   * Logs in a user with email and password, then retrieves their public profile.
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ user: any, session: any, profile: any, error: any }>}
   */
  async signIn({ email, password }) {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error('No user returned after successful authentication.');

      // 2. Fetch the user's relational profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('[authService.signIn]: Profile query notice:', profileError.message);
      }

      // If user profile record does not exist yet (e.g. created via Supabase console), create it
      let activeProfile = profile;
      if (!activeProfile) {
        const defaultRole = user.user_metadata?.account_type || 'student';
        const defaultName = user.user_metadata?.full_name || cleanEmail.split('@')[0];
        const newProfile = {
          id: user.id,
          full_name: defaultName,
          email: cleanEmail,
          account_type: defaultRole,
          education_level: 'college',
          school_name: 'University',
          is_tutor: defaultRole === 'mentor',
        };

        const { data: createdProfile } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select('*')
          .single();

        activeProfile = createdProfile || newProfile;
      }

      return {
        user,
        session: authData.session,
        profile: activeProfile,
        error: null,
      };
    } catch (err) {
      console.error('[authService.signIn Error]:', err.message);
      let friendlyMessage = err.message || 'Failed to sign in.';
      if (err.message.includes('Invalid login credentials')) {
        friendlyMessage = 'Invalid email or password. Please verify and try again.';
      } else if (err.message.includes('Email not confirmed')) {
        friendlyMessage = 'Email address not confirmed. Please check your inbox for confirmation link.';
      }
      return {
        user: null,
        session: null,
        profile: null,
        error: { message: friendlyMessage },
      };
    }
  },

  /**
   * Signs out the current active session.
   * @returns {Promise<{ error: any }>}
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error('[authService.signOut Error]:', err.message);
      return { error: { message: err.message } };
    }
  },

  /**
   * Retrieves the current authenticated session and matching profile.
   * @returns {Promise<{ user: any, session: any, profile: any, error: any }>}
   */
  async getCurrentSession() {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const session = sessionData.session;
      if (!session || !session.user) {
        return { user: null, session: null, profile: null, error: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('[authService.getCurrentSession]: Profile error:', profileError.message);
      }

      return {
        user: session.user,
        session,
        profile: profile || null,
        error: null,
      };
    } catch (err) {
      console.error('[authService.getCurrentSession Error]:', err.message);
      return { user: null, session: null, profile: null, error: { message: err.message } };
    }
  },

  /**
   * Triggers a password recovery email.
   * @param {string} email
   * @returns {Promise<{ data: any, error: any }>}
   */
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[authService.resetPassword Error]:', err.message);
      return { data: null, error: { message: err.message } };
    }
  },
};

export default authService;
