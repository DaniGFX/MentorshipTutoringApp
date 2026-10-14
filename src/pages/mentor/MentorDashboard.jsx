import React, { useState } from 'react';
import { sessionService } from '../../services/sessionService.js';

export default function MentorDashboard({
  currentUserProfile,
  sessions = [],
  onNavigateTab,
  onViewStudentProfile,
  onOpenNotifications
}) {
  // Mentor Availability Toggle
  const [isAcceptingRequests, setIsAcceptingRequests] = useState(true);

  // Derive sessions from dynamic props
  const pendingRequests = (sessions || []).filter((s) => s.status === 'pending');
  const upcomingSessions = (sessions || []).filter((s) => s.status === 'confirmed');
  const completedSessions = (sessions || []).filter((s) => s.status === 'completed');

  // Compute today's sessions
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaySessionsCount = upcomingSessions.filter((s) => s.date === todayIso).length;

  // Compute total earnings from completed sessions
  const totalEarnings = completedSessions.reduce(
    (sum, s) => sum + (parseFloat(s.totalFee || s.total_amount) || 0),
    0
  );

  // Extract unique students from sessions
  const studentsMap = new Map();
  (sessions || []).forEach((s) => {
    const studentId = s.student?.id || s.studentName;
    if (studentId && !studentsMap.has(studentId)) {
      studentsMap.set(studentId, {
        id: studentId,
        name: s.student?.name || s.studentName || 'Student Learner',
        course: s.student?.course || s.course || 'College Student',
        yearLevel: s.student?.yearLevel || s.yearLevel || '',
        sessionsCount: (sessions || []).filter((item) => (item.student?.id || item.studentName) === studentId && item.status === 'completed').length,
        initials: s.student?.initials || s.initials || 'SL',
        avatarBg: s.student?.avatarBg || s.avatarBg || 'bg-sky-500'
      });
    }
  });
  const students = Array.from(studentsMap.values());

  // Modals & Interaction States
  const [acceptModalRequest, setAcceptModalRequest] = useState(null);
  const [declineModalRequest, setDeclineModalRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState('Schedule conflict');
  const [toastMessage, setToastMessage] = useState(null);

  // Quick notification trigger
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handlers for Request Acceptance
  const handleConfirmAccept = async () => {
    if (!acceptModalRequest) return;
    const req = acceptModalRequest;
    try {
      if (currentUserProfile?.id) {
        await sessionService.acceptSession(req.id, currentUserProfile.id);
      }
      showToast(`Session Confirmed! Mentoring session with ${req.studentName} is confirmed.`);
    } catch (err) {
      console.error('[MentorDashboard] Accept session error:', err);
      showToast('Session updated.');
    } finally {
      setAcceptModalRequest(null);
    }
  };

  // Handlers for Request Decline
  const handleConfirmDecline = async () => {
    if (!declineModalRequest) return;
    const req = declineModalRequest;
    try {
      if (currentUserProfile?.id) {
        await sessionService.declineSession(req.id, currentUserProfile.id, declineReason);
      }
      showToast(`Session request with ${req.studentName} has been declined.`);
    } catch (err) {
      console.error('[MentorDashboard] Decline session error:', err);
      showToast('Session request updated.');
    } finally {
      setDeclineModalRequest(null);
    }
  };

  const mentorFirstName = currentUserProfile?.full_name?.trim()?.split(' ')[0] || 'Mentor';
  const mentorRating = currentUserProfile?.average_rating ? Number(currentUserProfile.average_rating).toFixed(1) : '5.0';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-xs font-medium leading-tight">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Dismiss message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 1. Header & Greeting Hero Banner */}
      <div className="bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        {/* Decorative blur accents */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 -top-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Top meta strip */}
          <div className="flex items-center justify-between">
            {/* Availability Toggle Pill */}
            <button
              onClick={() => setIsAcceptingRequests(!isAcceptingRequests)}
              className="touch-target inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/25 backdrop-blur-md text-[11px] font-semibold text-white transition-all active:scale-95"
              title="Click to toggle availability"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAcceptingRequests ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'
                }`}
              />
              <span>{isAcceptingRequests ? 'Accepting Students' : 'Temporarily Away'}</span>
            </button>

            {/* Notification Bell Icon */}
            <button
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  showToast('No unread mentor announcements.');
                }
              }}
              className="touch-target w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95 relative"
              aria-label="Mentor Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {pendingRequests.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-sky-600" />
              )}
            </button>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Good morning, {mentorFirstName}!
            </h1>
            <p className="text-xs text-sky-100 font-medium mt-0.5">
              Ready to help your students grow today?
            </p>
          </div>
        </div>
      </div>

      {/* 2. Today's Overview Metric Grid */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Today's Overview
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Metric 1: Today's Sessions */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('sessions')}
            className="bg-white rounded-2xl border border-sky-100 p-3.5 shadow-2xs space-y-2 hover:border-sky-300 hover:shadow-xs active:scale-[0.99] transition-all text-left w-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Today's Sessions</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-sky-700 tracking-tight">
                {todaySessionsCount}
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Scheduled today</p>
            </div>
          </button>

          {/* Metric 2: Total Earnings */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Total Earnings</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                ₱{totalEarnings.toLocaleString()}
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {completedSessions.length} paid sessions
              </p>
            </div>
          </div>

          {/* Metric 3: Pending Requests */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('sessions')}
            className="bg-white rounded-2xl border border-amber-100 p-3.5 shadow-2xs space-y-2 hover:border-amber-300 hover:shadow-xs active:scale-[0.99] transition-all text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Action
                  </span>
                )}
              </div>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-amber-600 tracking-tight">
                {pendingRequests.length}
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {pendingRequests.length > 0 ? 'Need response' : 'All caught up'}
              </p>
            </div>
          </button>

          {/* Metric 4: My Rating */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('profile')}
            className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs space-y-2 hover:border-purple-300 hover:shadow-xs active:scale-[0.99] transition-all text-left w-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Mentor Rating</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-purple-700 tracking-tight">
                {mentorRating}
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Academic rating</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Session Requests Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Session Requests</h2>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingRequests.length}
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('sessions')}
            className="touch-target text-xs font-semibold text-sky-600 hover:text-sky-700 active:scale-95 transition-all flex items-center gap-0.5"
          >
            <span>See All</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center border border-slate-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-800">No Pending Requests</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              New tutoring and mentorship requests from students will appear here for your review.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Student Info Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${req.avatarBg || 'bg-sky-500'} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                    >
                      {req.initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {req.studentName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {req.course} {req.yearLevel ? `· ${req.yearLevel}` : ''}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                    Pending
                  </span>
                </div>

                {/* Session Details Box */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{req.topic}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] font-semibold text-sky-600">{req.format}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      <span>{req.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span>{req.time}</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-slate-800">Amount: ₱{(req.downPayment || req.totalFee || 0).toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 block">
                        Via {req.paymentMethod || 'GCash'} · Ref: <span className="font-mono font-bold text-sky-700">{req.referenceNumber || 'N/A'}</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                      Ref Submitted
                    </span>
                  </div>
                </div>

                {/* Request Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setAcceptModalRequest(req)}
                    className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Verify & Accept</span>
                  </button>

                  <button
                    onClick={() => setDeclineModalRequest(req)}
                    className="touch-target flex-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-red-600 border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Upcoming Sessions Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Upcoming Sessions</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
              {upcomingSessions.length}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('sessions')}
            className="touch-target text-xs font-semibold text-sky-600 hover:text-sky-700 active:scale-95 transition-all flex items-center gap-0.5"
          >
            <span>See All</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-2">
            <p className="text-xs font-bold text-slate-800">No Upcoming Sessions</p>
            <p className="text-[11px] text-slate-400">
              Your confirmed tutoring sessions will appear here with classroom links.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingSessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Session Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${sess.avatarBg || 'bg-sky-500'} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                    >
                      {sess.initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {sess.studentName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">{sess.course}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    CONFIRMED
                  </span>
                </div>

                {/* Topic & Schedule */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{sess.topic}</p>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {sess.format}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      <span>{sess.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span>{sess.time}</span>
                    </div>
                  </div>
                </div>

                {/* Session Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('sessions')}
                    className="touch-target flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] text-center"
                  >
                    View Session
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('sessions');
                    }}
                    className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    <span>Classroom</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. My Students Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900">My Students</h2>
          <button
            onClick={() => onNavigateTab && onNavigateTab('students')}
            className="touch-target text-xs font-semibold text-sky-600 hover:text-sky-700 active:scale-95 transition-all flex items-center gap-0.5"
          >
            <span>See All</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-2">
            <p className="text-xs font-bold text-slate-800">No Students Yet</p>
            <p className="text-[11px] text-slate-400">
              Students who book sessions with you will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.slice(0, 4).map((stud) => (
              <div
                key={stud.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${stud.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    {stud.initials}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {stud.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {stud.course} {stud.yearLevel ? `· ${stud.yearLevel}` : ''}
                    </p>
                    <p className="text-[10px] text-sky-600 font-semibold mt-0.5">
                      {stud.sessionsCount} Sessions completed
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onViewStudentProfile) {
                      onViewStudentProfile(stud);
                    } else if (onNavigateTab) {
                      onNavigateTab('students');
                    }
                  }}
                  className="touch-target text-xs font-semibold text-slate-700 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-all active:scale-95"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Quick Action Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-4 text-white shadow-sm flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.943l.878-2.635C4.249 15.918 3 14.07 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            <h3 className="text-xs font-bold text-white tracking-tight">Stay Connected</h3>
          </div>
          <p className="text-[11px] text-slate-300 font-normal leading-tight max-w-xs">
            Keep in touch with your students and answer their questions.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab && onNavigateTab('messages')}
          className="touch-target shrink-0 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
        >
          View Messages
        </button>
      </div>

      {/* ACCEPT MODAL */}
      {acceptModalRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Accept Session Request?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Confirm mentoring session with{' '}
                <span className="font-semibold text-slate-800">
                  {acceptModalRequest.studentName}
                </span>{' '}
                on {acceptModalRequest.date}, {acceptModalRequest.time}?
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100 text-left">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Topic:</span>
                <span className="font-medium text-slate-900">{acceptModalRequest.topic}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Format:</span>
                <span className="font-medium text-slate-900">{acceptModalRequest.format}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Total Session Fee:</span>
                <span className="font-bold text-slate-900">₱{(acceptModalRequest.totalFee || 250).toFixed(2)}</span>
              </div>
            </div>

            {/* Anti-Scam Down Payment Verification Box */}
            <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">50% Down Payment</span>
                <span className="text-sm font-black text-emerald-700">
                  ₱{(acceptModalRequest.downPayment || 125).toFixed(2)}
                </span>
              </div>

              <div className="text-[11px] space-y-1 text-emerald-900">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Payment Channel:</span>
                  <span className="font-semibold">{acceptModalRequest.paymentMethod || 'GCash'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Submitted Reference:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {acceptModalRequest.referenceNumber || 'MP-8921-7734'}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-amber-800 bg-amber-50/90 rounded-lg p-2 border border-amber-200/80 font-medium leading-relaxed">
                Please verify that ₱{(acceptModalRequest.downPayment || 125).toFixed(2)} was received in your {acceptModalRequest.paymentMethod || 'GCash'} before accepting.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setAcceptModalRequest(null)}
                className="touch-target flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
              >
                Verify ₱{(acceptModalRequest.downPayment || 125).toFixed(0)} & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {declineModalRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Decline Session Request?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to decline this request from{' '}
                <span className="font-semibold text-slate-800">
                  {declineModalRequest.studentName}
                </span>
                ? Please select a reason:
              </p>
            </div>

            <div className="space-y-1.5">
              {[
                'Schedule conflict',
                'Time unavailable',
                'Not my area of expertise',
                'Other commitment'
              ].map((reason) => (
                <label
                  key={reason}
                  onClick={() => setDeclineReason(reason)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    declineReason === reason
                      ? 'border-sky-500 bg-sky-50 text-sky-900 font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{reason}</span>
                  <input
                    type="radio"
                    name="declineReason"
                    checked={declineReason === reason}
                    onChange={() => setDeclineReason(reason)}
                    className="accent-sky-600 w-3.5 h-3.5"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setDeclineModalRequest(null)}
                className="touch-target flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecline}
                className="touch-target flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
