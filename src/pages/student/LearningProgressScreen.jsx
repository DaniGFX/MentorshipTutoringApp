import React from 'react';

/**
 * Learning Progress Screen
 * Follows Section 8.1 of docs/student_flow_spec.md & docs/mobile_contents_guide.md.
 * Displays student learning metrics, progress milestone bar, skill percentages, and recent activities.
 * Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function LearningProgressScreen({
  sessions = [],
  currentUserProfile,
  onBack,
  onViewSessionHistory
}) {
  const completedSessions = (sessions || []).filter((s) => s.status === 'completed');
  const totalCompleted = completedSessions.length;
  const totalHours = completedSessions.reduce(
    (acc, s) => acc + (parseFloat(s.duration_hours || s.durationHours) || 1),
    0
  );

  const distinctTopics = Array.from(
    new Set(completedSessions.map((s) => s.topic).filter(Boolean))
  );

  const studentFirstName = currentUserProfile?.full_name?.trim()?.split(' ')[0] || 'Learner';
  const progressPercent = Math.min(100, Math.round((totalCompleted / 10) * 100));

  const stats = [
    {
      id: 'stat-1',
      label: 'Sessions Completed',
      value: String(totalCompleted),
      unit: 'Sessions',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
      borderColor: 'border-sky-100',
      icon: (
        <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      )
    },
    {
      id: 'stat-2',
      label: 'Hours Mentored',
      value: totalHours.toFixed(1),
      unit: 'Hours',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-100',
      icon: (
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      )
    },
    {
      id: 'stat-3',
      label: 'Skills Explored',
      value: String(distinctTopics.length),
      unit: 'Topics',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-100',
      icon: (
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
        </svg>
      )
    },
    {
      id: 'stat-4',
      label: 'Curriculum Progress',
      value: `${progressPercent}%`,
      unit: 'Term Goal',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-100',
      icon: (
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="touch-target -ml-1 p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Back to Profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Learning Progress
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Your academic mentorship and skill milestones
            </p>
          </div>
        </div>
      </div>

      {/* 2. Overview 4-Stat Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border ${item.borderColor} p-3.5 shadow-2xs space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
              <div className={`w-7 h-7 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                {item.icon}
              </div>
            </div>
            <div>
              <span className={`text-2xl font-extrabold ${item.textColor} tracking-tight`}>
                {item.value}
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.unit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Encouragement Milestone Card */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-600 rounded-2xl p-4 text-white shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold tracking-tight">Keep Growing, {studentFirstName}!</h3>
            <p className="text-xs text-sky-100 leading-relaxed font-normal">
              {totalCompleted > 0
                ? `You have completed ${totalCompleted} mentoring sessions. Keep learning and practicing to reach your semester learning goals.`
                : 'Book your first session with a peer mentor to start building verifiable academic milestones.'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-sky-100">
            <span>Overall Curriculum Milestone</span>
            <span className="text-white font-extrabold">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-sky-950/30 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-white rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Recent Learning Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Learning Sessions
          </h3>
          <button
            type="button"
            onClick={onViewSessionHistory}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>See All</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {completedSessions.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center border border-slate-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-700">No Completed Sessions Yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Completed sessions will show here with your mentor details, duration, and ratings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {completedSessions.slice(0, 5).map((act) => (
              <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {act.topic || act.session_topic || 'Academic Mentoring'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Mentor: <span className="text-sky-700 font-semibold">{act.mentor?.name || 'Peer Mentor'}</span> · {act.date}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                  {act.duration || '60 min'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Primary Action CTA */}
      <button
        type="button"
        onClick={onViewSessionHistory}
        className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-3 rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <span>View Full Session History</span>
      </button>
    </div>
  );
}
