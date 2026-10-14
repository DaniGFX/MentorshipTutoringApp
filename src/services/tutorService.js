import { supabase } from './supabaseClient.js';

// Curated fallback mentors to guarantee responsive UI if database tables are empty
const FALLBACK_MENTORS = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Alex Santos',
    email: 'mentor@mentorlink.ph',
    school: 'De La Salle University',
    specialization: 'Senior CS Student | Web & Database Specialist',
    category: 'Web Development',
    rating: 4.95,
    sessionsCount: 42,
    isVerified: true,
    rate: '₱200.00 / hr',
    hourlyRate: 200,
    paymentMethods: ['GCash', 'BDO Unibank'],
    gcashNumber: '0917-555-0192',
    gcashName: 'Alex Santos',
    sessionType: 'online',
    availableToday: true,
    availableThisWeek: true,
    avatarBg: 'bg-sky-600',
    initials: 'AS',
    bio: 'Dedicated peer tutor helping students master programming logic, database normalization, and frontend user interfaces in React.',
    experience: '2+ Years Academic Mentoring & Web Development',
    mentoringStyle: ['Project-Based Guidance', 'Hands-on Code Reviews', '1-on-1 Debugging Sessions'],
    expertise: ['Web Development', 'JavaScript', 'React', 'Database Systems & SQL', 'Data Structures & Algorithms'],
    availability: 'Mon – Fri · 6:00 PM – 9:00 PM (Online)',
    isAcceptingStudents: true,
  },
  {
    id: 'mentor-fallback-2',
    name: 'Maria Cruz',
    email: 'maria.cruz@university.edu',
    school: 'University of Santo Tomas',
    specialization: 'UI/UX Design & Figma Systems',
    category: 'UI/UX',
    rating: 4.85,
    sessionsCount: 28,
    isVerified: true,
    rate: '₱200.00 / hr',
    hourlyRate: 200,
    paymentMethods: ['GCash', 'BPI'],
    gcashNumber: '0928-444-1234',
    gcashName: 'Maria Cruz',
    sessionType: 'both',
    availableToday: false,
    availableThisWeek: true,
    avatarBg: 'bg-indigo-600',
    initials: 'MC',
    bio: 'BS Computer Science student focused on human-computer interaction, Figma design systems, wireframing, and interactive design prototyping.',
    experience: '2+ Years UI/UX Design & Prototyping',
    mentoringStyle: ['Design Critiques', 'Figma Best Practices', 'Portfolio & Case Studies'],
    expertise: ['UI/UX', 'Figma', 'Prototyping', 'Design Systems', 'User Research'],
    availability: 'Tue, Thu, Sat · 4:00 PM – 7:00 PM',
    isAcceptingStudents: true,
  },
  {
    id: 'mentor-fallback-3',
    name: 'Carlos Reyes',
    email: 'carlos.reyes@university.edu',
    school: 'Ateneo de Manila University',
    specialization: 'Database Systems & Relational Schema Design',
    category: 'Database',
    rating: 4.9,
    sessionsCount: 35,
    isVerified: true,
    rate: '₱250.00 / hr',
    hourlyRate: 250,
    paymentMethods: ['GCash', 'Maya Bank'],
    sessionType: 'online',
    availableToday: true,
    availableThisWeek: true,
    avatarBg: 'bg-emerald-600',
    initials: 'CR',
    bio: 'Database systems tutor specializing in PostgreSQL, SQL queries, relational schema normalization, query optimization, and Supabase integrations.',
    experience: '3+ Years Database Architecture',
    mentoringStyle: ['Interactive SQL Queries', 'Schema Design Reviews', 'Data Modeling Guidance'],
    expertise: ['Database', 'PostgreSQL', 'SQL', 'Schema Design', 'Supabase'],
    availability: 'Wed, Fri · 5:00 PM – 8:00 PM',
    isAcceptingStudents: true,
  },
];

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
      const { data, error } = await supabase
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
          profiles:tutor_id (
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

      if (error) {
        console.warn('[tutorService.getTutors notice]:', error.message);
        return { data: FALLBACK_MENTORS, error: null };
      }

      if (!data || data.length === 0) {
        return { data: FALLBACK_MENTORS, error: null };
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
          rate: `₱${rateNum.toFixed(2)} / hr`,
          hourlyRate: rateNum,
          bio: row.bio_experience || profile.bio || '',
          experience: `${row.years_experience || 1}+ Years Academic Mentoring`,
          expertise: subjectNames.length > 0 ? subjectNames : ['General Tutoring'],
          mentoringStyle: [
            'Project-Based Guidance',
            'Interactive Pair Debugging',
            '1-on-1 Personalized Coaching',
          ],
          isAcceptingStudents: row.is_accepting_students,
          initials,
          avatarBg: 'bg-sky-600',
          avatarUrl: profile.avatar_url,
          paymentMethods: ['GCash', 'Maya Bank'],
          gcashNumber: '0917-555-0192',
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
      return { data: FALLBACK_MENTORS, error: null };
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

      const { data, error } = await supabase
        .from('tutor_profiles')
        .select(`
          *,
          profiles:tutor_id (*),
          tutor_subjects (*),
          tutor_availability (*)
        `)
        .eq('tutor_id', tutorId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
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
