import React, { useState, useEffect, useRef } from 'react';
import { sessionService } from '../../services/sessionService.js';
import { supabase } from '../../services/supabaseClient.js';

export default function VirtualClassroomScreen({
  session,
  userRole = 'student',
  onLeave,
  onCompleteSession,
}) {
  const isMentor = userRole === 'mentor';

  // Session details fallback
  const activeSession = session || {
    id: 'session-conf-102',
    topic: 'Binary Search Trees, Traversal Algorithms & Balancing',
    mentor: {
      id: 'mentor-1',
      name: 'Alex Santos',
      specialization: 'Web Development Mentor',
      initials: 'AS',
      avatarBg: 'bg-sky-600',
    },
    student: {
      id: 'student-1',
      name: 'Daniela Gonzales',
      program: 'BS Computer Science — 2nd Year',
      initials: 'DG',
      avatarBg: 'bg-indigo-600',
    },
    date: '2026-09-22',
    time: '6:00 PM – 7:00 PM',
  };

  const mentor = activeSession.mentor || {
    id: 'mentor-1',
    name: 'Alex Santos',
    specialization: 'Web Development Mentor',
    initials: 'AS',
    avatarBg: 'bg-sky-600',
  };

  const student = activeSession.student || {
    id: 'student-1',
    name: 'Daniela Gonzales',
    program: 'BS Computer Science — 2nd Year',
    initials: 'DG',
    avatarBg: 'bg-indigo-600',
  };

  // Peer (main theater stage) vs Self (PiP overlay)
  const peer = isMentor ? student : mentor;
  const self = isMentor ? mentor : student;

  // Classroom States
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isMentorCameraOff, setIsMentorCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null); // null | 'chat' | 'notes'
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);

  // Live Timer Stopwatch (starts at 24 mins 18 secs)
  const [elapsedSeconds, setElapsedSeconds] = useState(1458);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatStopwatch = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // In-Meeting Chat State
  const [chatMessages, setChatMessages] = useState(
    isMentor
      ? [
        {
          id: 1,
          sender: mentor.name,
          initials: mentor.initials || 'AS',
          isMe: true,
          text: `Hi ${student.name.split(' ')[0]}! Welcome to our virtual classroom. Can you hear me clearly?`,
          time: '6:01 PM',
        },
        {
          id: 2,
          sender: student.name,
          initials: student.initials || 'DG',
          isMe: false,
          text: `Yes, Kuya ${mentor.name.split(' ')[0]}! Audio and video are crystal clear. Ready for our session!`,
          time: '6:02 PM',
        },
        {
          id: 3,
          sender: mentor.name,
          initials: mentor.initials || 'AS',
          isMe: true,
          text: "Awesome. I'm sharing my screen with our starter code repo: github.com/mentorlinks/practice",
          time: '6:03 PM',
        },
      ]
      : [
        {
          id: 1,
          sender: mentor.name,
          initials: mentor.initials || 'MC',
          isMe: false,
          text: `Hi ${student.name.split(' ')[0]}! Welcome to our virtual classroom. Can you hear me clearly?`,
          time: '6:01 PM',
        },
        {
          id: 2,
          sender: 'You',
          initials: student.initials || 'DG',
          isMe: true,
          text: `Yes, ${mentor.name.split(' ')[0]}! Audio and video are crystal clear. Ready!`,
          time: '6:02 PM',
        },
        {
          id: 3,
          sender: mentor.name,
          initials: mentor.initials || 'MC',
          isMe: false,
          text: "Awesome. I'm sharing my screen with our starter code repo: github.com/mentorlinks/practice",
          time: '6:03 PM',
        },
      ]
  );
  const [inputMessage, setInputMessage] = useState('');
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (activeDrawer === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeDrawer, chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'You',
      initials: self.initials || 'ME',
      isMe: true,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
  };

  // Live Study Notes State
  const [studyNotes, setStudyNotes] = useState(
    `• BST Key Invariant: Left subtree keys < Parent < Right subtree keys.
• In-Order Traversal (Left -> Root -> Right) generates sorted output.
• Search Time Complexity:
  - Average Case: O(log n)
  - Worst Case (Unbalanced): O(n)
• Balancing Algorithms: AVL tree rotations and Red-Black properties.`
  );

  const handleSaveNotes = () => {
    setNotesSavedToast(true);
    setTimeout(() => setNotesSavedToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col max-w-md mx-auto overflow-hidden animate-fade-in">
      {/* 1. Header Toolbar */}
      <header className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Live Indicator Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LIVE · {formatStopwatch(elapsedSeconds)}</span>
          </div>

          <div className="truncate">
            <h1 className="text-xs font-bold text-slate-100 truncate">
              {activeSession.topic}
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              {student.name} & {mentor.name} · 2 Participants
            </p>
          </div>
        </div>

        {/* Leave Call Trigger */}
        <button
          onClick={() => setShowLeaveModal(true)}
          className="touch-target inline-flex items-center gap-1 bg-rose-600/90 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 shrink-0"
          aria-label="Leave Classroom"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <span>Leave</span>
        </button>
      </header>

      {/* 2. Main Video Stage (Theater Mode) */}
      <main className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-3 overflow-hidden">
        {/* Main Peer Stream Container */}
        <div className="w-full h-full rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
          {/* Screen Share Mode */}
          {isScreenSharing ? (
            <div className="w-full h-full p-4 flex flex-col bg-slate-900 text-slate-200 font-mono text-[11px] select-none">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-400 font-sans text-xs ml-1">BinarySearchTree.js</span>
                </div>
                <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  Screen Shared by {isMentor ? 'You (Mentor)' : mentor.name.split(' ')[0]}
                </span>
              </div>

              <div className="flex-1 overflow-auto space-y-1 text-slate-300 leading-relaxed font-mono">
                <p><span className="text-purple-400">class</span> <span className="text-yellow-300">BSTNode</span> &#123;</p>
                <p className="pl-4"><span className="text-sky-400">constructor</span>(value) &#123;</p>
                <p className="pl-8"><span className="text-rose-400">this</span>.val = value;</p>
                <p className="pl-8"><span className="text-rose-400">this</span>.left = <span className="text-slate-500">null</span>;</p>
                <p className="pl-8"><span className="text-rose-400">this</span>.right = <span className="text-slate-500">null</span>;</p>
                <p className="pl-4">&#125;</p>
                <p>&#125;</p>
                <p className="text-slate-500 pt-2">&#47;&#47; Traversal algorithm demo</p>
                <p><span className="text-sky-400">function</span> <span className="text-yellow-300">inOrderTraverse</span>(root) &#123;</p>
                <p className="pl-4"><span className="text-purple-400">if</span> (!root) <span className="text-purple-400">return</span>;</p>
                <p className="pl-4">inOrderTraverse(root.left);</p>
                <p className="pl-4">console.<span className="text-sky-400">log</span>(root.val);</p>
                <p className="pl-4">inOrderTraverse(root.right);</p>
                <p>&#125;</p>
              </div>
            </div>
          ) : isMentorCameraOff ? (
            /* Peer Camera Paused State */
            <div className="text-center space-y-3 animate-fade-in">
              <div className={`w-20 h-20 rounded-full ${peer.avatarBg || 'bg-sky-600'} text-white font-bold text-2xl mx-auto flex items-center justify-center border-4 border-slate-700 shadow-lg`}>
                {peer.initials || 'P'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">{peer.name}</p>
                <p className="text-xs text-slate-400 font-medium">Camera Paused</p>
              </div>
            </div>
          ) : (
            /* Active Peer Stream */
            <div className="relative w-full h-full flex items-center justify-center bg-radial from-slate-800 to-slate-900">
              {/* Simulated Video Feed Graphic */}
              <div className="text-center space-y-4">
                {/* Active Speaker Animated Rings */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping"></div>
                  <div className="absolute -inset-2 rounded-full border-2 border-sky-400/40 animate-pulse"></div>
                  <div className={`w-20 h-20 rounded-full ${peer.avatarBg || 'bg-emerald-600'} text-white font-bold text-2xl flex items-center justify-center shadow-xl border-2 border-emerald-400`}>
                    {peer.initials || 'P'}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1.5">
                    <span>{peer.name}</span>
                    <svg className="w-3.5 h-3.5 text-sky-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </p>
                  <p className="text-xs text-sky-300 font-medium">Speaking...</p>
                </div>
              </div>
            </div>
          )}

          {/* Peer Nameplate Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-semibold text-slate-200">
              {peer.name} ({isMentor ? 'Student' : 'Mentor'})
            </span>
            <svg className="w-3 h-3 text-emerald-400 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
        </div>

        {/* 3. Floating Picture-in-Picture (PiP) Stream (Self) */}
        <div className="absolute bottom-6 right-6 w-28 h-36 rounded-2xl bg-slate-800/95 border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col items-center justify-center transition-all z-20">
          {isCameraOff ? (
            <div className="text-center p-2">
              <div className={`w-10 h-10 rounded-full ${self.avatarBg || 'bg-sky-600'} text-white font-bold text-xs mx-auto flex items-center justify-center shadow-xs`}>
                {self.initials || 'ME'}
              </div>
              <p className="text-[10px] font-bold text-slate-300 mt-1">Camera Off</p>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center p-2 relative">
              <div className={`w-12 h-12 rounded-full ${self.avatarBg || 'bg-sky-600'} text-white font-bold text-sm flex items-center justify-center shadow-md`}>
                {self.initials || 'ME'}
              </div>
              <p className="text-[10px] font-bold text-slate-200 mt-1">You ({isMentor ? 'Mentor' : 'Student'})</p>
            </div>
          )}

          {/* Self Mic Status Pill */}
          <div className="absolute bottom-1.5 left-1.5 bg-slate-950/80 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-slate-300 flex items-center gap-1">
            {isMicMuted ? (
              <svg className="w-2.5 h-2.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.364 18.364-1.414 1.414M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Zm-8.485-8.485 14.142 14.142" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            )}
            <span>{self.name.split(' ')[0]}</span>
          </div>
        </div>
      </main>

      {/* 4. Bottom Floating Meeting Controls Dock */}
      <footer className="bg-slate-900/95 backdrop-blur-md px-3 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center justify-around">
          {/* Mic Toggle */}
          <button
            onClick={() => setIsMicMuted(!isMicMuted)}
            className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 ${isMicMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMicMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3ZM3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            )}
            <span className="text-[10px] font-medium mt-1">{isMicMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Camera Toggle */}
          <button
            onClick={() => setIsCameraOff(!isCameraOff)}
            className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 ${isCameraOff
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            aria-label={isCameraOff ? 'Turn video on' : 'Turn video off'}
          >
            {isCameraOff ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25ZM3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            )}
            <span className="text-[10px] font-medium mt-1">{isCameraOff ? 'Start Video' : 'Stop Video'}</span>
          </button>

          {/* Meeting Chat Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'chat' ? null : 'chat')}
            className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 relative ${activeDrawer === 'chat'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            aria-label="Open chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.943l.878-2.635C4.249 15.918 3 14.07 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            <span className="text-[10px] font-medium mt-1">Chat</span>
            {activeDrawer !== 'chat' && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-400"></span>
            )}
          </button>

          {/* Session Notes Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'notes' ? null : 'notes')}
            className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 ${activeDrawer === 'notes'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            aria-label="Open session notes"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            <span className="text-[10px] font-medium mt-1">Notes</span>
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 ${isScreenSharing
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            aria-label="Toggle screen share presentation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
            </svg>
            <span className="text-[10px] font-medium mt-1">{isScreenSharing ? 'Sharing' : 'Share'}</span>
          </button>
        </div>
      </footer>

      {/* 5. In-Meeting Chat Drawer (Slide-up Panel) */}
      {activeDrawer === 'chat' && (
        <div className="absolute inset-x-0 bottom-0 top-16 z-30 bg-slate-900 border-t border-slate-700 flex flex-col shadow-2xl animate-slide-up">
          {/* Drawer Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.943l.878-2.635C4.249 15.918 3 14.07 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              <h2 className="text-xs font-bold text-slate-100">Meeting Chat</h2>
            </div>
            <button
              onClick={() => setActiveDrawer(null)}
              className="touch-target text-slate-400 hover:text-white p-1"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Stream */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <span className="font-semibold text-slate-300">{msg.sender}</span>
                  <span>·</span>
                  <span>{msg.time}</span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[80%] text-xs leading-relaxed ${msg.isMe
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2 bg-slate-900">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type message to mentor..."
              className="flex-1 bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500 placeholder-slate-500"
            />
            <button
              type="submit"
              className="touch-target bg-sky-600 hover:bg-sky-700 text-white p-2.5 rounded-xl transition-all active:scale-95"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* 6. Live Session Notes Pad Drawer */}
      {activeDrawer === 'notes' && (
        <div className="absolute inset-x-0 bottom-0 top-16 z-30 bg-slate-900 border-t border-slate-700 flex flex-col shadow-2xl animate-slide-up">
          {/* Notes Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
              </svg>
              <div>
                <h2 className="text-xs font-bold text-slate-100">Live Session Notes</h2>
                <p className="text-[10px] text-slate-400">Collaborative study pointers & takeaways</p>
              </div>
            </div>
            <button
              onClick={() => setActiveDrawer(null)}
              className="touch-target text-slate-400 hover:text-white p-1"
              aria-label="Close notes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Notes Editor Body */}
          <div className="flex-1 p-4 flex flex-col space-y-3">
            <textarea
              value={studyNotes}
              onChange={(e) => setStudyNotes(e.target.value)}
              rows={12}
              className="w-full flex-1 bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-sky-500 resize-none shadow-inner"
              placeholder="Record your study pointers, formulas, and questions here..."
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                Auto-saved into your student profile history.
              </span>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="touch-target bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Saved Feedback Banner */}
      {notesSavedToast && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span>Notes Saved Successfully!</span>
        </div>
      )}

      {/* 7. Leave Session Confirmation Dialog */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-800 text-center animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Leave Mentoring Session?</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to leave the virtual classroom? You can rejoin anytime while this session is still in progress.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setShowLeaveModal(false);
                  try {
                    const { data: authData } = await supabase.auth.getUser();
                    const mentorId = isMentor ? authData?.user?.id : (activeSession.mentor?.id || activeSession.tutor_id);
                    if (activeSession.id && mentorId) {
                      await sessionService.completeSession(activeSession.id, mentorId, studyNotes);
                    }
                  } catch (err) {
                    console.error('[VirtualClassroomScreen] Error completing session:', err);
                  }
                  const completedData = {
                    ...activeSession,
                    status: 'completed',
                    studyNotes: studyNotes || activeSession.studyNotes,
                  };
                  if (onCompleteSession) onCompleteSession(completedData);
                  else if (onLeave) onLeave();
                }}
                className="touch-target w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-2xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>
                  {isMentor
                    ? 'End Session & Settle Payment'
                    : 'End & View Session Summary'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  if (onLeave) onLeave();
                }}
                className="touch-target w-full bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-2xl shadow-sm transition-all active:scale-[0.99]"
              >
                Exit Classroom
              </button>

              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="touch-target w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold py-2.5 rounded-2xl transition-all active:scale-[0.99]"
              >
                Stay in Classroom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
