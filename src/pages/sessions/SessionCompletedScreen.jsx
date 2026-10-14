import React, { useState } from 'react';
import { reviewService } from '../../services/reviewService.js';
import { supabase } from '../../services/supabaseClient.js';

export default function SessionCompletedScreen({
  session,
  onBack,
  onMessageMentor,
  onViewSessionsHistory,
  onReturnHome
}) {
  // Fallback defaults
  const activeSession = session || {
    id: 'session-comp-103',
    status: 'completed',
    mentor: {
      id: 'mentor-2',
      name: 'Maria Clara',
      specialization: 'Data Structures & Algorithms',
      rating: 4.8,
      sessionsCount: 39,
      isVerified: true,
      rate: '₱250.00 / hr',
      avatarBg: 'bg-emerald-600',
      initials: 'MC'
    },
    topic: 'Binary Search Trees, Traversal Algorithms & Balancing',
    date: '2026-09-22',
    time: '6:00 PM – 7:00 PM',
    duration: '60 min',
    format: 'Online (Virtual Classroom)',
    totalFee: 250,
    downPayment: 125,
    finalPayment: 125,
    paymentMethod: 'GCash',
    paymentSettled: true,
    studyNotes: `• BST Invariant: Left subtree keys < Parent < Right subtree keys.
• In-Order Traversal (L -> Root -> R) produces sorted keys.
• Pre-Order Traversal is useful for serializing and cloning trees.
• Balancing (AVL / Red-Black) guarantees O(log n) search/insert/delete operations.
• Assignment: Implement in-order traversal and solve 2 LeetCode BST questions for next week.`
  };

  const mentor = activeSession.mentor;

  // Rating and review state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['Clear Explanations', 'Hands-On Code']);
  const [reviewComment, setReviewComment] = useState(
    'Maria was exceptional! She clearly explained BST tree pointer balancing with live interactive code examples.'
  );
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [isNotesCopied, setIsNotesCopied] = useState(false);

  const availableTags = [
    'Clear Explanations',
    'Patient & Encouraging',
    'Hands-On Code',
    'Punctual & Prepared',
    'Great Problem Solver'
  ];

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsReviewSubmitted(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const studentId = authData?.user?.id;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const targetSessionId = uuidRegex.test(activeSession.id) ? activeSession.id : null;
      const targetTutorId = uuidRegex.test(mentor.id) ? mentor.id : '6349edad-42be-4021-841d-e31684711397';

      if (studentId && targetSessionId && targetTutorId) {
        const fullComment = selectedTags.length > 0
          ? `[Tags: ${selectedTags.join(', ')}] ${reviewComment}`
          : reviewComment;

        await reviewService.createReview({
          sessionId: targetSessionId,
          studentId,
          tutorId: targetTutorId,
          rating,
          comment: fullComment,
        });
      }
    } catch (err) {
      console.error('[SessionCompletedScreen] Submit review error:', err);
    }
  };

  const handleCopyNotes = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeSession.studyNotes || '');
    }
    setIsNotesCopied(true);
    setTimeout(() => setIsNotesCopied(false), 2500);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* 1. Top Navigation Bar */}
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

        <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
          {activeSession.id ? `#${activeSession.id.slice(-6).toUpperCase()}` : '#COMP-103'}
        </span>
      </div>

      {/* 2. Celebratory Success Banner */}
      <div className="bg-gradient-to-br from-sky-600 via-sky-500 to-emerald-500 rounded-3xl p-5 text-white shadow-md relative overflow-hidden space-y-3">
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 -top-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white">
            <svg className="w-3.5 h-3.5 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span>Session Completed</span>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Great Job, Daniela!
            </h1>
            <p className="text-xs text-sky-100 font-medium mt-0.5 leading-relaxed">
              Your 60-minute session with <span className="font-bold text-white">{mentor.name}</span> has concluded successfully.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Session Summary Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Session Overview
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            COMPLETED
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full ${mentor.avatarBg || 'bg-emerald-600'} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
          >
            {mentor.initials || 'MC'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {mentor.name}
              </h3>
              {mentor.isVerified && (
                <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified Mentor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">{mentor.specialization}</p>
          </div>
        </div>

        {/* Schedule & Parameters Grid */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Date & Time</span>
            <span className="font-bold text-slate-800 text-xs">Sept 22 · 6:00 PM</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Duration</span>
            <span className="font-bold text-slate-800 text-xs">{activeSession.duration}</span>
          </div>

          <div className="col-span-2 pt-1 border-t border-slate-200/60">
            <span className="text-[10px] text-slate-400 font-semibold block">Topic Studied</span>
            <span className="font-bold text-slate-800 text-xs leading-snug">{activeSession.topic}</span>
          </div>
        </div>
      </div>

      {/* 4. Mentor Study Notes & Key Takeaways Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            <span>Mentor Study Notes & Takeaways</span>
          </div>

          <button
            type="button"
            onClick={handleCopyNotes}
            className="touch-target inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 active:scale-95"
          >
            {isNotesCopied ? (
              <span className="text-emerald-600">Copied!</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
                <span>Copy Notes</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-line">
          {activeSession.studyNotes}
        </div>
      </div>

      {/* 5. Interactive Rate & Review Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rate Your Experience
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Help your mentor and fellow students with verifiable feedback.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            5-Star Peer Review
          </span>
        </div>

        {isReviewSubmitted ? (
          /* Submitted State */
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center space-y-2 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-emerald-950">Review Submitted!</h3>
            <p className="text-xs text-emerald-800">
              Thank you for rating {mentor.name}. Your verified review will appear on their profile.
            </p>
            <div className="flex items-center justify-center gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              ))}
            </div>
          </div>
        ) : (
          /* Review Form */
          <form onSubmit={handleSubmitReview} className="space-y-3">
            {/* Interactive Stars Row */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="touch-target p-1 text-slate-300 hover:scale-110 active:scale-95 transition-all"
                    aria-label={`Rate ${star} star`}
                  >
                    <svg
                      className={`w-7 h-7 transition-colors ${
                        isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
                      }`}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Compliment Tags Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700">What went well?</span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`touch-target text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review Comment Textarea */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700">Detailed Feedback</span>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
                placeholder="Tell other students how Maria helped you understand this topic..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Submit Verified Review</span>
            </button>
          </form>
        )}
      </div>

      {/* 6. Payment Receipt & Settlement Box */}
      <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div className="space-y-0.5 text-xs text-emerald-950 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              Direct Payment Settled
            </h3>
            <span className="font-bold text-emerald-700">₱{(activeSession.totalFee || 250).toFixed(2)} Paid</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
            50% down payment (₱{(activeSession.downPayment || 125).toFixed(2)}) and remaining balance (₱{(activeSession.finalPayment || 125).toFixed(2)}) fully transferred to {mentor.name}.
          </p>
        </div>
      </div>

      {/* 7. Next Actions Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onViewSessionsHistory}
          className="touch-target w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-2xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span>View Session History</span>
        </button>

        <button
          type="button"
          onClick={onMessageMentor}
          className="touch-target w-full bg-white hover:bg-slate-50 text-sky-700 border border-slate-200 font-semibold text-xs py-2.5 rounded-2xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.943l.878-2.635C4.249 15.918 3 14.07 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          <span>Message {mentor.name.split(' ')[0]}</span>
        </button>

        <button
          type="button"
          onClick={onReturnHome}
          className="touch-target w-full text-slate-500 hover:text-slate-800 font-medium text-xs py-2 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
