import { supabase } from './supabaseClient.js';

/**
 * Report Service
 * Handles verifiable University Community Service Hours accreditation logs,
 * summary metrics, and accreditation report generation for peer mentors.
 */
export const reportService = {
  /**
   * Get all accredited service hour logs for a mentor
   * @param {string} tutorId - Mentor auth UID
   */
  async getAccreditedServiceHours(tutorId) {
    try {
      const { data, error } = await supabase
        .from('service_hour_logs')
        .select(`
          *,
          student:profiles!service_hour_logs_student_id_fkey(
            id,
            full_name,
            school_name,
            course_program
          ),
          session:sessions!service_hour_logs_session_id_fkey(
            id,
            session_topic,
            scheduled_start,
            duration_hours
          )
        `)
        .eq('tutor_id', tutorId)
        .order('verified_at', { ascending: false });

      if (error) throw error;
      const totalHours = (data || []).reduce((acc, row) => acc + Number(row.hours_credited || 0), 0);
      return { data: { logs: data || [], totalHours }, error: null };
    } catch (err) {
      console.error('[reportService.getAccreditedServiceHours error]:', err);
      return { data: null, error: { message: err.message || 'Failed to load service hours' } };
    }
  },

  /**
   * Get mentor summary stats including cumulative service hours and completed session counts
   * @param {string} tutorId - Mentor auth UID
   */
  async getSummaryStats(tutorId) {
    try {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('total_service_hours, completed_sessions_count, average_rating')
        .eq('tutor_id', tutorId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[reportService.getSummaryStats error]:', err);
      return { data: null, error: { message: err.message || 'Failed to load summary stats' } };
    }
  },
};
