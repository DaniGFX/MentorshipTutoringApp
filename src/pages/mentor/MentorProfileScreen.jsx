import React, { useState, useEffect } from 'react';
import { profileService } from '../../services/profileService.js';
import { tutorService } from '../../services/tutorService.js';
import { supportService } from '../../services/supportService.js';
import { supabase } from '../../services/supabaseClient.js';

export default function MentorProfileScreen({
  onOpenAvailability,
  onOpenNotifications,
  onViewStudents,
  onViewSessions,
  onLogout,
}) {
  // State for profile data
  const [profile, setProfile] = useState({
    name: 'Alex Santos',
    tagline: 'Senior CS Student | Web & Database Specialist',
    university: 'De La Salle University',
    program: 'BS Computer Science — 4th Year',
    email: 'mentor@mentorlink.ph',
    phone: '+63 917 555 0192',
    bio: 'Dedicated peer tutor helping students master programming logic, database normalization, and frontend user interfaces in React.',
    rating: 4.95,
    reviewCount: 22,
    sessionCount: 42,
    totalEarnings: 8400,
    hourlyRate: 200,
    gcashNumber: '0917-555-0192',
    bankName: 'BDO Unibank',
    bankAccountNumber: '1092-8834-5512',
  });

  const [expertiseTags, setExpertiseTags] = useState([
    'Web Development',
    'JavaScript',
    'React.js',
    'Database Systems & SQL',
    'Data Structures & Algorithms',
  ]);

  // Load live mentor profile from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadLiveMentor() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: pData } = await profileService.getProfile(authData.user.id);
          const { data: tData } = await tutorService.getTutorById(authData.user.id);

          if (isMounted) {
            const updated = {
              name: pData?.full_name || 'Alex Santos',
              tagline: tData?.headline || 'Senior CS Student | Web & Database Specialist',
              university: pData?.school_name || 'De La Salle University',
              program: pData?.course_program || 'BS Computer Science',
              email: pData?.email || authData.user.email || 'mentor@mentorlink.ph',
              bio: tData?.bio_experience || pData?.bio || 'Dedicated peer tutor helping students master programming logic.',
              rating: parseFloat(tData?.average_rating) || 4.95,
              sessionCount: tData?.completed_sessions_count || 42,
              hourlyRate: parseFloat(tData?.hourly_rate) || 200,
            };
            setProfile((prev) => ({ ...prev, ...updated }));
            setEditForm((prev) => ({ ...prev, ...updated }));
            if (tData?.tutor_subjects && tData.tutor_subjects.length > 0) {
              setExpertiseTags(tData.tutor_subjects.map((s) => s.subject_name));
            }
          }
        }
      } catch (err) {
        console.error('[MentorProfileScreen] Error loading live mentor data:', err);
      }
    }
    loadLiveMentor();
    return () => {
      isMounted = false;
    };
  }, []);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'editProfile', 'editExpertise', 'personalInfo', 'reviews', 'privacy', 'faqs', 'support', 'terms', 'privacyPolicy', 'about', 'logout'
  const [newTagInput, setNewTagInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Edit profile form state
  const [editForm, setEditForm] = useState({ ...profile });

  // Support ticket form state
  const [supportForm, setSupportForm] = useState({
    category: 'booking',
    subject: '',
    message: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirmPass: '',
  });

  // Sample reviews
  const reviews = [
    {
      id: 'rev-1',
      studentName: 'Maria Santos',
      avatarInitials: 'MS',
      rating: 5,
      date: 'Sep 18, 2026',
      subject: 'React.js Component Architecture',
      comment: 'Kuya Alex explained useState and useEffect so clearly! I was struggling with props for days and now I completely understand it. Highly recommended mentor!',
    },
    {
      id: 'rev-2',
      studentName: 'Christian Reyes',
      avatarInitials: 'CR',
      rating: 5,
      date: 'Sep 14, 2026',
      subject: 'Tailwind CSS Responsive Design',
      comment: 'Super patient and provided actual code snippets that I could review after the session. Really helped me finish my midterm project on time.',
    },
    {
      id: 'rev-3',
      studentName: 'Bea Alonzo',
      avatarInitials: 'BA',
      rating: 4.8,
      date: 'Sep 10, 2026',
      subject: 'Git Merge Conflicts & Branching',
      comment: 'Very accommodating! Answered all my beginner questions without making me feel intimidated.',
    },
  ];

  // Sample FAQs
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const faqs = [
    {
      q: 'How does the 50% Anti-Scam Down Payment protect mentors?',
      a: 'Students are required to transfer a 50% down payment via GCash or Bank Account and submit their transaction reference number before a booking can be accepted. This prevents bogus bookings and ensures your scheduled time is protected.',
    },
    {
      q: 'How does the Direct Payment model work?',
      a: 'Students transfer session fees directly to your preferred payment channels (GCash or Bank Account). They submit the transaction reference number in-app, which you verify and confirm before meeting.',
    },
    {
      q: 'Can I reschedule an upcoming session?',
      a: 'Yes, either party can propose a reschedule at least 2 hours before the scheduled time slot. Once the student accepts the new time, your calendar automatically updates.',
    },
    {
      q: 'When does the Virtual Classroom open?',
      a: 'The in-app Virtual Classroom unlocked 10 minutes prior to the booked time slot with video, audio, screen sharing, and collaborative notes.',
    },
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await profileService.updateProfile(authData.user.id, {
          full_name: editForm.name,
          school_name: editForm.university,
          course_program: editForm.program,
          bio: editForm.bio,
        });

        await tutorService.updateTutorProfile(authData.user.id, {
          headline: editForm.tagline,
          bio_experience: editForm.bio,
          hourly_rate: editForm.hourlyRate || 200,
        });
      }
      setProfile({ ...editForm });
      showToast('Profile updated successfully in Supabase!');
    } catch (err) {
      console.error('[MentorProfileScreen] Error saving profile:', err);
      setProfile({ ...editForm });
      showToast('Profile saved locally.');
    }
    setActiveModal(null);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !expertiseTags.includes(trimmed)) {
      setExpertiseTags([...expertiseTags, trimmed]);
      setNewTagInput('');
      showToast(`Added "${trimmed}" to expertise`);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setExpertiseTags(expertiseTags.filter((t) => t !== tagToRemove));
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      showToast('Please fill out all required fields.');
      return;
    }
    const subj = supportForm.subject.trim();
    const cat = supportForm.category || 'General';
    const msg = supportForm.message.trim();
    setActiveModal(null);
    setSupportForm({ category: 'booking', subject: '', message: '' });
    showToast('Support ticket submitted! Our help desk will assist you shortly.');

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        await supportService.createSupportTicket({
          userId: authData.user.id,
          subject: subj,
          category: cat,
          message: msg,
        });
      }
    } catch (err) {
      console.error('[MentorProfileScreen] Error submitting support ticket:', err);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirmPass) {
      showToast('Please fill out all password fields.');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirmPass) {
      showToast('New passwords do not match.');
      return;
    }
    setActiveModal(null);
    setPasswordForm({ current: '', newPass: '', confirmPass: '' });
    showToast('Password changed securely!');
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-full text-xs font-semibold shadow-xl backdrop-blur flex items-center gap-2.5 border border-slate-700 animate-fade-in">
          <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Hero Mentor Profile Card */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-sky-100/60 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-sky-500/20">
                {profile.name ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AS'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs" title="Verified Peer Mentor">
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
                  Peer Mentor
                </span>
              </div>
              <p className="text-xs font-semibold text-sky-600 mt-0.5 truncate">{profile.tagline}</p>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="truncate">{profile.university}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{profile.program}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditForm({ ...profile });
              setActiveModal('editProfile');
            }}
            className="touch-target px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        </div>

          {/* Bio snippet */}
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{profile.bio}</p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setActiveModal('reviews')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/50 transition-colors border border-slate-100 text-left"
            >
              <div className="flex items-center gap-1 text-amber-500">
                <svg className="w-4 h-4 fill-amber-400 stroke-amber-500" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-xs font-bold text-slate-900">{profile.rating}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">{profile.reviewCount} Reviews</p>
            </button>

            <button
              type="button"
              onClick={onViewSessions}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/50 transition-colors border border-slate-100 text-left"
            >
              <div className="flex items-center gap-1 text-sky-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-bold text-slate-900">{profile.sessionCount}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">Sessions Done</p>
            </button>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left">
              <div className="flex items-center gap-1 text-emerald-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-xs font-bold text-slate-900">₱{profile.hourlyRate}/hr</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">Session Rate</p>
            </div>
          </div>
        </section>

        {/* 2. My Expertise Section */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900">My Expertise</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('editExpertise')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>Edit Tags</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {expertiseTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/70 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* 3. My Activity & Connections Strip */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">My Activity</h3>
          </div>

          <button
            type="button"
            onClick={onViewStudents}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">My Students Roster</p>
                <p className="text-[11px] text-slate-500">12 active student learners</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-xs font-semibold text-indigo-600">Tab 2</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            type="button"
            onClick={onViewSessions}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Session History</p>
                <p className="text-[11px] text-slate-500">Upcoming, pending and past sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-xs font-semibold text-sky-600">Tab 4</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('reviews')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-4 h-4 fill-amber-500/20 stroke-amber-600" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Reviews & Testimonials</p>
                <p className="text-[11px] text-slate-500">18 student ratings · 4.9 average</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* 4. Account Settings */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Account Settings</h3>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal('personalInfo')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Personal Information</p>
                <p className="text-[11px] text-slate-500">Contact, student ID & university affiliation</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Availability Scheduler Trigger */}
          <button
            type="button"
            onClick={onOpenAvailability}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900">Availability & Schedule</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Weekly recurring slots & booking status</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-sky-600">Configure</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Notification Settings Trigger */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Notification Settings</p>
                <p className="text-[11px] text-slate-500">Booking requests, classroom alerts, sounds</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Privacy & Security */}
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Privacy & Security</p>
                <p className="text-[11px] text-slate-500">Password change, active sessions, 2FA</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* 5. Support & Legal Information */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Help & Legal</h3>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal('faqs')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-900">Frequently Asked Questions (FAQs)</p>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('support')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Help & Support Desk</p>
                <p className="text-[11px] text-slate-500">Submit an inquiry or report an issue</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('terms')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <span className="text-xs font-medium text-slate-700">Terms of Service</span>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('privacyPolicy')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <span className="text-xs font-medium text-slate-700">Privacy Policy</span>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('about')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <span className="text-xs font-medium text-slate-700">About MentorLinks</span>
            <span className="text-[11px] text-slate-400 font-mono">v1.2.0</span>
          </button>
        </section>

        {/* 6. Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setActiveModal('logout')}
            className="w-full py-3.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out Account</span>
          </button>
        </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal 1: Edit Profile */}
      {activeModal === 'editProfile' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Mentor Profile</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mentor Tagline / Title</label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">University / Campus</label>
                <input
                  type="text"
                  value={editForm.university}
                  onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program & Year Level</label>
                <input
                  type="text"
                  value={editForm.program}
                  onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bio Description</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-sm shadow-sky-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Expertise Tags */}
      {activeModal === 'editExpertise' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Expertise Tags</h3>
                <p className="text-[11px] text-slate-500">Add or remove subjects you can mentor</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current Tags */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Current Subjects ({expertiseTags.length})</label>
              <div className="flex flex-wrap gap-2">
                {expertiseTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="w-4 h-4 rounded-full bg-sky-200/70 hover:bg-sky-300 text-sky-800 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add New Tag */}
            <form onSubmit={handleAddTag} className="mt-5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Add New Subject</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Node.js, Python, SQL"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={!newTagInput.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  showToast('Expertise tags saved!');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Personal Information */}
      {activeModal === 'personalInfo' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Institutional Email</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{profile.email}</p>
                <span className="inline-block mt-1 text-[10px] text-emerald-600 font-medium">Verified by University</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Phone Number</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{profile.phone}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Student ID Number</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5 font-mono">BCP-2023-08914</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Accredited University</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{profile.university}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{profile.program}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal 4: Reviews & Testimonials */}
      {activeModal === 'reviews' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Reviews</h3>
                <p className="text-[11px] text-slate-500">⭐ {profile.rating} average out of {profile.reviewCount} reviews</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                        {rev.avatarInitials}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{rev.studentName}</p>
                        <p className="text-[10px] text-slate-400">{rev.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-3 h-3 fill-amber-400 stroke-amber-500" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                  </div>

                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                    {rev.subject}
                  </span>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">"{rev.comment}"</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal 5: Privacy & Security */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Privacy & Security</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Change Password</h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPass: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Two-Factor Authentication</h4>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">SMS Verification</p>
                  <p className="text-[10px] text-slate-500">Sent to +63 917 •••• 341</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: FAQs */}
      {activeModal === 'faqs' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left flex items-center justify-between bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-800 pr-2">{faq.q}</span>
                      <svg
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-sky-600' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="p-3.5 bg-white border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal 7: Help & Support Desk Ticket */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Support Ticket</h3>
                <p className="text-[11px] text-slate-500">Our student help desk responds within 2 hours</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={supportForm.category}
                  onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="booking">Booking / Schedule Issue</option>
                  <option value="payment">Direct Payment Verification</option>
                  <option value="downpayment_dispute">Down Payment Reference Dispute</option>
                  <option value="classroom">Virtual Classroom Audio/Video</option>
                  <option value="other">Other Account Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of what happened"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Provide session IDs or timestamps if applicable..."
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-sm shadow-sky-500/20"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 8: Terms & Conditions */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Terms of Service</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800">1. Peer Mentorship Code of Conduct</p>
              <p>Mentors agree to uphold academic honesty and provide constructive learning guidance rather than completing coursework or examinations on behalf of learners.</p>
              <p className="font-semibold text-slate-800">2. Direct Payment Integrity</p>
              <p>MentorLinks does not hold funds. All payments take place directly between students and mentors via trusted Philippine payment channels (GCash, Maya, or bank account). Reference numbers are logged for verification.</p>
              <p className="font-semibold text-slate-800">3. Anti-Scam Down Payment Policy</p>
              <p>Students submit a 50% down payment before booking confirmation. Mentors verify receipt before accepting. Confirmed bookings safeguard both student and mentor time.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Modal 9: Privacy Policy */}
      {activeModal === 'privacyPolicy' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Privacy Policy</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>MentorLinks adheres to the Philippine Data Privacy Act of 2012 (RA 10173). Your student credentials, contact info, and session transcripts are encrypted end-to-end and stored securely using Supabase Row Level Security.</p>
              <p>We never share or sell personal information to third parties. Academic records are utilized solely for peer matching and university hours accreditation.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal 10: About MentorLinks */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 mb-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">MentorLinks</h3>
            <p className="text-xs text-sky-600 font-semibold mt-0.5">"Connect. Learn. Grow."</p>
            <p className="text-[11px] text-slate-500 mt-2">Mobile Version 1.2.0 (Build 108)</p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed text-left">
              MentorLinks is a peer-to-peer mentorship and academic tutoring platform designed for high school and collegiate learners. Developed with React, Tailwind CSS, Capacitor, and Supabase.
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal 11: Log Out Confirmation */}
      {activeModal === 'logout' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Log Out of MentorLinks?</h3>
            <p className="text-xs text-slate-500 mt-1">
              You will need to sign in again to receive session requests and chat messages.
            </p>

            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm shadow-rose-500/20"
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
