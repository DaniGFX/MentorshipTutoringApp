import React, { useState } from 'react';
import StudentProfilePreview from './StudentProfilePreview.jsx';

/**
 * Mentor — My Students Screen (Tab 2: StudentsRosterScreen)
 * Conforms to Section 4 of docs/mentor_flow_spec.md & Part 3 of docs/mobile_contents_guide.md.
 * Features:
 * - Student Directory with real-time search and filter chips (All, Active, Upcoming, Completed).
 * - Student cards with completed sessions, last session timestamps, and status pills.
 * - Detailed Student Profile Preview (Bio, Learning Interests chips, Mentoring History, Upcoming Booking).
 * - Direct messaging integration and empty state linking to session requests.
 * - Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function StudentsRosterScreen({
  sessions = [],
  onMessageStudent,
  onViewSession,
  onViewRequests,
  onViewStudentProfile
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'upcoming' | 'completed'
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Derive mentee students dynamically from sessions
  const studentsMap = new Map();
  (sessions || []).forEach((s) => {
    const studentId = s.student?.id || s.studentName;
    if (studentId) {
      const isConfirmed = s.status === 'confirmed';
      const isCompleted = s.status === 'completed';
      const existing = studentsMap.get(studentId) || {
        id: studentId,
        name: s.student?.name || s.studentName || 'Student Learner',
        course: s.student?.course || s.course || 'College Student',
        yearLevel: s.student?.yearLevel || s.yearLevel || '',
        school: s.student?.school || 'University',
        status: isCompleted ? 'completed' : 'active',
        hasUpcoming: false,
        upcomingSession: null,
        sessionsCount: 0,
        totalHours: '0.0 hrs',
        lastSession: s.date || 'Recent',
        bio: s.student?.bio || 'Academic mentee focused on subject mastery and guided peer learning.',
        interests: [s.topic || 'Academic Mentoring'],
        initials: s.student?.initials || s.initials || 'SL',
        avatarBg: s.student?.avatarBg || s.avatarBg || 'bg-sky-600'
      };

      if (isConfirmed && !existing.hasUpcoming) {
        existing.hasUpcoming = true;
        existing.upcomingSession = {
          id: s.id,
          topic: s.topic,
          date: s.date,
          time: s.time,
          format: s.format
        };
      }
      if (isCompleted) {
        existing.sessionsCount += 1;
      }
      studentsMap.set(studentId, existing);
    }
  });
  const studentsList = Array.from(studentsMap.values());

  // Counts
  const allCount = studentsList.length;
  const activeCount = studentsList.filter((s) => s.status === 'active').length;
  const upcomingCount = studentsList.filter((s) => s.hasUpcoming).length;
  const completedCount = studentsList.filter((s) => s.status === 'completed').length;

  // Filtered List
  const filteredStudents = studentsList.filter((student) => {
    // Filter chip logic
    if (activeFilter === 'active' && student.status !== 'active') return false;
    if (activeFilter === 'upcoming' && !student.hasUpcoming) return false;
    if (activeFilter === 'completed' && student.status !== 'completed') return false;

    // Search query logic
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = student.name.toLowerCase();
      const course = student.course.toLowerCase();
      const year = student.yearLevel.toLowerCase();
      const bio = student.bio.toLowerCase();
      return name.includes(q) || course.includes(q) || year.includes(q) || bio.includes(q);
    }
    return true;
  });

  // =========================================================================
  // SUB-VIEW: Student Profile Preview (Fallback if viewed locally)
  // =========================================================================
  if (selectedStudent) {
    return (
      <StudentProfilePreview
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
        onMessageStudent={(s) => onMessageStudent && onMessageStudent(s)}
        onViewSession={(sess) => onViewSession && onViewSession(sess)}
      />
    );
  }

  // =========================================================================
  // MAIN VIEW: Student Roster Directory
  // =========================================================================
  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* 1. Header with Title & Student Count */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              My Students
            </h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
              {allCount} Students
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage and connect with your mentee students.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewRequests}
          className="touch-target inline-flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 active:scale-95 transition-all shadow-2xs"
          title="Review pending student requests"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>Requests</span>
        </button>
      </div>

      {/* 2. Real-time Search Input */}
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
          placeholder="Search by student name, course, or program..."
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

      {/* 3. Horizontal Filter Segment Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {[
          { key: 'all', label: 'All', count: allCount },
          { key: 'active', label: 'Active', count: activeCount },
          { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
          { key: 'completed', label: 'Completed', count: completedCount }
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`touch-target text-xs font-bold px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-sky-700/90 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Student Roster List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {searchQuery ? 'No matching students' : 'No Students Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? `No students found matching "${searchQuery}".`
                  : 'Students who book and complete mentoring sessions with you will appear here.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onViewRequests}
              className="touch-target inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>View Session Requests</span>
            </button>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 p-4 shadow-xs space-y-3 transition-all"
            >
              {/* Card Top: Avatar, Name & Status Pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl ${student.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                  >
                    {student.initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{student.name}</h3>
                    <p className="text-xs text-sky-700 font-semibold">{student.course}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{student.yearLevel}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                    student.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {student.status === 'active' ? 'Active' : 'Completed'}
                </span>
              </div>

              {/* Stats Block: Completed Sessions & Last Call */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span>{student.sessionsCount} Mentoring Sessions</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Last: {student.lastSession}
                </div>
              </div>

              {/* Upcoming Session Notice (if any) */}
              {student.hasUpcoming && student.upcomingSession && (
                <div className="text-[11px] bg-sky-50/70 border border-sky-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-sky-900">
                  <span className="font-semibold truncate mr-2">
                    Upcoming: {student.upcomingSession.date} ({student.upcomingSession.format})
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded-md">
                    Live soon
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onViewStudentProfile) {
                      onViewStudentProfile(student);
                    } else {
                      setSelectedStudent(student);
                    }
                  }}
                  className="touch-target flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  </svg>
                  <span>View Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMessageStudent && onMessageStudent(student)}
                  className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.99] shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.75-.75c0-.66.195-1.294.553-1.838C3.805 16.89 3 14.567 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                  <span>Message</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
