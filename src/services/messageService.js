import { supabase } from './supabaseClient.js';

/**
 * Service for real-time in-app 1-on-1 messaging between students and mentors.
 */
export const messageService = {
  /**
   * Retrieves conversation threads for a specific user.
   * @param {string} userId
   * @returns {Promise<{ data: any[], error: any }>}
   */
  async getConversations(userId) {
    try {
      if (!userId) return { data: [], error: null };

      // Query conversations where user is participant_one or participant_two
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_one_id,
          participant_two_id,
          last_message_at,
          created_at,
          participant_one:participant_one_id (*),
          participant_two:participant_two_id (*)
        `)
        .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.warn('[messageService.getConversations notice]:', error.message);
        return { data: [], error: null };
      }

      // Format conversation items with partner details
      const formatted = (data || []).map((conv) => {
        const isPartnerOne = conv.participant_two_id === userId;
        const partner = isPartnerOne ? conv.participant_one : conv.participant_two;
        const partnerName = partner?.full_name || 'Academic Partner';
        const partnerInitials = partnerName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return {
          id: conv.id,
          partnerId: partner?.id,
          partnerName,
          partnerRole: partner?.account_type || 'user',
          partnerSchool: partner?.school_name || 'University',
          partnerCourse: partner?.course_program || '',
          partnerInitials,
          partnerAvatar: partner?.avatar_url,
          lastMessageAt: conv.last_message_at,
        };
      });

      return { data: formatted, error: null };
    } catch (err) {
      console.error('[messageService.getConversations Error]:', err.message);
      return { data: [], error: { message: err.message } };
    }
  },

  /**
   * Finds an existing conversation between two users or creates one.
   * @param {string} userOneId
   * @param {string} userTwoId
   * @returns {Promise<{ data: any, error: any }>}
   */
  async getOrCreateConversation(userOneId, userTwoId) {
    try {
      if (!userOneId || !userTwoId) {
        throw new Error('Both user IDs are required to establish a conversation.');
      }

      // Check for existing conversation (in either participant order)
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .or(
          `and(participant_one_id.eq.${userOneId},participant_two_id.eq.${userTwoId}),and(participant_one_id.eq.${userTwoId},participant_two_id.eq.${userOneId})`
        )
        .maybeSingle();

      if (findError) {
        console.warn('[messageService.getOrCreateConversation find notice]:', findError.message);
      }

      if (existing) {
        return { data: existing, error: null };
      }

      // Create new conversation
      const newConv = {
        participant_one_id: userOneId,
        participant_two_id: userTwoId,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert(newConv)
        .select('*')
        .single();

      if (createError) throw createError;
      return { data: created, error: null };
    } catch (err) {
      console.error('[messageService.getOrCreateConversation Error]:', err.message);
      return { data: null, error: { message: err.message } };
    }
  },

  /**
   * Retrieves messages for a specific conversation in chronological order.
   * @param {string} conversationId
   * @returns {Promise<{ data: any[], error: any }>}
   */
  async getMessages(conversationId) {
    try {
      if (!conversationId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[messageService.getMessages notice]:', error.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('[messageService.getMessages Error]:', err.message);
      return { data: [], error: { message: err.message } };
    }
  },

  /**
   * Sends a new message and updates conversation's last_message_at.
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.senderId
   * @param {string} params.content
   * @returns {Promise<{ data: any, error: any }>}
   */
  async sendMessage({ conversationId, senderId, content }) {
    try {
      const cleanContent = content.trim();
      if (!cleanContent) throw new Error('Message content cannot be empty.');

      const newMsg = {
        conversation_id: conversationId,
        sender_id: senderId,
        content: cleanContent,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(newMsg)
        .select('*')
        .single();

      if (error) throw error;

      // Update thread timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { data, error: null };
    } catch (err) {
      console.error('[messageService.sendMessage Error]:', err.message);
      return { data: null, error: { message: err.message } };
    }
  },

  /**
   * Subscribes to real-time incoming messages for a specific conversation via WebSocket.
   * @param {string} conversationId
   * @param {(message: any) => void} onMessageReceived
   * @returns {() => void} Unsubscribe cleanup function
   */
  subscribeToMessages(conversationId, onMessageReceived) {
    if (!conversationId) return () => {};

    const channelName = `room-${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload?.new) {
            onMessageReceived(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected to real-time message stream
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Marks unread messages in a conversation as read.
   * @param {string} conversationId
   * @param {string} currentUserId
   * @returns {Promise<{ error: any }>}
   */
  async markMessagesAsRead(conversationId, currentUserId) {
    try {
      if (!conversationId || !currentUserId) return { error: null };

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.warn('[messageService.markMessagesAsRead notice]:', err.message);
      return { error: { message: err.message } };
    }
  },
};

export default messageService;
