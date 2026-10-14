import React, { useState, useEffect } from 'react';
import { messageService } from '../../services/messageService.js';
import { supabase } from '../../services/supabaseClient.js';

/**
 * Student Messages Screen (Tab 3)
 * Follows Section 6 of docs/student_flow_spec.md and docs/mobile_contents_guide.md.
 * Displays active conversation threads with mentor avatars, status dots, unread badges, and search.
 * Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function MessagesScreen({
  conversations,
  onSelectConversation,
  onFindMentor
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [liveConversations, setLiveConversations] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchThreads() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data } = await messageService.getConversations(authData.user.id);
          if (isMounted && data && data.length > 0) {
            const mapped = data.map((c) => ({
              id: c.id,
              mentor: {
                id: c.partnerId,
                name: c.partnerName,
                specialization: c.partnerCourse || 'Peer Mentor',
                rating: 5.0,
                sessionsCount: 1,
                isVerified: true,
                isOnline: true,
                rate: '₱200.00 / hr',
                avatarBg: 'bg-sky-600',
                initials: c.partnerInitials,
              },
              lastMessage: 'Tap to view live message thread',
              time: c.lastMessageAt
                ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now',
              unread: false,
              unreadCount: 0,
              hasUpcomingSession: true,
              upcomingSessionTopic: 'Academic Mentoring & Tutoring',
            }));
            setLiveConversations(mapped);
          }
        }
      } catch (err) {
        console.error('[MessagesScreen] Error loading threads:', err);
      }
    }
    fetchThreads();
    return () => {
      isMounted = false;
    };
  }, []);

  // Default seed conversations
  const defaultConversations = [
    {
      id: 'conv-alex-santos',
      mentor: {
        id: 'mentor-1',
        name: 'Alex Santos',
        specialization: 'Web Development Mentor',
        rating: 4.9,
        sessionsCount: 24,
        isVerified: true,
        isOnline: true,
        rate: '₱250.00 / hr',
        avatarBg: 'bg-sky-600',
        initials: 'AS'
      },
      lastMessage: 'Hi! Are you ready for our session tomorrow?',
      time: '6:42 PM',
      unread: true,
      unreadCount: 1,
      hasUpcomingSession: true,
      upcomingSessionTopic: 'JavaScript Functions, parameters, and return values'
    },
    {
      id: 'conv-maria-clara',
      mentor: {
        id: 'mentor-2',
        name: 'Maria Clara',
        specialization: 'Data Structures & Algorithms',
        rating: 4.8,
        sessionsCount: 38,
        isVerified: true,
        isOnline: true,
        rate: '₱250.00 / hr',
        avatarBg: 'bg-emerald-600',
        initials: 'MC'
      },
      lastMessage: 'You: Thank you for the feedback on BST balancing!',
      time: '3:15 PM',
      unread: false,
      unreadCount: 0,
      hasUpcomingSession: true,
      upcomingSessionTopic: 'Binary Search Trees and Traversals'
    },
    {
      id: 'conv-carlos-reyes',
      mentor: {
        id: 'mentor-3',
        name: 'Carlos Reyes',
        specialization: 'UI/UX Design & Figma Systems',
        rating: 5.0,
        sessionsCount: 45,
        isVerified: true,
        isOnline: false,
        rate: '₱200.00 / hr',
        avatarBg: 'bg-purple-600',
        initials: 'CR'
      },
      lastMessage: "Let's review your wireframe components in Figma during our next call.",
      time: 'Yesterday',
      unread: false,
      unreadCount: 0,
      hasUpcomingSession: false,
      upcomingSessionTopic: null
    }
  ];

  const baseList = conversations && conversations.length > 0 ? conversations : defaultConversations;
  const threadList = liveConversations.length > 0 ? [...liveConversations, ...baseList] : baseList;

  const filteredThreads = threadList.filter((thread) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = thread.mentor?.name?.toLowerCase() || '';
    const spec = thread.mentor?.specialization?.toLowerCase() || '';
    const msg = thread.lastMessage?.toLowerCase() || '';
    return name.includes(q) || spec.includes(q) || msg.includes(q);
  });

  const totalUnread = threadList.filter((t) => t.unread).length;

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* 1. Header with Title & Unread Badge */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Messages
            </h1>
            {totalUnread > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                {totalUnread} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Chat with your mentors and stay connected.
          </p>
        </div>

        <button
          type="button"
          onClick={onFindMentor}
          className="touch-target inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-xl hover:bg-sky-100 active:scale-95 transition-all shadow-2xs"
          title="Find new mentors to chat with"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span>Find Mentor</span>
        </button>
      </div>

      {/* 2. Search Conversations */}
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
          placeholder="Search conversations or mentors..."
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

      {/* 3. Conversation Thread List */}
      <div className="space-y-2">
        {filteredThreads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.75-.75c0-.66.195-1.294.553-1.838C3.805 16.89 3 14.567 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {searchQuery ? 'No matching conversations' : 'No messages yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? `No conversation found matching "${searchQuery}".`
                  : 'Start a conversation with a mentor to ask questions or discuss your learning goals.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onFindMentor}
              className="touch-target inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <span>Find a Mentor</span>
            </button>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const mentor = thread.mentor || {};
            const isUnread = thread.unread;

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectConversation(thread)}
                className={`touch-target w-full text-left bg-white rounded-2xl border transition-all p-3.5 flex items-center gap-3.5 shadow-2xs hover:border-sky-300 active:scale-[0.99] ${
                  isUnread
                    ? 'border-sky-200/90 bg-sky-50/20'
                    : 'border-slate-200/80 hover:bg-slate-50/50'
                }`}
              >
                {/* Mentor Avatar with Online Indicator */}
                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full ${mentor.avatarBg || 'bg-sky-600'} text-white font-bold text-xs flex items-center justify-center shadow-xs`}
                  >
                    {mentor.initials || 'AS'}
                  </div>
                  {mentor.isOnline && (
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400"
                      title="Online"
                    />
                  )}
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3
                        className={`text-sm truncate ${
                          isUnread ? 'font-extrabold text-slate-900' : 'font-bold text-slate-800'
                        }`}
                      >
                        {mentor.name}
                      </h3>
                      {mentor.isVerified && (
                        <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-[11px] shrink-0 ${
                        isUnread ? 'font-bold text-sky-600' : 'font-medium text-slate-400'
                      }`}
                    >
                      {thread.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium truncate mb-1">
                    {mentor.specialization}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        isUnread
                          ? 'font-bold text-slate-900'
                          : 'font-normal text-slate-600'
                      }`}
                    >
                      {thread.lastMessage}
                    </p>

                    {/* Unread blue dot indicator */}
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0 ring-2 ring-sky-100" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
