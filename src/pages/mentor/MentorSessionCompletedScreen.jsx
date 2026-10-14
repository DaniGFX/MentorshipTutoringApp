import React, { useState } from 'react';
import { sessionService } from '../../services/sessionService.js';
import { supabase } from '../../services/supabaseClient.js';

/**
 * Mentor Session Completed Screen (Tab 4 Sub-View)
 * Conforms to Section 6 of docs/mentor_flow_spec.md & Part 3 of docs/mobile_contents_guide.md.
 * Features:
 * - Session Completed congratulations banner with community service hour accreditation.
 * - Structured session information breakdown.
 * - Interactive Post-Session Observation & Study Notes pad with edit/save toggles.
 * - Mentee profile quick access card.
 * - Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function MentorSessionCompletedScreen({
  session,
  onBack,
  onViewStudentProfile,
  onMessageStudent
}) {
  const activeSession = session || {
    id: 'sess-comp-301',
    status: 'completed',
    student: {
      id: 'std-1',
      name: 'Daniela Gonzales',
      course: 'BS Information Technology',
      yearLevel: '3rd Year Student',
      school: 'Bestlink College of the Philippines',
      sessionsCount: 3,
      initials: 'DG',
      avatarBg: 'bg-sky-600'
    },
    topic: 'JavaScript Functions, parameters, and return values',
    date: 'September 18, 2026',
    time: '7:00 PM – 8:00 PM',
    duration: '60 minutes',
    format: 'Online Room',
    totalFee: 250,
    paymentStatus: 'fully_paid',
    notes: 'Discussed JavaScript functions, parameters, return values, and basic examples. Daniela grasped arrow function syntax quickly and built a solid callback demonstration.'
  };

  const student = activeSession.student || {
    name: 'Daniela Gonzales',
    course: 'BS Information Technology',
    yearLevel: '3rd Year Student',
    school: 'Bestlink College of the Philippines',
    sessionsCount: 3,
    initials: 'DG',
    avatarBg: 'bg-sky-600'
  };

  const [notes, setNotes] = useState(activeSession.notes);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveNotes = async () => {
    setIsEditingNotes(false);
    showToast('Post-session notes updated successfully!');
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id && activeSession.id) {
        await sessionService.completeSession(activeSession.id, authData.user.id, notes);
      }
    } catch (err) {
      console.error('[MentorSessionCompletedScreen] Error saving notes:', err);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24 max-w-md mx-auto relative">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="touch-target -ml-1 p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Back to sessions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Session Summary
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Completed mentoring session review
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          COMPLETED
        </span>
      </div>

      {/* 2. Success Banner with Service Hour Accreditation */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold">Session Completed</h2>
            <p className="text-xs text-emerald-100">
              Mentoring session with {student.name} successfully concluded.
            </p>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs mt-2 border border-white/15">
          <span className="font-semibold text-emerald-50 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Accreditation Ledger:
          </span>
          <span className="font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-md">
            +{(activeSession.duration_hours || 1.0).toFixed(1)} University Service Hours Credited
          </span>
        </div>
      </div>

      {/* 3. Session Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Session Details
        </span>

        <div className="space-y-3 divide-y divide-slate-100 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-medium block">Mentored Topic</span>
            <p className="text-slate-900 font-bold leading-relaxed">{activeSession.topic}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium block">Date Completed</span>
              <p className="text-slate-900 font-bold">{activeSession.date}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-medium block">Total Duration</span>
              <p className="text-slate-900 font-bold">{activeSession.duration}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium block">Meeting Format</span>
              <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg">
                <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>{activeSession.format}</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-medium block">Payment Status</span>
              <p className="text-emerald-700 font-bold">₱250.00 (Fully Paid)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Post-Session Mentor Notes Pad */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Your Post-Session Notes
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isEditingNotes) {
                handleSaveNotes();
              } else {
                setIsEditingNotes(true);
              }
            }}
            className="touch-target text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-xl transition-all active:scale-95"
          >
            {isEditingNotes ? 'Save Notes' : 'Edit Notes'}
          </button>
        </div>

        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Record covered concepts, exercises, homework, or mentee progress..."
              className="w-full text-xs text-slate-800 p-3 bg-slate-50 border border-sky-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all leading-relaxed"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotes(false)}
                className="touch-target text-xs text-slate-500 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="touch-target text-xs bg-sky-600 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-sky-700 shadow-2xs"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
            “{notes}”
          </div>
        )}
      </div>

      {/* 5. Mentee Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Student Mentee
          </span>
          <button
            type="button"
            onClick={() => onViewStudentProfile && onViewStudentProfile(student)}
            className="touch-target text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
          >
            <span>View Student Profile</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3.5 pt-0.5">
          <div className={`w-11 h-11 rounded-2xl ${student.avatarBg || 'bg-sky-600'} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}>
            {student.initials || 'ST'}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">{student.name}</h3>
            <p className="text-[11px] text-sky-700 font-semibold">{student.course}</p>
            <p className="text-[10px] text-slate-500 font-medium">
              {student.sessionsCount} Mentoring Sessions Completed
            </p>
          </div>
        </div>
      </div>

      {/* 6. Sticky Bottom Action Dock */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={() => onMessageStudent && onMessageStudent(student)}
          className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-3.5 rounded-2xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.75-.75c0-.66.195-1.294.553-1.838C3.805 16.89 3 14.567 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          <span>Message Student</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="touch-target w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-3 rounded-2xl shadow-2xs transition-all active:scale-[0.99]"
        >
          Back to Sessions
        </button>
      </div>

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
