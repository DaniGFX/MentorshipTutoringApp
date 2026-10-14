import React, { useState } from 'react';
import { profileService } from '../../services/profileService.js';
import { tutorService } from '../../services/tutorService.js';

const AVAILABLE_SUBJECTS = [
  'Programming Fundamentals',
  'Web Development',
  'Data Structures & Algorithms',
  'Database Management',
  'UI/UX Design',
  'Mobile App Development',
  'Cybersecurity Basics',
  'Object-Oriented Programming',
  'Discrete Mathematics',
  'Cloud Computing'
];

const MENTORING_STYLES = [
  { id: 'one_on_one', label: 'One-on-One Guided', desc: 'Step-by-step personalized explanations' },
  { id: 'project_based', label: 'Interactive & Project-Based', desc: 'Hands-on coding and practical building' },
  { id: 'code_review', label: 'Code Review & Problem Solving', desc: 'Debugging and algorithm optimization' }
];

const YEAR_LEVELS = [
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate / Masteral',
  'Alumni / Graduate'
];

export default function MentorSetupScreen({
  currentUser,
  currentProfile,
  onComplete,
  onSkip
}) {
  const [fullName, setFullName] = useState(currentProfile?.full_name || currentUser?.user_metadata?.full_name || '');
  const [schoolName, setSchoolName] = useState(currentProfile?.school_name || 'Polytechnic University of the Philippines');
  const [courseProgram, setCourseProgram] = useState(currentProfile?.course_program || 'BS Computer Science');
  const [yearLevel, setYearLevel] = useState(currentProfile?.year_level || '3rd Year');

  // Mentor profile fields
  const [headline, setHeadline] = useState('Senior CS Major | Full-Stack & Algorithms Mentor');
  const [bioExperience, setBioExperience] = useState('Passionate about helping junior students master coding concepts, build web applications, and ace technical coursework.');
  const [mentoringStyle, setMentoringStyle] = useState('one_on_one');
  const [yearsExperience, setYearsExperience] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(250);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [paymentInstructions, setPaymentInstructions] = useState('GCash: 0917-123-4567 (Send reference number after transfer)');
  const [selectedSubjects, setSelectedSubjects] = useState([
    'Programming Fundamentals',
    'Web Development',
    'Data Structures & Algorithms'
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((item) => item !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanFullName = fullName.trim();
    const cleanSchool = schoolName.trim();
    const cleanCourse = courseProgram.trim();
    const cleanHeadline = headline.trim();

    if (!cleanFullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanSchool) {
      setErrorMessage('Please enter your school or university.');
      return;
    }
    if (!cleanCourse) {
      setErrorMessage('Please enter your academic program or degree.');
      return;
    }
    if (!cleanHeadline) {
      setErrorMessage('Please provide a mentor headline or specialization.');
      return;
    }

    const tutorId = currentUser?.id || currentProfile?.id;
    if (!tutorId) {
      setErrorMessage('User session not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update public.profiles
      const profileUpdates = {
        full_name: cleanFullName,
        school_name: cleanSchool,
        course_program: cleanCourse,
        year_level: yearLevel,
        bio: bioExperience.trim(),
        learning_interests: selectedSubjects,
        is_tutor: true,
        account_type: 'mentor'
      };

      const { data: updatedProfile, error: profileErr } = await profileService.updateProfile(tutorId, profileUpdates);
      if (profileErr) throw profileErr;

      // 2. Update public.tutor_profiles
      const finalRate = isVolunteer ? 0.0 : Math.max(0, parseFloat(hourlyRate) || 0);
      const tutorProfileUpdates = {
        headline: cleanHeadline,
        bio_experience: bioExperience.trim(),
        hourly_rate: finalRate,
        mentoring_style: mentoringStyle,
        years_experience: Math.max(0, parseInt(yearsExperience, 10) || 1),
        default_duration_minutes: defaultDuration,
        payment_instructions: isVolunteer ? 'Volunteer Mentor (₱0.00 / Service Hours)' : paymentInstructions.trim(),
        is_accepting_students: true,
        profile_visibility: true
      };

      const { error: tutorErr } = await tutorService.updateTutorProfile(tutorId, tutorProfileUpdates);
      if (tutorErr) {
        console.warn('[MentorSetupScreen] Tutor profile update warning:', tutorErr);
      }

      // 3. Upsert selected subjects into public.tutor_subjects
      if (selectedSubjects.length > 0) {
        await tutorService.setTutorSubjects(tutorId, selectedSubjects);
      }

      if (onComplete) {
        onComplete(updatedProfile || { ...currentProfile, ...profileUpdates });
      }
    } catch (err) {
      console.error('[MentorSetupScreen Error]:', err);
      setErrorMessage(err.message || 'Failed to complete mentor profile setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const tutorId = currentUser?.id || currentProfile?.id;
      if (tutorId) {
        const fallbackProfile = {
          full_name: fullName.trim() || 'Academic Mentor',
          school_name: schoolName.trim() || 'University',
          course_program: courseProgram.trim() || 'Degree Program',
          year_level: yearLevel || '3rd Year',
          bio: bioExperience.trim() || 'Academic peer mentor ready to guide fellow students.',
          is_tutor: true,
          account_type: 'mentor'
        };
        await profileService.updateProfile(tutorId, fallbackProfile);
      }
      if (onSkip) {
        onSkip(currentProfile);
      } else if (onComplete) {
        onComplete(currentProfile);
      }
    } catch (err) {
      console.error('[MentorSetupScreen Skip Error]:', err);
      if (onSkip) onSkip(currentProfile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans relative selection:bg-sky-500 selection:text-white">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Step 1 of 1</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Mentor Profile Setup</h1>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg transition-colors"
        >
          Skip for now
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-5 py-6 space-y-6 overflow-y-auto pb-24">
        {/* Intro Card */}
        <div className="bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-100 rounded-2xl p-4 flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-5.25 6.557c0-.414.336-.75.75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V15Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Welcome Peer Mentor!</h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Complete your mentor profile to attract students, showcase your subjects, and earn direct income or accredited service hours.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
            <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Academic & Specialization */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Academic & Specialization</h3>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mentor Headline / Tagline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior CS Major | Full-Stack & Algorithms Tutor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* School */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">University / College</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Polytechnic University of the Philippines"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Course & Year Level */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Degree / Program</label>
                <input
                  type="text"
                  value={courseProgram}
                  onChange={(e) => setCourseProgram(e.target.value)}
                  placeholder="BS Computer Science"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Year Level</label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                >
                  {YEAR_LEVELS.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Mentoring Style & Experience */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teaching Style & Experience</h3>

            {/* Mentoring Style Segmented Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Preferred Mentoring Approach</label>
              {MENTORING_STYLES.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setMentoringStyle(style.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    mentoringStyle === style.id
                      ? 'border-sky-500 bg-sky-50/60 ring-1 ring-sky-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{style.label}</span>
                    {mentoringStyle === style.id && (
                      <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{style.desc}</p>
                </div>
              ))}
            </div>

            {/* Years of Experience & Duration */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tutoring Experience</label>
                <select
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                >
                  <option value={1}>1 year</option>
                  <option value={2}>2 years</option>
                  <option value={3}>3+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Duration</label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            {/* Bio Experience */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bio & Tutoring Background</label>
              <textarea
                value={bioExperience}
                onChange={(e) => setBioExperience(e.target.value)}
                rows={3}
                placeholder="Share your strengths, tutoring philosophy, or topics you love explaining..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* Section 3: Hourly Rate & Payment Instructions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Compensation & Direct Pay</h3>

            {/* Volunteer Mode Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Community Service Volunteer</span>
                <span className="text-[11px] text-slate-500">Earn accredited university hours (₱0.00 / free)</span>
              </div>
              <input
                type="checkbox"
                checked={isVolunteer}
                onChange={(e) => setIsVolunteer(e.target.checked)}
                className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
            </div>

            {/* Hourly Rate Input (if not volunteer) */}
            {!isVolunteer && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hourly Session Rate (₱)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Payment Instructions */}
            {!isVolunteer && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Direct Payment Instructions</label>
                <input
                  type="text"
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="e.g. GCash: 0917-xxx-xxxx (Juan D.)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Students will use this info to transfer direct payments via GCash or Maya.
                </p>
              </div>
            )}
          </div>

          {/* Section 4: Subjects Offered */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subjects & Topics Offered
              </label>
              <p className="text-xs text-slate-500 mt-0.5">Select subjects you are qualified and confident to teach.</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_SUBJECTS.map((subj) => {
                const isSelected = selectedSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => toggleSubject(subj)}
                    className={`touch-target px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                    <span>{subj}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Mentor Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Profile & Open Dashboard</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
