import React, { useState, useEffect } from 'react';
import { sessionService } from '../../services/sessionService.js';
import { supabase } from '../../services/supabaseClient.js';

/**
 * Student Sessions Screen (Tab 4)
 * Fully compliant with Section 7 of docs/student_flow_spec.md and docs/mobile_contents_guide.md.
 * Manages Upcoming (Pending & Confirmed) and Completed mentoring sessions with Ocean Breeze styling.
 * Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function SessionsScreen({
  sessions,
  onViewSessionDetails,
  onViewConfirmedSession,
  onViewCompletedSession,
  onJoinSession,
  onExploreMentors,
  onBookAgain,
  onMessageMentor
}) {
  const [activeSegment, setActiveSegment] = useState('upcoming'); // 'upcoming' | 'completed'
  const [upcomingSubFilter, setUpcomingSubFilter] = useState('all'); // 'all' | 'confirmed' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSessions, setLiveSessions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveStudentSessions() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data } = await sessionService.getStudentSessions(authData.user.id);
          if (isMounted && data && data.length > 0) {
            const mapped = data.map((s) => {
              const tutorProf = s.tutor_profile || {};
              const prof = tutorProf.profile || {};
              const isFullPayment = (s.student_note || '').includes('Full Payment') || Number(s.payment_amount) >= Number(tutorProf.hourly_rate || 250);
              
              const startDt = new Date(s.scheduled_start);
              const dateStr = startDt.toISOString().slice(0, 10);
              const timeStr = `${startDt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(s.scheduled_end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

              return {
                id: s.id,
                status: s.status,
                mentor: {
                  id: s.tutor_id,
                  name: prof.full_name || 'Alex Santos',
                  specialization: tutorProf.headline || 'Peer Mentor',
                  rating: tutorProf.average_rating || 5.0,
                  sessionsCount: 24,
                  isVerified: true,
                  rate: `₱${tutorProf.hourly_rate || 250}.00 / hr`,
                  hourlyRate: Number(tutorProf.hourly_rate || 250),
                  totalFee: Number(tutorProf.hourly_rate || 250),
                  downPayment: Math.round(Number(tutorProf.hourly_rate || 250) * 0.5),
                  remainingBalance: isFullPayment ? 0 : Math.round(Number(tutorProf.hourly_rate || 250) * 0.5),
                  paymentStatus: s.payment_status,
                  paymentChannel: 'Direct Pay',
                  referenceNumber: s.payment_reference || 'N/A',
                  avatarBg: 'bg-sky-600',
                  initials: prof.full_name ? prof.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'AS',
                },
                date: dateStr,
                time: timeStr,
                duration: `${Math.round((s.duration_hours || 1) * 60)} min`,
                format: s.meeting_type === 'online' ? 'Online' : 'In-person',
                topic: s.session_topic,
                submittedAt: new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                isFullPayment,
                amountPaid: s.payment_amount,
              };
            });
            setLiveSessions(mapped);
          }
        }
      } catch (err) {
        console.error('[SessionsScreen] Error loading student sessions:', err);
      }
    }
    fetchLiveStudentSessions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Default seed sessions if none passed
  const defaultSessions = [
    {
      id: 'session-conf-102',
      status: 'confirmed',
      mentor: {
        id: 'mentor-2',
        name: 'Maria Clara',
        specialization: 'Data Structures & Algorithms',
        rating: 4.8,
        sessionsCount: 38,
        isVerified: true,
        rate: '₱250.00 / hr',
        hourlyRate: 250,
        totalFee: 250,
        downPayment: 125,
        remainingBalance: 125,
        paymentStatus: 'downpayment_verified',
        paymentChannel: 'GCash',
        referenceNumber: '9021841029381',
        avatarBg: 'bg-emerald-600',
        initials: 'MC'
      },
      date: '2026-09-22',
      time: '6:00 PM – 7:00 PM',
      duration: '60 min',
      format: 'Online',
      topic: 'Binary Search Trees, Traversal Algorithms & Balancing',
      submittedAt: 'Sept 19 at 4:15 PM'
    },
    {
      id: 'session-req-101',
      status: 'pending',
      mentor: {
        id: 'mentor-1',
        name: 'Alex Santos',
        specialization: 'Web Development Mentor',
        rating: 4.9,
        sessionsCount: 24,
        isVerified: true,
        rate: '₱250.00 / hr',
        hourlyRate: 250,
        totalFee: 250,
        downPayment: 125,
        remainingBalance: 125,
        paymentStatus: 'downpayment_submitted',
        paymentChannel: 'GCash',
        referenceNumber: '1092837465012',
        avatarBg: 'bg-sky-600',
        initials: 'AS'
      },
      date: '2026-09-25',
      time: '7:00 PM – 8:00 PM',
      duration: '60 min',
      format: 'Online',
      topic: 'JavaScript Functions, parameters, and return values',
      submittedAt: 'Today at 7:30 PM'
    },
    {
      id: 'session-comp-103',
      status: 'completed',
      mentor: {
        id: 'mentor-3',
        name: 'Carlos Reyes',
        specialization: 'UI/UX Design & Figma Systems',
        rating: 5.0,
        sessionsCount: 45,
        isVerified: true,
        rate: '₱200.00 / hr',
        hourlyRate: 200,
        totalFee: 200,
        downPayment: 100,
        remainingBalance: 0,
        paymentStatus: 'fully_paid',
        paymentChannel: 'BPI Bank',
        referenceNumber: '8839201948572',
        avatarBg: 'bg-purple-600',
        initials: 'CR'
      },
      date: '2026-09-18',
      time: '5:00 PM – 6:00 PM',
      duration: '60 min',
      format: 'Online',
      topic: 'Mobile-first Wireframing and Auto Layout in Figma',
      ratingGiven: 5,
      studyNotes: 'Focus on 8pt grid systems, touch targets >= 44px, and atomic component structure.'
    }
  ];

  const baseList = sessions && sessions.length > 0 ? sessions : defaultSessions;
  const allSessions = liveSessions.length > 0 ? [...liveSessions, ...baseList] : baseList;

  // Format readable date
  const getReadableDate = (iso) => {
    if (!iso) return 'Friday, Sept 25, 2026';
    if (iso === '2026-09-25') return 'Friday, Sept 25, 2026';
    if (iso === '2026-09-22') return 'Tuesday, Sept 22, 2026';
    if (iso === '2026-09-21') return 'Monday, Sept 21, 2026';
    if (iso === '2026-09-18') return 'Friday, Sept 18, 2026';
    return iso;
  };

  // Base segment lists
  const allUpcoming = allSessions.filter(
    (s) => s.status === 'pending' || s.status === 'confirmed' || s.status === 'cancelled'
  );
  const allCompleted = allSessions.filter((s) => s.status === 'completed');

  const confirmedCount = allUpcoming.filter((s) => s.status === 'confirmed').length;
  const pendingCount = allUpcoming.filter((s) => s.status === 'pending').length;

  // Filtered upcoming sessions
  const filteredUpcoming = allUpcoming.filter((session) => {
    // Sub-filter match
    if (upcomingSubFilter === 'confirmed' && session.status !== 'confirmed') return false;
    if (upcomingSubFilter === 'pending' && session.status !== 'pending') return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mentorName = session.mentor?.name?.toLowerCase() || '';
      const topic = session.topic?.toLowerCase() || '';
      const spec = session.mentor?.specialization?.toLowerCase() || '';
      return mentorName.includes(q) || topic.includes(q) || spec.includes(q);
    }
    return true;
  });

  // Filtered completed sessions
  const filteredCompleted = allCompleted.filter((session) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mentorName = session.mentor?.name?.toLowerCase() || '';
      const topic = session.topic?.toLowerCase() || '';
      const spec = session.mentor?.specialization?.toLowerCase() || '';
      return mentorName.includes(q) || topic.includes(q) || spec.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* 1. Header with Title & Book Session Action */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            My Sessions
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your upcoming and completed mentoring sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreMentors}
          className="touch-target inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-xl hover:bg-sky-100 active:scale-95 transition-all shadow-2xs"
          title="Browse available mentors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Book Session</span>
        </button>
      </div>

      {/* 2. Search Bar for Sessions */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by mentor or topic..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 3. Primary Segmented Switcher (Upcoming vs Completed) */}
      <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setActiveSegment('upcoming');
            setSearchQuery('');
          }}
          className={`touch-target flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === 'upcoming'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span>Upcoming</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold transition-colors ${
              activeSegment === 'upcoming'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {allUpcoming.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSegment('completed');
            setSearchQuery('');
          }}
          className={`touch-target flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === 'completed'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>Completed</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold transition-colors ${
              activeSegment === 'completed'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {allCompleted.length}
          </span>
        </button>
      </div>

      {/* 4. Sub-Filter Chips for Upcoming Tab */}
      {activeSegment === 'upcoming' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setUpcomingSubFilter('all')}
            className={`touch-target text-xs font-bold px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
              upcomingSubFilter === 'all'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${upcomingSubFilter === 'all' ? 'bg-sky-700/80 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {allUpcoming.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setUpcomingSubFilter('confirmed')}
            className={`touch-target text-xs font-bold px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
              upcomingSubFilter === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Confirmed</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${upcomingSubFilter === 'confirmed' ? 'bg-emerald-700/80 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {confirmedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setUpcomingSubFilter('pending')}
            className={`touch-target text-xs font-bold px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
              upcomingSubFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Pending</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${upcomingSubFilter === 'pending' ? 'bg-amber-700/80 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {pendingCount}
            </span>
          </button>
        </div>
      )}

      {/* 5. Upcoming Segment Content */}
      {activeSegment === 'upcoming' && (
        <div className="space-y-3.5">
          {filteredUpcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {searchQuery ? 'No matching sessions' : 'No upcoming sessions'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {searchQuery
                    ? `No upcoming mentoring sessions matching "${searchQuery}".`
                    : "You don't have any upcoming mentoring sessions. Find a qualified mentor to start learning!"}
                </p>
              </div>
              <button
                type="button"
                onClick={onExploreMentors}
                className="touch-target inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <span>Find a Mentor</span>
              </button>
            </div>
          ) : (
            filteredUpcoming.map((item) => {
              const isPending = item.status === 'pending';
              const isCancelled = item.status === 'cancelled';
              const isConfirmed = item.status === 'confirmed';
              const mentor = item.mentor || {};

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                    isPending
                      ? 'border-amber-200/90 hover:border-amber-300'
                      : isCancelled
                      ? 'border-slate-200 hover:border-slate-300 opacity-90'
                      : 'border-slate-200/90 hover:border-sky-300'
                  }`}
                >
                  {/* Top Status Strip */}
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between text-[11px] font-bold ${
                      isPending
                        ? 'bg-amber-50/90 text-amber-900 border-b border-amber-100'
                        : isCancelled
                        ? 'bg-slate-100 text-slate-700 border-b border-slate-200'
                        : 'bg-emerald-50/90 text-emerald-900 border-b border-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span className="uppercase tracking-wider font-extrabold">Pending Request</span>
                        </>
                      )}
                      {isConfirmed && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="uppercase tracking-wider font-extrabold">Session Confirmed</span>
                        </>
                      )}
                      {isCancelled && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          <span className="uppercase tracking-wider font-extrabold text-slate-600">Request Cancelled</span>
                        </>
                      )}
                    </div>

                    <span className="font-semibold text-slate-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      <span>{item.format === 'Online' ? 'Online Room' : item.format}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {/* Mentor Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-full ${mentor.avatarBg || 'bg-sky-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {mentor.initials || 'AS'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900">{mentor.name}</h3>
                            {mentor.isVerified && (
                              <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified Mentor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{mentor.specialization}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                        {mentor.rate || '₱250.00 / hr'}
                      </span>
                    </div>

                    {/* Schedule Block */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        <span>{getReadableDate(item.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span>{item.time}</span>
                      </div>
                    </div>

                    {/* Topic Snippet */}
                    <div className="text-xs text-slate-700 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      <span className="font-bold text-slate-900 mr-1.5">Topic:</span>
                      <span>{item.topic}</span>
                    </div>

                    {/* Payment Mode Indicator */}
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-slate-500 font-medium">Payment Option:</span>
                      {item.isFullPayment ? (
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          100% Full Payment
                        </span>
                      ) : (
                        <span className="font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          50% Down Payment
                        </span>
                      )}
                    </div>

                    {/* Pending Notice if applicable */}
                    {isPending && (
                      <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50/70 px-2.5 py-1.5 rounded-lg border border-amber-100/80">
                        <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span>Submitted {item.submittedAt || 'recently'}. Waiting for mentor's confirmation.</span>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="pt-1 flex items-center gap-2">
                      {isCancelled ? (
                        <button
                          type="button"
                          onClick={() => onBookAgain ? onBookAgain(mentor) : onExploreMentors()}
                          className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          <span>Book Again</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (isPending) {
                                if (onViewSessionDetails) onViewSessionDetails(item);
                              } else {
                                if (onViewConfirmedSession) onViewConfirmedSession(item);
                                else if (onViewSessionDetails) onViewSessionDetails(item);
                              }
                            }}
                            className={`touch-target flex-1 text-xs font-bold py-2.5 px-3 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 ${
                              isPending
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            <span>{isPending ? 'View Request' : 'View Details'}</span>
                          </button>

                          {isConfirmed && (
                            <button
                              type="button"
                              onClick={() => onJoinSession && onJoinSession(item)}
                              className="touch-target flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                              </svg>
                              <span>Join Session</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onMessageMentor && onMessageMentor(mentor)}
                            className="touch-target w-10 h-10 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0 transition-all active:scale-95"
                            title="Chat with mentor"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.75-.75c0-.66.195-1.294.553-1.838C3.805 16.89 3 14.567 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. Completed Segment Content */}
      {activeSegment === 'completed' && (
        <div className="space-y-3.5">
          {filteredCompleted.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {searchQuery ? 'No matching completed sessions' : 'No completed sessions'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {searchQuery
                    ? `No completed mentoring sessions matching "${searchQuery}".`
                    : 'Your completed mentoring sessions and study notes will appear here.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onExploreMentors}
                className="touch-target inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <span>Explore Mentors</span>
              </button>
            </div>
          ) : (
            filteredCompleted.map((item) => {
              const mentor = item.mentor || {};

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 p-4 shadow-xs space-y-3 transition-all"
                >
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                        <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        <span>COMPLETED</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {getReadableDate(item.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                      <span>{item.ratingGiven || 5}.0 Rated</span>
                    </div>
                  </div>

                  {/* Mentor Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${mentor.avatarBg || 'bg-sky-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {mentor.initials || 'CR'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{mentor.name}</h3>
                          {mentor.isVerified && (
                            <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-sky-600 font-medium">{mentor.specialization}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {mentor.rate || '₱200.00 / hr'}
                    </span>
                  </div>

                  {/* Topic Box */}
                  <div className="text-xs text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    <span className="font-bold text-slate-900 mr-1.5">Topic:</span>
                    <span>{item.topic}</span>
                  </div>

                  {/* Study Notes Snippet */}
                  {item.studyNotes && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        <span>Study Takeaways:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-normal">{item.studyNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onViewCompletedSession && onViewCompletedSession(item)}
                      className="touch-target flex-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                      <span>View Notes & Summary</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onBookAgain ? onBookAgain(mentor) : onExploreMentors()}
                      className="touch-target flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      <span>Book Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onMessageMentor && onMessageMentor(mentor)}
                      className="touch-target w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 transition-all active:scale-95"
                      title="Chat with mentor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.75-.75c0-.66.195-1.294.553-1.838C3.805 16.89 3 14.567 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
