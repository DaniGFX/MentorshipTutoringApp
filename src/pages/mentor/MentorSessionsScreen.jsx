import React, { useState, useEffect } from 'react';
import { sessionService } from '../../services/sessionService.js';
import { supabase } from '../../services/supabaseClient.js';

/**
 * Mentor Sessions Screen (Tab 4: MentorSessionsScreen)
 * Conforms to Section 6 of docs/mentor_flow_spec.md & Part 3 of docs/mobile_contents_guide.md.
 * Features:
 * - 3-Segment tab switcher: Requests (Pending), Upcoming (Confirmed), Completed.
 * - Accept and Decline session request modals with reason selection and state transitions.
 * - Confirmed session cards with live countdown tags and direct Virtual Classroom launch.
 * - Completed session cards with service accreditation notes.
 * - Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function MentorSessionsScreen({
  sessions,
  onAcceptSession,
  onDeclineSession,
  onViewSessionDetails,
  onViewCompletedSession,
  onJoinSession,
  onViewStudents,
  onMessageStudent
}) {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'upcoming' | 'completed'

  // Mentor sessions list
  const [sessionList, setSessionList] = useState(sessions || []);

  // Modal States
  const [acceptModalSession, setAcceptModalSession] = useState(null);
  const [declineModalSession, setDeclineModalSession] = useState(null);
  const [declineReason, setDeclineReason] = useState('Schedule conflict');
  const [customDeclineNote, setCustomDeclineNote] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [liveMentorSessions, setLiveMentorSessions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveMentorSessions() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data } = await sessionService.getMentorSessions(authData.user.id);
          if (isMounted && data && data.length > 0) {
            const mapped = data.map((s) => {
              const studentProf = s.student_profile || {};
              const isFullPayment = (s.student_note || '').includes('Full Payment') || Number(s.payment_amount) >= 250;
              const startDt = new Date(s.scheduled_start);
              const dateStr = startDt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = `${startDt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(s.scheduled_end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

              return {
                id: s.id,
                status: s.status,
                student: {
                  id: s.student_id,
                  name: studentProf.full_name || 'Student Learner',
                  course: studentProf.course_program || 'BS Information Technology',
                  yearLevel: studentProf.year_level || 'College Student',
                  school: studentProf.school_name || 'University',
                  avatarBg: 'bg-sky-600',
                  initials: studentProf.full_name ? studentProf.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'SL',
                },
                topic: s.session_topic,
                date: dateStr,
                time: timeStr,
                duration: `${Math.round((s.duration_hours || 1) * 60)} min`,
                format: s.meeting_type === 'online' ? 'Online' : 'In-person',
                totalFee: isFullPayment ? Number(s.payment_amount) : Number(s.payment_amount) * 2,
                downPayment: isFullPayment ? 0 : Number(s.payment_amount),
                remainingBalance: isFullPayment ? 0 : Number(s.payment_amount),
                paymentMethod: 'Direct Pay',
                referenceNumber: s.payment_reference || 'N/A',
                paymentStatus: s.payment_status,
                studentNote: s.student_note,
                countdown: 'Starts soon',
                isFullPayment,
                amountPaid: s.payment_amount,
              };
            });
            setLiveMentorSessions(mapped);
          }
        }
      } catch (err) {
        console.error('[MentorSessionsScreen] Error loading mentor sessions:', err);
      }
    }
    fetchLiveMentorSessions();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeSessionList = liveMentorSessions.length > 0 ? liveMentorSessions : (sessionList.length > 0 ? sessionList : (sessions || []));

  // Filtered lists
  const pendingRequests = activeSessionList.filter((s) => s.status === 'pending');
  const upcomingSessions = activeSessionList.filter((s) => s.status === 'confirmed');
  const completedSessions = activeSessionList.filter((s) => s.status === 'completed');

  // Accept Flow Handler
  const handleConfirmAccept = async () => {
    if (!acceptModalSession) return;
    const targetId = acceptModalSession.id;

    setSessionList((prev) =>
      prev.map((s) =>
        s.id === targetId ? { ...s, status: 'confirmed', countdown: 'Starts in 4 days' } : s
      )
    );
    setLiveMentorSessions((prev) =>
      prev.map((s) =>
        s.id === targetId ? { ...s, status: 'confirmed', countdown: 'Starts in 4 days' } : s
      )
    );

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id && targetId) {
        await sessionService.acceptSession(targetId, authData.user.id);
      }
    } catch (err) {
      console.error('[MentorSessionsScreen] Accept error:', err);
    }

    if (onAcceptSession) onAcceptSession(targetId);

    const studentName = acceptModalSession.student?.name || 'Student';
    setAcceptModalSession(null);
    setActiveTab('upcoming');
    showToast(`Session confirmed! ${studentName} has been notified.`);
  };

  // Decline Flow Handler
  const handleConfirmDecline = async () => {
    if (!declineModalSession) return;
    const targetId = declineModalSession.id;

    setSessionList((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, status: 'declined' } : s))
    );
    setLiveMentorSessions((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, status: 'declined' } : s))
    );

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id && targetId) {
        await sessionService.declineSession(targetId, authData.user.id, declineReason, customDeclineNote);
      }
    } catch (err) {
      console.error('[MentorSessionsScreen] Decline error:', err);
    }

    if (onDeclineSession) onDeclineSession(targetId, declineReason, customDeclineNote);

    setDeclineModalSession(null);
    setCustomDeclineNote('');
    showToast('Session request declined. Student has been notified.');
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24 max-w-md mx-auto relative">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              My Sessions
            </h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
              {upcomingSessions.length} Confirmed
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your mentoring sessions and requests.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewStudents}
          className="touch-target inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 active:scale-95 transition-all shadow-2xs"
          title="View students"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <span>Students</span>
        </button>
      </div>

      {/* 2. 3-Segment Tab Switcher */}
      <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`touch-target flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>Requests</span>
          {pendingRequests.length > 0 && (
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
              activeTab === 'requests' ? 'bg-amber-100 text-amber-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`touch-target flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'upcoming'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span>Upcoming</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activeTab === 'upcoming' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {upcomingSessions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`touch-target flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'completed'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span>Completed</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activeTab === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
          }`}>
            {completedSessions.length}
          </span>
        </button>
      </div>

      {/* 3. Tab Content Area */}

      {/* A. REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No Pending Requests</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  New session requests from students will appear here when they book assistance.
                </p>
              </div>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs space-y-3.5 hover:border-amber-300 transition-all"
              >
                {/* Header: Status & Countdown */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    PENDING REQUEST
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Requested 2h ago
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl ${req.student?.avatarBg || 'bg-sky-600'} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}>
                    {req.student?.initials || 'ST'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{req.student?.name}</h3>
                    <p className="text-[11px] text-sky-700 font-semibold">{req.student?.course}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{req.student?.yearLevel} · {req.student?.school}</p>
                  </div>
                </div>

                {/* Topic & Schedule */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 leading-snug">
                    {req.topic}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      {req.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      {req.time}
                    </span>
                  </div>

                  {req.studentNote && (
                    <div className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100 mt-2 leading-relaxed">
                      “{req.studentNote}”
                    </div>
                  )}

                  {/* Payment Verification Box */}
                  <div className="bg-amber-50/80 rounded-xl p-2.5 border border-amber-200/70 space-y-1 text-xs mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950">
                        {req.isFullPayment ? '100% Full Payment Submitted' : '50% Down Payment Submitted'}
                      </span>
                      <span className="font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 text-[10px]">
                        ₱{(req.amountPaid || (req.isFullPayment ? req.totalFee : req.downPayment) || (req.isFullPayment ? 250 : 125)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Submitted Ref:</span>
                      <span className="font-mono font-bold text-slate-900">{req.referenceNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Dual Actions: Accept | Decline */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeclineModalSession(req)}
                    className="touch-target flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.99]"
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => setAcceptModalSession(req)}
                    className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-2xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Accept</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* B. UPCOMING TAB */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcomingSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No Upcoming Sessions</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Your confirmed mentoring sessions will appear here once accepted.
                </p>
              </div>
              <button
                type="button"
                onClick={onViewStudents}
                className="touch-target inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-4 py-2 rounded-xl hover:bg-sky-100 active:scale-95 transition-all shadow-2xs mt-1"
              >
                <span>View Students</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          ) : (
            upcomingSessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 hover:border-sky-300 transition-all"
              >
                {/* Status & Countdown Pill */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    CONFIRMED
                  </span>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    {sess.countdown || 'Starts soon'}
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${sess.student?.avatarBg || 'bg-sky-600'} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}>
                    {sess.student?.initials || 'ST'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{sess.student?.name}</h3>
                    <p className="text-[11px] text-sky-700 font-semibold">{sess.student?.course}</p>
                  </div>
                </div>

                {/* Topic & Schedule */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900">{sess.topic}</h4>
                  <p className="text-[11px] text-slate-500">
                    {sess.date} · {sess.time} ({sess.format || 'Online'})
                  </p>
                </div>

                {/* Action Buttons: View Session & Join */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onViewSessionDetails && onViewSessionDetails(sess)}
                    className="touch-target flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                  >
                    <span>View Session</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => onJoinSession && onJoinSession(sess)}
                    className="touch-target flex-1 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-2xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    <span>Join Session</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* C. COMPLETED TAB */}
      {activeTab === 'completed' && (
        <div className="space-y-3">
          {completedSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No Completed Sessions</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Mentoring sessions that have concluded will be archived here with service credit summaries.
                </p>
              </div>
            </div>
          ) : (
            completedSessions.map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Status & Service Hour Tag */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    COMPLETED
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {comp.totalPaid || '₱250.00'} Settled
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${comp.student?.avatarBg || 'bg-purple-600'} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}>
                    {comp.student?.initials || 'ST'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{comp.student?.name}</h3>
                    <p className="text-[11px] text-sky-700 font-semibold">{comp.student?.course}</p>
                  </div>
                </div>

                {/* Topic & Completion Date */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900">{comp.topic}</h4>
                  <p className="text-[11px] text-slate-500">
                    Completed: {comp.date} · {comp.duration} ({comp.format})
                  </p>
                </div>

                {/* Action: View Session Summary */}
                <button
                  type="button"
                  onClick={() => onViewCompletedSession && onViewCompletedSession(comp)}
                  className="touch-target w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  <span>View Session Summary</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Accept Confirmation Modal */}
      {acceptModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-scale-up border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Accept Session Request?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Confirm this session with <span className="font-bold text-slate-800">{acceptModalSession.student?.name}</span>?
              </p>
              <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-700 font-semibold border border-slate-100 mt-2">
                {acceptModalSession.date} · {acceptModalSession.time}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAcceptModalSession(null)}
                className="touch-target flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                className="touch-target flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 shadow-2xs"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Decline Confirmation Modal with Reason Picker */}
      {declineModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-scale-up border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Decline Session Request?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Please indicate a reason to inform {declineModalSession.student?.name}.
              </p>
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5 text-xs">
              {[
                'Schedule conflict',
                'Time unavailable',
                'Not my area of expertise',
                'Other'
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                    declineReason === r
                      ? 'border-sky-500 bg-sky-50/50 text-sky-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="declineReason"
                    value={r}
                    checked={declineReason === r}
                    onChange={() => setDeclineReason(r)}
                    className="accent-sky-600"
                  />
                  <span>{r}</span>
                </label>
              ))}

              {declineReason === 'Other' && (
                <textarea
                  value={customDeclineNote}
                  onChange={(e) => setCustomDeclineNote(e.target.value)}
                  placeholder="Provide brief note for the student..."
                  rows={2}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500"
                />
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeclineModalSession(null)}
                className="touch-target flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="touch-target flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-2xs"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
