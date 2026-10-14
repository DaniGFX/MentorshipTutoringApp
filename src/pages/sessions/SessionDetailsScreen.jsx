import React, { useState } from 'react';
import { sessionService } from '../../services/sessionService.js';
import { supabase } from '../../services/supabaseClient.js';

export default function SessionDetailsScreen({
  session,
  onBack,
  onCancelRequest,
  onMessageMentor,
  onJoinClassroom
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(session?.status || 'pending');

  // Fallback session data if opened standalone
  const activeSession = session || {
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
      avatarBg: 'bg-sky-600',
      initials: 'AS'
    },
    date: '2026-09-25',
    time: '7:00 PM – 8:00 PM',
    duration: '60 min',
    format: 'Online',
    totalFee: 250,
    downPayment: 125,
    remainingBalance: 125,
    paymentMethod: 'GCash',
    referenceNumber: 'MP-8921-7734',
    paymentStatus: 'downpayment_submitted',
    topic: 'I want help understanding JavaScript functions, parameters, and return values.',
    submittedAt: 'Today at 7:30 PM'
  };

  const mentor = activeSession.mentor;

  // Format readable date
  const getReadableDate = (iso) => {
    if (!iso) return 'Friday, September 25, 2026';
    if (iso === '2026-09-25') return 'Friday, September 25, 2026';
    if (iso === '2026-09-21') return 'Monday, September 21, 2026';
    if (iso === '2026-09-22') return 'Tuesday, September 22, 2026';
    if (iso === '2026-09-23') return 'Wednesday, September 23, 2026';
    if (iso === '2026-09-24') return 'Thursday, September 24, 2026';
    return iso;
  };

  const isFullPayment = Boolean(activeSession.isFullPayment || activeSession.remainingBalance === 0 || (activeSession.studentNote && activeSession.studentNote.includes('Full Payment')));

  const handleConfirmCancel = async () => {
    setCurrentStatus('cancelled');
    setShowCancelModal(false);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id && activeSession.id) {
        await sessionService.cancelSessionRequest(activeSession.id, authData.user.id);
      }
    } catch (err) {
      console.error('[SessionDetailsScreen] Error cancelling session:', err);
    }
    if (onCancelRequest) {
      onCancelRequest(activeSession.id);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 pt-1">
        <button
          onClick={onBack}
          className="touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span>Back to Sessions</span>
        </button>

        <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
          {activeSession.id ? `#${activeSession.id.slice(-6).toUpperCase()}` : '#SR-101'}
        </span>
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Session Request Details
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Review the status, scheduling parameters, and payment breakdown of your mentorship booking.
        </p>
      </div>

      {/* 2. Status Banner */}
      {currentStatus === 'pending' && (
        <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Pending Verification
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {isFullPayment ? '100% Full Payment Submitted' : '50% Down Payment Submitted'}
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            Waiting for <span className="font-bold text-amber-950">{mentor.name}</span> to verify your {isFullPayment ? 'full payment' : '50% down payment'} (₱{(activeSession.amountPaid || (isFullPayment ? activeSession.totalFee : activeSession.downPayment) || (isFullPayment ? 250 : 125)).toFixed(2)}) and accept your session request.
          </p>
          <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">Submitted Ref No.:</span>
            <span className="font-mono font-bold text-slate-800">{activeSession.referenceNumber || 'MP-8921-7734'}</span>
          </div>
        </div>
      )}

      {currentStatus === 'cancelled' && (
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="uppercase tracking-wider">Request Cancelled</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            This session request has been cancelled and withdrawn from the mentor's queue.
          </p>
        </div>
      )}

      {currentStatus === 'confirmed' && (
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Session Confirmed
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Down Payment Verified
            </span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">
            Great news! <span className="font-bold text-emerald-950">{mentor.name}</span> verified your down payment and confirmed the session. Remaining balance of ₱{(activeSession.remainingBalance || 125).toFixed(2)} is due upon completion.
          </p>
        </div>
      )}

      {/* 3. Mentor Information Card with Message Shortcut */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Assigned Mentor
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            {mentor.rate || '₱250.00 / hr'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full ${mentor.avatarBg || 'bg-sky-600'} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
          >
            {mentor.initials || 'AS'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {mentor.name}
              </h2>
              {mentor.isVerified && (
                <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified Mentor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">{mentor.specialization}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-semibold text-slate-700">
              <svg className="w-3.5 h-3.5 fill-sky-500 text-sky-500" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              <span>{mentor.rating ? mentor.rating.toFixed(1) : '4.9'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">{mentor.sessionsCount || 24} Sessions</span>
            </div>
          </div>
        </div>

        {/* Message Mentor CTA */}
        <button
          type="button"
          onClick={onMessageMentor}
          className="touch-target w-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.943l.878-2.635C4.249 15.918 3 14.07 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          <span>Message {mentor.name.split(' ')[0]}</span>
        </button>
      </div>

      {/* 4. Session Scheduling Specifications */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Scheduled Parameters
        </h3>

        <div className="space-y-3 text-xs divide-y divide-slate-100">
          {/* Date */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span>Date</span>
            </div>
            <span className="font-bold text-slate-800">{getReadableDate(activeSession.date)}</span>
          </div>

          {/* Time */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>Time Slot</span>
            </div>
            <span className="font-bold text-slate-800">{activeSession.time}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>Duration</span>
            </div>
            <span className="font-bold text-slate-800">{activeSession.duration}</span>
          </div>

          {/* Format */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <span>Meeting Format</span>
            </div>
            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
              {activeSession.format === 'Online' ? 'Online (Virtual Classroom)' : activeSession.format}
            </span>
          </div>

          {/* Session Fee & Down Payment Breakdown */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>Total Session Fee</span>
            </div>
            <span className="font-bold text-slate-900">
              ₱{(activeSession.totalFee || 250).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>{isFullPayment ? '100% Full Payment' : '50% Down Payment'}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-600">
                ₱{(activeSession.amountPaid || (isFullPayment ? activeSession.totalFee : activeSession.downPayment) || (isFullPayment ? 250 : 125)).toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block font-normal">
                Via {activeSession.paymentMethod || activeSession.paymentChannel || 'Direct Pay'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>Remaining Balance</span>
            </div>
            <div className="text-right">
              <span className={`font-bold ${isFullPayment ? 'text-emerald-700' : 'text-amber-700'}`}>
                ₱{(isFullPayment ? 0 : (activeSession.remainingBalance || 125)).toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block font-normal">
                {isFullPayment ? 'Fully settled upfront' : 'Due upon completion'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Learning Topic / Questions Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            What You Want to Learn
          </h3>
          <span className="text-[10px] font-semibold text-sky-600">Learning Goal</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-medium">
          {activeSession.topic || 'No specific topic entered.'}
        </div>
      </div>

      {/* 6. Submission Metadata */}
      <div className="px-1 text-[11px] text-slate-400 font-medium flex items-center justify-between">
        <span>Request Sent: {activeSession.submittedAt || 'Today at 7:30 PM'}</span>
        <span>MentorLinks Safe Direct Connect</span>
      </div>

      {/* 7. Action Buttons */}
      <div className="pt-2 space-y-2">
        {currentStatus === 'confirmed' && (
          <button
            type="button"
            onClick={onJoinClassroom}
            className="touch-target w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span>Join Virtual Classroom</span>
          </button>
        )}

        {currentStatus === 'pending' && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="touch-target w-full bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold py-3.5 px-4 rounded-2xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            <span>Cancel Session Request</span>
          </button>
        )}

        {currentStatus === 'cancelled' && (
          <button
            type="button"
            onClick={onBack}
            className="touch-target w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-2xl transition-all active:scale-[0.99]"
          >
            Return to Sessions
          </button>
        )}
      </div>

      {/* ================= CANCEL REQUEST CONFIRMATION MODAL ================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center animate-scale-up">
            {/* Warning Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>

            {/* Modal Heading & Text */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Cancel Session Request?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to cancel this session request with{' '}
                <span className="font-bold text-slate-800">{mentor.name}</span>? This request will be withdrawn and removed from the mentor's queue.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="touch-target w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-2xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                <span>Yes, Cancel Request</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="touch-target w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 rounded-2xl transition-all active:scale-[0.99]"
              >
                Keep Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
