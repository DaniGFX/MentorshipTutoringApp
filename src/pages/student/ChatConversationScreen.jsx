import React, { useState, useRef, useEffect } from 'react';
import { messageService } from '../../services/messageService.js';
import { supabase } from '../../services/supabaseClient.js';

/**
 * Chat Conversation Screen
 * Fully compliant with Section 6 of docs/student_flow_spec.md & docs/mobile_contents_guide.md.
 * Features:
 * - Real-time Supabase WebSocket message exchange with auto-scroll.
 * - Embedded Session Shortcut Card with direct navigation to session details.
 * - Quick conversation prompt chips (Icebreakers).
 * - Attachment simulated trigger.
 * - Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function ChatConversationScreen({
  mentor,
  session,
  onBack,
  onViewSession,
  onViewMentorProfile
}) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-seed-1',
      sender: 'mentor',
      text: 'Hi Daniela! Are you ready for our upcoming session?',
      time: '6:35 PM'
    },
    {
      id: 'msg-seed-2',
      sender: 'student',
      text: "Hi Alex! Yes, I prepared the code on JavaScript functions and closures we talked about.",
      time: '6:38 PM'
    },
    {
      id: 'msg-seed-3',
      sender: 'mentor',
      text: "Awesome! Please have your code editor or GitHub repository ready. We'll walk through closures, parameters, and arrow syntax step-by-step.",
      time: '6:42 PM'
    }
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

        // Partner mentor ID (Alex Santos seed ID or fallback)
        const partnerId = mentor?.id || '22222222-2222-2222-2222-222222222222';

        const { data: conv } = await messageService.getOrCreateConversation(uid, partnerId);
        if (!isMounted || !conv) return;

        setConversationId(conv.id);

        // Fetch past messages from Supabase
        const { data: dbMessages } = await messageService.getMessages(conv.id);
        if (isMounted && dbMessages && dbMessages.length > 0) {
          const mapped = dbMessages.map((m) => ({
            id: m.id,
            sender: m.sender_id === uid ? 'student' : 'mentor',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(mapped);
        }

        // Subscribe to live incoming messages
        unsubscribe = messageService.subscribeToMessages(conv.id, (incoming) => {
          if (!isMounted) return;
          // Avoid duplicating optimistic message
          if (incoming.sender_id !== uid) {
            const incomingFormatted = {
              id: incoming.id,
              sender: 'mentor',
              text: incoming.content,
              time: new Date(incoming.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, incomingFormatted]);
          }
        });
      } catch (err) {
        console.error('[ChatConversationScreen] Error initializing chat:', err);
      }
    }

    initChat();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [mentor?.id]);

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
      sender: 'student',
      text,
      time: formattedTime
    };

    // Optimistic UI update
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
        console.error('[ChatConversationScreen] Send error:', err);
      }
    }
  };

  const quickPrompts = [
    'Can we review my code?',
    'When are you available next?',
    'Can I share my GitHub repo?',
    'Thank you for the guidance!'
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

      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 shadow-2xs flex items-center justify-between z-10">
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
            onClick={() => onViewMentorProfile && onViewMentorProfile(mentor)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full ${mentor?.avatarBg || 'bg-sky-600'} text-white font-bold text-xs flex items-center justify-center shadow-xs`}
              >
                {mentor?.initials || 'AS'}
              </div>
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400"
                title="Active now"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  {mentor?.name || 'Alex Santos'}
                </h2>
                {mentor?.isVerified && (
                  <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Available · Active now</span>
              </p>
            </div>
          </div>
        </div>

        {/* View Profile Action */}
        <button
          type="button"
          onClick={() => onViewMentorProfile && onViewMentorProfile(mentor)}
          className="touch-target text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 active:scale-95 transition-all"
        >
          Profile
        </button>
      </div>

      {/* 2. Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain">
        {/* Date Divider */}
        <div className="flex items-center justify-center my-1">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-3 py-0.5 rounded-full uppercase tracking-wider">
            Today
          </span>
        </div>

        {/* 3. Embedded Session Shortcut Card (Specified in docs/student_flow_spec.md) */}
        <div className="bg-gradient-to-r from-sky-50 via-white to-cyan-50 border border-sky-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
              <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span>Upcoming Session</span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {session?.status === 'pending' ? 'PENDING' : 'CONFIRMED'}
            </span>
          </div>

          <div className="text-xs text-slate-700">
            <p className="font-bold text-slate-900">
              {session?.topic || 'JavaScript Functions, parameters, and return values'}
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {session?.date ? `${session.date} · ${session.time}` : 'Friday, Sept. 25 · 7:00 PM – 8:00 PM'}
            </p>
          </div>

          <div className="pt-0.5 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onViewSession && onViewSession(session)}
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
          const isStudent = msg.sender === 'student';

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isStudent ? 'justify-end' : 'justify-start'}`}
            >
              {!isStudent && (
                <div
                  className={`w-7 h-7 rounded-full ${mentor?.avatarBg || 'bg-sky-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0 mb-1 shadow-2xs`}
                >
                  {mentor?.initials || 'AS'}
                </div>
              )}

              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                  isStudent
                    ? 'bg-sky-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                }`}
              >
                <p>{msg.text}</p>
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isStudent ? 'text-sky-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.time}</span>
                  {isStudent && (
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
              className={`w-7 h-7 rounded-full ${mentor?.avatarBg || 'bg-sky-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs`}
            >
              {mentor?.initials || 'AS'}
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
        {quickPrompts.map((prompt, idx) => (
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
          onClick={() => showToast('Attachment options (Images, Documents) ready.')}
          className="touch-target p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95 shrink-0"
          title="Attach file or code snippet"
          aria-label="Attach file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
        />

        {/* Send Action Button */}
        <button
          type="button"
          disabled={!inputMessage.trim()}
          onClick={() => handleSendMessage()}
          className={`touch-target p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
            inputMessage.trim()
              ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
