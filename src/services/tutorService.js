import { supabase } from './supabaseClient.js';



/**
 * Service for querying and updating mentor directory data in Supabase.
 */
export const tutorService = {
  /**
   * Fetches active peer mentors joined with profiles and subjects.
   * @param {Object} [params]
   * @param {string} [params.search]
   * @param {string} [params.category]
   * @param {number} [params.minRating]
   * @returns {Promise<{ data: any[], error: any }>}
   */
  async getTutors({ search = '', category = 'All', minRating = 0 } = {}) {
    try {
      // 1. Query Supabase tutor_profiles with relational joins
      let data = null;
      let error = null;

      const primaryQuery = await supabase
        .from('tutor_profiles')
        .select(`
          tutor_id,
          headline,
          bio_experience,
          hourly_rate,
          is_accepting_students,
          total_service_hours,
          average_rating,
          completed_sessions_count,
          mentoring_style,
          years_experience,
          profile_visibility,
          show_email,
          profiles:profiles!tutor_profiles_tutor_id_fkey (
            id,
            full_name,
            email,
            avatar_url,
            school_name,
            course_program,
            year_level,
            status_message,
            bio
          ),
          tutor_subjects (
            id,
            subject_name,
            category,
            proficiency_details
          )
        `)
        .eq('profile_visibility', true);

      if (!primaryQuery.error && primaryQuery.data) {
        data = primaryQuery.data;
      } else {
        // Resilient fallback if PostgREST relational schema cache encounters disambiguation issue
        console.warn('[tutorService.getTutors notice]: falling back to two-stage profile resolution:', primaryQuery.error?.message);
        const { data: rawTutors, error: tutorErr } = await supabase
          .from('tutor_profiles')
          .select('*')
          .eq('profile_visibility', true);

        if (tutorErr || !rawTutors || rawTutors.length === 0) {
          return { data: [], error: tutorErr };
        }

        const tutorIds = rawTutors.map((t) => t.tutor_id);
        const [{ data: profs }, { data: subjs }] = await Promise.all([
          supabase.from('profiles').select('*').in('id', tutorIds),
          supabase.from('tutor_subjects').select('*').in('tutor_id', tutorIds),
        ]);

        data = rawTutors.map((t) => ({
          ...t,
          profiles: (profs || []).find((p) => p.id === t.tutor_id) || {},
          tutor_subjects: (subjs || []).filter((s) => s.tutor_id === t.tutor_id),
        }));
      }

      if (!data || data.length === 0) {
        return { data: [], error: null };
      }

      // 2. Map and normalize relational records
      const mappedMentors = data.map((row) => {
        const profile = row.profiles || {};
        const subjects = row.tutor_subjects || [];
        const subjectNames = subjects.map((s) => s.subject_name);
        const primaryCategory = subjects[0]?.category || 'Technology';

        const fullName = profile.full_name || 'Academic Mentor';
        const initials = fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        const rateNum = parseFloat(row.hourly_rate) || 0;

        return {
          id: row.tutor_id,
          name: fullName,
          email: profile.email || '',
          school: profile.school_name || 'University',
          course: profile.course_program || '',
          yearLevel: profile.year_level || '',
          specialization: row.headline || 'Peer Tutor & Academic Mentor',
          category: primaryCategory,
          rating: parseFloat(row.average_rating) || 5.0,
          sessionsCount: row.completed_sessions_count || 0,
          isVerified: true,
          rate: rateNum === 0 ? '₱0.00 (Volunteer / Free)' : `₱${rateNum.toFixed(2)} / hr`,
          hourlyRate: rateNum,
          bio: row.bio_experience || profile.bio || '',
          experience: `${row.years_experience || 1}+ Years Academic Mentoring`,
          expertise: subjectNames.length > 0 ? subjectNames : ['General Tutoring'],
          mentoringStyle: [
            row.mentoring_style === 'project_based' ? 'Project-Based Guidance' : row.mentoring_style === 'code_review' ? 'Code Review & Problem Solving' : '1-on-1 Guided Mentoring',
            'Interactive Tutoring',
          ],
          isAcceptingStudents: row.is_accepting_students,
          initials,
          avatarBg: 'bg-sky-600',
          avatarUrl: profile.avatar_url,
          paymentMethods: ['GCash', 'Maya'],
          gcashNumber: row.payment_instructions || 'Direct Transfer',
          gcashName: fullName,
          availableToday: true,
          availableThisWeek: true,
          sessionType: 'online',
          availability: 'Flexible Schedule · Mon – Sat',
        };
      });

      return { data: mappedMentors, error: null };
    } catch (err) {
      console.error('[tutorService.getTutors Error]:', err.message);
      return { data: [], error: { message: err.message } };
    }
  },

  /**
   * Fetches detailed mentor information by tutor ID.
   * @param {string} tutorId
   * @returns {Promise<{ data: any, error: any }>}
   */
  async getTutorById(tutorId) {
    try {
      if (!tutorId) throw new Error('tutorId is required');

      const primary = await supabase
        .from('tutor_profiles')
        .select(`
          *,
          profiles:profiles!tutor_profiles_tutor_id_fkey (*),
          tutor_subjects (*),
          tutor_availability (*)
        `)
        .eq('tutor_id', tutorId)
        .maybeSingle();

      if (!primary.error && primary.data) {
        return { data: primary.data, error: null };
      }

      // Fallback if PostgREST relational schema cache encounters an issue
      const { data: tutor, error: tutorErr } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('tutor_id', tutorId)
        .maybeSingle();

      if (tutorErr || !tutor) {
        return { data: null, error: tutorErr || { message: 'Mentor not found' } };
      }

      const [{ data: prof }, { data: subjects }, { data: avail }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', tutorId).maybeSingle(),
        supabase.from('tutor_subjects').select('*').eq('tutor_id', tutorId),
        supabase.from('tutor_availability').select('*').eq('tutor_id', tutorId),
      ]);

      return {
        data: {
          ...tutor,
          profiles: prof || {},
          tutor_subjects: subjects || [],
          tutor_availability: avail || [],
        },
        error: null,
      };
    } catch (err) {
      console.error('[tutorService.getTutorById Error]:', err.message);
      return { data: null, error: { message: err.message } };
    }
  },

  /**
   * Updates mentor profile fields in public.tutor_profiles.
   * @param {string} tutorId
   * @param {Object} updates
   * @returns {Promise<{ data: any, error: any }>}
   */
  async updateTutorProfile(tutorId, updates) {
    try {
      if (!tutorId) throw new Error('tutorId is required');

      const { data, error } = await supabase
        .from('tutor_profiles')
        .update(updates)
        .eq('tutor_id', tutorId)
        .select('*')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[tutorService.updateTutorProfile Error]:', err.message);
      return { data: null, error: { message: err.message } };
    }
  },

  /**
   * Sets or updates subjects offered by a mentor.
   * @param {string} tutorId
   * @param {Array<string | { subject_name: string, category?: string }>} subjects
   * @returns {Promise<{ success: boolean, error: any }>}
   */
  async setTutorSubjects(tutorId, subjects = []) {
    try {
      if (!tutorId) throw new Error('tutorId is required');

      // Remove existing subjects for clean sync
      await supabase.from('tutor_subjects').delete().eq('tutor_id', tutorId);

      if (subjects && subjects.length > 0) {
        const rows = subjects.map((subj) => {
          const name = typeof subj === 'string' ? subj : subj.subject_name;
          const category = typeof subj === 'object' && subj.category ? subj.category : 'Technology';
          return {
            tutor_id: tutorId,
            subject_name: name,
            category: category,
            grade_level: 'both',
          };
        });

        const { error: insertError } = await supabase.from('tutor_subjects').insert(rows);
        if (insertError) throw insertError;
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[tutorService.setTutorSubjects Error]:', err.message);
      return { success: false, error: { message: err.message } };
    }
  },
};

export default tutorService;
