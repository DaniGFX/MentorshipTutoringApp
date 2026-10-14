import { supabase } from './supabaseClient.js';

/**
 * Support & Notification Service
 * Handles Help Center support ticket submissions and user notification preferences.
 */
export const supportService = {
  /**
   * Submit a new support ticket
   * @param {Object} params
   * @param {string} params.userId - Authenticated user UUID
   * @param {string} params.subject - Ticket title/subject
   * @param {string} params.category - Ticket category (e.g. "Account & Verification", "Payment Issue")
   * @param {string} params.message - Detailed explanation
   */
  async createSupportTicket({ userId, subject, category, message }) {
    try {
      const payload = {
        user_id: userId,
        subject: subject.trim(),
        category: category.trim(),
        message: message.trim(),
        status: 'open',
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[supportService.createSupportTicket error]:', err);
      return { data: null, error: { message: err.message || 'Failed to submit support ticket' } };
    }
  },

  /**
   * Get all support tickets submitted by a user
   * @param {string} userId - User UUID
   */
  async getUserTickets(userId) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[supportService.getUserTickets error]:', err);
      return { data: null, error: { message: err.message || 'Failed to fetch tickets' } };
    }
  },

  /**
   * Get user notification preferences
   * @param {string} userId - User UUID
   */
  async getNotificationPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[supportService.getNotificationPreferences error]:', err);
      return { data: null, error: { message: err.message || 'Failed to load notification preferences' } };
    }
  },

  /**
   * Update or initialize user notification preferences
   * @param {string} userId - User UUID
   * @param {Object} preferences - Toggle values
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      const payload = {
        user_id: userId,
        session_reminders: Boolean(preferences.sessionReminders ?? true),
        chat_messages: Boolean(preferences.chatMessages ?? true),
        booking_updates: Boolean(preferences.bookingUpdates ?? true),
        email_notifications: Boolean(preferences.emailNotifications ?? false),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('[supportService.updateNotificationPreferences error]:', err);
      return { data: null, error: { message: err.message || 'Failed to update preferences' } };
    }
  },
};
