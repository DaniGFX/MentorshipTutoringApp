import { supabase } from './supabaseClient.js';

/**
 * Session Service
 * Handles session booking creation, direct payment submissions,
 * status lifecycle transitions (pending -> confirmed -> completed/declined/cancelled),
 * and query methods for Student and Mentor session dashboards.
 */
export const sessionService = {
  /**
   * Create a new session booking with direct payment submission
   * @param {Object} params
   * @param {string} params.studentId - Current student auth UID
   * @param {string} params.tutorId - Mentor UID
   * @param {string} [params.subjectId] - Optional subject ID
   * @param {string} params.topic - Learning topic & focus
   * @param {string} [params.date] - Date string (YYYY-MM-DD)
   * @param {string} [params.time] - Time string (e.g. "7:00 PM – 8:00 PM")
   * @param {string} [params.duration] - e.g. "60 min"
   * @param {string} [params.format] - "Online" or "In-person"
   * @param {string} [params.paymentOption] - "full" | "downpayment"
   * @param {number} params.paymentAmount - Amount transferred now (full or 50% downpayment)
   * @param {number} [params.totalFee] - Total session fee
   * @param {string} params.referenceNumber - Direct payment transaction ref
   * @param {string} [params.paymentChannel] - "gcash" | "bank"
   * @param {string} [params.notes] - Additional student notes
   */
  async createSession({
    studentId,
    tutorId,
    subjectId = null,
    topic,
    date = '2026-09-25',
    time = '7:00 PM – 8:00 PM',
    duration = '60 min',
    format = 'Online',
    paymentOption = 'downpayment',
    paymentAmount = 125,
    totalFee = 250,
    referenceNumber,
    paymentChannel = 'gcash',
    notes = '',
  }) {
    try {
      // Calculate scheduled_start and scheduled_end ISO timestamps
      let startHours = 19;
      let startMinutes = 0;
      let endHours = 20;
      let endMinutes = 0;

      // Simple time parser (e.g., "7:00 PM – 8:00 PM")
      if (time && time.includes('–')) {
        const [startPart, endPart] = time.split('–').map((s) => s.trim());
        if (startPart) {
          const match = startPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match) {
            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const isPM = match[3].toUpperCase() === 'PM';
            if (isPM && h !== 12) h += 12;
            if (!isPM && h === 12) h = 0;
            startHours = h;
            startMinutes = m;
          }
        }
        if (endPart) {
          const match = endPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match) {
            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const isPM = match[3].toUpperCase() === 'PM';
            if (isPM && h !== 12) h += 12;
            if (!isPM && h === 12) h = 0;
            endHours = h;
            endMinutes = m;
          }
        }
      }

      const targetDate = date || '2026-09-25';
      const scheduledStart = new Date(`${targetDate}T${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}:00Z`).toISOString();
      const scheduledEnd = new Date(`${targetDate}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00Z`).toISOString();

      const durationHours = duration.includes('30') ? 0.5 : duration.includes('45') ? 0.75 : 1.0;
      const paymentModeTag = paymentOption === 'full' ? 'Full Payment' : '50% Down Payment';
      const studentNoteCombined = `[${paymentModeTag} | Amount: ₱${paymentAmount}.00 | Channel: ${paymentChannel.toUpperCase()}] ${notes || topic}`.trim();

      const payload = {
        student_id: studentId,
        tutor_id: tutorId,
        subject_id: subjectId,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        duration_hours: durationHours,
        meeting_type: format.toLowerCase().includes('in-person') ? 'in_person' : 'online',
        session_topic: topic || 'Academic Mentoring & Tutoring',
        student_note: studentNoteCombined,
        status: 'pending',
        payment_type: 'direct_pay',
        payment_amount: paymentAmount,
        payment_status: 'payment_submitted',
        payment_reference: referenceNumber,
        counts_toward_service_hours: paymentAmount === 0,
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[sessionService.createSession error]:', err);
      return { data: null, error: { message: err.message || 'Failed to create session booking' } };
    }
  },

  /**
   * Get sessions for a specific student, joined with tutor profiles
   * @param {string} studentId - Student auth UID
   */
  async getStudentSessions(studentId) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor_profile:tutor_profiles!sessions_tutor_id_fkey(
            tutor_id,
            headline,
            hourly_rate,
            average_rating,
            profile:profiles!tutor_profiles_tutor_id_fkey(
              id,
              full_name,
              email,
              avatar_url,
              school_name
            )
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[sessionService.getStudentSessions error]:', err);
      return { data: null, error: { message: err.message || 'Failed to load student sessions' } };
    }
  },

  /**
   * Get sessions for a specific mentor, joined with student profile
   * @param {string} tutorId - Mentor auth UID
   */
  async getMentorSessions(tutorId) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student_profile:profiles!sessions_student_id_fkey(
            id,
            full_name,
            email,
            avatar_url,
            school_name,
            course_program,
            year_level
          )
        `)
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[sessionService.getMentorSessions error]:', err);
      return { data: null, error: { message: err.message || 'Failed to load mentor sessions' } };
    }
  },

  /**
   * Mentor confirms & accepts a session (and acknowledges direct payment verification)
   * @param {string} sessionId
   * @param {string} tutorId
   */
  async acceptSession(sessionId, tutorId) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: 'confirmed',
          payment_status: 'confirmed',
        })
        .eq('id', sessionId)
        .eq('tutor_id', tutorId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[sessionService.acceptSession error]:', err);
      return { data: null, error: { message: err.message || 'Failed to accept session' } };
    }
  },

  /**
   * Mentor declines a session request with a reason
   * @param {string} sessionId
   * @param {string} tutorId
   * @param {string} declineReason
   * @param {string} [customNote]
   */
  async declineSession(sessionId, tutorId, declineReason, customNote = '') {
    try {
      const fullReason = customNote ? `${declineReason} - ${customNote}` : declineReason;
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: 'declined',
          decline_reason: fullReason,
        })
        .eq('id', sessionId)
        .eq('tutor_id', tutorId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[sessionService.declineSession error]:', err);
      return { data: null, error: { message: err.message || 'Failed to decline session' } };
    }
  },

  /**
   * Student cancels a pending session request
   * @param {string} sessionId
   * @param {string} studentId
   */
  async cancelSessionRequest(sessionId, studentId) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
        })
        .eq('id', sessionId)
        .eq('student_id', studentId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[sessionService.cancelSessionRequest error]:', err);
      return { data: null, error: { message: err.message || 'Failed to cancel session request' } };
    }
  },

  /**
   * Mentor completes a session (triggers community service hours server trigger if applicable)
   * @param {string} sessionId
   * @param {string} tutorId
   * @param {string} [sessionNotes]
   */
  async completeSession(sessionId, tutorId, sessionNotes = '') {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          session_notes: sessionNotes,
        })
        .eq('id', sessionId)
        .eq('tutor_id', tutorId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[sessionService.completeSession error]:', err);
      return { data: null, error: { message: err.message || 'Failed to complete session' } };
    }
  },
};
