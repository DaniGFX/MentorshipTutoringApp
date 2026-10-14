import React, { useState, useRef, useEffect } from 'react';
import { messageService } from '../../services/messageService.js';
import { supabase } from '../../services/supabaseClient.js';

/**
 * Mentor Chat Conversation Screen (Tab 3 Sub-View)
 * Follows the clean, organized layout of ChatConversationScreen.jsx.
 * Features:
 * - Real-time Supabase WebSocket message exchange with auto-scroll and fallback simulation.
 * - Embedded Upcoming Session Shortcut Card with direct navigation to session details.
 * - Quick mentor response prompt chips.
 * - Direct shortcut to view student profile.
 * - Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function MentorChatScreen({
  student,
  session,
  onBack,
  onViewSession,
  onViewStudentProfile,
}) {
  const targetStudent = student || {
    id: 'std-1',
    name: 'Daniela Gonzales',
    course: 'BS Information Technology · 3rd Year',
    school: 'Bestlink College of the Philippines',
    initials: 'DG',
    avatarBg: 'bg-sky-600',
    isOnline: true,
    isVerified: true,
  };

  const upcomingSession = session || {
    id: 'sess-101',
    topic: 'JavaScript Functions, parameters, and return values',
    date: 'Friday, Sept. 25',
    time: '7:00 PM – 8:00 PM',
    format: 'Online Room',
    status: 'confirmed',
  };

  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'student',
      text: 'Hi Alex! Good day. I have a quick question about our upcoming session this Friday.',
      time: '6:30 PM',
    },
    {
      id: 'msg-2',
      sender: 'mentor',
      text: 'Hello Daniela! Sure, ask away. How is your preparation going with JavaScript functions?',
      time: '6:34 PM',
    },
    {
      id: 'msg-3',
      sender: 'student',
      text: "I was practicing callbacks and return values, but I still get confused when passing functions as arguments. Should I prepare specific sample exercises?",
      time: '6:38 PM',
    },
    {
      id: 'msg-4',
      sender: 'mentor',
      text: "That's completely normal! Yes, please have your VS Code and local files open. We'll start with standard functions, transition to arrow syntax, and then build a small callback demonstration together.",
      time: '6:42 PM',
    },
    {
      id: 'msg-5',
      sender: 'student',
      text: "Thank you so much, Alex! That sounds super helpful. See you on Friday at 7:00 PM!",
      time: '6:43 PM',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Connect to Supabase Conversation & Realtime Channel
  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    async function initChat() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) return;

        const uid = authData.user.id;
        if (isMounted) setCurrentUserId(uid);

        // Partner student ID (fallback to Daniela Gonzales seed ID if not UUID)
        const partnerId = targetStudent?.id || '11111111-1111-1111-1111-111111111111';

        const { data: conv } = await messageService.getOrCreateConversation(partnerId, uid);
        if (!isMounted || !conv) return;

        setConversationId(conv.id);

        // Fetch past messages from Supabase
        const { data: dbMessages } = await messageService.getMessages(conv.id);
        if (isMounted && dbMessages && dbMessages.length > 0) {
          const mapped = dbMessages.map((m) => ({
            id: m.id,
            sender: m.sender_id === uid ? 'mentor' : 'student',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(mapped);
        }

        // Subscribe to live incoming messages
        unsubscribe = messageService.subscribeToMessages(conv.id, (incoming) => {
          if (!isMounted) return;
          if (incoming.sender_id !== uid) {
            const incomingFormatted = {
              id: incoming.id,
              sender: 'student',
              text: incoming.content,
              time: new Date(incoming.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, incomingFormatted]);
          }
        });
      } catch (err) {
        console.error('[MentorChatScreen] Error initializing chat:', err);
      }
    }

    initChat();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [targetStudent?.id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'mentor',
      text,
      time: formattedTime,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Persist to Supabase if conversation is established
    if (conversationId && currentUserId) {
      try {
        await messageService.sendMessage({
          conversationId,
          senderId: currentUserId,
          content: text,
        });
      } catch (err) {
        console.error('[MentorChatScreen] Send error:', err);
      }
    } else {
      // Simulate fallback student reply after a short delay if offline/mock thread
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const replies = [
            "Got it! I will review the notes and have the GitHub repository ready.",
            "Thank you, Alex! That makes a lot more sense now.",
            "Awesome, looking forward to the hands-on walkthrough!",
            "Understood! I'll prepare my questions beforehand.",
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}-student`,
              sender: 'student',
              text: randomReply,
              time: replyTime,
            },
          ]);
        }, 1400);
      }, 800);
    }
  };

  const quickResponses = [
    'Sounds great, see you then!',
    'Please have your code editor ready.',
    "Let's review the parameters first.",
    'Push your latest code to GitHub before we start.',
  ];

  return (
    <div className="fixed inset-0 z-40 max-w-md mx-auto bg-slate-50 flex flex-col overflow-hidden animate-fade-in">
      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="absolute top-16 inset-x-4 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Fixed Header Toolbar (Steady Top Bar) */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 shadow-2xs flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="touch-target -ml-1.5 p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Back to conversations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>

          <div
            onClick={() => onViewStudentProfile && onViewStudentProfile(targetStudent)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full ${targetStudent?.avatarBg || 'bg-sky-600'} text-white font-bold text-xs flex items-center justify-center shadow-xs`}
              >
                {targetStudent?.initials || 'DG'}
              </div>
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400"
                title="Active now"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  {targetStudent?.name || 'Daniela Gonzales'}
                </h2>
                {targetStudent?.isVerified && (
                  <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Mentee · Active now</span>
              </p>
            </div>
          </div>
        </div>

        {/* View Profile Action */}
        <button
          type="button"
          onClick={() => onViewStudentProfile && onViewStudentProfile(targetStudent)}
          className="touch-target text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 active:scale-95 transition-all"
        >
          Profile
        </button>
      </header>

      {/* 2. Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain">
        {/* Date Divider */}
        <div className="flex items-center justify-center my-1">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-3 py-0.5 rounded-full uppercase tracking-wider">
            Today
          </span>
        </div>

        {/* 3. Embedded Session Shortcut Card */}
        <div className="bg-gradient-to-r from-sky-50 via-white to-cyan-50 border border-sky-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
              <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span>Upcoming Mentoring Session</span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              CONFIRMED
            </span>
          </div>

          <div className="text-xs text-slate-700">
            <p className="font-bold text-slate-900">
              {upcomingSession.topic}
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {upcomingSession.date} · {upcomingSession.time} ({upcomingSession.format})
            </p>
          </div>

          <div className="pt-0.5 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onViewSession && onViewSession(upcomingSession)}
              className="touch-target inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-white border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-50 shadow-2xs active:scale-95 transition-all"
            >
              <span>View Session</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Message Bubbles */}
        {messages.map((msg) => {
          const isMentor = msg.sender === 'mentor';

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMentor ? 'justify-end' : 'justify-start'}`}
            >
              {!isMentor && (
                <div
                  className={`w-7 h-7 rounded-full ${targetStudent?.avatarBg || 'bg-sky-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0 mb-1 shadow-2xs`}
                >
                  {targetStudent?.initials || 'DG'}
                </div>
              )}

              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                  isMentor
                    ? 'bg-sky-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                }`}
              >
                <p>{msg.text}</p>
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isMentor ? 'text-sky-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.time}</span>
                  {isMentor && (
                    <svg className="w-3 h-3 text-sky-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full ${targetStudent?.avatarBg || 'bg-sky-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs`}
            >
              {targetStudent?.initials || 'DG'}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Suggestion Prompt Chips */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/60 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
        {quickResponses.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="touch-target text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:border-sky-300 hover:text-sky-700 px-3 py-1.5 rounded-full shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 5. Input Toolbar */}
      <div className="bg-white border-t border-slate-200 px-3 py-2.5 pb-safe shrink-0 flex items-center gap-2">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => showToast('Attachment simulated: Code_Template.js uploaded')}
          className="touch-target p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95 shrink-0"
          title="Attach file or code snippet"
          aria-label="Attach file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
        </button>

        {/* Text Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${targetStudent?.name?.split(' ')[0] || 'student'}...`}
            className="flex-1 bg-slate-100 border-none rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="touch-target w-9 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 shadow-xs shrink-0"
            aria-label="Send message"
          >
            <svg className="w-4 h-4 -rotate-45 -mr-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
