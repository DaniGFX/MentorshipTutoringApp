import { supabase } from './supabaseClient.js';

/**
 * Review Service
 * Handles peer review creation, rating calculations,
 * and fetching mentor review histories.
 */
export const reviewService = {
  /**
   * Submit a student evaluation review for a completed mentorship session
   * @param {Object} params
   * @param {string} params.sessionId - Target session UUID
   * @param {string} params.studentId - Student auth UID
   * @param {string} params.tutorId - Mentor UID
   * @param {number} params.rating - 1 to 5 stars
   * @param {string} [params.comment] - Review feedback comment
   */
  async createReview({ sessionId, studentId, tutorId, rating, comment = '' }) {
    try {
      const payload = {
        session_id: sessionId,
        student_id: studentId,
        tutor_id: tutorId,
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        comment: comment.trim(),
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[reviewService.createReview error]:', err);
      return { data: null, error: { message: err.message || 'Failed to submit review' } };
    }
  },

  /**
   * Get reviews for a mentor joined with student profiles
   * @param {string} tutorId - Mentor UUID
   */
  async getReviewsForTutor(tutorId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          student:profiles!reviews_student_id_fkey(
            id,
            full_name,
            avatar_url,
            school_name,
            course_program
          )
        `)
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[reviewService.getReviewsForTutor error]:', err);
      return { data: null, error: { message: err.message || 'Failed to fetch reviews' } };
    }
  },

  /**
   * Get an existing review for a specific session
   * @param {string} sessionId
   */
  async getReviewForSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[reviewService.getReviewForSession error]:', err);
      return { data: null, error: { message: err.message || 'Failed to check session review' } };
    }
  },
};
