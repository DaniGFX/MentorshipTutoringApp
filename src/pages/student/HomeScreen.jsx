import React, { useState, useEffect } from 'react';
import { tutorService } from '../../services/tutorService.js';

export default function HomeScreen({
  currentUserProfile,
  sessions = [],
  onNavigateTab,
  onViewMentorProfile,
  onViewConfirmedSession,
  onJoinClassroom
}) {
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  // Load recommended mentors from Supabase
  useEffect(() => {
    let isMounted = true;
    async function fetchRecommended() {
      try {
        setLoadingMentors(true);
        const { data, error } = await tutorService.getTutors();
        if (isMounted && data) {
          // Take top 3 mentors
          setRecommendedMentors(data.slice(0, 3));
        }
      } catch (err) {
        console.error('[HomeScreen] Error loading mentors:', err);
      } finally {
        if (isMounted) setLoadingMentors(false);
      }
    }
    fetchRecommended();
    return () => {
      isMounted = false;
    };
  }, []);

  const studentFirstName = currentUserProfile?.full_name?.trim()?.split(' ')[0] || 'Student';
  const upcomingSession = sessions.find((s) => s.status === 'confirmed');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Greeting & Hero Banner */}
      <div className="bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 -top-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold text-white/95">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-pulse" />
            Active Academic Term 2026
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Good morning, {studentFirstName}!
            </h1>
            <p className="text-xs text-sky-100 font-medium mt-0.5">
              Ready to learn something new today?
            </p>
          </div>

          {/* Search Bar Input Trigger */}
          <button
            onClick={() => onNavigateTab && onNavigateTab('explore')}
            className="touch-target w-full bg-white/95 hover:bg-white text-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-sm transition-all active:scale-[0.99] text-left"
            aria-label="Search mentors or skills"
          >
            <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span className="text-xs text-slate-400 font-normal">
              Search mentors or skills (Calculus, Web Dev, UI/UX)...
            </span>
          </button>
        </div>
      </div>

      {/* 2. Quick Actions Grid */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          What are you looking for?
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Action 1: Find a Mentor */}
          <button
            onClick={() => onNavigateTab && onNavigateTab('explore')}
            className="touch-target bg-white rounded-2xl border border-slate-200/80 p-3 text-center space-y-2 hover:border-sky-300 hover:shadow-sm active:scale-[0.98] transition-all flex flex-col items-center justify-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Find Mentor</p>
              <p className="text-[10px] text-slate-400 font-medium">Explore peer tutors</p>
            </div>
          </button>

          {/* Action 2: My Sessions */}
          <button
            onClick={() => onNavigateTab && onNavigateTab('sessions')}
            className="touch-target bg-white rounded-2xl border border-slate-200/80 p-3 text-center space-y-2 hover:border-sky-300 hover:shadow-sm active:scale-[0.98] transition-all flex flex-col items-center justify-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">My Sessions</p>
              <p className="text-[10px] text-slate-400 font-medium">View bookings</p>
            </div>
          </button>

          {/* Action 3: Messages */}
          <button
            onClick={() => onNavigateTab && onNavigateTab('messages')}
            className="touch-target bg-white rounded-2xl border border-slate-200/80 p-3 text-center space-y-2 hover:border-sky-300 hover:shadow-sm active:scale-[0.98] transition-all flex flex-col items-center justify-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.943l.878-2.635C4.249 15.918 3 14.07 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Messages</p>
              <p className="text-[10px] text-slate-400 font-medium">Chat with tutors</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Upcoming Session Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upcoming Session
          </h2>
          {upcomingSession && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Confirmed
            </span>
          )}
        </div>

        {upcomingSession ? (
          /* Real Upcoming Session Card */
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center font-bold text-sky-700 text-sm shrink-0">
                  {upcomingSession.mentor?.initials || 'MT'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {upcomingSession.mentor?.name || 'Peer Mentor'}
                  </h3>
                  <p className="text-xs text-sky-600 font-semibold">
                    {upcomingSession.topic || upcomingSession.mentor?.specialization || 'Academic Mentoring'}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                </svg>
                {upcomingSession.format || 'Online Room'}
              </span>
            </div>

            {/* Schedule Info Box */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <span className="font-semibold">{upcomingSession.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>{upcomingSession.time}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onViewConfirmedSession ? onViewConfirmedSession(upcomingSession) : (onNavigateTab && onNavigateTab('sessions'))}
                className="touch-target flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-[0.99] font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span>Session Details</span>
              </button>

              <button
                type="button"
                onClick={() => onJoinClassroom ? onJoinClassroom(upcomingSession) : (onNavigateTab && onNavigateTab('sessions'))}
                className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>Join Classroom</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Upcoming Session Card */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">No Upcoming Sessions</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You don't have any scheduled sessions yet. Discover qualified peer mentors to get started.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('explore')}
              className="touch-target inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              <span>Find a Mentor</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 4. Recommended Mentors Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recommended Mentors
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Matched with your learning goals
            </p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('explore')}
            className="touch-target text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>See All</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Mentor Cards List */}
        {loadingMentors ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Loading mentors...</span>
          </div>
        ) : recommendedMentors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-700">No Mentors Listed Yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Peer mentors will appear here as they register and publish their tutoring profiles.
            </p>
            <button
              onClick={() => onNavigateTab && onNavigateTab('explore')}
              className="touch-target text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 pt-1"
            >
              <span>Explore Directory</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendedMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 hover:border-sky-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center font-bold text-sky-700 text-sm shrink-0">
                      {mentor.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900">{mentor.name}</h3>
                        {mentor.isVerified && (
                          <span className="text-sky-600" title="Verified Peer Mentor">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{mentor.specialization}</p>
                    </div>
                  </div>

                  <span className="inline-block bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {mentor.rate}
                  </span>
                </div>

                {/* Subject Chips */}
                {mentor.expertise && mentor.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.expertise.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="bg-sky-50 text-sky-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-sky-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rating & Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                    <svg className="w-3.5 h-3.5 fill-amber-500 text-amber-500" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{mentor.rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">({mentor.sessionsCount} sessions)</span>
                  </div>

                  <button
                    onClick={() => {
                      if (onViewMentorProfile) {
                        onViewMentorProfile(mentor);
                      } else if (onNavigateTab) {
                        onNavigateTab('explore');
                      }
                    }}
                    className="touch-target px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200 transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
