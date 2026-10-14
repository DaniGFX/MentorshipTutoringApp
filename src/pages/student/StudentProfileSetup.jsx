import React, { useState } from 'react';
import { profileService } from '../../services/profileService.js';

const POPULAR_INTERESTS = [
  'Programming',
  'Web Development',
  'UI/UX Design',
  'Cybersecurity',
  'Database',
  'Mobile Development',
  'Data Analytics',
  'Networking',
  'Cloud Computing',
  'Artificial Intelligence'
];

const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate / Masteral'
];

const AVATAR_COLORS = [
  { bg: 'bg-sky-600', text: 'text-white' },
  { bg: 'bg-indigo-600', text: 'text-white' },
  { bg: 'bg-emerald-600', text: 'text-white' },
  { bg: 'bg-amber-600', text: 'text-white' },
  { bg: 'bg-purple-600', text: 'text-white' },
  { bg: 'bg-rose-600', text: 'text-white' }
];

export default function StudentProfileSetup({
  currentUser,
  currentProfile,
  onComplete,
  onSkip
}) {
  const [fullName, setFullName] = useState(currentProfile?.full_name || currentUser?.user_metadata?.full_name || '');
  const [schoolName, setSchoolName] = useState(currentProfile?.school_name || 'Polytechnic University of the Philippines');
  const [courseProgram, setCourseProgram] = useState(currentProfile?.course_program || '');
  const [yearLevel, setYearLevel] = useState(currentProfile?.year_level || '1st Year');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState(
    Array.isArray(currentProfile?.learning_interests) && currentProfile.learning_interests.length > 0
      ? currentProfile.learning_interests
      : ['Programming', 'Web Development']
  );
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const initials = (fullName || 'Student')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanFullName = fullName.trim();
    const cleanSchool = schoolName.trim();
    const cleanCourse = courseProgram.trim();

    if (!cleanFullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanSchool) {
      setErrorMessage('Please provide your school or university.');
      return;
    }
    if (!cleanCourse) {
      setErrorMessage('Please specify your course or academic program.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates = {
        full_name: cleanFullName,
        school_name: cleanSchool,
        course_program: cleanCourse,
        year_level: yearLevel,
        bio: bio.trim() || 'Excited to learn and collaborate with peer mentors.',
        learning_interests: selectedInterests.length > 0 ? selectedInterests : ['General Academics']
      };

      const userId = currentUser?.id || currentProfile?.id;
      if (!userId) {
        throw new Error('User session not found. Please log in again.');
      }

      const { data, error } = await profileService.updateProfile(userId, updates);
      if (error) throw error;

      if (onComplete) {
        onComplete(data || { ...currentProfile, ...updates });
      }
    } catch (err) {
      console.error('[StudentProfileSetup Error]:', err);
      setErrorMessage(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const updates = {
        full_name: fullName.trim() || 'Student Member',
        school_name: schoolName.trim() || 'University',
        course_program: courseProgram.trim() || 'General Studies',
        year_level: yearLevel || '1st Year',
        bio: bio.trim() || 'Student eager to connect and learn.',
        learning_interests: selectedInterests.length > 0 ? selectedInterests : ['Programming']
      };

      const userId = currentUser?.id || currentProfile?.id;
      if (userId) {
        await profileService.updateProfile(userId, updates);
      }

      if (onSkip) {
        onSkip({ ...currentProfile, ...updates });
      } else if (onComplete) {
        onComplete({ ...currentProfile, ...updates });
      }
    } catch (err) {
      console.error('[StudentProfileSetup Skip Error]:', err);
      if (onSkip) onSkip(currentProfile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans relative selection:bg-sky-500 selection:text-white">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">Step 1 of 1</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Complete Your Profile</h1>
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

      {/* Main Form Body */}
      <main className="flex-1 px-5 py-6 space-y-6 overflow-y-auto pb-24">
        {/* Intro Banner */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Welcome to MentorLinks!</h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Set up your student profile so we can match you with peer mentors aligned with your academic needs.
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
          {/* Section 1: Avatar / Profile Appearance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Profile Avatar
            </label>
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-2xl ${AVATAR_COLORS[selectedColorIndex].bg} ${AVATAR_COLORS[selectedColorIndex].text} flex items-center justify-center font-bold text-xl shadow-sm ring-4 ring-sky-50 transition-all`}
              >
                {initials}
              </div>
              <div className="flex-1 space-y-1.5">
                <span className="text-xs text-slate-500 font-medium block">Choose Avatar Color</span>
                <div className="flex items-center space-x-2">
                  {AVATAR_COLORS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColorIndex(idx)}
                      className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${
                        selectedColorIndex === idx ? 'ring-2 ring-offset-2 ring-sky-500 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      aria-label={`Color option ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Academic Details</h3>

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

            {/* School / University */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">School / University</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Polytechnic University of the Philippines"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Course / Program */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course / Program</label>
              <input
                type="text"
                value={courseProgram}
                onChange={(e) => setCourseProgram(e.target.value)}
                placeholder="e.g. BS Computer Science, BS Information Technology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Year Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Year Level</label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              >
                {YEAR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Short Bio */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Short Bio</label>
              <span className="text-[11px] text-slate-400 font-medium">{bio.length} / 150</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= 150) setBio(e.target.value);
              }}
              rows={3}
              placeholder="What are your academic goals or subjects you want guidance in?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Section 4: Learning Interests */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Learning Interests
              </label>
              <p className="text-xs text-slate-500 mt-0.5">Select areas where you want peer tutoring or mentorship.</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {POPULAR_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`touch-target px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Profile & Go to Dashboard</span>
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
