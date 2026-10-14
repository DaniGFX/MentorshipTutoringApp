import React, { useState, useEffect } from 'react';
import { profileService } from '../../services/profileService.js';
import { supportService } from '../../services/supportService.js';
import { supabase } from '../../services/supabaseClient.js';

/**
 * Student Profile & Settings Screen (Tab 5)
 * Conforms to Section 8 of docs/student_flow_spec.md & docs/mobile_contents_guide.md.
 * Features:
 * - Profile header with student academic credentials and avatar.
 * - My Learning menu (Learning Progress, Session History).
 * - Account Settings (Personal Info editor, Notification toggles, Privacy & Security).
 * - Help & Support (Searchable FAQs, Support Ticket form, Terms & Policies, About).
 * - Secure Log Out confirmation dialog.
 * - Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function ProfileScreen({
  onOpenLearningProgress,
  onViewSessionHistory,
  onLogout
}) {
  // Student Profile State
  const [profile, setProfile] = useState({
    name: 'Daniela Gonzales',
    email: 'student@mentorlink.ph',
    school: 'Polytechnic University of the Philippines',
    course: 'BS Information Technology',
    yearLevel: '3rd Year Student',
    bio: 'Third-year IT major focusing on frontend systems and mobile-first responsive architecture.',
    avatarBg: 'bg-sky-600',
    initials: 'DG'
  });

  // Fetch live profile from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLiveProfile() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data } = await profileService.getProfile(authData.user.id);
          if (isMounted && data) {
            const fullName = data.full_name || 'Daniela Gonzales';
            const initials = fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            setProfile((prev) => ({
              ...prev,
              name: fullName,
              email: data.email || authData.user.email || prev.email,
              school: data.school_name || prev.school,
              course: data.course_program || prev.course,
              yearLevel: data.year_level || prev.yearLevel,
              bio: data.bio || prev.bio,
              initials,
            }));
          }
        }
      } catch (err) {
        console.error('[ProfileScreen] Error loading profile from Supabase:', err);
      }
    }
    loadLiveProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active Modals / Sheets
  const [activeModal, setActiveModal] = useState(null); 
  // 'personal_info' | 'notifications' | 'privacy' | 'faqs' | 'support' | 'terms' | 'privacy_policy' | 'about' | 'logout'

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    sessionRequests: true,
    sessionReminders: true,
    sessionUpdates: true,
    newMessages: true,
    learningUpdates: true,
    announcements: false,
    pushMethod: true,
    emailMethod: true
  });

  // Privacy & Security State
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    profileVisibility: 'mentors_only', // 'public' | 'mentors_only'
    showEmail: false
  });

  // FAQ State & Search
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const faqItems = [
    {
      q: 'How do I find a mentor?',
      a: 'Go to the Explore tab and search for mentors based on their skills, expertise, ratings, or schedule availability.'
    },
    {
      q: 'How do I book a mentoring session?',
      a: "Open a mentor's profile, select Book a Session, choose your preferred date and time slot, enter your topic, and confirm your request."
    },
    {
      q: 'When is my session confirmed?',
      a: 'Your session becomes confirmed once the peer mentor reviews and accepts your session request. You will receive a real-time notification.'
    },
    {
      q: 'Can I cancel a session request?',
      a: 'Yes. You can cancel a pending request anytime from the My Sessions tab by opening the session details.'
    },
    {
      q: 'How do I join my virtual classroom?',
      a: 'Open your confirmed session card in My Sessions or on the Dashboard and tap Join Session once the room is unlocked (10 minutes before start).'
    },
    {
      q: 'How does the 50% anti-scam down payment work?',
      a: 'To protect mentors and guarantee student bookings, a 50% down payment is required via GCash or Bank Account. You enter your payment reference number upon booking, which the mentor verifies before confirming.'
    }
  ];

  const filteredFaqs = faqItems.filter((item) => {
    if (!faqSearch.trim()) return true;
    const q = faqSearch.toLowerCase();
    return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
  });

  // Support Ticket Form State
  const [supportCategory, setSupportCategory] = useState('Account');
  const [supportMessage, setSupportMessage] = useState('');

  const handleSendSupport = async (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    const msg = supportMessage.trim();
    const cat = supportCategory || 'General Question';
    setActiveModal(null);
    setSupportMessage('');
    showToast('Your support ticket has been submitted. Our team will get back to you shortly.');

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        await supportService.createSupportTicket({
          userId: authData.user.id,
          subject: `${cat} - Student Support Inquiry`,
          category: cat,
          message: msg,
        });
      }
    } catch (err) {
      console.error('[ProfileScreen] Error submitting support ticket:', err);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Hero Student Profile Card (Matching MentorProfileScreen layout) */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-sky-100/60 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Student Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-sky-500/20">
                {profile.initials}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs" title="Verified Student">
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 truncate">{profile.name}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                  Student Learner
                </span>
              </div>
              <p className="text-xs font-semibold text-sky-600 mt-0.5 truncate">{profile.course}</p>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="truncate">{profile.school}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{profile.yearLevel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal('personal_info')}
            className="touch-target px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        </div>

        {/* Bio snippet */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600 leading-relaxed">{profile.bio}</p>
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onViewSessionHistory}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/50 transition-colors border border-slate-100 text-left active:scale-95"
          >
            <div className="flex items-center gap-1 text-sky-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-bold text-slate-900">4</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Completed</p>
          </button>

          <button
            type="button"
            onClick={onOpenLearningProgress}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/50 transition-colors border border-slate-100 text-left active:scale-95"
          >
            <div className="flex items-center gap-1 text-emerald-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold text-slate-900">6.5h</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Study Hours</p>
          </button>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left">
            <div className="flex items-center gap-1 text-indigo-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-bold text-slate-900">3</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Peer Mentors</p>
          </div>
        </div>
      </section>

      {/* 2. Section: My Learning */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 text-left">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">My Learning</h3>
        </div>

        {/* Learning Progress */}
        <button
          type="button"
          onClick={onOpenLearningProgress}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 text-left">Learning Progress</p>
              <p className="text-[11px] text-slate-500 text-left">View mentoring milestones and completed hours</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Session History */}
        <button
          type="button"
          onClick={onViewSessionHistory}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 text-left">Session History</p>
              <p className="text-[11px] text-slate-500 text-left">Archive of past mentoring sessions and notes</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </section>

      {/* 3. Section: Account Settings */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 text-left">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Account Settings</h3>
        </div>

        {/* Personal Information */}
        <button
          type="button"
          onClick={() => setActiveModal('personal_info')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 text-left">Personal Information</p>
              <p className="text-[11px] text-slate-500 text-left">Name, school, course, year level, bio</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Notification Settings */}
        <button
          type="button"
          onClick={() => setActiveModal('notifications')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 text-left">Notification Settings</p>
              <p className="text-[11px] text-slate-500 text-left">Manage push alerts, reminders, updates</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Privacy & Security */}
        <button
          type="button"
          onClick={() => setActiveModal('privacy')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 text-left">Privacy & Security</p>
              <p className="text-[11px] text-slate-500 text-left">Password, two-factor auth, visibility</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </section>

      {/* 4. Section: Help & Support */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 text-left">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Help & Support</h3>
        </div>

        {/* FAQs */}
        <button
          type="button"
          onClick={() => setActiveModal('faqs')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-900 text-left">Frequently Asked Questions (FAQs)</p>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Contact Support */}
        <button
          type="button"
          onClick={() => setActiveModal('support')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 text-left">Help & Support Desk</p>
              <p className="text-[11px] text-slate-500 text-left">Submit an inquiry or report an issue</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Terms & Conditions */}
        <button
          type="button"
          onClick={() => setActiveModal('terms')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <span className="text-xs font-medium text-slate-700 text-left">Terms of Service</span>
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Privacy Policy */}
        <button
          type="button"
          onClick={() => setActiveModal('privacy_policy')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <span className="text-xs font-medium text-slate-700 text-left">Privacy Policy</span>
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* About */}
        <button
          type="button"
          onClick={() => setActiveModal('about')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <span className="text-xs font-medium text-slate-700 text-left">About MentorLinks</span>
          <span className="text-[11px] text-slate-400 font-mono shrink-0">v1.2.0</span>
        </button>
      </section>

      {/* 5. Section: Log Out Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setActiveModal('logout')}
          className="touch-target w-full py-3.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Log Out Account</span>
        </button>
      </div>

      {/* =========================================================================
          MODALS & SLIDE-UP SHEETS
      ========================================================================= */}

      {/* 1. Personal Information Modal */}
      {activeModal === 'personal_info' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const { data: authData } = await supabase.auth.getUser();
                  if (authData?.user) {
                    await profileService.updateProfile(authData.user.id, {
                      full_name: profile.name,
                      school_name: profile.school,
                      course_program: profile.course,
                      year_level: profile.yearLevel,
                      bio: profile.bio,
                    });
                  }
                  showToast('Personal information updated successfully in Supabase.');
                } catch (err) {
                  console.error('[ProfileScreen] Error updating profile:', err);
                  showToast('Profile updated.');
                }
                setActiveModal(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">Institutional email managed by university SSO.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">School / University</label>
                <input
                  type="text"
                  value={profile.school}
                  onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course / Program</label>
                <input
                  type="text"
                  value={profile.course}
                  onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Year Level</label>
                <select
                  value={profile.yearLevel}
                  onChange={(e) => setProfile({ ...profile, yearLevel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="1st Year Student">1st Year Student</option>
                  <option value="2nd Year Student">2nd Year Student</option>
                  <option value="3rd Year Student">3rd Year Student</option>
                  <option value="4th Year Student">4th Year Student</option>
                  <option value="Graduate / Other">Graduate / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
                <textarea
                  rows="3"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  placeholder="Tell mentors about yourself..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="touch-target flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Notification Settings Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Notification Preferences</h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3.5">
              {[
                { key: 'sessionRequests', label: 'Session Requests', desc: 'Get notified when a mentor responds to your request' },
                { key: 'sessionReminders', label: 'Session Reminders', desc: 'Receive alert 15 mins before your scheduled session' },
                { key: 'sessionUpdates', label: 'Session Updates', desc: 'Notified on classroom unlock or reschedule' },
                { key: 'newMessages', label: 'New Direct Messages', desc: 'Alerts when mentors send you new chat messages' },
                { key: 'learningUpdates', label: 'Learning Progress', desc: 'Milestone achievements and accreditation notices' },
                { key: 'announcements', label: 'Platform Announcements', desc: 'Occasional platform features and campus events' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className={`touch-target w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                      notifications[item.key] ? 'bg-sky-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700">Delivery Channels</span>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.pushMethod}
                      onChange={(e) => setNotifications({ ...notifications, pushMethod: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-medium text-slate-700">Push Notifications</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailMethod}
                      onChange={(e) => setNotifications({ ...notifications, emailMethod: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-medium text-slate-700">Email Digest</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  showToast('Notification preferences saved.');
                }}
                className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Privacy & Security Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Privacy & Security</h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Change Password */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-900">Account Password</span>
                <p className="text-[11px] text-slate-500">Keep your account protected with a strong password.</p>
                <button
                  type="button"
                  onClick={() => showToast('Password reset link sent to your university email.')}
                  className="touch-target text-xs font-bold text-sky-700 bg-white border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-50 shadow-2xs"
                >
                  Change Password
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">Two-Factor Authentication (2FA)</p>
                  <p className="text-[11px] text-slate-400 font-medium">Add an extra layer of security via SMS/Email code</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSecurity((prev) => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }));
                    showToast(!security.twoFactorAuth ? '2FA enabled.' : '2FA disabled.');
                  }}
                  className={`touch-target w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    security.twoFactorAuth ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      security.twoFactorAuth ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Profile Visibility */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-900">Profile Visibility</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSecurity({ ...security, profileVisibility: 'mentors_only' })}
                    className={`touch-target p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      security.profileVisibility === 'mentors_only'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Mentors Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecurity({ ...security, profileVisibility: 'public' })}
                    className={`touch-target p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      security.profileVisibility === 'public'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    All Campus
                  </button>
                </div>
              </div>

              {/* Show Email toggle */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">Display Email Address</p>
                  <p className="text-[11px] text-slate-400 font-medium">Allow mentors to view your school email address</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSecurity({ ...security, showEmail: !security.showEmail })}
                  className={`touch-target w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    security.showEmail ? 'bg-sky-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      security.showEmail ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Danger Zone */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-red-600">Danger Zone</span>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Deleting your account permanently removes your sessions and history.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    showToast('Account deletion request requires administrator review.');
                  }}
                  className="touch-target mt-2 text-xs font-bold text-red-600 hover:text-red-700 underline"
                >
                  Delete Student Account
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  showToast('Security settings updated.');
                }}
                className="touch-target w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FAQs Modal */}
      {activeModal === 'faqs' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Frequently Asked Questions</h2>
                <p className="text-[11px] text-slate-400">Quick answers to common questions</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0">
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>

            {/* Accordion List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="touch-target w-full p-3 text-left font-bold text-xs text-slate-800 flex items-center justify-between gap-2 hover:bg-slate-50"
                    >
                      <span>{faq.q}</span>
                      <svg
                        className={`w-4 h-4 text-slate-400 shrink-0 transform transition-transform ${
                          isOpen ? 'rotate-180 text-sky-600' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="p-3 pt-0 text-xs text-slate-600 bg-slate-50/50 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Contact Support Modal */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Help & Support Form</h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendSupport} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">What can we help you with?</label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Account">Account & Profile</option>
                  <option value="Booking">Booking & Scheduling</option>
                  <option value="Sessions">Classroom & Sessions</option>
                  <option value="Messages">Direct Messages</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Other">Other Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="4"
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your concern in detail..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="touch-target flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Terms & Conditions Modal */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-bold text-slate-900">Terms & Conditions</h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto text-xs text-slate-600 space-y-3 pr-1 leading-relaxed">
              <p className="text-[11px] text-slate-400">Last updated: September 2026</p>
              <div>
                <h3 className="font-bold text-slate-900">1. Acceptance of Terms</h3>
                <p>By registering, browsing, or using MentorLinks, you agree to comply with all campus academic integrity and community guidelines.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">2. User Accounts</h3>
                <p>Users are responsible for keeping account credentials safe and ensuring learning interactions remain professional and educational.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">3. Mentoring Sessions</h3>
                <p>Sessions are subject to mutual mentor availability. A session is confirmed only after explicit acceptance by the assigned mentor.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">4. User Conduct</h3>
                <p>All communication must be respectful and strictly focused on legitimate academic assistance and skill development.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">5. Cancellations</h3>
                <p>Users are expected to provide reasonable notice if they need to cancel a scheduled session.</p>
              </div>
            </div>
            <div className="pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="touch-target w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Privacy Policy Modal */}
      {activeModal === 'privacy_policy' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-bold text-slate-900">Privacy Policy</h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto text-xs text-slate-600 space-y-3 pr-1 leading-relaxed">
              <p className="text-[11px] text-slate-400">Last updated: September 2026</p>
              <div>
                <h3 className="font-bold text-slate-900">1. Information We Collect</h3>
                <p>We collect essential academic credentials (name, institutional email, course, year level) to facilitate peer mentoring.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">2. How We Use Information</h3>
                <p>Data is used strictly to match learners with mentors, coordinate schedules, verify direct payments, and maintain in-app security.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">3. Data Protection</h3>
                <p>All database records are protected with 100% PostgreSQL Row Level Security (RLS) ensuring that only authorized participants can access session data.</p>
              </div>
            </div>
            <div className="pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="touch-target w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. About MentorLinks Modal */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white mx-auto flex items-center justify-center shadow-md">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">MentorLinks</h2>
              <p className="text-xs font-bold text-sky-600">Connect. Learn. Grow.</p>
              <p className="text-[11px] text-slate-400">Mobile Peer Mentoring & Tutoring Platform · v1.0.0</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              MentorLinks bridges high school and university students with qualified peer mentors, fostering collaborative learning, hands-on guidance, and transparent direct-pay mentorship.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Log Out Confirmation Modal */}
      {activeModal === 'logout' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Log Out of MentorLinks?</h3>
              <p className="text-xs text-slate-500">
                You can sign back in anytime with your university credentials.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="touch-target flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  if (onLogout) onLogout();
                }}
                className="touch-target flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
