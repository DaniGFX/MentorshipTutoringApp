import React, { useState, useEffect } from 'react';
import { supportService } from '../../services/supportService.js';
import { supabase } from '../../services/supabaseClient.js';

/**
 * Mentor Notification Settings Screen
 * Conforms to Section 7 of docs/mentor_flow_spec.md & lines 2843–2923 of docs/mobile_contents_guide.md.
 * Features:
 * - Session Notifications toggles (Requests, Reminders, Updates).
 * - Communication toggles (Messages, Student Updates).
 * - MentorLinks Platform Announcements toggle.
 * - Delivery methods (Push & Email).
 * - Quick Option: Mute All Notifications toggle.
 * - Instant feedback toast on save.
 * - Strictly uses vector SVGs — zero raw emojis in UI.
 */
export default function MentorNotificationSettingsScreen({ onBack }) {
  const [settings, setSettings] = useState({
    sessionRequests: true,
    sessionReminders: true,
    sessionUpdates: true,
    newMessages: true,
    studentUpdates: true,
    announcements: true,
    pushNotifications: true,
    emailNotifications: false,
    muteAll: false
  });

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPreferences() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data } = await supportService.getNotificationPreferences(authData.user.id);
          if (isMounted && data) {
            setSettings((prev) => ({
              ...prev,
              sessionReminders: data.session_reminders ?? true,
              newMessages: data.chat_messages ?? true,
              sessionUpdates: data.booking_updates ?? true,
              emailNotifications: data.email_notifications ?? false,
            }));
          }
        }
      } catch (err) {
        console.error('[MentorNotificationSettingsScreen] Error loading preferences:', err);
      }
    }
    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSetting = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // If muting all, turn off other notifications
      if (key === 'muteAll' && updated.muteAll) {
        updated.sessionRequests = false;
        updated.sessionReminders = false;
        updated.sessionUpdates = false;
        updated.newMessages = false;
        updated.studentUpdates = false;
        updated.announcements = false;
      } else if (key === 'muteAll' && !updated.muteAll) {
        updated.sessionRequests = true;
        updated.sessionReminders = true;
        updated.sessionUpdates = true;
        updated.newMessages = true;
        updated.studentUpdates = true;
        updated.announcements = true;
      }
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    showToast('Settings Saved — Your notification preferences have been updated.');
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await supportService.updateNotificationPreferences(authData.user.id, {
          sessionReminders: settings.sessionReminders,
          chatMessages: settings.newMessages,
          bookingUpdates: settings.sessionUpdates,
          emailNotifications: settings.emailNotifications,
        });
      }
    } catch (err) {
      console.error('[MentorNotificationSettingsScreen] Error saving preferences:', err);
    }
    setTimeout(() => {
      if (onBack) onBack();
    }, 1200);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24 max-w-md mx-auto relative select-none">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="touch-target -ml-1 p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Notification Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Choose which notifications you'd like to receive.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Quick Option: Mute All Notifications */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.75 3.75l16.5 16.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-950">Mute All Notifications</h3>
              <p className="text-[11px] text-amber-800 font-medium">
                Temporarily pause all non-essential notifications.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => toggleSetting('muteAll')}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
              settings.muteAll ? 'bg-amber-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                settings.muteAll ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Session Notifications Group */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Session Notifications
          </h2>
        </div>

        <div className="space-y-3 divide-y divide-slate-100">
          {/* Session Requests */}
          <div className="flex items-center justify-between pt-1">
            <div className="pr-3">
              <h3 className="text-xs font-bold text-slate-900">Session Requests</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Get notified when a student requests a mentoring session.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('sessionRequests')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
                settings.sessionRequests ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                  settings.sessionRequests ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Session Reminders */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <h3 className="text-xs font-bold text-slate-900">Session Reminders</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Receive reminders before your upcoming sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('sessionReminders')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
                settings.sessionReminders ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                  settings.sessionReminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Session Updates */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <h3 className="text-xs font-bold text-slate-900">Session Updates</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Get notified when a session is accepted, declined, cancelled, or rescheduled.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('sessionUpdates')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
                settings.sessionUpdates ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                  settings.sessionUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Communication Group */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.75-.75c0-.66.195-1.294.553-1.838C3.805 16.89 3 14.567 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Communication
          </h2>
        </div>

        <div className="space-y-3 divide-y divide-slate-100">
          {/* New Messages */}
          <div className="flex items-center justify-between pt-1">
            <div className="pr-3">
              <h3 className="text-xs font-bold text-slate-900">New Messages</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Get notified when students send you a message.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('newMessages')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
                settings.newMessages ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                  settings.newMessages ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Student Updates */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <h3 className="text-xs font-bold text-slate-900">Student Updates</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Receive important activity updates related to your mentee students.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('studentUpdates')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
                settings.studentUpdates ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                  settings.studentUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MentorLinks Announcements */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.455a28.047 28.047 0 0 1-2.16-6.038m3.822 1.819c-.439-1.28-.73-2.618-.867-3.987m0 0a31.328 31.328 0 0 1 8.932-1.897c.563-.042 1.043.393 1.043.957v4.88c0 .564-.48 1-.943.958a31.328 31.328 0 0 1-8.932-1.898Z" />
            </svg>
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            MentorLinks Updates
          </h2>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="pr-3">
            <h3 className="text-xs font-bold text-slate-900">Announcements & News</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Receive platform enhancements, university partnerships, and program updates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSetting('announcements')}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
              settings.announcements ? 'bg-sky-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                settings.announcements ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 6. Notification Delivery Methods */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Delivery Methods
          </h2>
        </div>

        <div className="space-y-3 divide-y divide-slate-100">
          {/* Push Notifications */}
          <div className="flex items-center justify-between pt-1">
            <div className="pr-3">
              <h3 className="text-xs font-bold text-slate-900">Push Notifications</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Receive instant alerts on your Android device.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('pushNotifications')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
                settings.pushNotifications ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                  settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <h3 className="text-xs font-bold text-slate-900">Email Notifications</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Receive session recaps and daily summaries via email.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSetting('emailNotifications')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
                settings.emailNotifications ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                  settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Save Changes Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSaveChanges}
          className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-3.5 rounded-2xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span>Save Changes</span>
        </button>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
